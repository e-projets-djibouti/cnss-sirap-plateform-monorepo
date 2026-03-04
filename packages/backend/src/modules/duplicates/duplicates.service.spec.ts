import { describe, expect, it } from 'vitest';
import { DuplicatesService } from './duplicates.service';

const service = new DuplicatesService();

const baseRecords = [
    {
        no: 1,
        brenet: 'B1',
        nomsEtPrenoms: 'Ali Omar',
        netAPayer: 1000,
        codePeriode: '2026-01',
        typeRelation: 'Assuré',
        nomMere: 'A',
        nature: 'Pension',
        banque: 'BCIMR',
        rib: 'R1',
    },
    {
        no: 2,
        brenet: 'B2',
        nomsEtPrenoms: 'Ali Omar',
        netAPayer: 1000,
        codePeriode: '2026-01',
        typeRelation: 'Assuré',
        nomMere: 'B',
        nature: 'Pension',
        banque: 'BCIMR',
        rib: 'R2',
    },
    {
        no: 3,
        brenet: 'B3',
        nomsEtPrenoms: 'Mouna Said',
        netAPayer: 500,
        codePeriode: '2026-01',
        typeRelation: 'Conjoint',
        nomMere: 'C',
        nature: 'Pension',
        banque: 'CAC BANK',
        rib: 'R3',
    },
];

describe('DuplicatesService', () => {
    it('detects duplicates with AND operator', () => {
        const result = service.detect(baseRecords, ['nomsEtPrenoms', 'netAPayer'], 'AND');

        expect(result.stats.duplicates).toBe(2);
        expect(result.stats.duplicateGroups).toBe(1);
        expect(result.records[0].isDuplicate).toBe(true);
        expect(result.records[1].isDuplicate).toBe(true);
        expect(result.records[2].isDuplicate).toBe(false);
    });

    it('detects duplicates with OR operator', () => {
        const result = service.detect(baseRecords, ['nomsEtPrenoms', 'rib'], 'OR');

        expect(result.stats.duplicates).toBeGreaterThanOrEqual(2);
        expect(result.stats.duplicateGroups).toBeGreaterThanOrEqual(1);
    });

    it('is case-insensitive and trims values', () => {
        const records = [
            {
                ...baseRecords[0],
                nomsEtPrenoms: '  ALI OMAR  ',
            },
            {
                ...baseRecords[1],
                nomsEtPrenoms: 'ali omar',
            },
        ];

        const result = service.detect(records, ['nomsEtPrenoms'], 'AND');
        expect(result.stats.duplicates).toBe(2);
        expect(result.stats.duplicateGroups).toBe(1);
    });
});
