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
              aggregate: jest
                .fn()
                .mockResolvedValue({ _sum: { amount: 50000 } }),
            },
            $queryRaw: jest.fn().mockResolvedValue([
              { date: '2026-07-01', revenue: BigInt(50000) },
            ]),
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
    expect(result).toEqual({ totalRevenue: 500 });
    expect(prisma.payment.aggregate).toHaveBeenCalled();
  });

  it('should calculate daily revenue', async () => {
    const result = await service.getDailyRevenue();
    expect(result).toEqual([{ date: '2026-07-01', revenue: 500 }]);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});
