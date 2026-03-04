import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RoleRateLimitGuard implements CanActivate {
    private readonly logger = new Logger(RoleRateLimitGuard.name);

    constructor(
        private readonly redis: RedisService,
        private readonly config: ConfigService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const windowSec = this.config.get<number>('security.roleRateLimit.windowSec', 60);
        const endpoint = `${context.getClass().name}.${context.getHandler().name}`;
        const path = req.path;
        const user = req.user as AuthenticatedUser | undefined;

        const roleBucket = this.resolveRoleBucket(user, isPublic);
        const limit = this.resolveLimit(path, roleBucket);
        const tracker = user?.id ? `user:${user.id}` : `ip:${req.ip}`;
        const key = `rl:${roleBucket}:${endpoint}:${tracker}`;

        try {
            const current = await this.redis.incrementWithExpiry(key, windowSec);
            if (current > limit) {
                throw new HttpException(
                    `Trop de requêtes pour ${endpoint}. Réessayez dans ${windowSec}s.`,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }
            return true;
        } catch (error) {
            if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
                throw error;
            }
            this.logger.warn(
                `Rate-limit bypassed (redis unavailable) on ${endpoint}: ${error instanceof Error ? error.message : 'unknown error'
                }`,
            );
            return true;
        }
    }

    private resolveRoleBucket(user: AuthenticatedUser | undefined, isPublic: boolean) {
        if (!user || isPublic) return 'public';
        if (user.roleLevel >= 100) return 'owner';
        if (user.roleLevel >= 50) return 'admin';
        return 'agent';
    }

    private resolveLimit(path: string, roleBucket: 'public' | 'agent' | 'admin' | 'owner') {
        if (path.endsWith('/auth/login')) {
            return this.config.get<number>('security.roleRateLimit.login', 5);
        }
        if (path.endsWith('/auth/refresh')) {
            return this.config.get<number>('security.roleRateLimit.refresh', 20);
        }

        switch (roleBucket) {
            case 'owner':
                return this.config.get<number>('security.roleRateLimit.owner', 600);
            case 'admin':
                return this.config.get<number>('security.roleRateLimit.admin', 300);
            case 'agent':
                return this.config.get<number>('security.roleRateLimit.agent', 180);
            default:
                return this.config.get<number>('security.roleRateLimit.public', 60);
        }
    }
}
