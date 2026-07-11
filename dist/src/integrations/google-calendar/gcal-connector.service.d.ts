import { IntegrationProvider, SyncResult } from '../../sync/interfaces/integration-provider.interface';
import { calendar_v3 } from 'googleapis';
export declare class GcalConnectorService implements IntegrationProvider<calendar_v3.Schema$Event> {
    private readonly calendar;
    private readonly logger;
    constructor();
    getName(): string;
    fetchData(cursor?: string): Promise<SyncResult<calendar_v3.Schema$Event>>;
}
