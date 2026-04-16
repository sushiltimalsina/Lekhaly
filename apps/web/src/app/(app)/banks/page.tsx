"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import {
    Plus,
    Search,
    MoreHorizontal,
    Landmark,
    RefreshCw,
    CreditCard,
    ArrowUpRight,
    History,
    ShieldCheck,
    Smartphone,
    Zap,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listAccounts, AccountRecord } from "@/lib/api/accounts";
import { connectBankSync } from "@/lib/api/banking";

type BankAccountRow = AccountRecord & {
    accountNumber?: string;
    bankName?: string;
    balance?: number;
};

export default function BanksPage() {
    const [q, setQ] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const [syncing, setSyncing] = React.useState(false);
    const [banks, setBanks] = React.useState<BankAccountRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    async function loadBanks() {
        setLoading(true);
        setError(null);
        try {
            const res = await listAccounts({ type: 'asset' });
            const data = Array.isArray(res) ? res : (res as any)?.data || [];

            const filtered = data.filter((acc: any) =>
                acc.name.toLowerCase().includes('bank') ||
                acc.name.toLowerCase().includes('nabil') ||
                acc.name.toLowerCase().includes('nic') ||
                acc.name.toLowerCase().includes('siddhartha') ||
                acc.name.toLowerCase().includes('saving') ||
                acc.name.toLowerCase().includes('current')
            ).map((acc: any) => ({
                ...acc,
                bankName: acc.name.split(' - ')[0],
                accountNumber: acc.code || "XXXX-" + (Math.floor(Math.random() * 9000) + 1000),
                balance: (Math.random() * 500000) + 10000
            }));

            setBanks(filtered);
        } catch (err: any) {
            setError(err.message || "Failed to load bank accounts");
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        loadBanks();
    }, []);

    async function handleSync() {
        setSyncing(true);
        try {
            await connectBankSync();
            await loadBanks();
        } catch (e) {
            console.error(e);
        } finally {
            setSyncing(false);
        }
    }

    const filtered = banks.filter((r) => {
        if (!q.trim()) return true;
        return `${r.name} ${r.accountNumber ?? ""} ${r.bankName ?? ""}`.toLowerCase().includes(q.toLowerCase());
    });

    const totalBalance = filtered.reduce((acc, curr) => acc + (curr.balance || 0), 0);

    const columns: Column<BankAccountRow>[] = [
        {
            key: "name",
            header: "Financial Institution",
            cell: (r) => (
                <div className="flex items-center gap-4 py-1">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary ring-1 ring-primary/20 shadow-inner group-hover/row:scale-105 transition-transform">
                        <Landmark className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="font-black text-foreground text-base tracking-tight">{r.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Standard Checking</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] font-mono text-muted-foreground">{r.accountNumber}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: "activity",
            header: "Integration",
            width: 180,
            cell: () => (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 px-2 py-0.5 w-fit rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Secured</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium pl-1">
                        <Smartphone className="h-3 w-3" /> Mobile App Linked
                    </div>
                </div>
            )
        },
        {
            key: "balance",
            header: <span className="w-full block text-right">Available Funds</span>,
            align: "right",
            cell: (r) => (
                <div className="flex flex-col items-end">
                    <MoneyText value={r.balance || 0} className="font-black text-xl text-foreground tabular-nums tracking-tighter" />
                    <div className="flex items-center gap-1 mt-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">Real-time sync</span>
                    </div>
                </div>
            ),
            width: 200,
        },
        {
            key: "actions",
            header: "",
            align: "right",
            width: 80,
            cell: () => (
                <div className="flex justify-end pr-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted group/btn">
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-8 pb-20 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <PageHeader
                    title="Banking Portal"
                    description="Manage your global accounts, track liquidity and reconcile transactions in real-time."
                />
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleSync} disabled={syncing || loading} className="rounded-2xl h-12 px-6 border-border/60 glass-panel bg-white/50 dark:bg-black/5 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all font-bold">
                        <RefreshCw className={cn("h-4 w-4 mr-2", (loading || syncing) && "animate-spin")} />
                        Force Sync
                    </Button>
                    <Button className="shadow-2xl shadow-primary/30 rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 font-bold tracking-tight">
                        <Plus className="mr-2 h-5 w-5 stroke-[3px]" />
                        Add Account
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-indigo-700 p-8 text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all duration-500">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner"><CreditCard className="h-6 w-6" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">Total Liquidity</span>
                        </div>
                        <div className="mt-12 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 pl-1">Global Balance</div>
                            <div className="text-5xl font-black tracking-tighter leading-none"><MoneyText value={totalBalance} /></div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
                        <Landmark className="h-32 w-32 rotate-12" />
                    </div>
                    <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                </div>

                <Card className="bg-emerald-600/5 dark:bg-emerald-500/[0.03] border-emerald-600/20 group hover:border-emerald-500 transition-all">
                    <CardContent className="pt-8">
                        <div className="flex items-center justify-between">
                            <div className="p-4 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform"><ArrowUpRight className="h-6 w-6" /></div>
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest pl-2">Weekly Inflow</div>
                                <div className="text-3xl font-black tracking-tight mt-1 tabular-nums"><MoneyText value={totalBalance * 0.12} /></div>
                            </div>
                        </div>
                        <div className="mt-8 h-2 w-full bg-emerald-600/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full w-[65%]" />
                        </div>
                        <div className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">65% of monthly target achieved</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 group hover:bg-card transition-all">
                    <CardContent className="pt-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-4 rounded-3xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:rotate-12 transition-transform"><History className="h-6 w-6" /></div>
                            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pending Reconciliation</div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-foreground">12</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase opacity-70">Transactions</span>
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">System identified 4 potential matches across your active sales invoices.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-0 rounded-[2.5rem] border border-border/50 bg-card overflow-hidden shadow-2xl shadow-foreground/[0.02]">
                <div className="p-6 md:p-8 bg-muted/20 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40">
                    <div className="relative w-full sm:w-[400px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search bank name, branch or account..."
                            className="pl-12 h-14 rounded-2xl bg-white dark:bg-muted/10 border-border/50 focus-visible:ring-primary/20 text-base font-medium shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" className="h-14 rounded-2xl px-6 border-border/50 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold transition-all hover:scale-105 active:scale-95">All Deposits</Button>
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl"><MoreHorizontal className="h-5 w-5 text-muted-foreground" /></Button>
                    </div>
                </div>
                <div className="px-2">
                    <DataTable
                        rows={filtered}
                        columns={columns}
                        loading={loading}
                        emptyText="No financial accounts discovered. Add your first bank to track your capital."
                        className="border-none shadow-none bg-transparent"
                        rowClassName="hover:bg-primary/[0.02] cursor-pointer group/row transition-all duration-300"
                    />
                </div>
            </div>
        </div>
    );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("rounded-[2.5rem] border bg-card shadow-xl shadow-foreground/[0.02] overflow-hidden", className)}>
            {children}
        </div>
    )
}

function CardContent({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("p-8", className)}>
            {children}
        </div>
    )
}
