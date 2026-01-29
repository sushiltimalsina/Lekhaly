"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { getProfitLoss, getBalanceSheet } from "@/lib/api/reports";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, Scale, Zap, DollarSign, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { MoneyText } from "@/components/app/money";
import { Skeleton } from "@/components/ui/skeleton";

export default function RatiosPage() {
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<any>(null);

    async function run() {
        setLoading(true);
        try {
            const [pl, bs] = await Promise.all([
                getProfitLoss({}),
                getBalanceSheet({})
            ]);

            const sales = pl?.totalRevenue ?? 0;
            const cogs = pl?.totalCogs ?? 0;
            const opExp = pl?.totalOperatingExpenses ?? 0;
            const netProfit = pl?.netProfit ?? 0;

            const assets = bs?.totalAssets ?? 0;
            const liabilities = bs?.totalLiabilities ?? 0;
            const equity = bs?.totalEquity ?? 0;

            // Calculate basic ratios
            setData({
                grossMargin: sales > 0 ? ((sales - cogs) / sales) * 100 : 0,
                netMargin: sales > 0 ? (netProfit / sales) * 100 : 0,
                currentRatio: liabilities > 0 ? assets / liabilities : 0,
                debtToEquity: equity > 0 ? liabilities / equity : 0,
                returnOnAssets: assets > 0 ? (netProfit / assets) * 100 : 0,
                efficiencyRatio: sales > 0 ? (opExp / sales) * 100 : 0
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => { run(); }, []);

    const RatioCard = ({ title, value, unit = "%", icon: Icon, description, goodThreshold, invert = false }: any) => {
        const isGood = invert ? value < goodThreshold : value > goodThreshold;
        return (
            <Card className="border-border/40 shadow-sm hover:shadow-lg transition-all hover:border-primary/30 group">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                            <Icon className="h-5 w-5" />
                        </div>
                        {loading ? <Skeleton className="h-4 w-12" /> : (
                            <div className={cn("flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full", isGood ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                                {isGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {isGood ? "Healthy" : "Check"}
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
                        <div className="text-3xl font-black text-foreground">
                            {loading ? <Skeleton className="h-10 w-24" /> : (
                                <>
                                    {unit === "x" ? value.toFixed(2) : Math.round(value)}
                                    <span className="text-lg ml-1 font-bold text-muted-foreground">{unit}</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            <PageHeader title="Performance Ratios" description="Key financial metrics to track business growth and stability." />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <RatioCard
                    title="Gross Margin"
                    value={data?.grossMargin ?? 0}
                    icon={TrendingUp}
                    description="Profitability after cost of goods."
                    goodThreshold={30}
                />
                <RatioCard
                    title="Net Margin"
                    value={data?.netMargin ?? 0}
                    icon={DollarSign}
                    description="Overall profitability for the period."
                    goodThreshold={10}
                />
                <RatioCard
                    title="Current Ratio"
                    value={data?.currentRatio ?? 0}
                    unit="x"
                    icon={Scale}
                    description="Ability to pay short-term obligations."
                    goodThreshold={1.5}
                />
                <RatioCard
                    title="Efficiency Ratio"
                    value={data?.efficiencyRatio ?? 0}
                    icon={Zap}
                    description="OpEx spend vs Revenue."
                    goodThreshold={40}
                    invert={true}
                />
                <RatioCard
                    title="Debt to Equity"
                    value={data?.debtToEquity ?? 0}
                    unit="x"
                    icon={Wallet}
                    description="Financial leverage and risk."
                    goodThreshold={1}
                    invert={true}
                />
                <RatioCard
                    title="Return on Assets"
                    value={data?.returnOnAssets ?? 0}
                    icon={TrendingUp}
                    description="How efficiently assets generate profit."
                    goodThreshold={5}
                />
            </div>
        </div>
    );
}
