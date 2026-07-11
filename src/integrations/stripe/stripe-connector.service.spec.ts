import { Test, TestingModule } from '@nestjs/testing';
import { StripeConnectorService } from './stripe-connector.service';

describe('StripeConnectorService', () => {
  let service: StripeConnectorService;

  beforeEach(async () => {
    // Set a dummy key before the service is instantiated
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeConnectorService],
    }).compile();

    service = module.get<StripeConnectorService>(StripeConnectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
