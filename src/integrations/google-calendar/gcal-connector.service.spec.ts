import { Test, TestingModule } from '@nestjs/testing';
import { GcalConnectorService } from './gcal-connector.service';

describe('GcalConnectorService', () => {
  let service: GcalConnectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GcalConnectorService],
    }).compile();

    service = module.get<GcalConnectorService>(GcalConnectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
