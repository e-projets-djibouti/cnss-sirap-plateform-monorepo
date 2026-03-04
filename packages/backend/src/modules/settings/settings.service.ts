import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateDuplicatesSettingDto } from './dto/update-duplicates-setting.dto';

const DUPLICATE_COLUMNS_KEY = 'duplicate_columns';
const DUPLICATE_OPERATOR_KEY = 'duplicate_operator';

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.setting.findMany({
            orderBy: { createdAt: 'asc' },
        });
    }

    async getDuplicatesSetting() {
        const [columns, operator] = await Promise.all([
            this.prisma.setting.findUnique({ where: { key: DUPLICATE_COLUMNS_KEY } }),
            this.prisma.setting.findUnique({ where: { key: DUPLICATE_OPERATOR_KEY } }),
        ]);

        return {
            columns: Array.isArray(columns?.value)
                ? (columns?.value as string[])
                : ['nomsEtPrenoms', 'netAPayer'],
            operator: operator?.value === 'OR' ? 'OR' : 'AND',
        } as const;
    }

    async updateDuplicatesSetting(dto: UpdateDuplicatesSettingDto) {
        const normalizedColumns = [...new Set(dto.columns.map((column) => column.trim()).filter(Boolean))];

        const [columns, operator] = await Promise.all([
            this.prisma.setting.upsert({
                where: { key: DUPLICATE_COLUMNS_KEY },
                update: { value: normalizedColumns, category: 'duplicates' },
                create: {
                    key: DUPLICATE_COLUMNS_KEY,
                    value: normalizedColumns,
                    category: 'duplicates',
                },
            }),
            this.prisma.setting.upsert({
                where: { key: DUPLICATE_OPERATOR_KEY },
                update: { value: dto.operator, category: 'duplicates' },
                create: {
                    key: DUPLICATE_OPERATOR_KEY,
                    value: dto.operator,
                    category: 'duplicates',
                },
            }),
        ]);

        return {
            columns: columns.value as string[],
            operator: operator.value as 'AND' | 'OR',
        };
    }
}
