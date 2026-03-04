import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Shield, X, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  /* ── Level badge ── */
  function LevelBadge({ level }: { level: number }) {
    const cls =
      level >= 100 ? 'bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400' :
      level >= 50  ? 'bg-amber-500/10  text-amber-600  ring-amber-500/20  dark:text-amber-400'  :
                     'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400';
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1', cls)}>
        {level}
      </span>
    );
  }

  /* ─── Render ─── */
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Gestion des rôles</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {roles.length} rôle{roles.length !== 1 ? 's' : ''} · configuration des accès et permissions
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nouveau rôle
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Rôle</TableHead>
              <TableHead className="h-10 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Description</TableHead>
              <TableHead className="h-10 w-20 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Niveau</TableHead>
              <TableHead className="h-10 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Permissions</TableHead>
              <TableHead className="h-10 w-24 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
              <TableHead className="h-10 w-28 text-right text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-[13px] text-muted-foreground">Aucun rôle trouvé</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {roles.map(role => (
              <TableRow key={role.id} className="group">
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{role.name}</p>
                      {role._count?.users !== undefined && (
                        <p className="text-[11px] text-muted-foreground">{role._count.users} utilisateur{role._count.users !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-[13px] text-muted-foreground max-w-[200px] truncate">
                  {role.description ?? <span className="text-muted-foreground/40">—</span>}
                </TableCell>
                <TableCell className="py-3">
                  <LevelBadge level={role.level} />
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {(role.permissions ?? []).slice(0, 3).map(rp => (
                      <span key={rp.permission.id}
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground">
                        {rp.permission.action}
                      </span>
                    ))}
                    {(role.permissions?.length ?? 0) > 3 && (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                        +{(role.permissions?.length ?? 0) - 3}
                      </span>
                    )}
                    {(role.permissions?.length ?? 0) === 0 && (
                      <span className="text-[11px] text-muted-foreground/50">Aucune</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  {role.isSystem
                    ? <Badge className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 border-0 dark:text-blue-400">Système</Badge>
                    : <span className="text-[11px] text-muted-foreground/40">—</span>
                  }
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => setAssignRole(role)} title="Gérer les permissions">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    {!role.isSystem && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => openEdit(role)} title="Modifier">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteRole(role)} title="Supprimer">
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* ── Shared form fields helper ── */}
      {(['create', 'edit'] as const).map(mode => {
        const isCreate = mode === 'create';
        const form = isCreate ? createForm : editForm;
        const open = isCreate ? createOpen : !!editRole;
        const onClose = isCreate ? () => setCreateOpen(false) : () => setEditRole(null);
        const onSubmit = isCreate ? handleCreate : handleEdit;
        return (
          <Dialog key={mode} open={open} onOpenChange={o => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">{isCreate ? 'Créer un rôle' : 'Modifier le rôle'}</DialogTitle>
                <DialogDescription className="text-[13px]">
                  {isCreate ? "Définissez le nom, la description et le niveau d'accès." : "Modifiez les informations du rôle."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor={`${mode}-name`} className="text-[13px]">Nom du rôle</Label>
                  <Input id={`${mode}-name`} placeholder="ex : MANAGER" {...form.register('name')} />
                  {form.formState.errors.name && (
                    <p className="text-[12px] text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${mode}-desc`} className="text-[13px]">Description <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
                  <Input id={`${mode}-desc`} placeholder="Courte description du rôle" {...form.register('description')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${mode}-level`} className="text-[13px]">Niveau d'accès <span className="text-muted-foreground font-normal">(1–100)</span></Label>
                  <Input id={`${mode}-level`} type="number" min={1} max={100} {...form.register('level')} />
                  <p className="text-[11px] text-muted-foreground">100 = propriétaire · 50 = admin · 10 = agent</p>
                  {form.formState.errors.level && (
                    <p className="text-[12px] text-destructive">{form.formState.errors.level.message}</p>
                  )}
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>Annuler</Button>
                  <Button type="submit" size="sm" disabled={actionLoading} className="gap-1.5">
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isCreate ? 'Créer le rôle' : 'Enregistrer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        );
      })}

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteRole} onOpenChange={o => { if (!o) setDeleteRole(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Supprimer le rôle</DialogTitle>
            <DialogDescription className="text-[13px]">
              Le rôle <strong className="text-foreground">«{deleteRole?.name}»</strong> sera définitivement supprimé.
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteRole(null)}>Annuler</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={actionLoading} className="gap-1.5">
              {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Permissions ── */}
      <Dialog open={!!assignRole} onOpenChange={o => { if (!o) setAssignRole(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base">{assignRole?.name}</DialogTitle>
                <DialogDescription className="text-[12px]">Gérer les permissions de ce rôle</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Assigned */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Permissions assignées ({(assignRole?.permissions ?? []).length})
              </p>
              {(assignRole?.permissions ?? []).length === 0 ? (
                <p className="text-[13px] text-muted-foreground">Aucune permission assignée</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(assignRole?.permissions ?? []).map(rp => (
                    <span key={rp.permission.id}
                      className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-[12px] font-medium border border-border shadow-sm">
                      {rp.permission.action}
                      <button
                        onClick={() => handleRemovePermission(rp.permission.id)}
                        disabled={actionLoading}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-40"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add */}
            {availablePerms.length > 0 && (
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Ajouter une permission
                </p>
                <div className="flex gap-2">
                  <Select value={selectedPermId} onValueChange={setSelectedPermId}>
                    <SelectTrigger className="flex-1 text-[13px]">
                      <SelectValue placeholder="Choisir une permission…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePerms.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-[13px]">
                          <span className="font-medium">{p.action}</span>
                          {p.description && <span className="ml-1.5 text-muted-foreground">— {p.description}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAssign} disabled={!selectedPermId || actionLoading} className="gap-1.5">
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Assigner
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAssignRole(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
