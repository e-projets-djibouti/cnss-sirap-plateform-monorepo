import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MinioService } from '../../../common/minio/minio.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class AuthProfileService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly minio: MinioService,
    ) { }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                mustChangePassword: true,
                isActive: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        level: true,
                        permissions: { select: { permission: { select: { action: true } } } },
                    },
                },
                profile: { select: { fullName: true, phone: true, avatarUrl: true } },
            },
        });
        if (!user) throw new NotFoundException('Utilisateur introuvable');
        return user;
    }

    async updateMe(userId: string, dto: UpdateProfileDto) {
        const trimmedFullName = dto.fullName?.trim();
        const trimmedAvatarUrl = dto.avatarUrl?.trim();
        const hasFullName = typeof trimmedFullName === 'string';
        const hasPhone = typeof dto.phone === 'string';
        const hasAvatarUrl = typeof dto.avatarUrl === 'string';

        if (!hasFullName && !hasPhone && !hasAvatarUrl) {
            throw new BadRequestException('Aucune information à mettre à jour');
        }

        if (hasFullName && !trimmedFullName) {
            throw new BadRequestException('Le nom complet ne peut pas être vide');
        }

        if (hasAvatarUrl && trimmedAvatarUrl && !this.isHttpUrl(trimmedAvatarUrl)) {
            throw new BadRequestException('URL avatar invalide');
        }

        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                profile: { select: { id: true } },
            },
        });

        if (!existing) throw new NotFoundException('Utilisateur introuvable');

        if (existing.profile) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    profile: {
                        update: {
                            ...(hasFullName ? { fullName: trimmedFullName } : {}),
                            ...(hasPhone ? { phone: dto.phone } : {}),
                            ...(hasAvatarUrl ? { avatarUrl: trimmedAvatarUrl || null } : {}),
                        },
                    },
                },
            });
        } else {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    profile: {
                        create: {
                            fullName: trimmedFullName || 'Utilisateur',
                            ...(hasPhone ? { phone: dto.phone } : {}),
                            ...(hasAvatarUrl && trimmedAvatarUrl ? { avatarUrl: trimmedAvatarUrl } : {}),
                        },
                    },
                },
            });
        }

        return this.getMe(userId);
    }

    async uploadMyAvatar(userId: string, file: Express.Multer.File) {
        if (!file?.buffer?.length) {
            throw new BadRequestException('Fichier avatar invalide');
        }

        if (!this.isImageMimeType(file.mimetype)) {
            throw new BadRequestException('Format image non supporté');
        }

        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                profile: { select: { id: true } },
            },
        });

        if (!existing) throw new NotFoundException('Utilisateur introuvable');

        const ext = this.extensionForMimeType(file.mimetype);
        const objectName = `users/${userId}/avatar-${Date.now()}${ext}`;
        const avatarUrl = await this.minio.uploadAvatar(objectName, file.buffer, file.mimetype);

        if (existing.profile) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    profile: {
                        update: {
                            avatarUrl,
                        },
                    },
                },
            });
        } else {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    profile: {
                        create: {
                            fullName: 'Utilisateur',
                            avatarUrl,
                        },
                    },
                },
            });
        }

        return this.getMe(userId);
    }

    private isHttpUrl(value: string): boolean {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    private isImageMimeType(mimeType: string): boolean {
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType);
    }

    private extensionForMimeType(mimeType: string): string {
        switch (mimeType) {
            case 'image/jpeg':
                return '.jpg';
            case 'image/png':
                return '.png';
            case 'image/webp':
                return '.webp';
            case 'image/gif':
                return '.gif';
            default:
                return '';
        }
    }
}
