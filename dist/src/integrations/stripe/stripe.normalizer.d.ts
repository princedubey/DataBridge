import { Normalizer } from '../../sync/interfaces/normalizer.interface';
import { Payment } from '@prisma/client';
import Stripe from 'stripe';
export declare class StripeNormalizer implements Normalizer<Stripe.PaymentIntent, Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>> {
    private readonly COLLECTED_STATUSES;
    normalize(data: Stripe.PaymentIntent): Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;
}
