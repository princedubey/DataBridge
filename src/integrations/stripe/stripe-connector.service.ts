import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider, SyncResult } from '../../sync/interfaces/integration-provider.interface';
import Stripe from 'stripe';

@Injectable()
export class StripeConnectorService implements IntegrationProvider<Stripe.PaymentIntent> {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeConnectorService.name);

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2025-01-27.acacia' as any, // latest API version approx
    });
  }

  getName(): string {
    return 'stripe';
  }

  async fetchData(cursor?: string): Promise<SyncResult<Stripe.PaymentIntent>> {
    this.logger.debug(`Fetching Stripe payments from cursor: ${cursor || 'start'}`);
    
    let createdFilter: any = undefined;

    // We simulate incremental sync by fetching payments created after a certain timestamp.
    // In actual Stripe, you might use 'starting_after' with an object ID, or a date filter.
    // For incremental date filtering:
    if (cursor) {
      const cursorDate = new Date(cursor);
      createdFilter = { gte: Math.floor(cursorDate.getTime() / 1000) };
    }

    const limit = 100;
    
    // For simplicity, we just use a basic list call. 
    // To do true deep pagination, we'd loop or return the last object ID as next cursor.
    // Since the SRS says cursor can be a timestamp, we'll store the latest createdAt timestamp as the new cursor.
    
    const response = await this.stripe.paymentIntents.list({
      limit,
      created: createdFilter,
    });

    const data = response.data;
    
    let nextCursor = cursor || null;
    if (data.length > 0) {
      // Find the most recent creation time
      const maxCreated = Math.max(...data.map((p) => p.created));
      // Convert back to ISO string for storage
      nextCursor = new Date(maxCreated * 1000).toISOString();
    }

    return {
      data,
      nextCursor,
      hasMore: response.has_more,
    };
  }
}
