import { Test, TestingModule } from '@nestjs/testing';
import { StripeConnectorService } from './stripe-connector.service';
import Stripe from 'stripe';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      list: jest.fn(),
    },
  }));
});

describe('StripeConnectorService', () => {
  let service: StripeConnectorService;
  let stripeMock: any;

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';

    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeConnectorService],
    }).compile();

    service = module.get<StripeConnectorService>(StripeConnectorService);
    stripeMock = (service as any).stripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getName should return stripe', () => {
    expect(service.getName()).toBe('stripe');
  });

  it('fetchData should fetch from stripe and return sync result with pagination', async () => {
    stripeMock.paymentIntents.list.mockResolvedValue({
      data: [{ id: 'pi_123', created: 1000 }],
      has_more: true,
    });

    const result = await service.fetchData();

    expect(result.data.length).toBe(1);
    expect(result.hasMore).toBe(true);
    // Cursor logic: null|pi_123|newMaxIso
    expect(result.nextCursor).toContain('pi_123');
    expect(stripeMock.paymentIntents.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });

  it('fetchData should handle cursor correctly', async () => {
    stripeMock.paymentIntents.list.mockResolvedValue({
      data: [],
      has_more: false,
    });

    const result = await service.fetchData('2023-01-01T00:00:00Z|pi_456|2023-01-02T00:00:00Z');

    expect(result.data.length).toBe(0);
    expect(result.hasMore).toBe(false);
    expect(stripeMock.paymentIntents.list).toHaveBeenCalledWith(expect.objectContaining({
      starting_after: 'pi_456',
    }));
  });
});
