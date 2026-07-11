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
    saveToDb: (data: InternalType) => Promise<any>
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
        let result;
        try {
          result = await provider.fetchData(currentCursor || undefined);
        } catch (error: any) {
          this.logger.warn(`Incremental fetch failed for ${sourceName}. Attempting full sync fallback. Error: ${error.message}`);
          currentCursor = null; 
          result = await provider.fetchData();
        }

        for (const item of result.data) {
          const normalized = normalizer.normalize(item);
          await saveToDb(normalized);
          recordsProcessed++;
        }

        currentCursor = result.nextCursor || null;
        hasMore = result.hasMore;

        await this.prisma.syncState.update({
          where: { source: sourceName },
          data: { cursor: currentCursor },
        });
      }

      await this.prisma.syncState.update({
        where: { source: sourceName },
        data: {
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

      this.logger.log(`Sync completed for ${sourceName}. Processed ${recordsProcessed} records.`);
      return { source: sourceName, status: 'SUCCESS', recordsProcessed };
    } catch (error: any) {
      this.logger.error(`Sync failed for ${sourceName}`, error.stack);
      
      await this.prisma.syncState.update({
        where: { source: sourceName },
        data: { status: 'FAILED' },
      });

      await this.prisma.syncLog.create({
        data: {
          source: sourceName,
          status: 'FAILED',
          recordsProcessed,
          errorMessage: error.message,
        },
      });

      return { source: sourceName, status: 'FAILED', recordsProcessed, error: error.message };
    }
  }
}
