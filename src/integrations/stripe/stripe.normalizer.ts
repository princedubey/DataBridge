import { Normalizer } from '../../sync/interfaces/normalizer.interface';
import { Payment } from '@prisma/client';
import Stripe from 'stripe';

export class StripeNormalizer implements Normalizer<
  Stripe.PaymentIntent,
  Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
> {
  private readonly COLLECTED_STATUSES = ['succeeded', 'paid', 'completed'];

  normalize(
    data: Stripe.PaymentIntent,
  ): Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> {
    let internalStatus = 'PENDING';

    if (this.COLLECTED_STATUSES.includes(data.status)) {
      internalStatus = 'COLLECTED';
    } else if (
      data.status === 'canceled' ||
      data.status === 'requires_payment_method'
    ) {
      internalStatus = 'FAILED';
    }

    let customerName: string | null = null;
    if (data.customer) {
      if (typeof data.customer === 'string') {
        customerName = data.customer;
      } else if ('name' in data.customer && data.customer.name) {
        customerName = data.customer.name;
      } else if ('email' in data.customer && data.customer.email) {
        customerName = data.customer.email;
      } else {
        customerName = data.customer.id;
      }
    }

    // Stripe amount is in cents, keep it as int
    return {
      externalId: data.id,
      customerName,
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      status: internalStatus,
    };
  }
}
