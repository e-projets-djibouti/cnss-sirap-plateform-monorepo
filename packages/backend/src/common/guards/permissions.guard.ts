import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsCache } from '../cache/permissions.cache';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly cache: PermissionsCache,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<
      string | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) return false;

    // Les rôles de niveau ≥ 100 (OWNER) contournent toutes les permissions
    if (user.roleLevel >= 100) return true;

    const permissions = await this.loadPermissions(user.roleId);
    return permissions.has(requiredPermission);
  }

  private async loadPermissions(roleId: string): Promise<Set<string>> {
    const cached = await this.cache.get(roleId);
    if (cached) return cached;

    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { action: true } } },
    });

    const permissions = new Set(rows.map((r) => r.permission.action));
    await this.cache.set(roleId, permissions);
    return permissions;
  }
}
