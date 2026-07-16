import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upserts a customer record ensuring idempotency.
   */
  async upsertCustomer(data: Prisma.CustomerCreateInput) {
    return this.prisma.customer.upsert({
      where: { externalId: data.externalId },
      update: data,
      create: data,
    });
  }

  /**
   * Upserts an event record ensuring idempotency.
   */
  async upsertEvent(data: Prisma.EventCreateInput) {
    return this.prisma.event.upsert({
      where: { externalId: data.externalId },
      update: data,
      create: data,
    });
  }

  /**
   * Upserts a payment record ensuring idempotency.
   */
  async upsertPayment(data: Prisma.PaymentCreateInput) {
    return this.prisma.payment.upsert({
      where: { externalId: data.externalId },
      update: data,
      create: data,
    });
  }
}
