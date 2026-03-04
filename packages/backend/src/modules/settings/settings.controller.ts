import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { UpdateDuplicatesSettingDto } from './dto/update-duplicates-setting.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @RequirePermission('settings:read')
    @Get()
    findAll() {
        return this.settingsService.findAll();
    }

    @RequirePermission('settings:read')
    @Get('duplicates')
    getDuplicates() {
        return this.settingsService.getDuplicatesSetting();
    }

    @RequirePermission('settings:manage')
    @Put('duplicates')
    updateDuplicates(@Body() dto: UpdateDuplicatesSettingDto) {
        return this.settingsService.updateDuplicatesSetting(dto);
    }
}
