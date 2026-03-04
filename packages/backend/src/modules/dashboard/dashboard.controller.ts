import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardRecordsDto } from './dto/dashboard-records.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Post('stats')
    stats(@Body() dto: DashboardRecordsDto) {
        return this.dashboardService.computeStats(dto.records);
    }

    @Post('charts')
    charts(@Body() dto: DashboardRecordsDto) {
        return this.dashboardService.computeCharts(dto.records);
    }

    @Post('export/pdf')
    exportPdf(@Body() dto: DashboardRecordsDto) {
        return this.dashboardService.exportPdf(dto.records);
    }

    @Post('export/excel')
    exportExcel(@Body() dto: DashboardRecordsDto) {
        return this.dashboardService.exportExcel(dto.records);
    }

    @Get('admin')
    admin() {
        return this.dashboardService.adminStats();
    }
}
