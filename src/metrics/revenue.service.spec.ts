import { Test, TestingModule } from '@nestjs/testing';
import { RevenueService } from './revenue.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RevenueService', () => {
  let service: RevenueService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueService,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 50000 } }),
              findMany: jest.fn().mockResolvedValue([
                { amount: 10000, createdAt: new Date('2026-07-01T12:00:00Z') },
                { amount: 40000, createdAt: new Date('2026-07-01T15:00:00Z') },
              ]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RevenueService>(RevenueService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate total revenue', async () => {
    const result = await service.getTotalRevenue();
    expect(result).toEqual({ totalRevenue: 50000 });
    expect(prisma.payment.aggregate).toHaveBeenCalled();
  });

  it('should calculate daily revenue', async () => {
    const result = await service.getDailyRevenue();
    expect(result).toEqual([{ date: '2026-07-01', revenue: 50000 }]);
    expect(prisma.payment.findMany).toHaveBeenCalled();
  });
});
