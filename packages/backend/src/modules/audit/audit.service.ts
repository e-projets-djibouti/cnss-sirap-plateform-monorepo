import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { MinioService } from '../../common/minio/minio.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
        private readonly minio: MinioService,
    ) { }

    async findAll(query: AuditQueryDto) {
        const where: Prisma.AuditLogWhereInput = {
            ...(query.method ? { method: query.method } : {}),
            ...(typeof query.success === 'boolean' ? { success: query.success } : {}),
            ...(query.userId ? { userId: query.userId } : {}),
            ...(query.path ? { path: { contains: query.path, mode: 'insensitive' } } : {}),
        };

        const [total, rows] = await Promise.all([
            this.prisma.auditLog.count({ where }),
            this.prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
        ]);

        const data = rows.map((row) => ({
            ...row,
            timestamp: row.timestamp.toISOString(),
        }));

        return {
            data,
            total,
            page: query.page,
            limit: query.limit,
        };
    }

    async archiveOlderThan(days?: number) {
        const retentionDays = days ?? this.config.get<number>('security.auditRetentionDays', 90);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);

        const rows = await this.prisma.auditLog.findMany({
            where: { timestamp: { lt: cutoff } },
            orderBy: { timestamp: 'asc' },
            take: 10_000,
        });

        if (rows.length === 0) {
            return {
                archived: 0,
                deleted: 0,
                archiveUrl: null,
                cutoff: cutoff.toISOString(),
            };
        }

        const payload = rows
            .map((row) => {
                const event = {
                    ...row,
                    timestamp: row.timestamp.toISOString(),
                };
                return JSON.stringify(event);
            })
            .join('\n');

        const objectName = `audit/${cutoff.toISOString().slice(0, 10)}/audit-${Date.now()}.ndjson`;
        const archiveUrl = await this.minio.uploadAuditArchive(objectName, Buffer.from(payload, 'utf8'));

        const ids = rows.map((row) => row.id);
        await this.prisma.auditLog.deleteMany({ where: { id: { in: ids } } });

        return {
            archived: rows.length,
            deleted: rows.length,
            archiveUrl,
            cutoff: cutoff.toISOString(),
        };
    }
}
