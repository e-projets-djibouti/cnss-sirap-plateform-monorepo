import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateUserFormValues } from './users.schemas';

type EditUserDialogProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    form: UseFormReturn<UpdateUserFormValues>;
    actionLoading: boolean;
    onSubmit: (values: UpdateUserFormValues) => Promise<void>;
};

export function EditUserDialog({
    open,
    setOpen,
    form,
    actionLoading,
    onSubmit,
}: EditUserDialogProps) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier l’utilisateur</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="e-email">Email</Label>
                        <Input id="e-email" type="email" {...form.register('email')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="e-fullName">Nom complet</Label>
                        <Input id="e-fullName" {...form.register('fullName')} />
                        {form.formState.errors.fullName && (
                            <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="e-phone">Téléphone</Label>
                        <Input id="e-phone" {...form.register('phone')} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={actionLoading}>
                            {actionLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
