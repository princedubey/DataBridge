import { Test, TestingModule } from '@nestjs/testing';
import { GcalConnectorService } from './gcal-connector.service';
import { google } from 'googleapis';

jest.mock('googleapis', () => {
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn(),
        })),
      },
      calendar: jest.fn().mockReturnValue({
        events: {
          list: jest.fn(),
        },
      }),
    },
  };
});

describe('GcalConnectorService', () => {
  let service: GcalConnectorService;
  let calendarMock: any;

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'client_id';
    process.env.GOOGLE_CLIENT_SECRET = 'client_secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh_token';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GcalConnectorService],
    }).compile();

    service = module.get<GcalConnectorService>(GcalConnectorService);
    calendarMock = (service as any).calendar;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getName should return google-calendar', () => {
    expect(service.getName()).toBe('google-calendar');
  });

  it('fetchData should fetch from calendar and return sync result with pagination', async () => {
    calendarMock.events.list.mockResolvedValue({
      data: {
        items: [{ id: 'event1', updated: '2023-01-01T00:00:00.000Z' }],
        nextPageToken: 'token_123',
      },
    });

    const result = await service.fetchData();

    expect(result.data.length).toBe(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('pageToken:token_123');
    expect(calendarMock.events.list).toHaveBeenCalled();
  });

  it('fetchData should handle cursor correctly', async () => {
    calendarMock.events.list.mockResolvedValue({
      data: {
        items: [],
      },
    });

    const result = await service.fetchData('pageToken:token_456');

    expect(result.data.length).toBe(0);
    expect(result.hasMore).toBe(false);
    expect(calendarMock.events.list).toHaveBeenCalledWith(expect.objectContaining({
      pageToken: 'token_456',
    }));
  });
});
