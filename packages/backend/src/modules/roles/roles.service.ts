import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsCache } from '../../common/cache/permissions.cache';
import { CreateRoleDto } from './dto/create-role.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateRoleDto extends PartialType(CreateRoleDto) { }

const ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
  level: true,
  isSystem: true,
  permissions: {
    select: {
      permission: { select: { id: true, action: true, description: true } },
    },
  },
  _count: { select: { users: true } },
} as const;

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private cache: PermissionsCache,
  ) { }

  findAll() {
    return this.prisma.role.findMany({
      orderBy: { level: 'desc' },
      select: ROLE_SELECT,
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: ROLE_SELECT,
    });
    if (!role) throw new NotFoundException(`Rôle ${id} introuvable`);
    return role;
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (exists) throw new ConflictException(`Rôle "${dto.name}" déjà existant`);
    return this.prisma.role.create({
      data: { name: dto.name, description: dto.description, level: dto.level ?? 10 },
      select: ROLE_SELECT,
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    await this.cache.invalidate(id);
    return this.prisma.role.update({
      where: { id },
      data: dto,
      select: ROLE_SELECT,
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem)
      throw new BadRequestException('Les rôles système ne peuvent pas être supprimés');
    if (role._count.users > 0)
      throw new BadRequestException(`Ce rôle est assigné à ${role._count.users} utilisateur(s)`);
    await this.cache.invalidate(id);
    await this.prisma.role.delete({ where: { id } });
    return { message: `Rôle "${role.name}" supprimé` };
  }

  async assignPermission(roleId: string, permissionId: string) {
    await this.findOne(roleId);
    const perm = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!perm) throw new NotFoundException(`Permission ${permissionId} introuvable`);

    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });

    await this.cache.invalidate(roleId);
    return this.findOne(roleId);
  }

  async removePermission(roleId: string, permissionId: string) {
    await this.findOne(roleId);
    const link = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (!link) throw new NotFoundException('Permission non assignée à ce rôle');

    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });

    await this.cache.invalidate(roleId);
    return this.findOne(roleId);
  }
}
