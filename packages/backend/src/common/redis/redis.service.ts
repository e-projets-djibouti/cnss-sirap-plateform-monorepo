import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly client: Redis;

    constructor(private readonly config: ConfigService) {
        this.client = new Redis({
            host: this.config.get<string>('redis.host', 'localhost'),
            port: this.config.get<number>('redis.port', 6379),
            password: this.config.get<string>('redis.password') || undefined,
            db: this.config.get<number>('redis.db', 0),
            maxRetriesPerRequest: 2,
            lazyConnect: true,
        });
    }

    async onModuleDestroy() {
        await this.client.quit();
    }

    async ping() {
        await this.ensureConnected();
        return this.client.ping();
    }

    async getJson<T>(key: string): Promise<T | null> {
        await this.ensureConnected();
        const value = await this.client.get(key);
        if (!value) return null;
        return JSON.parse(value) as T;
    }

    async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        await this.ensureConnected();
        await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }

    async delete(key: string): Promise<void> {
        await this.ensureConnected();
        await this.client.del(key);
    }

    private async ensureConnected() {
        if (this.client.status !== 'ready' && this.client.status !== 'connect') {
            await this.client.connect();
        }
    }
}
