import { Injectable, Logger } from '@nestjs/common';
import {
  IntegrationProvider,
  SyncResult,
} from '../../sync/interfaces/integration-provider.interface';
import { Client } from '@hubspot/api-client';
import { SimplePublicObjectWithAssociations } from '@hubspot/api-client/lib/codegen/crm/contacts/models/SimplePublicObjectWithAssociations';

@Injectable()
export class HubspotConnectorService implements IntegrationProvider<SimplePublicObjectWithAssociations> {
  private readonly hubspotClient: Client;
  private readonly logger = new Logger(HubspotConnectorService.name);

  constructor() {
    this.hubspotClient = new Client({
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN || 'pat-na1-placeholder',
    });
  }

  getName(): string {
    return 'hubspot';
  }

  async fetchData(
    cursor?: string,
  ): Promise<SyncResult<SimplePublicObjectWithAssociations>> {
    this.logger.debug(
      `Fetching HubSpot contacts from cursor: ${cursor || 'start'}`,
    );

    const limit = 100;
    const properties = ['firstname', 'lastname', 'email', 'company'];

    let originalSyncTimestamp: string | undefined = undefined;
    let afterToken: string | undefined = undefined;

    // Cursor format: originalSyncTimestamp|afterToken
    if (cursor) {
      if (cursor.includes('|')) {
        const parts = cursor.split('|');
        originalSyncTimestamp = parts[0] !== 'null' ? parts[0] : undefined;
        afterToken = parts[1];
      } else {
        originalSyncTimestamp = cursor;
      }
    }

    const searchRequest: Parameters<
      typeof this.hubspotClient.crm.contacts.searchApi.doSearch
    >[0] = {
      limit,
      properties,
      after: afterToken,
      sorts: ['lastmodifieddate'],
    };

    if (originalSyncTimestamp) {
      const timestamp = new Date(originalSyncTimestamp).getTime();
      searchRequest.filterGroups = [
        {
          filters: [
            {
              propertyName: 'lastmodifieddate',
              operator: 'GTE' as any,
              value: timestamp.toString(),
            },
          ],
        },
      ];
    }

    const response =
      await this.hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);

    // Cast because search API returns SimplePublicObject but the IntegrationProvider expects SimplePublicObjectWithAssociations
    const data =
      response.results as unknown as SimplePublicObjectWithAssociations[];

    let nextCursor: string | null = null;
    let hasMore = false;

    if (response.paging && response.paging.next && response.paging.next.after) {
      nextCursor = `${originalSyncTimestamp || 'null'}|${response.paging.next.after}`;
      hasMore = true;
    } else {
      // End of sync run. Save the current timestamp for the NEXT scheduled run.
      nextCursor = new Date().toISOString();
      hasMore = false;
    }

    return {
      data,
      nextCursor,
      hasMore,
    };
  }
}
