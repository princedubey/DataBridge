"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RevenueService = class RevenueService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    parseDateFilter(startDate, endDate) {
        const where = { status: 'COLLECTED' };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                if (endDate.length === 10) {
                    end.setDate(end.getDate() + 1);
                }
                where.createdAt.lt = end;
            }
        }
        return where;
    }
    async getTotalRevenue(startDate, endDate) {
        const where = this.parseDateFilter(startDate, endDate);
        const result = await this.prisma.payment.aggregate({
            _sum: { amount: true },
            where,
        });
        return { totalRevenue: result._sum.amount || 0 };
    }
    async getDailyRevenue(startDate, endDate) {
        const where = this.parseDateFilter(startDate, endDate);
        const payments = await this.prisma.payment.findMany({
            where,
            select: { amount: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        const dailyMap = new Map();
        for (const payment of payments) {
            const dateString = payment.createdAt.toISOString().split('T')[0];
            const current = dailyMap.get(dateString) || 0;
            dailyMap.set(dateString, current + payment.amount);
        }
        const result = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
            date,
            revenue,
        }));
        return result;
    }
};
exports.RevenueService = RevenueService;
exports.RevenueService = RevenueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RevenueService);
//# sourceMappingURL=revenue.service.js.map