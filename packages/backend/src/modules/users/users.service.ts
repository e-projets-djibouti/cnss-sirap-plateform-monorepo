import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true, level: true } },
  profile: { select: { firstName: true, lastName: true, phone: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    const [hashedPassword, roleId] = await Promise.all([
      bcrypt.hash(dto.password, 12),
      this.resolveRoleId(dto.roleId),
    ]);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        roleId,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
          },
        },
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: Prisma.UserUpdateInput = {};
    if (dto.email) data.email = dto.email;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 12);
    if (dto.firstName ?? dto.lastName ?? dto.phone) {
      data.profile = {
        update: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName && { lastName: dto.lastName }),
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
