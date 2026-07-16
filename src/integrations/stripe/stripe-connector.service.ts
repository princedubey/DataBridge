import { Injectable, Logger } from '@nestjs/common';
import {
  IntegrationProvider,
  SyncResult,
} from '../../sync/interfaces/integration-provider.interface';
import Stripe from 'stripe';

@Injectable()
export class StripeConnectorService implements IntegrationProvider<Stripe.PaymentIntent> {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeConnectorService.name);

  constructor() {
    this.stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    );
  }

  getName(): string {
    return 'stripe';
  }

  async fetchData(cursor?: string): Promise<SyncResult<Stripe.PaymentIntent>> {
    this.logger.debug(
      `Fetching Stripe payments from cursor: ${cursor || 'start'}`,
    );

    let createdFilter: Stripe.PaymentIntentListParams['created'] = undefined;
    let startingAfter: string | undefined = undefined;
    let originalSyncTimestamp: string | undefined = undefined;
    let maxSeenSoFar: string | undefined = undefined;

    // Cursor format: originalSyncTimestamp|startingAfter|maxSeenSoFar
    if (cursor) {
      if (cursor.includes('|')) {
        const parts = cursor.split('|');
        originalSyncTimestamp = parts[0] !== 'null' ? parts[0] : undefined;
        startingAfter = parts[1];
        maxSeenSoFar = parts[2];
      } else {
        originalSyncTimestamp = cursor;
      }
    }

    if (originalSyncTimestamp) {
      const cursorDate = new Date(originalSyncTimestamp);
      createdFilter = { gte: Math.floor(cursorDate.getTime() / 1000) };
    }

    const limit = 100;

    const response = await this.stripe.paymentIntents.list({
      limit,
      created: createdFilter,
      starting_after: startingAfter,
      expand: ['data.customer'],
    });

    const data = response.data;

    let nextCursor: string | null = null;

    if (data.length > 0) {
      const currentBatchMax = Math.max(...data.map((p) => p.created));
      const currentBatchMaxIso = new Date(currentBatchMax * 1000).toISOString();

      // Update maxSeenSoFar if this batch has a newer record
      if (
        !maxSeenSoFar ||
        new Date(currentBatchMaxIso) > new Date(maxSeenSoFar)
      ) {
        maxSeenSoFar = currentBatchMaxIso;
      }

      if (response.has_more) {
        // Pagination within the same sync run
        const lastId = data[data.length - 1].id;
        nextCursor = `${originalSyncTimestamp || 'null'}|${lastId}|${maxSeenSoFar}`;
      } else {
        // End of sync run. The next sync should start from the absolute max timestamp we found.
        nextCursor = maxSeenSoFar;
      }
    } else {
      // No data returned, so no changes to cursor for next run
      nextCursor = originalSyncTimestamp || null;
    }

    return {
      data,
      nextCursor,
      hasMore: response.has_more,
    };
  }
}
