import { SyncService } from './sync/sync.service';
import { IdempotencyService } from './sync/services/idempotency.service';
import { StripeConnectorService } from './integrations/stripe/stripe-connector.service';
import { HubspotConnectorService } from './integrations/hubspot/hubspot-connector.service';
import { GcalConnectorService } from './integrations/google-calendar/gcal-connector.service';
export declare class AppService {
    private readonly syncService;
    private readonly idempotencyService;
    private readonly stripeConnector;
    private readonly hubspotConnector;
    private readonly gcalConnector;
    private readonly logger;
    constructor(syncService: SyncService, idempotencyService: IdempotencyService, stripeConnector: StripeConnectorService, hubspotConnector: HubspotConnectorService, gcalConnector: GcalConnectorService);
    getHello(): string;
    triggerAllSyncs(): Promise<{
        message: string;
        results: ("rejected" | "fulfilled")[];
    }>;
}
