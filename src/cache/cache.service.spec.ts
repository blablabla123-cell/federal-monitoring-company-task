import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      store: {
        ttl: jest.fn(),
        keys: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Delete cache method', () => {
    it("Should delete cache by it's key", async () => {
      const key = 'user:1:tasks';

      await service.deleteCache(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('Validate cache method', () => {
    it('Should return cached data if key exists', async () => {
      const key = 'user:1:tasks';
      const cachedData = ['task1', 'task2'];

      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.validateCache(
        key,
        async () => {
          throw new Error('fetchFn should not be called');
        },
        5,
      );

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
      expect(result).toBe(cachedData);
    });

    it('Should fetch data and set cache if key does not exist', async () => {
      const key = 'user:1:tasks';
      const fetchedData = ['task1', 'task2'];

      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.validateCache(
        key,
        async () => {
          return fetchedData;
        },
        5,
      );

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        fetchedData,
        5 * 1000 * 60,
      );
      expect(result).toBe(fetchedData);
    });
  });
});
