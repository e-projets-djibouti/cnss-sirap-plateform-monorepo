import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class MinioService implements OnModuleInit {
    private readonly logger = new Logger(MinioService.name);
    private readonly client: Client;

    constructor(private readonly config: ConfigService) {
        this.client = new Client({
            endPoint: this.config.get<string>('minio.endpoint', 'localhost'),
            port: this.config.get<number>('minio.port', 9000),
            useSSL: this.config.get<boolean>('minio.useSSL', false),
            accessKey: this.config.get<string>('minio.accessKey', 'minioadmin'),
            secretKey: this.config.get<string>('minio.secretKey', 'minioadmin'),
        });
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.ensureAvatarBucket();
            await this.ensureAuditBucket();
            await this.ensureUploadsBucket();
        } catch (error) {
            this.logger.warn(
                `MinIO init warning: ${error instanceof Error ? error.message : 'unknown error'}`,
            );
        }
    }

    async uploadAvatar(objectName: string, buffer: Buffer, mimeType: string): Promise<string> {
        const bucket = this.avatarBucket;
        await this.ensureAvatarBucket();

        await this.client.putObject(bucket, objectName, buffer, buffer.length, {
            'Content-Type': mimeType,
        });

        return `${this.publicBaseUrl}/${bucket}/${objectName}`;
    }

    async uploadAuditArchive(objectName: string, buffer: Buffer): Promise<string> {
        const bucket = this.auditBucket;
        await this.ensureAuditBucket();

        await this.client.putObject(bucket, objectName, buffer, buffer.length, {
            'Content-Type': 'application/x-ndjson',
        });

        return `${this.publicBaseUrl}/${bucket}/${objectName}`;
    }

    async uploadExcelVersioned(
        originalFileName: string,
        buffer: Buffer,
        mimeType: string,
    ): Promise<{ objectName: string; url: string; version: number }> {
        const bucket = this.uploadsBucket;
        await this.ensureUploadsBucket();

        const now = new Date();
        const yy = now.getFullYear().toString();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const safeFileName = this.sanitizeFileName(originalFileName);
        const fileBase = safeFileName.replace(/\.[^.]+$/, '');
        const extension = this.extractExtension(safeFileName);
        const prefix = `excel/${fileBase}/${yy}/${mm}/${dd}/`;

        const version = (await this.countObjectsByPrefix(bucket, prefix)) + 1;
        const objectName = `${prefix}v${String(version).padStart(4, '0')}-${Date.now()}-${randomUUID()}${extension}`;

        await this.client.putObject(bucket, objectName, buffer, buffer.length, {
            'Content-Type': mimeType,
            'X-Amz-Meta-Original-Filename': originalFileName,
            'X-Amz-Meta-Upload-Version': String(version),
        });

        return {
            objectName,
            url: `${this.publicBaseUrl}/${bucket}/${objectName}`,
            version,
        };
    }

    private get avatarBucket(): string {
        return this.config.get<string>('minio.avatarBucket', 'avatars');
    }

    private get auditBucket(): string {
        return this.config.get<string>('minio.auditBucket', 'audit-archives');
    }

    private get uploadsBucket(): string {
        return this.config.get<string>('minio.uploadsBucket', 'uploads');
    }

    private get publicBaseUrl(): string {
        const configured = this.config.get<string>('minio.publicUrl');
        if (configured) return configured.replace(/\/$/, '');

        const endpoint = this.config.get<string>('minio.endpoint', 'localhost');
        const port = this.config.get<number>('minio.port', 9000);
        const protocol = this.config.get<boolean>('minio.useSSL', false) ? 'https' : 'http';
        return `${protocol}://${endpoint}:${port}`;
    }

    private async ensureAvatarBucket(): Promise<void> {
        const bucket = this.avatarBucket;
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
            await this.client.makeBucket(bucket, 'us-east-1');
        }

        await this.client.setBucketPolicy(
            bucket,
            JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'PublicReadGetObject',
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${bucket}/*`],
                    },
                ],
            }),
        );
    }

    private async ensureAuditBucket(): Promise<void> {
        const bucket = this.auditBucket;
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
            await this.client.makeBucket(bucket, 'us-east-1');
        }
    }

    private async ensureUploadsBucket(): Promise<void> {
        const bucket = this.uploadsBucket;
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
            await this.client.makeBucket(bucket, 'us-east-1');
        }
    }

    private extractExtension(fileName: string): string {
        const idx = fileName.lastIndexOf('.');
        if (idx < 0) return '.xlsx';
        return fileName.slice(idx).toLowerCase();
    }

    private sanitizeFileName(fileName: string): string {
        const normalized = fileName.trim().toLowerCase();
        const safe = normalized.replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
        return safe || `upload-${Date.now()}.xlsx`;
    }

    private async countObjectsByPrefix(bucket: string, prefix: string): Promise<number> {
        const stream = this.client.listObjectsV2(bucket, prefix, true);
        return new Promise<number>((resolve, reject) => {
            let count = 0;

            stream.on('data', () => {
                count += 1;
            });
            stream.on('end', () => resolve(count));
            stream.on('error', (error) => reject(error));
        });
    }
}
