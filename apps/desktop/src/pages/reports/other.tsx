"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Card, CardContent } from "@lekhaly/ui";
import {
    FileText,
    BookOpen,
    Percent,
    List,
    ScrollText,
    BarChart,
    Package,
    ArrowDownRight,
    ArrowUpRight,
    RefreshCcw,
    ChevronRight,
    Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@lekhaly/ui";
import { getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";

const reports = [
    {
        group: "Compliance & Financials",
        items: [
            { label: "Cash Flow Statement", href: "/reports/cash-flow", icon: FileText, description: "Track inflows and outflows of cash." },
            { label: "VAT Reports", href: "/reports/vat", icon: Percent, description: "Value Added Tax detail and summaries." },
            { label: "Tax Summary", href: "/reports/tax-summary", icon: Percent, description: "Consolidated tax information." },
        ]
    },
    {
        group: "Registers",
        items: [
            { label: "Sales Register", href: "/reports/sales-register", icon: FileText, description: "Detailed list of all sales transactions." },
            { label: "Purchase Register", href: "/reports/purchase-register", icon: FileText, description: "Detailed list of all purchase records." },
            { label: "Sales Return Register", href: "/reports/sales-return-register", icon: RefreshCcw, description: "Track items returned by customers." },
            { label: "Purchase Return Register", href: "/reports/purchase-return-register", icon: RefreshCcw, description: "Track items returned to suppliers." },
        ]
    },
    {
        group: "Daily & Operations",
        items: [
            { label: "Day Book", href: "/reports/day-book", icon: BookOpen, description: "View daily transaction entries chronologically." },
            { label: "Expenses Details", href: "/reports/expenses-details", icon: List, description: "Breakdown of all operational expenses." },
            { label: "Stock Ledger", href: "/reports/stock-ledger", icon: Package, description: "Item-wise stock movement and balances." },
            { label: "Stock Aging Report", href: "/reports/stock-aging", icon: Package, description: "Aged stock quantity and value in Nepal reporting buckets." },
        ]
    },
    {
        group: "Analysis & Summaries",
        items: [
            { label: "Party Aging", href: "/reports/party-aging", icon: ScrollText, description: "Receivables and payables divided by age." },
            { label: "Receivable Summary", href: "/reports/receivable-summary", icon: ArrowDownRight, description: "Overview of amounts owed to you." },
            { label: "Payable Summary", href: "/reports/payable-summary", icon: ArrowUpRight, description: "Overview of amounts you owe to others." },
            { label: "Business Performance Ratios", href: "/reports/ratios", icon: BarChart, description: "Key financial health indicators and ratios." },
        ]
    }
];

export default function OtherReportsPage() {
    const [search, setSearch] = React.useState("");
    const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
    const features = inventoryFeatures(inventorySettings);

    React.useEffect(() => {
        getInventorySettings().then(setInventorySettings).catch(() => setInventorySettings(null));
    }, []);

    const filteredReports = reports.map(group => ({
        ...group,
        items: group.items.filter(item =>
            (item.href !== "/reports/stock-ledger" || features.inventory) &&
            (item.href !== "/reports/stock-aging" || features.inventory) &&
            (item.label.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase()))
        )
    })).filter(group => group.items.length > 0);

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <PageHeader
                    title="Other Reports"
                    description="Access secondary registers, tax summaries, and detailed financial analysis."
                />
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search for a report..."
                        className="pl-10 rounded-xl bg-background border-border/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-12">
                {filteredReports.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                {section.group}
                            </h3>
                            <div className="h-px flex-1 bg-border/40" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {section.items.map((item, itemIdx) => (
                                <Link key={itemIdx} to={item.href}>
                                    <Card className="group relative overflow-hidden border-border/40 bg-card/50 transition-all hover:bg-primary/[0.03] hover:border-primary/30 h-full cursor-pointer shadow-sm hover:shadow-lg hover:shadow-primary/5">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col h-full gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                                        <item.icon className="h-5 w-5" />
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">
                                                        {item.label}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredReports.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold">No reports found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
                    </div>
                )}
            </div>
        </div>
    );
}


