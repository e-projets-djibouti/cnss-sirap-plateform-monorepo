import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Public()
    @Get('infra')
    @ApiOperation({ summary: 'Health check des services d’infrastructure (DB, MinIO)' })
    infra() {
        return this.healthService.infraStatus();
    }

    @Public()
    @Get('platformes')
    @ApiOperation({ summary: 'Health check des plateformes exposées (API, Swagger)' })
    platformes() {
        return this.healthService.platformesStatus();
    }

    @Public()
    @Get('platforms')
    @ApiOperation({ summary: 'Alias de /health/platformes' })
    platformsAlias() {
        return this.healthService.platformesStatus();
    }
}
