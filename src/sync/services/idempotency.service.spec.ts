import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockPrisma = {
      customer: { upsert: jest.fn().mockResolvedValue({}) },
      event: { upsert: jest.fn().mockResolvedValue({}) },
      payment: { upsert: jest.fn().mockResolvedValue({}) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should upsert customer', async () => {
    await service.upsertCustomer({ externalId: '123', firstName: 'John' } as any);
    expect(prismaService.customer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { externalId: '123' } })
    );
  });

  it('should upsert event', async () => {
    await service.upsertEvent({ externalId: 'evt_1', summary: 'Meeting' } as any);
    expect(prismaService.event.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { externalId: 'evt_1' } })
    );
  });

  it('should upsert payment', async () => {
    await service.upsertPayment({ externalId: 'pay_1', amount: 100 } as any);
    expect(prismaService.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { externalId: 'pay_1' } })
    );
  });
});
