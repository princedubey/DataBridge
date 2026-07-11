import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider, SyncResult } from '../../sync/interfaces/integration-provider.interface';
import { Client } from '@hubspot/api-client';
import { SimplePublicObjectWithAssociations } from '@hubspot/api-client/lib/codegen/crm/contacts/models/SimplePublicObjectWithAssociations';

@Injectable()
export class HubspotConnectorService implements IntegrationProvider<SimplePublicObjectWithAssociations> {
  private readonly hubspotClient: Client;
  private readonly logger = new Logger(HubspotConnectorService.name);

  constructor() {
    this.hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN || 'pat-na1-placeholder' });
  }

  getName(): string {
    return 'hubspot';
  }

  async fetchData(cursor?: string): Promise<SyncResult<SimplePublicObjectWithAssociations>> {
    this.logger.debug(`Fetching HubSpot contacts from cursor: ${cursor || 'start'}`);

    const limit = 100;
    const properties = ['firstname', 'lastname', 'email', 'company'];

    const response = await this.hubspotClient.crm.contacts.basicApi.getPage(
      limit,
      cursor,
      properties
    );

    const data = response.results;
    
    // HubSpot uses 'paging.next.after' as the pagination cursor
    let nextCursor: string | null = null;
    let hasMore = false;

    if (response.paging && response.paging.next && response.paging.next.after) {
      nextCursor = response.paging.next.after;
      hasMore = true;
    }

    return {
      data,
      nextCursor,
      hasMore,
    };
  }
}
