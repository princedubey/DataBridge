import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from './services/idempotency.service';
import { IntegrationProvider } from './interfaces/integration-provider.interface';
import { Normalizer } from './interfaces/normalizer.interface';

describe('SyncService', () => {
  let service: SyncService;
  let prisma: PrismaService;

  const mockPrisma = {
    syncState: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    syncLog: {
      create: jest.fn(),
    },
  };

  const mockProvider: IntegrationProvider<any> = {
    getName: jest.fn().mockReturnValue('TEST_SOURCE'),
    fetchData: jest.fn(),
  };

  const mockNormalizer: Normalizer<any, any> = {
    normalize: jest.fn().mockImplementation((val) => val),
  };

  const mockSaveToDb = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IdempotencyService, useValue: {} },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prisma = module.get<PrismaService>(PrismaService);
    
    jest.clearAllMocks();
  });

  it('should run sync successfully with batching', async () => {
    mockPrisma.syncState.findUnique.mockResolvedValue({ source: 'TEST_SOURCE', cursor: null });
    (mockProvider.fetchData as jest.Mock).mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      hasMore: false,
      nextCursor: null,
    });

    const result = await service.runSync(mockProvider, mockNormalizer, mockSaveToDb);

    expect(result.status).toBe('SUCCESS');
    expect(result.recordsProcessed).toBe(2);
    // Called once with an array of 2 items
    expect(mockSaveToDb).toHaveBeenCalledTimes(1);
    expect(mockSaveToDb).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });

  it('should abort and throw on cursor error without falling back', async () => {
    mockPrisma.syncState.findUnique.mockResolvedValue({ source: 'TEST_SOURCE', cursor: 'old_cursor' });
    
    (mockProvider.fetchData as jest.Mock)
      .mockRejectedValueOnce(new Error('Cursor expired'));

    const result = await service.runSync(mockProvider, mockNormalizer, mockSaveToDb);

    expect(result.status).toBe('FAILED');
    expect(mockProvider.fetchData).toHaveBeenCalledTimes(1); // No full fallback
    expect(mockProvider.fetchData).toHaveBeenNthCalledWith(1, 'old_cursor');
  });

});
