import { Injectable, Logger } from '@nestjs/common';
import {
  IntegrationProvider,
  SyncResult,
} from '../../sync/interfaces/integration-provider.interface';
import { google, calendar_v3 } from 'googleapis';

@Injectable()
export class GcalConnectorService implements IntegrationProvider<calendar_v3.Schema$Event> {
  private readonly calendar: calendar_v3.Calendar;
  private readonly logger = new Logger(GcalConnectorService.name);

  constructor() {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || 'client_id',
      process.env.GOOGLE_CLIENT_SECRET || 'client_secret',
    );
    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN || 'refresh_token',
    });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  getName(): string {
    return 'google-calendar';
  }

  async fetchData(
    cursor?: string,
  ): Promise<SyncResult<calendar_v3.Schema$Event>> {
    this.logger.debug(
      `Fetching Google Calendar events from cursor: ${cursor || 'start'}`,
    );

    const maxResults = 100;

    // We can use updatedMin for incremental fetching based on modified time.
    let updatedMin: string | undefined = undefined;

    // Check if cursor is a date (updatedMin requires RFC3339 timestamp)
    if (cursor && !cursor.startsWith('pageToken:')) {
      updatedMin = new Date(cursor).toISOString();
    }

    // Page token processing
    let pageToken: string | undefined = undefined;
    if (cursor && cursor.startsWith('pageToken:')) {
      pageToken = cursor.split(':')[1];
    }

    const response = await this.calendar.events.list({
      calendarId: 'primary',
      maxResults,
      updatedMin,
      pageToken,
      singleEvents: true, // expands recurring events
      showDeleted: false,
    });

    const data = response.data.items || [];

    let nextCursor: string | null = null;
    let hasMore = false;

    if (response.data.nextPageToken) {
      nextCursor = `pageToken:${response.data.nextPageToken}`;
      hasMore = true;
    } else if (data.length > 0) {
      // Find the max updated time
      const maxUpdated = data.reduce((max, event) => {
        const updated = new Date(event.updated || 0).getTime();
        return updated > max ? updated : max;
      }, 0);

      if (maxUpdated > 0) {
        nextCursor = new Date(maxUpdated).toISOString();
      }
    }

    return {
      data,
      nextCursor,
      hasMore,
    };
  }
}
