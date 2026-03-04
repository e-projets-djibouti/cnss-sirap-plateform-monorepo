import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class HealthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly redis: RedisService,
    ) { }

    async infraStatus() {
        const [database, minio, redis] = await Promise.all([
            this.checkDatabase(),
            this.checkMinio(),
            this.checkRedis(),
        ]);

        const status =
            database.status === 'up' && minio.status === 'up' && redis.status === 'up'
                ? 'up'
                : 'degraded';

        return {
            status,
            timestamp: new Date().toISOString(),
            services: {
                database,
                minio,
                redis,
            },
        };
    }

    async platformesStatus() {
        const baseUrl = this.buildApiBaseUrl();

        return {
            status: 'up',
            timestamp: new Date().toISOString(),
            services: {
                api: { status: 'up', baseUrl },
                swagger: { status: 'up', url: `${baseUrl}/docs` },
            },
        };
    }

    private async checkDatabase() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'up' as const };
        } catch (error) {
            return {
                status: 'down' as const,
                error: error instanceof Error ? error.message : 'Database check failed',
            };
        }
    }

    private async checkMinio() {
        const endpoint = this.config.get<string>('minio.endpoint', 'localhost');
        const port = this.config.get<number>('minio.port', 9000);
        const useSSL = this.config.get<boolean>('minio.useSSL', false);
        const protocol = useSSL ? 'https' : 'http';
        const url = `${protocol}://${endpoint}:${port}/minio/health/live`;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                return {
                    status: 'down' as const,
                    url,
                    error: `HTTP ${response.status}`,
                };
            }

            return { status: 'up' as const, url };
        } catch (error) {
            return {
                status: 'down' as const,
                url,
                error: error instanceof Error ? error.message : 'MinIO check failed',
            };
        }
    }

    private async checkRedis() {
        const host = this.config.get<string>('redis.host', 'localhost');
        const port = this.config.get<number>('redis.port', 6379);

        try {
            const pong = await this.redis.ping();
            return {
                status: pong === 'PONG' ? ('up' as const) : ('down' as const),
                endpoint: `${host}:${port}`,
            };
        } catch (error) {
            return {
                status: 'down' as const,
                endpoint: `${host}:${port}`,
                error: error instanceof Error ? error.message : 'Redis check failed',
            };
        }
    }

    private buildApiBaseUrl() {
        const port = this.config.get<number>('port', 3000);
        return `http://localhost:${port}/api`;
    }
}
