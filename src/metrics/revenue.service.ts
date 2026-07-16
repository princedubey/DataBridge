import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { Prisma } from '@prisma/client';

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDateFilter(startDate?: string, endDate?: string) {
    const where: Prisma.PaymentWhereInput = { status: 'COLLECTED' };

    if (startDate || endDate) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        createdAtFilter.gte = new Date(startDate);
      }
      if (endDate) {
        // To include the entire end date, add 1 day if it's a simple YYYY-MM-DD
        const end = new Date(endDate);
        if (endDate.length === 10) {
          // basic YYYY-MM-DD
          end.setDate(end.getDate() + 1);
        }
        createdAtFilter.lt = end;
      }
      where.createdAt = createdAtFilter;
    }

    return where;
  }

  async getTotalRevenue(startDate?: string, endDate?: string) {
    const where = this.parseDateFilter(startDate, endDate);

    const result = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where,
    });

    return { totalRevenue: (result._sum.amount || 0) / 100 };
  }

  async getDailyRevenue(startDate?: string, endDate?: string) {
    const where = this.parseDateFilter(startDate, endDate);

    const payments = await this.prisma.payment.findMany({
      where,
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, number>();

    for (const payment of payments) {
      // Group by YYYY-MM-DD
      const dateString = payment.createdAt.toISOString().split('T')[0];
      const current = dailyMap.get(dateString) || 0;
      dailyMap.set(dateString, current + payment.amount);
    }

    const result = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: revenue / 100,
    }));

    return result;
  }
}
