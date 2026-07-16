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
    let lastSyncCreated: number | undefined = undefined;
    let lastSyncId: string | undefined = undefined;

    // Cursor format: lastSyncCreated|lastSyncId|startingAfter
    if (cursor) {
      const parts = cursor.split('|');
      if (parts.length >= 2) {
        lastSyncCreated = parseInt(parts[0], 10);
        lastSyncId = parts[1] !== 'null' ? parts[1] : undefined;
        startingAfter = parts[2];
      } else {
        // Fallback for old cursor format (ISO string)
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
          lastSyncCreated = Math.floor(cursorDate.getTime() / 1000);
        }
      }
    }

    if (lastSyncCreated) {
      createdFilter = { gte: lastSyncCreated };
    }

    const limit = 100;

    const response = await this.stripe.paymentIntents.list({
      limit,
      created: createdFilter,
      starting_after: startingAfter,
    });

    let data = response.data;

    // Strict boundary semantics: if we are at the beginning of a new run (no startingAfter),
    // we might fetch the exact boundary record again because of `gte`. Let's filter it out.
    if (!startingAfter && lastSyncId && data.length > 0) {
       const boundaryIndex = data.findIndex(d => d.id === lastSyncId);
       if (boundaryIndex !== -1) {
         // We found the boundary record, slice the array to only include records newer than it.
         // Since Stripe returns descending (newest first), newer records are before the boundary index.
         data = data.slice(0, boundaryIndex);
       }
    }

    let nextCursor: string | null = null;

    if (response.data.length > 0) {
      if (response.has_more) {
        // Pagination within the same sync run
        const lastId = response.data[response.data.length - 1].id;
        // Keep the original boundary timestamp and ID, just update startingAfter
        nextCursor = `${lastSyncCreated || Math.floor(Date.now()/1000)}|${lastSyncId || 'null'}|${lastId}`;
      } else {
        // End of sync run. The next sync should start from the newest record we just processed.
        // Stripe sorts descending, so the newest record is the FIRST item of the FIRST page.
        // However, we only have access to the current page. To be safe, we just use the current time
        // or the max created timestamp of the current batch as the new boundary.
        const maxCreated = Math.max(...response.data.map(d => d.created));
        const newestRecord = response.data.find(d => d.created === maxCreated);
        nextCursor = `${maxCreated}|${newestRecord?.id || 'null'}|`;
      }
    } else {
      // No data returned, update cursor to current time
      nextCursor = `${Math.floor(Date.now() / 1000)}|null|`;
    }

    return {
      data,
      nextCursor,
      hasMore: response.has_more,
    };
  }
}
