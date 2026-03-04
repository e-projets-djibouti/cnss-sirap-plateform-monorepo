import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AuditQueryDto {
    @IsOptional()
    @Transform(({ value }) => Number(value ?? 1))
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Transform(({ value }) => Number(value ?? 20))
    @IsInt()
    @Min(1)
    @Max(200)
    limit = 20;

    @IsOptional()
    @Transform(({ value }) => String(value).toUpperCase())
    @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    method?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;
        return String(value).toLowerCase() === 'true';
    })
    success?: boolean;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    path?: string;
}
