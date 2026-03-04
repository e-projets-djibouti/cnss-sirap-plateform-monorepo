import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { api, tokenStorage } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import {
    passwordSchema,
    PasswordFormValues,
    profileSchema,
    ProfileFormValues,
} from './profile.schemas';

export function useProfilePage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isAvatarSubmitting, setIsAvatarSubmitting] = useState(false);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: '',
            phone: '',
        },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    useEffect(() => {
        profileForm.reset({
            fullName: user?.profile?.fullName ?? '',
            phone: user?.profile?.phone ?? '',
        });
    }, [profileForm, user]);

    const fullName = profileForm.watch('fullName')?.trim() || user?.profile?.fullName || '';

    const initials = useMemo(
        () =>
            fullName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase() || '??',
        [fullName],
    );

    const avatarPreview = useMemo(() => {
        if (avatarFile) return URL.createObjectURL(avatarFile);
        return user?.profile?.avatarUrl || '';
    }, [avatarFile, user?.profile?.avatarUrl]);

    useEffect(() => {
        return () => {
            if (avatarFile) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarFile, avatarPreview]);

    const onSubmitProfile = profileForm.handleSubmit(async (values) => {
        try {
            await api.patch('/api/auth/me', {
                fullName: values.fullName,
                phone: values.phone || undefined,
            });

            await refreshUser();
            toast({ title: 'Profil mis à jour' });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de mettre à jour le profil.',
            });
        }
    });

    const onUploadAvatar = async () => {
        if (!avatarFile) return;

        const formData = new FormData();
        formData.append('file', avatarFile);

        setIsAvatarSubmitting(true);
        try {
            await api.post('/api/auth/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAvatarFile(null);
            await refreshUser();
            toast({ title: 'Avatar mis à jour' });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Upload avatar impossible (format accepté: jpg/png/webp/gif, max 5MB).',
            });
        } finally {
            setIsAvatarSubmitting(false);
        }
    };

    const onSubmitPassword = passwordForm.handleSubmit(async (values) => {
        try {
            await api.post('/api/auth/change-password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });

            toast({
                title: 'Mot de passe modifié',
                description: 'Reconnectez-vous avec votre nouveau mot de passe.',
            });
            passwordForm.reset();
            tokenStorage.clear();
            window.dispatchEvent(new Event('auth:logout'));
            navigate('/login', { replace: true });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de changer le mot de passe.',
            });
        }
    });

    return {
        user,
        fullName,
        initials,
        avatarFile,
        avatarPreview,
        isAvatarSubmitting,
        showCurrentPassword,
        showNewPassword,
        showConfirmPassword,
        profileForm,
        passwordForm,
        setAvatarFile,
        setShowCurrentPassword,
        setShowNewPassword,
        setShowConfirmPassword,
        onUploadAvatar,
        onSubmitProfile,
        onSubmitPassword,
    };
}
