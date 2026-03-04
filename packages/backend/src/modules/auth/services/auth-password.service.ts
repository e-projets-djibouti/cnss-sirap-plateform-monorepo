import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../../../common/mail/mail.service';
import { RedisService } from '../../../common/redis/redis.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuthPasswordService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly mail: MailService,
    ) { }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, isActive: true, profile: { select: { fullName: true } } },
        });

        if (!user || !user.isActive) {
            return { message: 'Si le compte existe, un code de réinitialisation a été envoyé.' };
        }

        const code = this.generateResetCode();
        const key = this.passwordResetCodeKey(email);
        await this.redis.setJson(key, { userId: user.id, code }, 10 * 60);

        const fullName = user.profile?.fullName?.trim();
        await this.mail.sendEmail(
            email,
            'Code de réinitialisation de mot de passe',
            `
        <p>Bonjour ${fullName || 'utilisateur'},</p>
        <p>Votre code de réinitialisation est:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
        <p>Ce code expire dans 10 minutes.</p>
      `,
            `Votre code de réinitialisation est: ${code}. Il expire dans 10 minutes.`,
        );

        return { message: 'Si le compte existe, un code de réinitialisation a été envoyé.' };
    }

    async resetPassword(email: string, code: string, newPassword: string) {
        const key = this.passwordResetCodeKey(email);
        const payload = await this.redis.getJson<{ userId: string; code: string }>(key);

        if (!payload?.userId || payload.code !== code) {
            throw new UnauthorizedException('Code de réinitialisation invalide ou expiré');
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: payload.userId },
            data: { password: passwordHash, mustChangePassword: false },
        });

        await this.redis.delete(key);
        await this.prisma.refreshToken.updateMany({
            where: { userId: payload.userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });

        return { message: 'Mot de passe réinitialisé avec succès.' };
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true },
        });

        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            throw new BadRequestException('Mot de passe actuel incorrect');
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: passwordHash, mustChangePassword: false },
        });

        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });

        return { message: 'Mot de passe modifié avec succès. Reconnexion requise.' };
    }

    private passwordResetCodeKey(email: string): string {
        return `password-reset-code:${email.toLowerCase()}`;
    }

    private generateResetCode(): string {
        return `${randomInt(100000, 1000000)}`;
    }
}
