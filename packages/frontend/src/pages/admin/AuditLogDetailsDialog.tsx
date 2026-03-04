import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { AuditEvent } from '@/types/api';

type AuditLogDetailsDialogProps = {
    event: AuditEvent | null;
    onOpenChange: (open: boolean) => void;
};

export function AuditLogDetailsDialog({ event, onOpenChange }: AuditLogDetailsDialogProps) {
    return (
        <Dialog open={!!event} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Détails du log</DialogTitle>
                    <DialogDescription>
                        {event ? new Date(event.timestamp).toLocaleString() : ''}
                    </DialogDescription>
                </DialogHeader>

                {event && (
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{event.method}</Badge>
                            <Badge variant="outline">{event.statusCode}</Badge>
                            {event.success ? (
                                <Badge variant="secondary">OK</Badge>
                            ) : (
                                <Badge variant="destructive">KO</Badge>
                            )}
                        </div>
                        <div><strong>Path:</strong> {event.path}</div>
                        <div><strong>Durée:</strong> {event.durationMs} ms</div>
                        <div><strong>User ID:</strong> {event.userId ?? 'anonyme'}</div>
                        <div><strong>Rôle:</strong> {event.roleName ?? '—'}</div>
                        <div><strong>IP:</strong> {event.ip ?? '—'}</div>
                        <div><strong>User-Agent:</strong> {event.userAgent ?? '—'}</div>
                        <div><strong>Erreur:</strong> {event.error ?? '—'}</div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
