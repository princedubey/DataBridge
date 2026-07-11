import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SyncModule } from './sync/sync.module';
import { StripeModule } from './integrations/stripe/stripe.module';
import { MetricsModule } from './metrics/metrics.module';
import { HubspotModule } from './integrations/hubspot/hubspot.module';
import { GoogleCalendarModule } from './integrations/google-calendar/google-calendar.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, SyncModule, StripeModule, MetricsModule, HubspotModule, GoogleCalendarModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
