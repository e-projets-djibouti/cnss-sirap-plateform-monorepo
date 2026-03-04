import { BadRequestException, Injectable } from '@nestjs/common';
import { CNSSRecord } from '@sirap/shared';

type Operator = 'AND' | 'OR';

const DEFAULT_COLUMNS: (keyof CNSSRecord)[] = ['nomsEtPrenoms', 'netAPayer'];
const ALLOWED_COLUMNS: (keyof CNSSRecord)[] = [
    'brenet',
    'nomsEtPrenoms',
    'netAPayer',
    'codePeriode',
    'typeRelation',
    'nomMere',
    'nature',
    'banque',
    'rib',
];

@Injectable()
export class DuplicatesService {
    detect(records: CNSSRecord[], columns?: string[], operator?: Operator) {
        const selectedColumns = this.resolveColumns(columns);
        const selectedOperator: Operator = operator ?? 'AND';

        if (records.length === 0) {
            return {
                records,
                stats: { duplicates: 0, duplicateGroups: 0 },
                config: {
                    columns: selectedColumns,
                    operator: selectedOperator,
                },
            };
        }

        const nextRecords = records.map((record) => ({
            ...record,
            isDuplicate: false,
            duplicateGroup: undefined,
        }));

        if (selectedOperator === 'AND') {
            const duplicateGroups = this.detectWithAnd(nextRecords, selectedColumns);
            return {
                records: nextRecords,
                stats: {
                    duplicates: nextRecords.filter((record) => record.isDuplicate).length,
                    duplicateGroups,
                },
                config: {
                    columns: selectedColumns,
                    operator: selectedOperator,
                },
            };
        }

        const duplicateGroups = this.detectWithOr(nextRecords, selectedColumns);
        return {
            records: nextRecords,
            stats: {
                duplicates: nextRecords.filter((record) => record.isDuplicate).length,
                duplicateGroups,
            },
            config: {
                columns: selectedColumns,
                operator: selectedOperator,
            },
        };
    }

    private resolveColumns(columns?: string[]): (keyof CNSSRecord)[] {
        const values = (columns?.length ? columns : DEFAULT_COLUMNS)
            .filter((value): value is keyof CNSSRecord =>
                ALLOWED_COLUMNS.includes(value as keyof CNSSRecord),
            );

        if (values.length === 0) {
            throw new BadRequestException('Aucune colonne valide fournie pour la détection des doublons');
        }

        return [...new Set(values)];
    }

    private detectWithAnd(records: CNSSRecord[], columns: (keyof CNSSRecord)[]): number {
        const grouped = new Map<string, number[]>();

        records.forEach((record, index) => {
            const key = this.combinedKey(record, columns);
            const existing = grouped.get(key) ?? [];
            existing.push(index);
            grouped.set(key, existing);
        });

        let groupId = 1;
        grouped.forEach((indices) => {
            if (indices.length <= 1) return;
            indices.forEach((index) => {
                records[index].isDuplicate = true;
                records[index].duplicateGroup = groupId;
            });
            groupId += 1;
        });

        return groupId - 1;
    }

    private detectWithOr(records: CNSSRecord[], columns: (keyof CNSSRecord)[]): number {
        const duplicateCandidates = new Set<number>();

        columns.forEach((column) => {
            const grouped = new Map<string, number[]>();

            records.forEach((record, index) => {
                const value = this.normalizeValue(record[column]);
                const existing = grouped.get(value) ?? [];
                existing.push(index);
                grouped.set(value, existing);
            });

            grouped.forEach((indices) => {
                if (indices.length <= 1) return;
                indices.forEach((index) => duplicateCandidates.add(index));
            });
        });

        const regrouped = new Map<string, number[]>();
        duplicateCandidates.forEach((index) => {
            const key = this.combinedKey(records[index], columns);
            const existing = regrouped.get(key) ?? [];
            existing.push(index);
            regrouped.set(key, existing);
        });

        let groupId = 1;
        regrouped.forEach((indices) => {
            indices.forEach((index) => {
                records[index].isDuplicate = true;
                records[index].duplicateGroup = groupId;
            });
            groupId += 1;
        });

        return groupId - 1;
    }

    private combinedKey(record: CNSSRecord, columns: (keyof CNSSRecord)[]): string {
        return columns
            .map((column) => this.normalizeValue(record[column]))
            .join('|||');
    }

    private normalizeValue(value: unknown): string {
        return String(value ?? '').trim().toLowerCase();
    }
}
