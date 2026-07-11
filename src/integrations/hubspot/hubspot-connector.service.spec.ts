import { Test, TestingModule } from '@nestjs/testing';
import { HubspotConnectorService } from './hubspot-connector.service';

describe('HubspotConnectorService', () => {
  let service: HubspotConnectorService;

  beforeEach(async () => {
    process.env.HUBSPOT_ACCESS_TOKEN = 'pat-na1-123';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [HubspotConnectorService],
    }).compile();

    service = module.get<HubspotConnectorService>(HubspotConnectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
