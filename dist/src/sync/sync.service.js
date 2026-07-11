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
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const idempotency_service_1 = require("./services/idempotency.service");
let SyncService = SyncService_1 = class SyncService {
    prisma;
    idempotency;
    logger = new common_1.Logger(SyncService_1.name);
    constructor(prisma, idempotency) {
        this.prisma = prisma;
        this.idempotency = idempotency;
    }
    async runSync(provider, normalizer, saveToDb) {
        const sourceName = provider.getName();
        this.logger.log(`Starting sync for ${sourceName}`);
        let syncState = await this.prisma.syncState.findUnique({
            where: { source: sourceName },
        });
        if (!syncState) {
            syncState = await this.prisma.syncState.create({
                data: { source: sourceName, status: 'PENDING' },
            });
        }
        let currentCursor = syncState.cursor;
        let hasMore = true;
        let recordsProcessed = 0;
        try {
            while (hasMore) {
                let result;
                try {
                    result = await provider.fetchData(currentCursor || undefined);
                }
                catch (error) {
                    this.logger.warn(`Incremental fetch failed for ${sourceName}. Attempting full sync fallback. Error: ${error.message}`);
                    currentCursor = null;
                    result = await provider.fetchData();
                }
                for (const item of result.data) {
                    const normalized = normalizer.normalize(item);
                    await saveToDb(normalized);
                    recordsProcessed++;
                }
                currentCursor = result.nextCursor || null;
                hasMore = result.hasMore;
                await this.prisma.syncState.update({
                    where: { source: sourceName },
                    data: { cursor: currentCursor },
                });
            }
            await this.prisma.syncState.update({
                where: { source: sourceName },
                data: {
                    lastExecution: new Date(),
                    status: 'SUCCESS',
                },
            });
            await this.prisma.syncLog.create({
                data: {
                    source: sourceName,
                    status: 'SUCCESS',
                    recordsProcessed,
                },
            });
            this.logger.log(`Sync completed for ${sourceName}. Processed ${recordsProcessed} records.`);
        }
        catch (error) {
            this.logger.error(`Sync failed for ${sourceName}`, error.stack);
            await this.prisma.syncState.update({
                where: { source: sourceName },
                data: { status: 'FAILED' },
            });
            await this.prisma.syncLog.create({
                data: {
                    source: sourceName,
                    status: 'FAILED',
                    recordsProcessed,
                    errorMessage: error.message,
                },
            });
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        idempotency_service_1.IdempotencyService])
], SyncService);
//# sourceMappingURL=sync.service.js.map