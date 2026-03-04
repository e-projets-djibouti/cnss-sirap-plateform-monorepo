import { Injectable } from '@nestjs/common';

interface CacheEntry {
  permissions: Set<string>;
  expiresAt: number;
}

@Injectable()
export class PermissionsCache {
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly store = new Map<string, CacheEntry>();

  get(roleId: string): Set<string> | null {
    const entry = this.store.get(roleId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(roleId);
      return null;
    }
    return entry.permissions;
  }

  set(roleId: string, permissions: Set<string>): void {
    this.store.set(roleId, {
      permissions,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  invalidate(roleId: string): void {
    this.store.delete(roleId);
  }
}
