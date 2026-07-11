import { Module } from '@nestjs/common';
import { StripeConnectorService } from './stripe-connector.service';

@Module({
  providers: [StripeConnectorService],
  exports: [StripeConnectorService],
})
export class StripeModule {}
