import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SyncModule } from './sync/sync.module';
import { StripeModule } from './integrations/stripe/stripe.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [PrismaModule, SyncModule, StripeModule, MetricsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
