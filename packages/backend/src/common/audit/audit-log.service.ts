import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, appendFile } from 'fs/promises';
import { dirname } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEvent {
    timestamp: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    ip?: string;
    userAgent?: string;
    userId?: string;
    roleName?: string;
    success: boolean;
    error?: string;
}

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async log(event: AuditEvent): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    timestamp: new Date(event.timestamp),
                    method: event.method,
                    path: event.path,
                    statusCode: event.statusCode,
                    durationMs: event.durationMs,
                    ip: event.ip,
                    userAgent: event.userAgent,
                    userId: event.userId,
                    roleName: event.roleName,
                    success: event.success,
                    error: event.error,
                },
            });
        } catch (error) {
            this.logger.warn(
                `Unable to persist audit log in database: ${error instanceof Error ? error.message : 'unknown error'}`,
            );
        }

        const filePath = this.config.get<string>(
            'security.auditLogPath',
            'logs/security-audit.log',
        );

        try {
            await mkdir(dirname(filePath), { recursive: true });
            await appendFile(filePath, `${JSON.stringify(event)}\n`, 'utf8');
        } catch (error) {
            this.logger.warn(
                `Unable to persist audit log: ${error instanceof Error ? error.message : 'unknown error'}`,
            );
        }
    }
}
