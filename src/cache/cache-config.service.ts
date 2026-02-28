import KeyvRedis from '@keyv/redis';
import { CacheOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions():
    | CacheOptions<Record<string, any>>
    | Promise<CacheOptions<Record<string, any>>> {
    const redis = new KeyvRedis(
      `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    );

    return {
      stores: [redis],
      ttl: 60 * 1000 * 5,
    };
  }
}
