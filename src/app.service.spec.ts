import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { SyncService } from './sync/sync.service';
import { IdempotencyService } from './sync/services/idempotency.service';
import { StripeConnectorService } from './integrations/stripe/stripe-connector.service';
import { HubspotConnectorService } from './integrations/hubspot/hubspot-connector.service';
import { GcalConnectorService } from './integrations/google-calendar/gcal-connector.service';

describe('AppService', () => {
  let appService: AppService;
  let syncService: SyncService;

  beforeEach(async () => {
    const mockSyncService = {
      runSync: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: SyncService, useValue: mockSyncService },
        { provide: IdempotencyService, useValue: {} },
        { provide: StripeConnectorService, useValue: {} },
        { provide: HubspotConnectorService, useValue: {} },
        { provide: GcalConnectorService, useValue: {} },
      ],
    }).compile();

    appService = module.get<AppService>(AppService);
    syncService = module.get<SyncService>(SyncService);
  });

  it('should trigger all sync operations without failing if one rejects', async () => {
    // Mock runSync to resolve successfully
    (syncService.runSync as jest.Mock).mockResolvedValueOnce(undefined);
    (syncService.runSync as jest.Mock).mockResolvedValueOnce(undefined);
    (syncService.runSync as jest.Mock).mockRejectedValueOnce(new Error('Sync failed'));

    const result = await appService.triggerAllSyncs();
    
    expect(syncService.runSync).toHaveBeenCalledTimes(3);
    
    // Promise.allSettled ensures it doesn't throw, and returns statuses
    expect(result.results).toContain('fulfilled');
    expect(result.results).toContain('rejected');
  });
});
