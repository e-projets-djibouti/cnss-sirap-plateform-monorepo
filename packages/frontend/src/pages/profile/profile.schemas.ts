import { z } from 'zod';

export const profileSchema = z.object({
    fullName: z.string().min(1, 'Nom complet requis'),
    phone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
        newPassword: z
            .string()
            .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
            .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
                message:
                    'Le mot de passe doit contenir une majuscule, un chiffre et un caractère spécial',
            }),
        confirmPassword: z.string().min(8, 'Confirmation requise'),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
    });

export type PasswordFormValues = z.infer<typeof passwordSchema>;
