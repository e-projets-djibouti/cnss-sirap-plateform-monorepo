import { Eye, EyeOff } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { PasswordFormValues } from './profile.schemas';

interface ProfileSecurityCardProps {
    showCurrentPassword: boolean;
    showNewPassword: boolean;
    showConfirmPassword: boolean;
    passwordForm: UseFormReturn<PasswordFormValues>;
    onToggleCurrent: () => void;
    onToggleNew: () => void;
    onToggleConfirm: () => void;
    onSubmitPassword: () => void;
}

export function ProfileSecurityCard({
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    passwordForm,
    onToggleCurrent,
    onToggleNew,
    onToggleConfirm,
    onSubmitPassword,
}: ProfileSecurityCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>Modifiez votre mot de passe.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmitPassword} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                className="pr-10"
                                {...passwordForm.register('currentPassword')}
                            />
                            <button
                                type="button"
                                onClick={onToggleCurrent}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordForm.formState.errors.currentPassword && (
                            <p className="text-sm text-destructive">
                                {passwordForm.formState.errors.currentPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                className="pr-10"
                                {...passwordForm.register('newPassword')}
                            />
                            <button
                                type="button"
                                onClick={onToggleNew}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordForm.formState.errors.newPassword && (
                            <p className="text-sm text-destructive">
                                {passwordForm.formState.errors.newPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                className="pr-10"
                                {...passwordForm.register('confirmPassword')}
                            />
                            <button
                                type="button"
                                onClick={onToggleConfirm}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-destructive">
                                {passwordForm.formState.errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                        {passwordForm.formState.isSubmitting ? 'Mise à jour...' : 'Changer le mot de passe'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
