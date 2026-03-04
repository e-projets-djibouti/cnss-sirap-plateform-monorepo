import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { ArchiveAuditDto } from './dto/archive-audit.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @RequirePermission('audit:read')
    @Get()
    findAll(@Query() query: AuditQueryDto) {
        return this.auditService.findAll(query);
    }

    @RequirePermission('audit:manage')
    @Post('archive')
    archive(@Body() dto: ArchiveAuditDto) {
        return this.auditService.archiveOlderThan(dto.days);
    }
}
