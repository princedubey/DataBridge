import { Module } from '@nestjs/common';
import { GcalConnectorService } from './gcal-connector.service';

@Module({
  providers: [GcalConnectorService],
  exports: [GcalConnectorService],
})
export class GoogleCalendarModule {}
