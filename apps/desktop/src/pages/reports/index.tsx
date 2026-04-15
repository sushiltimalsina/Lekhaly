// apps/desktop/src/pages/reports/index.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    Clock, 
    BookOpen, 
    Download, 
    ArrowRight, 
    FileSpreadsheet, 
    FileText, 
    History,
    Search,
    ChevronRight,
    TrendingDown,
    Calendar,
    ShoppingCart,
    Truck,
    LayoutGrid
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const reportCategories = [
    {
        name: "Core Financials",
        reports: [
            { id: 'tb', title: "Trial Balance", desc: "Verify audit integrity across all ledger accounts.", href: "/reports/trial-balance", icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
            { id: 'pl', title: "Profit & Loss", desc: "Detailed income and expense reconciliation.", href: "/reports/pl", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { id: 'bs', title: "Balance Sheet", desc: "Snapshot of assets, liabilities, and equity.", href: "/reports/balance-sheet", icon: PieChart, color: "text-indigo-600", bg: "bg-indigo-50" },
        ]
    },
    {
        name: "Registers & Books",
        reports: [
            { id: 'db', title: "Day Book", desc: "Chronological registry of every daily transaction.", href: "/reports/day-book", icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
            { id: 'sales', title: "Sales Register", desc: "Consolidated audit of all sales invoices.", href: "/reports/sales-register", icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
            { id: 'purchase', title: "Purchase Register", desc: "Consolidated audit of all procurement bills.", href: "/reports/purchase-register", icon: Truck, color: "text-rose-600", bg: "bg-rose-50" },
        ]
    },
    {
        name: "Inventory & Logistics",
        reports: [
            { id: 'stock', title: "Stock Summary", desc: "Real-time inventory valuation and movement audit.", href: "/reports/stock-summary", icon: LayoutGrid, color: "text-amber-600", bg: "bg-amber-50" },
            { id: 'ledger', title: "General Ledger", desc: "Complete transaction history with running balances.", href: "/reports/ledger", icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
            { id: 'aging', title: "Party Aging", desc: "Outstanding reconciliation across time buckets.", href: "/reports/party-aging", icon: Clock, color: "text-slate-600", bg: "bg-slate-50" },
        ]
    }
];

export default function ReportsDashboardPage() {
    const navigate = useNavigate();
    const [query, setQuery] = React.useState("");

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageHeader 
                    title="Intelligence Center" 
                    description="Advanced financial analytics and regulatory audit registries."
                />
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search for a specific report..." 
                        className="pl-11 h-12 rounded-[20px] border-slate-100 bg-white font-bold text-xs shadow-sm"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-12">
                {reportCategories.map((cat, idx) => {
                    const filtered = cat.reports.filter(r => 
                        r.title.toLowerCase().includes(query.toLowerCase()) || 
                        r.desc.toLowerCase().includes(query.toLowerCase())
                    );
                    
                    if (filtered.length === 0) return null;

                    return (
                        <div key={idx} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">{cat.name}</span>
                                <div className="h-px bg-slate-100 flex-1" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filtered.map((report) => (
                                    <div 
                                        key={report.id}
                                        onClick={() => navigate(report.href)}
                                        className="group p-8 rounded-[36px] bg-white border-2 border-slate-50 hover:border-indigo-100 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer relative overflow-hidden"
                                    >
                                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3", report.bg, report.color)}>
                                            <report.icon className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tighter italic">{report.title}</h3>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{report.desc}</p>
                                        
                                        <div className="mt-8 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 italic">Launch Analysis</span>
                                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:rotate-12 transition-transform duration-700">
                                             <report.icon className="h-24 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-10 rounded-[42px] bg-slate-900 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                    <Download className="h-48 w-48 text-white" />
                </div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Bulk Data Orchestration</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Institutional Audit Export</h2>
                        <p className="max-w-xl text-xs text-slate-400 font-medium italic leading-relaxed">
                            Generate high-volume ledger exports and encrypted trial balance snapshots for institutional compliance and external regulatory audits.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 shrink-0">
                        <Button className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.05] active:scale-95 transition-all italic border-none">
                            <FileSpreadsheet className="mr-3 h-5 w-5" /> Export Ledger (EXCEL)
                        </Button>
                        <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-700 bg-transparent text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all italic">
                            <FileText className="mr-3 h-5 w-5" /> Trial Balance (PDF)
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
