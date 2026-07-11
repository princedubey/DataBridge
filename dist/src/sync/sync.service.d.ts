import { PrismaService } from '../prisma/prisma.service';
import { IntegrationProvider } from './interfaces/integration-provider.interface';
import { Normalizer } from './interfaces/normalizer.interface';
import { IdempotencyService } from './services/idempotency.service';
export declare class SyncService {
    private readonly prisma;
    private readonly idempotency;
    private readonly logger;
    constructor(prisma: PrismaService, idempotency: IdempotencyService);
    runSync<ExternalType, InternalType>(provider: IntegrationProvider<ExternalType>, normalizer: Normalizer<ExternalType, InternalType>, saveToDb: (data: InternalType) => Promise<any>): Promise<void>;
}
