import { useMemo, useState } from 'react';
import type { CNSSRecord } from '@sirap/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function formatAmount(value: number) {
    return new Intl.NumberFormat('fr-FR').format(value);
}

function loadRecords(): CNSSRecord[] {
    try {
        return JSON.parse(sessionStorage.getItem('cnssData') || '[]') as CNSSRecord[];
    } catch {
        return [];
    }
}

export function AnalysisPage() {
    const [query, setQuery] = useState('');
    const [relation, setRelation] = useState('all');
    const [bank, setBank] = useState('all');
    const [duplicatesOnly, setDuplicatesOnly] = useState(false);
    const [limit, setLimit] = useState(20);
    const [page, setPage] = useState(1);

    const records = useMemo(() => loadRecords(), []);

    const banks = useMemo(
        () => [...new Set(records.map((record) => record.banque).filter(Boolean))].sort(),
        [records],
    );

    const filtered = useMemo(() => {
        return records.filter((record) => {
            if (duplicatesOnly && !record.isDuplicate) return false;

            if (relation !== 'all') {
                const relationNorm = (record.typeRelation || '').toLowerCase();
                if (!relationNorm.includes(relation.toLowerCase())) return false;
            }

            if (bank !== 'all' && record.banque !== bank) return false;

            if (query.trim()) {
                const q = query.toLowerCase();
                const haystack = [record.brenet, record.nomsEtPrenoms, record.rib, record.codePeriode, record.nature]
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            return true;
        });
    }, [records, duplicatesOnly, relation, bank, query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * limit, safePage * limit);

    const stats = useMemo(() => {
        const totalAmount = filtered.reduce((sum, record) => sum + (record.netAPayer || 0), 0);
        const duplicates = filtered.filter((record) => record.isDuplicate).length;
        const groups = new Set(filtered.filter((record) => record.isDuplicate && record.duplicateGroup).map((record) => record.duplicateGroup)).size;
        const assures = filtered.filter((record) => (record.typeRelation || '').toLowerCase().includes('assur')).length;
        const conjoints = filtered.filter((record) => (record.typeRelation || '').toLowerCase().includes('conjoint')).length;

        return {
            count: filtered.length,
            totalAmount,
            duplicates,
            groups,
            assures,
            conjoints,
            uniqueBanks: new Set(filtered.map((record) => (record.banque || '').toLowerCase()).filter(Boolean)).size,
        };
    }, [filtered]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analyse</h1>
                <p className="text-muted-foreground">Filtres avancés et pagination des enregistrements.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Enregistrements</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.count}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Montant total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatAmount(stats.totalAmount)} DJF</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Doublons</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.duplicates}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Groupes</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.groups}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Assurés</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.assures}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conjoints</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.conjoints}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Banques uniques</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.uniqueBanks}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pagination</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{safePage}/{totalPages}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Lignes/page</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{limit}</CardContent></Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Filtres</CardTitle></CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <Input placeholder="Recherche texte" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
                    <Select value={relation} onValueChange={(value) => { setRelation(value); setPage(1); }}>
                        <SelectTrigger><SelectValue placeholder="Type relation" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="assur">Assurés</SelectItem>
                            <SelectItem value="conjoint">Conjoints</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={bank} onValueChange={(value) => { setBank(value); setPage(1); }}>
                        <SelectTrigger><SelectValue placeholder="Banque" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {banks.map((item) => (
                                <SelectItem key={item} value={item}>{item}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={String(duplicatesOnly)} onValueChange={(value) => { setDuplicatesOnly(value === 'true'); setPage(1); }}>
                        <SelectTrigger><SelectValue placeholder="Doublons" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="false">Tous</SelectItem>
                            <SelectItem value="true">Doublons uniquement</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}>
                        <SelectTrigger><SelectValue placeholder="Lignes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N°</TableHead>
                                <TableHead>Brevet</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Période</TableHead>
                                <TableHead>Relation</TableHead>
                                <TableHead>Banque</TableHead>
                                <TableHead>RIB</TableHead>
                                <TableHead>Doublon</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paged.map((record) => (
                                <TableRow key={record.no}>
                                    <TableCell>{record.no}</TableCell>
                                    <TableCell>{record.brenet}</TableCell>
                                    <TableCell>{record.nomsEtPrenoms}</TableCell>
                                    <TableCell>{formatAmount(record.netAPayer || 0)} DJF</TableCell>
                                    <TableCell>{record.codePeriode}</TableCell>
                                    <TableCell>{record.typeRelation}</TableCell>
                                    <TableCell>{record.banque}</TableCell>
                                    <TableCell>{record.rib}</TableCell>
                                    <TableCell>{record.isDuplicate ? `Oui (G${record.duplicateGroup ?? '-'})` : 'Non'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {filtered.length === 0 ? 0 : (safePage - 1) * limit + 1} - {Math.min(safePage * limit, filtered.length)} sur {filtered.length}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage <= 1}>Précédent</Button>
                            <Button variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage >= totalPages}>Suivant</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
