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
    this.logger.log('Manually triggering all sync operations...');
    
    // We run these concurrently. The SyncService catches and isolates errors internally 
    // so if Stripe fails, HubSpot and GCal still continue without crashing the whole run.
    const results = await Promise.allSettled([
      this.syncService.runSync(
        this.stripeConnector,
        new StripeNormalizer(),
        async (data) => this.idempotencyService.upsertPayment(data)
      ),
      this.syncService.runSync(
        this.hubspotConnector,
        new HubSpotNormalizer(),
        async (data) => this.idempotencyService.upsertCustomer(data)
      ),
      this.syncService.runSync(
        this.gcalConnector,
        new GcalNormalizer(),
        async (data) => this.idempotencyService.upsertEvent(data)
      )
    ]);

    const status = results.map(r => r.status);
    this.logger.log(`Sync operations completed. Statuses: ${JSON.stringify(status)}`);
    
    return {
      message: 'Sync operations completed',
      results: status
    };
  }
}
