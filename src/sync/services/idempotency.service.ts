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

  /**
   * Batch upserts customer records using a Prisma transaction.
   */
  async upsertCustomers(data: Prisma.CustomerCreateInput[]) {
    return this.prisma.$transaction(
      data.map((item) =>
        this.prisma.customer.upsert({
          where: { externalId: item.externalId },
          update: item,
          create: item,
        }),
      ),
    );
  }

  /**
   * Batch upserts event records using a Prisma transaction.
   */
  async upsertEvents(data: Prisma.EventCreateInput[]) {
    return this.prisma.$transaction(
      data.map((item) =>
        this.prisma.event.upsert({
          where: { externalId: item.externalId },
          update: item,
          create: item,
        }),
      ),
    );
  }

  /**
   * Batch upserts payment records using a Prisma transaction.
   */
  async upsertPayments(data: Prisma.PaymentCreateInput[]) {
    return this.prisma.$transaction(
      data.map((item) =>
        this.prisma.payment.upsert({
          where: { externalId: item.externalId },
          update: item,
          create: item,
        }),
      ),
    );
  }
}
