import { useMemo, useState } from 'react';
import type { CNSSRecord } from '@sirap/shared';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Database, DollarSign, Users, Copy,
    Building2, BarChart2, FileDown, RefreshCw, Loader2,
} from 'lucide-react';

interface DashboardStats {
    totalRecords: number;
    totalAmount: number;
    amountOnePerGroup: number;
    amountWithoutDuplicates: number;
    ecartOnePerGroup: number;
    ecartSansDoublons: number;
    assures: number;
    conjoints: number;
    duplicates: number;
    duplicateGroups: number;
    uniqueBanks: number;
}

interface DashboardCharts {
    bankDistribution: Array<{ name: string; value: number; amount: number }>;
    relationDistribution: Array<{ name: string; count: number; amount: number }>;
    topBanksDetails: Array<{ name: string; count: number; amount: number; average: number }>;
    periodDistribution: Array<{ name: string; count: number; amount: number }>;
    amountRanges: Array<{ label: string; count: number }>;
    natureDistribution: Array<{ name: string; count: number; amount: number }>;
    relationComparison: Array<{ name: string; count: number; amount: number; average: number }>;
}

function loadRecords(): CNSSRecord[] {
    try {
        return JSON.parse(sessionStorage.getItem('cnssData') || '[]') as CNSSRecord[];
    } catch {
        return [];
    }
}

function formatAmount(value: number) {
    return new Intl.NumberFormat('fr-FR').format(value);
}

function downloadBase64(fileName: string, mimeType: string, base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

export function DashboardPage() {
    const records = useMemo(() => loadRecords(), []);
    const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [charts, setCharts] = useState<DashboardCharts | null>(null);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        if (records.length === 0) return;

        setLoading(true);
        try {
            const [statsRes, chartsRes] = await Promise.all([
                api.post<DashboardStats>('/api/dashboard/stats', { records }),
                api.post<DashboardCharts>('/api/dashboard/charts', { records }),
            ]);
            setStats(statsRes.data);
            setCharts(chartsRes.data);
        } finally {
            setLoading(false);
        }
    };

    const exportPdf = async () => {
        if (records.length === 0) return;
        const { data } = await api.post<{ fileName: string; mimeType: string; base64: string }>('/api/dashboard/export/pdf', { records });
        downloadBase64(data.fileName, data.mimeType, data.base64);
    };

    const exportExcel = async () => {
        if (records.length === 0) return;
        const { data } = await api.post<{ fileName: string; mimeType: string; base64: string }>('/api/dashboard/export/excel', { records });
        downloadBase64(data.fileName, data.mimeType, data.base64);
    };

    type KpiItem = { label: string; value: string | number; icon: React.ElementType; color: string };

    const kpis: KpiItem[] = stats ? [
        { label: 'Total enregistrements',       value: stats.totalRecords,                                   icon: Database,   color: 'bg-blue-500/10 text-blue-500' },
        { label: 'Montant total',               value: `${formatAmount(stats.totalAmount)} DJF`,              icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-500' },
        { label: 'Montant 1/groupe',            value: `${formatAmount(stats.amountOnePerGroup)} DJF`,        icon: DollarSign, color: 'bg-violet-500/10 text-violet-500' },
        { label: 'Montant sans doublons',       value: `${formatAmount(stats.amountWithoutDuplicates)} DJF`,  icon: DollarSign, color: 'bg-cyan-500/10 text-cyan-500' },
        { label: 'Écart vs 1/groupe',           value: `${formatAmount(stats.ecartOnePerGroup)} DJF`,         icon: BarChart2,  color: 'bg-orange-500/10 text-orange-500' },
        { label: 'Écart vs sans doublons',      value: `${formatAmount(stats.ecartSansDoublons)} DJF`,        icon: BarChart2,  color: 'bg-rose-500/10 text-rose-500' },
        { label: 'Assurés',                     value: stats.assures,                                        icon: Users,      color: 'bg-sky-500/10 text-sky-500' },
        { label: 'Conjoints',                   value: stats.conjoints,                                      icon: Users,      color: 'bg-indigo-500/10 text-indigo-500' },
        { label: 'Doublons (occurrences)',       value: stats.duplicates,                                     icon: Copy,       color: 'bg-amber-500/10 text-amber-500' },
        { label: 'Groupes de doublons',         value: stats.duplicateGroups,                                icon: Copy,       color: 'bg-yellow-500/10 text-yellow-500' },
        { label: 'Banques uniques',             value: stats.uniqueBanks,                                    icon: Building2,  color: 'bg-teal-500/10 text-teal-500' },
    ] : [];

    const ChartComponent = chartMode === 'bar' ? BarChart : LineChart;
    const hasData = records.length > 0;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">Tableau de bord analytique</h1>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                        11 indicateurs · 7 graphiques · règles de calcul CNSS
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-[13px]"
                        onClick={() => setChartMode(m => m === 'bar' ? 'line' : 'bar')}>
                        <BarChart2 className="h-3.5 w-3.5" />
                        Mode {chartMode === 'bar' ? 'ligne' : 'barres'}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-[13px]"
                        onClick={exportPdf} disabled={!hasData}>
                        <FileDown className="h-3.5 w-3.5" />PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-[13px]"
                        onClick={exportExcel} disabled={!hasData}>
                        <FileDown className="h-3.5 w-3.5" />Excel
                    </Button>
                    <Button size="sm" className="gap-1.5 text-[13px]"
                        onClick={refresh} disabled={loading || !hasData}>
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* ── Empty state ── */}
            {!hasData && (
                <Card className="border-dashed shadow-none">
                    <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                            <Database className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Aucune donnée disponible</p>
                            <p className="mt-0.5 text-[13px] text-muted-foreground">
                                Importez un fichier Excel depuis la page Import.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── KPI grid ── */}
            {kpis.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {kpis.map(item => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label} className="shadow-card hover:shadow-card-md transition-shadow duration-200">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-medium text-muted-foreground">{item.label}</p>
                                            <p className="mt-1.5 truncate text-xl font-bold">{item.value}</p>
                                        </div>
                                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', item.color)}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Charts ── */}
            {charts && (
                <div className="grid gap-4 xl:grid-cols-2">
                    {[
                        { title: 'Répartition par banque', chart: (
                            <PieChart>
                                <Pie data={charts.bankDistribution} dataKey="value" nameKey="name" outerRadius={100} fill="#3b82f6" />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                            </PieChart>
                        )},
                        { title: 'Assurés vs Conjoints', chart: (
                            <PieChart>
                                <Pie data={charts.relationDistribution} dataKey="count" nameKey="name" outerRadius={100} fill="#10b981" />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                            </PieChart>
                        )},
                        { title: 'Top banques — détails', chart: (
                            <ChartComponent data={charts.topBanksDetails}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                {chartMode === 'bar' ? <Bar dataKey="count" fill="#3b82f6" radius={[3,3,0,0] as [number,number,number,number]} /> : <Line dataKey="count" stroke="#3b82f6" dot={false} />}
                                {chartMode === 'bar' ? <Bar dataKey="amount" fill="#10b981" radius={[3,3,0,0] as [number,number,number,number]} /> : <Line dataKey="amount" stroke="#10b981" dot={false} />}
                            </ChartComponent>
                        )},
                        { title: 'Distribution par période', chart: (
                            <ChartComponent data={charts.periodDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                {chartMode === 'bar' ? <Bar dataKey="count" fill="#6366f1" radius={[3,3,0,0] as [number,number,number,number]} /> : <Line dataKey="count" stroke="#6366f1" dot={false} />}
                            </ChartComponent>
                        )},
                        { title: 'Distribution des montants', chart: (
                            <ChartComponent data={charts.amountRanges}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                {chartMode === 'bar' ? <Bar dataKey="count" fill="#f59e0b" radius={[3,3,0,0] as [number,number,number,number]} /> : <Line dataKey="count" stroke="#f59e0b" dot={false} />}
                            </ChartComponent>
                        )},
                        { title: 'Répartition par nature', chart: (
                            <ChartComponent data={charts.natureDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                {chartMode === 'bar' ? <Bar dataKey="count" fill="#ef4444" radius={[3,3,0,0] as [number,number,number,number]} /> : <Line dataKey="count" stroke="#ef4444" dot={false} />}
                            </ChartComponent>
                        )},
                    ].map(({ title, chart }) => (
                        <Card key={title} className="shadow-card">
                            <CardHeader className="px-5 py-4">
                                <CardTitle className="text-[13px] font-semibold">{title}</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 px-2 pb-4">
                                <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
                            </CardContent>
                        </Card>
                    ))}

                    <Card className="shadow-card xl:col-span-2">
                        <CardHeader className="px-5 py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-[13px] font-semibold">Comparaison Assurés vs Conjoints</CardTitle>
                                <Badge variant="outline" className="text-[11px]">Vue complète</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="h-72 px-2 pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ChartComponent data={charts.relationComparison}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ fontSize: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {chartMode === 'bar' ? <Bar dataKey="count" fill="#3b82f6" radius={[3,3,0,0] as [number,number,number,number]} /> : <Line dataKey="count" stroke="#3b82f6" dot={false} />}
                                    {chartMode === 'bar' ? <Bar dataKey="amount" fill="#22c55e" radius={[3,3,0,0] as [number,number,number,number]} /> : <Line dataKey="amount" stroke="#22c55e" dot={false} />}
                                    {chartMode === 'bar' ? <Bar dataKey="average" fill="#a855f7" radius={[3,3,0,0] as [number,number,number,number]} /> : <Line dataKey="average" stroke="#a855f7" dot={false} />}
                                </ChartComponent>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
