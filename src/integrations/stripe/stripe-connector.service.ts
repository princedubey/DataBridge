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
      if (response.has_more) {
        // Pagination within the same sync run
        const lastId = data[data.length - 1].id;
        nextCursor = `${originalSyncTimestamp || 'null'}|${lastId}`;
      } else {
        // End of sync run. The next sync should start from the time this run was initiated.
        // We use Math.floor(Date.now() / 1000) instead of maxSeenSoFar to avoid infinite loops 
        // fetching the exact same-second records on every scheduled run.
        nextCursor = new Date().toISOString();
      }
    } else {
      // No data returned, update cursor to current time to avoid re-fetching old empty windows
      nextCursor = new Date().toISOString();
    }

    return {
      data,
      nextCursor,
      hasMore: response.has_more,
    };
  }
}
