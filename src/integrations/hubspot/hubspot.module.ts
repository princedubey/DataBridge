import { Module } from '@nestjs/common';
import { HubspotConnectorService } from './hubspot-connector.service';

@Module({
  providers: [HubspotConnectorService],
  exports: [HubspotConnectorService],
})
export class HubspotModule {}
