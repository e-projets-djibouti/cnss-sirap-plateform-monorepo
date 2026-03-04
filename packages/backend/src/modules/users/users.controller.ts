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
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequirePermission } from '../../common/decorators/permission.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /** GET /api/users?page=1&limit=20 */
  @RequirePermission('users:read')
  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.findAll(+page, +limit);
  }

  /** GET /api/users/:id */
  @RequirePermission('users:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /** POST /api/users */
  @RequirePermission('users:create')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** PATCH /api/users/:id */
  @RequirePermission('users:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /** DELETE /api/users/:id — soft delete */
  @RequirePermission('users:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /** PATCH /api/users/:id/role */
  @RequirePermission('users:change-role')
  @Patch(':id/role')
  changeRole(@Param('id') id: string, @Body('roleId') roleId: string) {
    return this.usersService.changeRole(id, roleId);
  }
}
