import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { IdempotencyService } from './services/idempotency.service';

@Module({
  providers: [SyncService, IdempotencyService],
  exports: [SyncService, IdempotencyService],
})
export class SyncModule {}
