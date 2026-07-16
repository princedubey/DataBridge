import { Test, TestingModule } from '@nestjs/testing';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';

describe('RevenueController', () => {
  let controller: RevenueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevenueController],
      providers: [
        {
          provide: RevenueService,
          useValue: {
            getTotalRevenue: jest
              .fn()
              .mockResolvedValue({ totalRevenue: 50000 }),
            getDailyRevenue: jest
              .fn()
              .mockResolvedValue([{ date: '2026-07-01', revenue: 50000 }]),
          },
        },
      ],
    }).compile();

    controller = module.get<RevenueController>(RevenueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
