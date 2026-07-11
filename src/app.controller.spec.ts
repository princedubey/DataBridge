import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SyncService } from './sync/sync.service';
import { IdempotencyService } from './sync/services/idempotency.service';
import { StripeConnectorService } from './integrations/stripe/stripe-connector.service';
import { HubspotConnectorService } from './integrations/hubspot/hubspot-connector.service';
import { GcalConnectorService } from './integrations/google-calendar/gcal-connector.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockSyncService = { runSync: jest.fn() };
    const mockIdempotencyService = { upsertPayment: jest.fn(), upsertCustomer: jest.fn(), upsertEvent: jest.fn() };
    
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: SyncService, useValue: mockSyncService },
        { provide: IdempotencyService, useValue: mockIdempotencyService },
        { provide: StripeConnectorService, useValue: {} },
        { provide: HubspotConnectorService, useValue: {} },
        { provide: GcalConnectorService, useValue: {} },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "DataBridge API is running!"', () => {
      expect(appController.getHello()).toBe('DataBridge API is running!');
    });
  });
});
