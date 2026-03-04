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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileFormValues } from './profile.schemas';

interface ProfileInfoCardProps {
    email: string;
    roleName: string;
    fullName: string;
    initials: string;
    avatarPreview: string;
    avatarFile: File | null;
    isAvatarSubmitting: boolean;
    profileForm: UseFormReturn<ProfileFormValues>;
    onAvatarChange: (file: File | null) => void;
    onUploadAvatar: () => Promise<void>;
    onSubmitProfile: () => void;
}

export function ProfileInfoCard({
    email,
    roleName,
    fullName,
    initials,
    avatarPreview,
    avatarFile,
    isAvatarSubmitting,
    profileForm,
    onAvatarChange,
    onUploadAvatar,
    onSubmitProfile,
}: ProfileInfoCardProps) {
    return (
        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Votre email est verrouillé et ne peut pas être modifié.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview || undefined} alt={fullName || 'Utilisateur'} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="avatar">Avatar (jpg/png/webp/gif, max 5MB)</Label>
                            <Input
                                id="avatar"
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    onAvatarChange(file);
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={onUploadAvatar}
                            disabled={!avatarFile || isAvatarSubmitting}
                        >
                            {isAvatarSubmitting ? 'Upload...' : 'Mettre à jour l’avatar'}
                        </Button>
                    </div>
                </div>

                <form onSubmit={onSubmitProfile} className="space-y-4" noValidate>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={email} disabled readOnly />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Rôle</Label>
                            <Input id="role" value={roleName} disabled readOnly />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nom complet</Label>
                            <Input id="fullName" {...profileForm.register('fullName')} />
                            {profileForm.formState.errors.fullName && (
                                <p className="text-sm text-destructive">
                                    {profileForm.formState.errors.fullName.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input id="phone" {...profileForm.register('phone')} />
                            {profileForm.formState.errors.phone && (
                                <p className="text-sm text-destructive">
                                    {profileForm.formState.errors.phone.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting ? 'Mise à jour...' : 'Enregistrer les informations'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
