import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import type { AuditEvent, PaginatedResponse } from '@/types/api';
import { toast } from '@/hooks/useToast';
import { AuditLogDetailsDialog } from './AuditLogDetailsDialog';

export function AuditPage() {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isArchiving, setIsArchiving] = useState(false);
    const [pathFilter, setPathFilter] = useState('');
    const [archiveDays, setArchiveDays] = useState(90);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    async function loadData(nextPage = page, path = pathFilter, nextLimit = limit) {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(nextPage),
                limit: String(nextLimit),
            });
            if (path.trim()) params.set('path', path.trim());

            const { data } = await api.get<PaginatedResponse<AuditEvent>>(`/api/audit?${params.toString()}`);
            setEvents(data.data ?? []);
            setTotal(data.total ?? 0);
            setPage(data.page ?? nextPage);
            setLimit(data.limit ?? nextLimit);
        } catch {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les audits.' });
        } finally {
            setLoading(false);
        }
    }

    async function archiveLogs() {
        setIsArchiving(true);
        try {
            const { data } = await api.post<{ archived: number; archiveUrl: string | null }>(
                '/api/audit/archive',
                { days: archiveDays },
            );

            toast({
                title: 'Archivage terminé',
                description: `${data.archived} log(s) archivés${data.archiveUrl ? ' vers MinIO' : ''}.`,
            });
            await loadData(1, pathFilter, limit);
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Archivage impossible (vérifiez la permission audit:manage).',
            });
        } finally {
            setIsArchiving(false);
        }
    }

    useEffect(() => {
        void loadData(1, '', 20);
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Audit sécurité</h1>
                    <p className="text-muted-foreground">
                        {total} événement(s) — page {page}/{totalPages}
                    </p>
                </div>

                <div className="flex items-end gap-2">
                    <div className="space-y-2">
                        <Label htmlFor="audit-path">Filtre chemin</Label>
                        <Input
                            id="audit-path"
                            placeholder="/api/users"
                            value={pathFilter}
                            onChange={(e) => setPathFilter(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="audit-limit">Lignes</Label>
                        <Input
                            id="audit-limit"
                            type="number"
                            min={1}
                            max={200}
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value) || 20)}
                            className="w-20"
                        />
                    </div>
                    <Button onClick={() => void loadData(1, pathFilter, limit)}>Filtrer</Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setPathFilter('');
                            void loadData(1, '', limit);
                        }}
                    >
                        Rafraîchir
                    </Button>
                </div>
            </div>

            <div className="flex items-end gap-2 rounded-md border p-3">
                <div className="space-y-2">
                    <Label htmlFor="archive-days">Archiver les logs {'>'} (jours)</Label>
                    <Input
                        id="archive-days"
                        type="number"
                        min={1}
                        max={3650}
                        value={archiveDays}
                        onChange={(e) => setArchiveDays(Number(e.target.value) || 90)}
                        className="w-28"
                    />
                </div>
                <Button onClick={() => void archiveLogs()} disabled={isArchiving}>
                    {isArchiving ? 'Archivage...' : 'Archiver vers MinIO'}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Requête</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Durée</TableHead>
                            <TableHead>Résultat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    Aucun événement audit.
                                </TableCell>
                            </TableRow>
                        )}
                        {events.map((event, index) => (
                            <TableRow
                                key={`${event.timestamp}-${index}`}
                                className="cursor-pointer"
                                onClick={() => setSelectedEvent(event)}
                            >
                                <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                                <TableCell className="font-mono text-xs">{event.method} {event.path}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{event.statusCode}</Badge>
                                </TableCell>
                                <TableCell>{event.userId ?? 'anonyme'}</TableCell>
                                <TableCell>{event.durationMs} ms</TableCell>
                                <TableCell>
                                    {event.success ? (
                                        <Badge variant="secondary">OK</Badge>
                                    ) : (
                                        <Badge variant="destructive">KO</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => void loadData(Math.max(1, page - 1), pathFilter, limit)}
                    disabled={page <= 1 || loading}
                >
                    Précédent
                </Button>
                <Button
                    variant="outline"
                    onClick={() => void loadData(Math.min(totalPages, page + 1), pathFilter, limit)}
                    disabled={page >= totalPages || loading}
                >
                    Suivant
                </Button>
            </div>

            <AuditLogDetailsDialog
                event={selectedEvent}
                onOpenChange={(open) => {
                    if (!open) setSelectedEvent(null);
                }}
            />
        </div>
    );
}
