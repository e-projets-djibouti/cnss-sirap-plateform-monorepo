import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService, UpdateRoleDto } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { RequirePermission } from '../../common/decorators/permission.decorator';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) { }

  /** GET /api/roles */
  @RequirePermission('roles:read')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  /** GET /api/roles/:id */
  @RequirePermission('roles:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  /** POST /api/roles */
  @RequirePermission('roles:manage')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  /** PATCH /api/roles/:id */
  @RequirePermission('roles:manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  /** DELETE /api/roles/:id */
  @RequirePermission('roles:manage')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  /** POST /api/roles/:id/permissions */
  @RequirePermission('roles:manage')
  @Post(':id/permissions')
  assignPermission(
    @Param('id') id: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.rolesService.assignPermission(id, dto.permissionId);
  }

  /** DELETE /api/roles/:id/permissions/:permId */
  @RequirePermission('roles:manage')
  @Delete(':id/permissions/:permId')
  @HttpCode(HttpStatus.OK)
  removePermission(
    @Param('id') id: string,
    @Param('permId') permId: string,
  ) {
    return this.rolesService.removePermission(id, permId);
  }
}
