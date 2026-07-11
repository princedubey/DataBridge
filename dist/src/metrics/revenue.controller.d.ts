import { RevenueService } from './revenue.service';
export declare class RevenueController {
    private readonly revenueService;
    constructor(revenueService: RevenueService);
    getSummary(startDate?: string, endDate?: string): Promise<{
        totalRevenue: number;
    }>;
    getDaily(startDate?: string, endDate?: string): Promise<{
        date: string;
        revenue: number;
    }[]>;
}
