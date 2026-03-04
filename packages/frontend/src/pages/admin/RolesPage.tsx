import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Role, Permission } from '@/types/api';
import { toast } from '@/hooks/useToast';

/* ─── Schemas ─────────────────────────────────────────────── */
const roleSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  description: z.string().optional(),
  level: z.coerce.number().int().min(1).max(100),
});
type RoleFormValues = z.infer<typeof roleSchema>;

/* ─── Component ──────────────────────────────────────────── */
export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [assignRole, setAssignRole] = useState<Role | null>(null);
  const [selectedPermId, setSelectedPermId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  /* ─── Data loading ─── */
  async function loadData() {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get<{ data: Role[] }>('/api/roles'),
        api.get<{ data: Permission[] }>('/api/permissions'),
      ]);
      setRoles(rolesRes.data.data ?? (rolesRes.data as unknown as Role[]));
      setPermissions(permsRes.data.data ?? (permsRes.data as unknown as Permission[]));
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  /* ─── Create form ─── */
  const createForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '', level: 10 },
  });

  async function handleCreate(data: RoleFormValues) {
    setActionLoading(true);
    try {
      await api.post('/api/roles', data);
      toast({ title: 'Rôle créé', description: `Le rôle "${data.name}" a été créé.` });
      setCreateOpen(false);
      createForm.reset();
      await loadData();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de créer le rôle' });
    } finally {
      setActionLoading(false);
    }
  }

  /* ─── Edit form ─── */
  const editForm = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema) });

  function openEdit(role: Role) {
    setEditRole(role);
    editForm.reset({ name: role.name, description: role.description ?? '', level: role.level });
  }

  async function handleEdit(data: RoleFormValues) {
    if (!editRole) return;
    setActionLoading(true);
    try {
      await api.patch(`/api/roles/${editRole.id}`, data);
      toast({ title: 'Rôle modifié', description: `Le rôle "${data.name}" a été mis à jour.` });
      setEditRole(null);
      await loadData();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le rôle' });
    } finally {
      setActionLoading(false);
    }
  }

  /* ─── Delete ─── */
  async function handleDelete() {
    if (!deleteRole) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/roles/${deleteRole.id}`);
      toast({ title: 'Rôle supprimé', description: `Le rôle "${deleteRole.name}" a été supprimé.` });
      setDeleteRole(null);
      await loadData();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer ce rôle' });
    } finally {
      setActionLoading(false);
    }
  }

  /* ─── Assign permission ─── */
  async function handleAssign() {
    if (!assignRole || !selectedPermId) return;
    setActionLoading(true);
    try {
      await api.post(`/api/roles/${assignRole.id}/permissions`, { permissionId: selectedPermId });
      toast({ title: 'Permission assignée' });
      setSelectedPermId('');
      await loadData();
      // Refresh assignRole with updated data
      const updated = await api.get<Role>(`/api/roles/${assignRole.id}`);
      setAssignRole(updated.data);
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'assigner la permission' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemovePermission(permissionId: string) {
    if (!assignRole) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/roles/${assignRole.id}/permissions/${permissionId}`);
      toast({ title: 'Permission retirée' });
      await loadData();
      const updated = await api.get<Role>(`/api/roles/${assignRole.id}`);
      setAssignRole(updated.data);
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de retirer la permission' });
    } finally {
      setActionLoading(false);
    }
  }

  const assignedIds = new Set(assignRole?.permissions?.map(p => p.permission.id) ?? []);
  const availablePerms = permissions.filter(p => !assignedIds.has(p.id));

  /* ─── Render ─── */
  if (loading) {
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
          <h1 className="text-2xl font-bold tracking-tight">Gestion des rôles</h1>
          <p className="text-muted-foreground">Gérez les rôles et leurs permissions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau rôle
        </Button>
      </div>

      {/* Roles table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Système</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun rôle trouvé
                </TableCell>
              </TableRow>
            )}
            {roles.map(role => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="text-muted-foreground">{role.description ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{role.level}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(role.permissions ?? []).slice(0, 3).map(rp => (
                      <Badge key={rp.permission.id} variant="secondary" className="text-xs">
                        {rp.permission.action}
                      </Badge>
                    ))}
                    {(role.permissions?.length ?? 0) > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(role.permissions?.length ?? 0) - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {role.isSystem ? (
                    <Badge variant="default">Système</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setAssignRole(role)} title="Permissions">
                      <Shield className="h-4 w-4" />
                    </Button>
                    {!role.isSystem && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(role)} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteRole(role)}
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Create Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un rôle</DialogTitle>
            <DialogDescription>Définissez le nom, la description et le niveau d'accès.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nom</Label>
              <Input id="c-name" placeholder="ex: MANAGER" {...createForm.register('name')} />
              {createForm.formState.errors.name && (
                <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-desc">Description</Label>
              <Input id="c-desc" placeholder="Description optionnelle" {...createForm.register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-level">Niveau (1–100)</Label>
              <Input id="c-level" type="number" min={1} max={100} {...createForm.register('level')} />
              {createForm.formState.errors.level && (
                <p className="text-sm text-destructive">{createForm.formState.errors.level.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ── */}
      <Dialog open={!!editRole} onOpenChange={open => { if (!open) setEditRole(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>Modifiez les informations du rôle.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-name">Nom</Label>
              <Input id="e-name" {...editForm.register('name')} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-desc">Description</Label>
              <Input id="e-desc" {...editForm.register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-level">Niveau (1–100)</Label>
              <Input id="e-level" type="number" min={1} max={100} {...editForm.register('level')} />
              {editForm.formState.errors.level && (
                <p className="text-sm text-destructive">{editForm.formState.errors.level.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditRole(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteRole} onOpenChange={open => { if (!open) setDeleteRole(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le rôle</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle <strong>{deleteRole?.name}</strong> ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRole(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Permissions Modal ── */}
      <Dialog open={!!assignRole} onOpenChange={open => { if (!open) setAssignRole(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Permissions — {assignRole?.name}</DialogTitle>
            <DialogDescription>Assignez ou retirez des permissions à ce rôle.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Assigned permissions */}
            <div>
              <p className="mb-2 text-sm font-medium">Permissions assignées</p>
              {(assignRole?.permissions ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune permission assignée</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(assignRole?.permissions ?? []).map(rp => (
                    <Badge key={rp.permission.id} variant="secondary" className="gap-1 pr-1">
                      {rp.permission.action}
                      <button
                        onClick={() => handleRemovePermission(rp.permission.id)}
                        className="ml-1 rounded-full hover:bg-muted"
                        disabled={actionLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Add permission */}
            {availablePerms.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedPermId} onValueChange={setSelectedPermId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choisir une permission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePerms.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.action}
                        {p.description && <span className="text-muted-foreground"> — {p.description}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!selectedPermId || actionLoading}>
                  Assigner
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignRole(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
