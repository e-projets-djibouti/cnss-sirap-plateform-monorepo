import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class DashboardRecordDto {
    @IsNumber()
    no!: number;

    @IsString()
    brenet!: string;

    @IsString()
    nomsEtPrenoms!: string;

    @IsNumber()
    netAPayer!: number;

    @IsString()
    codePeriode!: string;

    @IsString()
    typeRelation!: string;

    @IsOptional()
    @IsString()
    nomMere?: string;

    @IsString()
    nature!: string;

    @IsString()
    banque!: string;

    @IsString()
    rib!: string;

    @IsOptional()
    @IsBoolean()
    isDuplicate?: boolean;

    @IsOptional()
    @IsNumber()
    duplicateGroup?: number;
}

export class DashboardRecordsDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => DashboardRecordDto)
    records!: DashboardRecordDto[];
}
