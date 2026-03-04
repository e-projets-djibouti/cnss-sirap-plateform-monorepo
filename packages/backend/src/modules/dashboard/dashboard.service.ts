import { Injectable } from '@nestjs/common';
import { CNSSRecord, AMOUNT_RANGES } from '@sirap/shared';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    computeStats(records: CNSSRecord[]) {
        const totalRecords = records.length;
        const totalAmount = this.sum(records);
        const amountOnePerGroup = this.calculateAmountOnePerGroup(records);
        const amountWithoutDuplicates = this.calculateAmountWithoutDuplicates(records);

        const duplicates = records.filter((record) => record.isDuplicate).length;
        const duplicateGroups = this.calculateDuplicateGroupsCount(records);
        const assures = records.filter((record) => this.normalize(record.typeRelation).includes('assur')).length;
        const conjoints = records.filter((record) => this.normalize(record.typeRelation).includes('conjoint')).length;
        const uniqueBanks = new Set(
            records.map((record) => this.normalize(record.banque)).filter((value) => value.length > 0),
        ).size;

        return {
            totalRecords,
            totalAmount,
            amountOnePerGroup,
            amountWithoutDuplicates,
            ecartOnePerGroup: totalAmount - amountOnePerGroup,
            ecartSansDoublons: totalAmount - amountWithoutDuplicates,
            assures,
            conjoints,
            duplicates,
            duplicateGroups,
            uniqueBanks,
        };
    }

    computeCharts(records: CNSSRecord[]) {
        const byBank = this.groupBy(records, (record) => record.banque || 'Inconnu');
        const byPeriod = this.groupBy(records, (record) => record.codePeriode || 'N/A');
        const byNature = this.groupBy(records, (record) => record.nature || 'N/A');

        const relationRows = [
            {
                name: 'Assurés',
                count: records.filter((record) => this.normalize(record.typeRelation).includes('assur')).length,
                amount: this.sum(records.filter((record) => this.normalize(record.typeRelation).includes('assur'))),
            },
            {
                name: 'Conjoints',
                count: records.filter((record) => this.normalize(record.typeRelation).includes('conjoint')).length,
                amount: this.sum(records.filter((record) => this.normalize(record.typeRelation).includes('conjoint'))),
            },
        ];

        const amountRanges = AMOUNT_RANGES.map((range) => {
            const count = records.filter((record) => record.netAPayer >= range.min && record.netAPayer < range.max).length;
            return { label: range.label, count };
        });

        const topBankRows = [...byBank.entries()]
            .map(([name, list]) => ({
                name,
                count: list.length,
                amount: this.sum(list),
                average: list.length ? this.sum(list) / list.length : 0,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        const topPeriodRows = [...byPeriod.entries()]
            .map(([name, list]) => ({ name, count: list.length, amount: this.sum(list) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        const topNatureRows = [...byNature.entries()]
            .map(([name, list]) => ({ name, count: list.length, amount: this.sum(list) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            bankDistribution: topBankRows.map((row) => ({ name: row.name, value: row.count, amount: row.amount })),
            relationDistribution: relationRows,
            topBanksDetails: topBankRows,
            periodDistribution: topPeriodRows,
            amountRanges,
            natureDistribution: topNatureRows,
            relationComparison: relationRows.map((row) => ({
                name: row.name,
                count: row.count,
                amount: row.amount,
                average: row.count ? row.amount / row.count : 0,
            })),
        };
    }

    async exportExcel(records: CNSSRecord[]) {
        const stats = this.computeStats(records);
        const charts = this.computeCharts(records);

        const workbook = XLSX.utils.book_new();

        const summaryRows = Object.entries(stats).map(([key, value]) => ({ key, value }));
        const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

        const recordsSheet = XLSX.utils.json_to_sheet(records);
        XLSX.utils.book_append_sheet(workbook, recordsSheet, 'Enregistrements');

        const chartsSheet = XLSX.utils.json_to_sheet([
            { section: 'bankDistribution', value: JSON.stringify(charts.bankDistribution) },
            { section: 'relationDistribution', value: JSON.stringify(charts.relationDistribution) },
            { section: 'topBanksDetails', value: JSON.stringify(charts.topBanksDetails) },
            { section: 'periodDistribution', value: JSON.stringify(charts.periodDistribution) },
            { section: 'amountRanges', value: JSON.stringify(charts.amountRanges) },
            { section: 'natureDistribution', value: JSON.stringify(charts.natureDistribution) },
            { section: 'relationComparison', value: JSON.stringify(charts.relationComparison) },
        ]);
        XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Graphiques');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

        return {
            fileName: `dashboard-${Date.now()}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            base64: buffer.toString('base64'),
        };
    }

    async exportPdf(records: CNSSRecord[]) {
        const stats = this.computeStats(records);

        const doc = new PDFDocument({ margin: 40 });
        const chunks: Buffer[] = [];

        return new Promise<{ fileName: string; mimeType: string; base64: string }>((resolve) => {
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    fileName: `dashboard-${Date.now()}.pdf`,
                    mimeType: 'application/pdf',
                    base64: buffer.toString('base64'),
                });
            });

            doc.fontSize(18).text('Rapport Dashboard CNSS', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Date: ${new Date().toLocaleString('fr-FR')}`);
            doc.moveDown();

            Object.entries(stats).forEach(([key, value]) => {
                doc.text(`${key}: ${typeof value === 'number' ? value.toLocaleString('fr-FR') : value}`);
            });

            doc.end();
        });
    }

    async adminStats() {
        const [users, auditLogs, settings] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.auditLog.count(),
            this.prisma.setting.count(),
        ]);

        return {
            users,
            auditLogs,
            settings,
            generatedAt: new Date().toISOString(),
        };
    }

    calculateAmountOnePerGroup(records: CNSSRecord[]) {
        const seenGroups = new Set<number>();
        let total = 0;

        for (const record of records) {
            if (!record.isDuplicate) {
                total += record.netAPayer || 0;
                continue;
            }

            if (record.duplicateGroup && !seenGroups.has(record.duplicateGroup)) {
                seenGroups.add(record.duplicateGroup);
                total += record.netAPayer || 0;
            }
        }

        return total;
    }

    calculateAmountWithoutDuplicates(records: CNSSRecord[]) {
        return records
            .filter((record) => !record.isDuplicate)
            .reduce((sum, record) => sum + (record.netAPayer || 0), 0);
    }

    calculateDuplicateGroupsCount(records: CNSSRecord[]) {
        return new Set(
            records
                .filter((record) => record.isDuplicate && !!record.duplicateGroup)
                .map((record) => record.duplicateGroup as number),
        ).size;
    }

    private sum(records: CNSSRecord[]) {
        return records.reduce((sum, record) => sum + (record.netAPayer || 0), 0);
    }

    private groupBy(records: CNSSRecord[], selector: (record: CNSSRecord) => string) {
        const map = new Map<string, CNSSRecord[]>();
        records.forEach((record) => {
            const key = selector(record).trim() || 'N/A';
            const existing = map.get(key) ?? [];
            existing.push(record);
            map.set(key, existing);
        });
        return map;
    }

    private normalize(value: string) {
        return (value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }
}
