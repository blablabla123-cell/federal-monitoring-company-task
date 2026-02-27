import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // ← Нужен!
  ) {}

  async deleteCache(key: string) {
    await this.cacheManager.del(key);
  }

  async validateCache<T>(key: string, fetch: () => Promise<T>, ttl: number) {
    let data = await this.cacheManager.get<T>(key);

    if (!data) {
      data = await fetch();
      await this.cacheManager.set(key, data, ttl * 1000 * 60);
    }

    return data;
  }
}
