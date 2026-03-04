import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Request, Response } from 'express';
import {
    AuditEvent,
    AuditLogService,
} from '../audit/audit-log.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    constructor(private readonly audit: AuditLogService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') return next.handle();

        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        if (!this.shouldLog(req)) return next.handle();

        const startedAt = Date.now();

        return next.handle().pipe(
            tap(() => {
                const event = this.buildEvent(req, res, startedAt, true);
                void this.audit.log(event);
            }),
            catchError((error) => {
                const event = this.buildEvent(req, res, startedAt, false, error);
                void this.audit.log(event);
                return throwError(() => error);
            }),
        );
    }

    private shouldLog(req: Request) {
        const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
        return mutatingMethods.has(req.method) || req.path.startsWith('/api/auth/');
    }

    private buildEvent(
        req: Request,
        res: Response,
        startedAt: number,
        success: boolean,
        error?: unknown,
    ): AuditEvent {
        const user = req.user as AuthenticatedUser | undefined;
        return {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.originalUrl || req.url,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: user?.id,
            roleName: user?.roleName,
            success,
            error: error instanceof Error ? error.message : undefined,
        };
    }
}
