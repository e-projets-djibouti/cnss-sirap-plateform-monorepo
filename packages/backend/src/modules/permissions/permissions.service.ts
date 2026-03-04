import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

export class CreatePermissionDto {
  @IsString()
  action!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.permission.findMany({
      orderBy: { action: 'asc' },
    });
  }

  async create(dto: CreatePermissionDto) {
    const exists = await this.prisma.permission.findUnique({
      where: { action: dto.action },
    });
    if (exists) throw new ConflictException(`Permission "${dto.action}" déjà existante`);
    return this.prisma.permission.create({ data: dto });
  }

  async remove(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException(`Permission ${id} introuvable`);
    await this.prisma.permission.delete({ where: { id } });
    return { message: `Permission "${perm.action}" supprimée` };
  }
}
