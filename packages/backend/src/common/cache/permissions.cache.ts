import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PermissionsCache {
  private readonly TTL_SECONDS = 5 * 60;

  constructor(private readonly redis: RedisService) { }

  async get(roleId: string): Promise<Set<string> | null> {
    const key = this.cacheKey(roleId);
    const permissions = await this.redis.getJson<string[]>(key);
    if (!permissions) return null;
    return new Set(permissions);
  }

  async set(roleId: string, permissions: Set<string>): Promise<void> {
    const key = this.cacheKey(roleId);
    await this.redis.setJson(key, [...permissions], this.TTL_SECONDS);
  }

  async invalidate(roleId: string): Promise<void> {
    await this.redis.delete(this.cacheKey(roleId));
  }

  private cacheKey(roleId: string) {
    return `role-permissions:${roleId}`;
  }
}
