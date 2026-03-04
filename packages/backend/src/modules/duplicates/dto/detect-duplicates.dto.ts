import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class DetectDuplicateRecordDto {
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
}

export class DetectDuplicatesDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => DetectDuplicateRecordDto)
    records!: DetectDuplicateRecordDto[];

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    columns?: string[];

    @IsOptional()
    @IsIn(['AND', 'OR'])
    operator?: 'AND' | 'OR';
}
