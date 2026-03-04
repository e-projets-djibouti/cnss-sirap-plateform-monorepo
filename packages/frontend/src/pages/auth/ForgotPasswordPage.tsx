import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

const schema = z.object({
    email: z.string().email('Adresse email invalide'),
});

type FormValues = z.infer<typeof schema>;

type ForgotPasswordResponse = {
    message: string;
};

export function ForgotPasswordPage() {
    const [message, setMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    async function onSubmit(data: FormValues) {
        try {
            const { data: response } = await api.post<ForgotPasswordResponse>('/api/auth/forgot-password', data);
            setMessage(response.message);
        } catch {
            setError('root', { message: 'Impossible de traiter la demande pour le moment.' });
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
                    <CardDescription>
                        Entrez votre email pour recevoir un code à 6 chiffres.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@cnss.dj"
                                autoComplete="email"
                                {...register('email')}
                            />
                            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                        </div>

                        {errors.root && (
                            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {errors.root.message}
                            </div>
                        )}

                        {message && (
                            <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                                <p>{message}</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Envoi...' : 'Envoyer le code'}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            <Link to="/reset-password" className="underline">J’ai déjà un code</Link>
                        </p>

                        <p className="text-center text-sm text-muted-foreground">
                            <Link to="/login" className="underline">Retour à la connexion</Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
