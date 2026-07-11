import { PrismaService } from '../../prisma/prisma.service';
export declare class IdempotencyService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    upsertCustomer(data: any): Promise<{
        id: string;
        externalId: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    upsertEvent(data: any): Promise<{
        id: string;
        externalId: string;
        createdAt: Date;
        updatedAt: Date;
        summary: string;
        startTime: Date;
        endTime: Date | null;
    }>;
    upsertPayment(data: any): Promise<{
        id: string;
        externalId: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string | null;
        amount: number;
        currency: string;
        status: string;
    }>;
}
