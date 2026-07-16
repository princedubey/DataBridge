import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationProvider } from './interfaces/integration-provider.interface';
import { Normalizer } from './interfaces/normalizer.interface';
import { IdempotencyService } from './services/idempotency.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async runSync<ExternalType, InternalType>(
    provider: IntegrationProvider<ExternalType>,
    normalizer: Normalizer<ExternalType, InternalType>,
    saveToDb: (data: InternalType[]) => Promise<unknown>,
  ) {
    const sourceName = provider.getName();
    this.logger.log(`Starting sync for ${sourceName}`);

    let syncState = await this.prisma.syncState.findUnique({
      where: { source: sourceName },
    });

    if (!syncState) {
      syncState = await this.prisma.syncState.create({
        data: { source: sourceName, status: 'PENDING' },
      });
    }

    let currentCursor = syncState.cursor;
    let hasMore = true;
    let recordsProcessed = 0;

    try {
      while (hasMore) {
        let result: Awaited<ReturnType<typeof provider.fetchData>>;
        try {
          result = await provider.fetchData(currentCursor || undefined);
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));
          this.logger.warn(`Fetch error encountered for ${sourceName}. Aborting sync for retry. Error: ${error.message}`);
          throw error;
        }

        const batchSize = 100;
        for (let i = 0; i < result.data.length; i += batchSize) {
          const batch = result.data.slice(i, i + batchSize);
          const normalizedBatch = batch.map((item) => normalizer.normalize(item));
          
          await saveToDb(normalizedBatch);
          recordsProcessed += batch.length;
        }

        currentCursor = result.nextCursor || null;
        hasMore = result.hasMore;
      }

      await this.prisma.syncState.update({
        where: { source: sourceName },
        data: {
          cursor: currentCursor, // Update only at the end of a successful run
          lastExecution: new Date(),
          status: 'SUCCESS',
        },
      });

      await this.prisma.syncLog.create({
        data: {
          source: sourceName,
          status: 'SUCCESS',
          recordsProcessed,
        },
      });

      this.logger.log(
        `Sync completed for ${sourceName}. Processed ${recordsProcessed} records.`,
      );
      return { source: sourceName, status: 'SUCCESS', recordsProcessed };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Sync failed for ${sourceName}`, error.stack);

      await this.prisma.syncState.update({
        where: { source: sourceName },
        data: { status: 'FAILED' }, // Do not wipe cursor, just mark FAILED
      });

      await this.prisma.syncLog.create({
        data: {
          source: sourceName,
          status: 'FAILED',
          recordsProcessed,
          errorMessage: error.message,
        },
      });

      return {
        source: sourceName,
        status: 'FAILED',
        recordsProcessed,
        error: error.message,
      };
    }
  }
}

