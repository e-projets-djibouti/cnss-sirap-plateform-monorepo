import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, appendFile } from 'fs/promises';
import { dirname } from 'path';

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

    constructor(private readonly config: ConfigService) { }

    async log(event: AuditEvent): Promise<void> {
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
