import { IntegrationProvider, SyncResult } from '../../sync/interfaces/integration-provider.interface';
import { SimplePublicObjectWithAssociations } from '@hubspot/api-client/lib/codegen/crm/contacts/models/SimplePublicObjectWithAssociations';
export declare class HubspotConnectorService implements IntegrationProvider<SimplePublicObjectWithAssociations> {
    private readonly hubspotClient;
    private readonly logger;
    constructor();
    getName(): string;
    fetchData(cursor?: string): Promise<SyncResult<SimplePublicObjectWithAssociations>>;
}
