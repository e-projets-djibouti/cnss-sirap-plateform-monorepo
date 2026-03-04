import { Module } from '@nestjs/common';
import { DuplicatesController } from './duplicates.controller';
import { DuplicatesService } from './duplicates.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [SettingsModule],
    controllers: [DuplicatesController],
    providers: [DuplicatesService],
    exports: [DuplicatesService],
})
export class DuplicatesModule { }
