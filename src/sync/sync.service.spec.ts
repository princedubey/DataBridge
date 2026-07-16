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

  it('should run sync successfully', async () => {
    mockPrisma.syncState.findUnique.mockResolvedValue({ source: 'TEST_SOURCE', cursor: null });
    (mockProvider.fetchData as jest.Mock).mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      hasMore: false,
      nextCursor: null,
    });

    const result = await service.runSync(mockProvider, mockNormalizer, mockSaveToDb);

    expect(result.status).toBe('SUCCESS');
    expect(result.recordsProcessed).toBe(2);
    expect(mockSaveToDb).toHaveBeenCalledTimes(2);
  });

  it('should fallback to full sync on cursor error', async () => {
    mockPrisma.syncState.findUnique.mockResolvedValue({ source: 'TEST_SOURCE', cursor: 'old_cursor' });
    
    // First call fails with generic error, second call (full sync) succeeds
    (mockProvider.fetchData as jest.Mock)
      .mockRejectedValueOnce(new Error('Cursor expired'))
      .mockResolvedValueOnce({
        data: [{ id: 3 }],
        hasMore: false,
        nextCursor: null,
      });

    const result = await service.runSync(mockProvider, mockNormalizer, mockSaveToDb);

    expect(result.status).toBe('SUCCESS');
    expect(result.recordsProcessed).toBe(1);
    expect(mockProvider.fetchData).toHaveBeenCalledTimes(2);
    expect(mockProvider.fetchData).toHaveBeenNthCalledWith(1, 'old_cursor');
    expect(mockProvider.fetchData).toHaveBeenNthCalledWith(2); // no cursor
  });

  it('should abort and throw on rate limit error 429', async () => {
    mockPrisma.syncState.findUnique.mockResolvedValue({ source: 'TEST_SOURCE', cursor: 'old_cursor' });
    
    (mockProvider.fetchData as jest.Mock).mockRejectedValueOnce(new Error('429 Too Many Requests'));

    const result = await service.runSync(mockProvider, mockNormalizer, mockSaveToDb);

    // It should catch the error and log FAILED
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('429 Too Many Requests');
    // Ensure it did not attempt a fallback
    expect(mockProvider.fetchData).toHaveBeenCalledTimes(1);
  });
});
