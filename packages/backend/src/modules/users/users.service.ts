import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  mustChangePassword: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true, level: true } },
  profile: { select: { fullName: true, phone: true, avatarUrl: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) { }

  private generateTemporaryPassword(length = 12): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    const all = upper + lower + digits + special;

    const required = [
      upper[randomInt(upper.length)],
      lower[randomInt(lower.length)],
      digits[randomInt(digits.length)],
      special[randomInt(special.length)],
    ];

    const remaining = Array.from({ length: Math.max(length - required.length, 0) }, () => {
      return all[randomInt(all.length)];
    });

    const password = [...required, ...remaining]
      .sort(() => randomInt(0, 2) - 1)
      .join('');

    return password;
  }

  private async resolveRoleId(roleId?: string): Promise<string> {
    if (roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw new BadRequestException(`Rôle ${roleId} introuvable`);
      return role.id;
    }
    const agentRole = await this.prisma.role.findUnique({
      where: { name: 'AGENT' },
    });
    if (!agentRole)
      throw new BadRequestException('Rôle AGENT non configuré — lancez le seed');
    return agentRole.id;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_SELECT,
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Cet email est déjà utilisé');

    const temporaryPassword = this.generateTemporaryPassword(12);
    const [hashedPassword, roleId] = await Promise.all([
      bcrypt.hash(temporaryPassword, 12),
      this.resolveRoleId(dto.roleId),
    ]);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        mustChangePassword: true,
        roleId,
        profile: {
          create: {
            fullName: dto.fullName,
            phone: dto.phone,
          },
        },
      },
      select: USER_SELECT,
    });

    try {
      await this.mail.sendEmail(
        dto.email,
        'Vos accès CNSS-SIRAP',
        `
          <p>Bonjour ${dto.fullName},</p>
          <p>Votre compte CNSS-SIRAP a été créé.</p>
          <p><strong>Identifiant:</strong> ${dto.email}</p>
          <p><strong>Mot de passe temporaire:</strong> ${temporaryPassword}</p>
          <p>Vous devrez le changer lors de votre première connexion.</p>
        `,
        `Compte CNSS-SIRAP créé\nIdentifiant: ${dto.email}\nMot de passe temporaire: ${temporaryPassword}`,
      );
    } catch {
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new InternalServerErrorException(
        'Création utilisateur annulée: envoi email impossible. Vérifiez la configuration SMTP.',
      );
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: Prisma.UserUpdateInput = {};
    if (dto.email) data.email = dto.email;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 12);
    if (dto.fullName ?? dto.phone) {
      data.profile = {
        update: {
          ...(dto.fullName && { fullName: dto.fullName }),
          ...(dto.phone && { phone: dto.phone }),
        },
      };
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: `Utilisateur ${id} désactivé` };
  }

  async changeRole(id: string, roleId: string) {
    await this.findOne(id);
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new BadRequestException(`Rôle ${roleId} introuvable`);

    return this.prisma.user.update({
      where: { id },
      data: { roleId },
      select: USER_SELECT,
    });
  }
}
