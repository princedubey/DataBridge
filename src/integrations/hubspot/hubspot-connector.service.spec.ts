import { Test, TestingModule } from '@nestjs/testing';
import { HubspotConnectorService } from './hubspot-connector.service';
import { Client } from '@hubspot/api-client';

jest.mock('@hubspot/api-client', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      crm: {
        contacts: {
          searchApi: {
            doSearch: jest.fn(),
          },
        },
      },
    })),
  };
});

describe('HubspotConnectorService', () => {
  let service: HubspotConnectorService;
  let clientMock: any;

  beforeEach(async () => {
    process.env.HUBSPOT_ACCESS_TOKEN = 'pat-na1-123';

    const module: TestingModule = await Test.createTestingModule({
      providers: [HubspotConnectorService],
    }).compile();

    service = module.get<HubspotConnectorService>(HubspotConnectorService);
    clientMock = (service as any).hubspotClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getName should return hubspot', () => {
    expect(service.getName()).toBe('hubspot');
  });

  it('fetchData should fetch from hubspot and return sync result with pagination', async () => {
    clientMock.crm.contacts.searchApi.doSearch.mockResolvedValue({
      results: [{ id: '123' }],
      paging: {
        next: {
          after: 'next_page_token',
        },
      },
    });

    const result = await service.fetchData();

    expect(result.data.length).toBe(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toContain('next_page_token');
    expect(clientMock.crm.contacts.searchApi.doSearch).toHaveBeenCalled();
  });

  it('fetchData should handle cursor correctly', async () => {
    clientMock.crm.contacts.searchApi.doSearch.mockResolvedValue({
      results: [],
    });

    const result = await service.fetchData('2023-01-01T00:00:00Z|after_token_123');

    expect(result.data.length).toBe(0);
    expect(result.hasMore).toBe(false);
    expect(clientMock.crm.contacts.searchApi.doSearch).toHaveBeenCalledWith(expect.objectContaining({
      after: 'after_token_123',
    }));
  });
});
