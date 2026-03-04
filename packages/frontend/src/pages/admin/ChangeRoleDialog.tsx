import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Role, User } from '@/types/api';

type ChangeRoleDialogProps = {
    user: User | null;
    setUser: (user: User | null) => void;
    roleOptions: Role[];
    selectedRoleId: string;
    setSelectedRoleId: (roleId: string) => void;
    actionLoading: boolean;
    onSubmit: () => Promise<void>;
};

export function ChangeRoleDialog({
    user,
    setUser,
    roleOptions,
    selectedRoleId,
    setSelectedRoleId,
    actionLoading,
    onSubmit,
}: ChangeRoleDialogProps) {
    return (
        <Dialog open={!!user} onOpenChange={(open) => !open && setUser(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Changer le rôle</DialogTitle>
                    <DialogDescription>{user?.email}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                            {roleOptions.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                    {role.name} (Niveau {role.level})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setUser(null)}>
                            Annuler
                        </Button>
                        <Button onClick={onSubmit} disabled={!selectedRoleId || actionLoading}>
                            {actionLoading ? 'Mise à jour...' : 'Mettre à jour'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
