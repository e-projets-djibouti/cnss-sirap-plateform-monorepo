import {
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsString()
  fullName!: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
