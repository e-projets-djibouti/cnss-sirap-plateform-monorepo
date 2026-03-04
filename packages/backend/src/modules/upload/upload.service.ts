import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CNSSRecord } from '@sirap/shared';
import { MinioService } from '../../common/minio/minio.service';
import { parseNetAmount } from './upload.parsing';

@Injectable()
export class UploadService {
    constructor(private readonly minio: MinioService) { }

    async parseAndStore(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Fichier manquant');
        }

        const ext = this.getExtension(file.originalname);
        if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
            throw new BadRequestException('Format non supporté. Utiliser .xlsx, .xls ou .csv');
        }

        const storage = await this.minio.uploadExcelVersioned(
            file.originalname,
            file.buffer,
            file.mimetype || 'application/octet-stream',
        );

        const records = this.parseWorkbook(file.buffer);

        return {
            fileName: file.originalname,
            records,
            stats: {
                totalRecords: records.length,
            },
            storage,
        };
    }

    private parseWorkbook(buffer: Buffer): CNSSRecord[] {
        let workbook: XLSX.WorkBook;
        try {
            workbook = XLSX.read(buffer, { type: 'buffer' });
        } catch {
            throw new BadRequestException('Fichier Excel invalide ou illisible');
        }

        const records: CNSSRecord[] = [];
        let no = 1;

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) continue;

            const rows = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
                header: 1,
                raw: true,
                defval: '',
            });

            for (let i = 1; i < rows.length; i += 1) {
                const row = rows[i] ?? [];
                if (!row[1]) continue;

                records.push({
                    no,
                    brenet: this.toString(row[1]),
                    nomsEtPrenoms: this.toString(row[2]),
                    netAPayer: parseNetAmount(row[3]),
                    codePeriode: this.toString(row[4]),
                    typeRelation: this.toString(row[5]),
                    nomMere: this.toOptionalString(row[6]),
                    nature: this.toString(row[7]),
                    banque: this.toString(row[8]),
                    rib: this.toString(row[9]),
                });

                no += 1;
            }
        }

        return records;
    }
    private toString(value: unknown): string {
        return String(value ?? '').trim();
    }

    private toOptionalString(value: unknown): string | undefined {
        const normalized = this.toString(value);
        return normalized.length > 0 ? normalized : undefined;
    }

    private getExtension(fileName: string): string {
        const idx = fileName.lastIndexOf('.');
        if (idx < 0) return '';
        return fileName.slice(idx).toLowerCase();
    }
}
