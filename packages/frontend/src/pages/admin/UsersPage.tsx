import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChangeRoleDialog } from './ChangeRoleDialog';
import { CreateUserDialog } from './CreateUserDialog';
import { DeactivateUserDialog } from './DeactivateUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { UsersTable } from './UsersTable';
import { useUsersPage } from './useUsersPage';

export function UsersPage() {
    const vm = useUsersPage();

    if (vm.loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestion des utilisateurs</h1>
                    <p className="text-muted-foreground">Création, modification, rôles et désactivation.</p>
                </div>
                <Button onClick={() => vm.setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nouvel utilisateur
                </Button>
            </div>

            <UsersTable
                users={vm.users}
                onChangeRole={vm.openChangeRole}
                onEdit={vm.openEdit}
                onDeactivate={vm.setDeleteUser}
            />

            <CreateUserDialog
                open={vm.createOpen}
                setOpen={vm.setCreateOpen}
                form={vm.createForm}
                roleOptions={vm.roleOptions}
                actionLoading={vm.actionLoading}
                onSubmit={vm.handleCreate}
            />

            <EditUserDialog
                open={!!vm.editUser}
                setOpen={(open) => !open && vm.setEditUser(null)}
                form={vm.editForm}
                actionLoading={vm.actionLoading}
                onSubmit={vm.handleEdit}
            />

            <ChangeRoleDialog
                user={vm.changeRoleUser}
                setUser={vm.setChangeRoleUser}
                roleOptions={vm.roleOptions}
                selectedRoleId={vm.selectedRoleId}
                setSelectedRoleId={vm.setSelectedRoleId}
                actionLoading={vm.actionLoading}
                onSubmit={vm.handleChangeRole}
            />

            <DeactivateUserDialog
                user={vm.deleteUser}
                setUser={vm.setDeleteUser}
                actionLoading={vm.actionLoading}
                onSubmit={vm.handleDeactivate}
            />
        </div>
    );
}
