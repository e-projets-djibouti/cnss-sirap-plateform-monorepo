import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Role } from '@/types/api';
import type { CreateUserFormValues } from './users.schemas';

type CreateUserDialogProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    form: UseFormReturn<CreateUserFormValues>;
    roleOptions: Role[];
    actionLoading: boolean;
    onSubmit: (values: CreateUserFormValues) => Promise<void>;
};

export function CreateUserDialog({
    open,
    setOpen,
    form,
    roleOptions,
    actionLoading,
    onSubmit,
}: CreateUserDialogProps) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer un utilisateur</DialogTitle>
                    <DialogDescription>
                        Un mot de passe temporaire sera généré et envoyé automatiquement par email.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="c-email">Email</Label>
                        <Input id="c-email" type="email" {...form.register('email')} />
                        {form.formState.errors.email && (
                            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="c-fullName">Nom complet</Label>
                        <Input id="c-fullName" {...form.register('fullName')} />
                        {form.formState.errors.fullName && (
                            <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="c-phone">Téléphone (optionnel)</Label>
                        <Input id="c-phone" {...form.register('phone')} />
                    </div>
                    <div className="space-y-2">
                        <Label>Rôle (optionnel)</Label>
                        <Select value={form.watch('roleId') || ''} onValueChange={(value) => form.setValue('roleId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Rôle AGENT par défaut" />
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name} (Niveau {role.level})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={actionLoading}>
                            {actionLoading ? 'Création...' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
