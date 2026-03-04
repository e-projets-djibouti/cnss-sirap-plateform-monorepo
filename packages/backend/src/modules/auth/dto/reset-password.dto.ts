import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail({}, { message: 'Email invalide' })
    email!: string;

    @IsString()
    @Matches(/^\d{6}$/, { message: 'Le code doit contenir 6 chiffres' })
    code!: string;

    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
        message:
            'Le mot de passe doit contenir une majuscule, un chiffre et un caractère spécial',
    })
    password!: string;
}
