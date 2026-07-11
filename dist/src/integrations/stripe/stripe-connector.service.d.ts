import { IntegrationProvider, SyncResult } from '../../sync/interfaces/integration-provider.interface';
import Stripe from 'stripe';
export declare class StripeConnectorService implements IntegrationProvider<Stripe.PaymentIntent> {
    private readonly stripe;
    private readonly logger;
    constructor();
    getName(): string;
    fetchData(cursor?: string): Promise<SyncResult<Stripe.PaymentIntent>>;
}
