import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { CNSSRecord } from '@sirap/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface UploadParseResponse {
    fileName: string;
    records: CNSSRecord[];
    stats: {
        totalRecords: number;
    };
    storage: {
        objectName: string;
        url: string;
        version: number;
    };
}

export function UploadPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!file) {
            setError('Sélectionnez un fichier Excel avant de continuer.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { data } = await api.post<UploadParseResponse>('/api/upload/parse', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            sessionStorage.setItem('cnssData', JSON.stringify(data.records));
            sessionStorage.setItem('cnssFileName', data.fileName);
            sessionStorage.setItem('cnssUploadStorage', JSON.stringify(data.storage));

            setMessage(
                `Import réussi: ${data.stats.totalRecords} lignes valides. Version MinIO: v${String(data.storage.version).padStart(4, '0')}`,
            );

            navigate('/dashboard', { replace: true });
        } catch {
            setError('Échec de l’upload/parsing. Vérifiez le format du fichier (.xlsx, .xls, .csv).');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>Import Excel</CardTitle>
                    <CardDescription>
                        Chaque fichier uploadé est stocké dans MinIO avec versionnement, puis parsé.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="upload-file">Fichier Excel</Label>
                        <input
                            id="upload-file"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(event) => {
                                const selected = event.target.files?.[0] ?? null;
                                setFile(selected);
                                setError(null);
                                setMessage(null);
                            }}
                            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {message && <p className="text-sm text-emerald-600">{message}</p>}

                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Import en cours...' : 'Uploader et parser'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
