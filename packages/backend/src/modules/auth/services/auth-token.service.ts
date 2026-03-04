import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class AuthTokenService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
            roleName: user.role.name,
            roleLevel: user.role.level,
        };
    }

    async login(user: AuthenticatedUser) {
        const { accessToken, refreshToken } = this.generateTokens(user);
        await this.storeRefreshToken(user.id, refreshToken);

        const fullUser = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                mustChangePassword: true,
                isActive: true,
                role: { select: { id: true, name: true, level: true } },
                profile: { select: { fullName: true, phone: true, avatarUrl: true } },
            },
        });

        return { user: fullUser, accessToken, refreshToken };
    }

    async refresh(rawToken: string) {
        if (!rawToken) {
            throw new UnauthorizedException('Refresh token manquant');
        }

        const tokenHash = this.hashToken(rawToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { include: { role: true } } },
        });

        if (
            !stored ||
            stored.revokedAt !== null ||
            stored.expiresAt < new Date() ||
            !stored.user.isActive
        ) {
            throw new UnauthorizedException('Refresh token invalide ou expiré');
        }

        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });

        const authUser: AuthenticatedUser = {
            id: stored.user.id,
            email: stored.user.email,
            roleId: stored.user.roleId,
            roleName: stored.user.role.name,
            roleLevel: stored.user.role.level,
        };

        const { accessToken, refreshToken } = this.generateTokens(authUser);
        await this.storeRefreshToken(stored.userId, refreshToken);

        return { accessToken, refreshToken };
    }

    async logout(rawToken?: string): Promise<void> {
        if (!rawToken) return;

        const tokenHash = this.hashToken(rawToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        if (!stored) return;

        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
    }

    private hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private generateTokens(user: AuthenticatedUser) {
        const payload = {
            sub: user.id,
            email: user.email,
            roleId: user.roleId,
            roleName: user.roleName,
            roleLevel: user.roleLevel,
        };

        const accessToken = this.jwt.sign(payload, {
            expiresIn: this.config.get<string>('jwt.accessExpiresIn', '1h'),
        });
        const refreshToken = randomUUID();
        return { accessToken, refreshToken };
    }

    private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
        const tokenHash = this.hashToken(rawToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.refreshToken.create({
            data: { tokenHash, userId, expiresAt },
        });
    }
}
