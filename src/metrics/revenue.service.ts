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
    const filters: Prisma.Sql[] = [Prisma.sql`"status" = 'COLLECTED'`];

    if (startDate) {
      filters.push(Prisma.sql`"createdAt" >= ${new Date(startDate)}`);
    }
    if (endDate) {
      const end = new Date(endDate);
      if (endDate.length === 10) {
        end.setDate(end.getDate() + 1);
      }
      filters.push(Prisma.sql`"createdAt" < ${end}`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`;

    const result = await this.prisma.$queryRaw<{ date: string; revenue: number | bigint }[]>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
        SUM(amount) as revenue
      FROM "Payment"
      ${whereClause}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    return result.map(row => ({
      date: row.date,
      revenue: Number(row.revenue) / 100,
    }));
  }
}
