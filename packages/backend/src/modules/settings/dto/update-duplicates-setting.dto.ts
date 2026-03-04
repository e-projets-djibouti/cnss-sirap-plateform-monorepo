import { ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';

export class UpdateDuplicatesSettingDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    columns!: string[];

    @IsIn(['AND', 'OR'])
    operator!: 'AND' | 'OR';
}
