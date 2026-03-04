import { MailCheck, Pencil, Trash2, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { User } from '@/types/api';

type UsersTableProps = {
    users: User[];
    onChangeRole: (user: User) => void;
    onEdit: (user: User) => void;
    onDeactivate: (user: User) => void;
};

export function UsersTable({ users, onChangeRole, onEdit, onDeactivate }: UsersTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nom complet</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>1ère connexion</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                Aucun utilisateur trouvé
                            </TableCell>
                        </TableRow>
                    )}
                    {users.map((user) => {
                        const fullName = user.profile?.fullName?.trim() || '—';
                        return (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{fullName}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{user.role.name}</Badge>
                                </TableCell>
                                <TableCell>
                                    {user.isActive ? (
                                        <Badge variant="secondary">Actif</Badge>
                                    ) : (
                                        <Badge variant="destructive">Inactif</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {user.mustChangePassword ? (
                                        <Badge className="gap-1">
                                            <MailCheck className="h-3 w-3" /> Requise
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">Non</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" title="Changer rôle" onClick={() => onChangeRole(user)}>
                                            <UserCog className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Modifier" onClick={() => onEdit(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {user.isActive && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Désactiver"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => onDeactivate(user)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
