import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsService, CreatePermissionDto } from './permissions.service';
import { RequirePermission } from '../../common/decorators/permission.decorator';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) { }

  /** GET /api/permissions */
  @RequirePermission('permissions:read')
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  /** POST /api/permissions */
  @RequirePermission('permissions:manage')
  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  /** DELETE /api/permissions/:id */
  @RequirePermission('permissions:manage')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
