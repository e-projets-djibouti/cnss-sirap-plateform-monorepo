import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Role, User, PaginatedResponse } from '@/types/api';
import { api } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import {
    createUserSchema,
    updateUserSchema,
    type CreateUserFormValues,
    type UpdateUserFormValues,
} from './users.schemas';

export function useUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const roleOptions = useMemo(() => [...roles].sort((a, b) => b.level - a.level), [roles]);

    const createForm = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            email: '',
            fullName: '',
            phone: '',
            roleId: '',
        },
    });

    const editForm = useForm<UpdateUserFormValues>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            email: '',
            fullName: '',
            phone: '',
        },
    });

    async function loadData() {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get<PaginatedResponse<User>>('/api/users?page=1&limit=100'),
                api.get<Role[]>('/api/roles'),
            ]);

            setUsers(usersRes.data.data ?? []);
            setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de charger les utilisateurs.',
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadData();
    }, []);

    async function handleCreate(values: CreateUserFormValues) {
        setActionLoading(true);
        try {
            await api.post('/api/users', {
                email: values.email,
                fullName: values.fullName,
                phone: values.phone || undefined,
                roleId: values.roleId || undefined,
            });

            toast({
                title: 'Utilisateur créé',
                description: 'Identifiant et mot de passe temporaire envoyés par email.',
            });

            setCreateOpen(false);
            createForm.reset();
            await loadData();
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Création impossible. Vérifiez SMTP et les données.',
            });
        } finally {
            setActionLoading(false);
        }
    }

    function openEdit(user: User) {
        setEditUser(user);
        editForm.reset({
            email: user.email,
            fullName: user.profile?.fullName ?? '',
            phone: user.profile?.phone ?? '',
        });
    }

    async function handleEdit(values: UpdateUserFormValues) {
        if (!editUser) return;
        setActionLoading(true);
        try {
            await api.patch(`/api/users/${editUser.id}`, {
                email: values.email,
                fullName: values.fullName,
                phone: values.phone || undefined,
            });

            toast({ title: 'Utilisateur mis à jour' });
            setEditUser(null);
            await loadData();
        } catch {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Mise à jour impossible.' });
        } finally {
            setActionLoading(false);
        }
    }

    function openChangeRole(user: User) {
        setChangeRoleUser(user);
        setSelectedRoleId(user.role.id);
    }

    async function handleChangeRole() {
        if (!changeRoleUser || !selectedRoleId) return;
        setActionLoading(true);
        try {
            await api.patch(`/api/users/${changeRoleUser.id}/role`, { roleId: selectedRoleId });
            toast({ title: 'Rôle modifié' });
            setChangeRoleUser(null);
            setSelectedRoleId('');
            await loadData();
        } catch {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Changement de rôle impossible.' });
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDeactivate() {
        if (!deleteUser) return;
        setActionLoading(true);
        try {
            await api.delete(`/api/users/${deleteUser.id}`);
            toast({ title: 'Utilisateur désactivé' });
            setDeleteUser(null);
            await loadData();
        } catch {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Désactivation impossible.' });
        } finally {
            setActionLoading(false);
        }
    }

    return {
        users,
        loading,
        roleOptions,
        createOpen,
        editUser,
        deleteUser,
        changeRoleUser,
        selectedRoleId,
        actionLoading,
        createForm,
        editForm,
        setCreateOpen,
        setEditUser,
        setDeleteUser,
        setChangeRoleUser,
        setSelectedRoleId,
        handleCreate,
        openEdit,
        handleEdit,
        openChangeRole,
        handleChangeRole,
        handleDeactivate,
    };
}
