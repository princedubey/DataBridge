import { Controller, Get, Query } from '@nestjs/common';
import { RevenueService } from './revenue.service';

@Controller('metrics/revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.revenueService.getTotalRevenue(startDate, endDate);
  }

  @Get('daily')
  async getDaily(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.revenueService.getDailyRevenue(startDate, endDate);
  }
}
