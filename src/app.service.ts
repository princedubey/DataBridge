import { Injectable, Logger } from '@nestjs/common';
import { SyncService } from './sync/sync.service';
import { IdempotencyService } from './sync/services/idempotency.service';
import { StripeConnectorService } from './integrations/stripe/stripe-connector.service';
import { StripeNormalizer } from './integrations/stripe/stripe.normalizer';
import { HubspotConnectorService } from './integrations/hubspot/hubspot-connector.service';
import { HubSpotNormalizer } from './integrations/hubspot/hubspot.normalizer';
import { GcalConnectorService } from './integrations/google-calendar/gcal-connector.service';
import { GcalNormalizer } from './integrations/google-calendar/gcal.normalizer';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly idempotencyService: IdempotencyService,
    private readonly stripeConnector: StripeConnectorService,
    private readonly hubspotConnector: HubspotConnectorService,
    private readonly gcalConnector: GcalConnectorService,
  ) {}

  getHello(): string {
    return 'DataBridge API is running!';
  }

  async triggerAllSyncs() {
    this.logger.log('Manually triggering all sync operations sequentially to prevent saturation...');

    const tasks = [
      () => this.syncService.runSync(
        this.stripeConnector,
        new StripeNormalizer(),
        async (data) => this.idempotencyService.upsertPayments(data),
      ),
      () => this.syncService.runSync(
        this.hubspotConnector,
        new HubSpotNormalizer(),
        async (data) => this.idempotencyService.upsertCustomers(data),
      ),
      () => this.syncService.runSync(
        this.gcalConnector,
        new GcalNormalizer(),
        async (data) => this.idempotencyService.upsertEvents(data),
      ),
    ];

    const syncStatuses: Array<{ source: string; status: string; recordsProcessed?: number; error?: string }> = [];
    for (const task of tasks) {
      try {
        const result = await task();
        syncStatuses.push(result);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        syncStatuses.push({
          source: 'unknown',
          status: 'CRITICAL_ERROR',
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Sync operations completed. Statuses: ${JSON.stringify(syncStatuses)}`,
    );

    return {
      message: 'Sync operations completed',
      results: syncStatuses,
    };
  }
}
