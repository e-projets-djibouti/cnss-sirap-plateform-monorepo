import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email('Email invalide'),
    fullName: z.string().min(1, 'Nom complet requis'),
    phone: z.string().optional(),
    roleId: z.string().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
    email: z.string().email('Email invalide'),
    fullName: z.string().min(1, 'Nom complet requis'),
    phone: z.string().optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
