import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { User } from '@/types/api';

type DeactivateUserDialogProps = {
    user: User | null;
    setUser: (user: User | null) => void;
    actionLoading: boolean;
    onSubmit: () => Promise<void>;
};

export function DeactivateUserDialog({
    user,
    setUser,
    actionLoading,
    onSubmit,
}: DeactivateUserDialogProps) {
    return (
        <Dialog open={!!user} onOpenChange={(open) => !open && setUser(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Désactiver l’utilisateur</DialogTitle>
                    <DialogDescription>
                        Confirmer la désactivation du compte <strong>{user?.email}</strong> ?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setUser(null)}>
                        Annuler
                    </Button>
                    <Button variant="destructive" onClick={onSubmit} disabled={actionLoading}>
                        {actionLoading ? 'Désactivation...' : 'Désactiver'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
