import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upserts a customer record ensuring idempotency.
   */
  async upsertCustomer(data: any) {
    return this.prisma.customer.upsert({
      where: { externalId: data.externalId },
      update: data,
      create: data,
    });
  }

  /**
   * Upserts an event record ensuring idempotency.
   */
  async upsertEvent(data: any) {
    return this.prisma.event.upsert({
      where: { externalId: data.externalId },
      update: data,
      create: data,
    });
  }

  /**
   * Upserts a payment record ensuring idempotency.
   */
  async upsertPayment(data: any) {
    return this.prisma.payment.upsert({
      where: { externalId: data.externalId },
      update: data,
      create: data,
    });
  }
}
