import { PrismaService } from '../prisma/prisma.service';
export declare class RevenueService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseDateFilter;
    getTotalRevenue(startDate?: string, endDate?: string): Promise<{
        totalRevenue: number;
    }>;
    getDailyRevenue(startDate?: string, endDate?: string): Promise<{
        date: string;
        revenue: number;
    }[]>;
}
