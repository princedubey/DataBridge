import { StripeNormalizer } from './stripe.normalizer';
import Stripe from 'stripe';

describe('StripeNormalizer', () => {
  let normalizer: StripeNormalizer;

  beforeEach(() => {
    normalizer = new StripeNormalizer();
  });

  it('should normalize a successful payment', () => {
    const payment = {
      id: 'pi_123',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      customer: 'John Doe',
    } as Stripe.PaymentIntent;

    const result = normalizer.normalize(payment);

    expect(result).toEqual({
      externalId: 'pi_123',
      customerName: 'John Doe',
      amount: 5000,
      currency: 'USD',
      status: 'COLLECTED',
    });
  });

  it('should normalize a failed payment', () => {
    const payment = {
      id: 'pi_456',
      amount: 2000,
      currency: 'eur',
      status: 'canceled',
    } as Stripe.PaymentIntent;

    const result = normalizer.normalize(payment);

    expect(result).toEqual({
      externalId: 'pi_456',
      customerName: null,
      amount: 2000,
      currency: 'EUR',
      status: 'FAILED',
    });
  });
});
