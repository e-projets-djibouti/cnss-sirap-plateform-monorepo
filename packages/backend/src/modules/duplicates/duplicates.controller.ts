import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DuplicatesService } from './duplicates.service';
import { DetectDuplicatesDto } from './dto/detect-duplicates.dto';
import { SettingsService } from '../settings/settings.service';

@ApiTags('Duplicates')
@Controller('duplicates')
export class DuplicatesController {
    constructor(
        private readonly duplicatesService: DuplicatesService,
        private readonly settingsService: SettingsService,
    ) { }

    @Post('detect')
    async detect(@Body() dto: DetectDuplicatesDto) {
        const defaults = await this.settingsService.getDuplicatesSetting();
        const columns = dto.columns?.length ? dto.columns : defaults.columns;
        const operator = dto.operator ?? defaults.operator;

        return this.duplicatesService.detect(dto.records, columns, operator);
    }
}
