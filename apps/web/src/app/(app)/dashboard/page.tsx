"use client";

import * as React from "react";
import { MoneyText } from "@/components/app/money";
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
  ArrowDownRight,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RevenueChart, ExpenseDistribution } from "@/components/app/dashboard-charts";

import { getDashboardStats, getDashboardCharts } from "@/lib/api/reports";
import { Skeleton } from "@lekhaly/ui/src/components/ui/skeleton";
import { getSettings } from "@/lib/store/settings";

export default function DashboardPage() {
  const [stats, setStats] = React.useState<any>(null);
  const [charts, setCharts] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const { calendarPreference } = getSettings();
        const [statsData, chartsData] = await Promise.all([
          getDashboardStats({ calendar: calendarPreference }),
          getDashboardCharts()
        ]);
        setStats(statsData);
        setCharts(chartsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Overview of your business performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex">Download Report</Button>
          <Button className="shadow-lg shadow-primary/25">New Transaction</Button>
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={stats?.revenue || 0}
          icon={DollarSign}
          loading={loading}
          trend={`${stats?.revenueTrend >= 0 ? "+" : ""}${stats?.revenueTrend?.toFixed(1) || 0}% from last month`}
          trendUp={stats?.revenueTrend >= 0}
        />
        <MetricCard
          title="Receivables"
          value={stats?.receivables || 0}
          icon={Users}
          loading={loading}
          trend={`${stats?.receivablesTrend >= 0 ? "+" : ""}${stats?.receivablesTrend?.toFixed(1) || 0}% from last month`}
          trendUp={stats?.receivablesTrend >= 0}
        />
        <MetricCard
          title="Payables"
          value={stats?.payables || 0}
          icon={CreditCard}
          loading={loading}
          trend={`${stats?.payablesTrend >= 0 ? "+" : ""}${stats?.payablesTrend?.toFixed(1) || 0}% from last month`}
          trendUp={stats?.payablesTrend <= 0} // Less payables is usually good
        />
        <MetricCard
          title="Cash at Hand"
          value={stats?.cashAtHand || 0}
          icon={Activity}
          loading={loading}
          trend={`${stats?.cashTrend >= 0 ? "+" : ""}${stats?.cashTrend?.toFixed(1) || 0}% since last month`}
          trendUp={stats?.cashTrend >= 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Visualizing your monthly cash flow (Revenue vs Expenses).</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <RevenueChart data={charts} />
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3 glass-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest financial transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="ml-4 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((item: any) => (
                  <ActivityItem
                    key={item.id}
                    title={`${item.type.replace('_', ' ').replace(/\b\w/g, (l: any) => l.toUpperCase())} #${item.number || 'Draft'}`}
                    subtitle={item.partyName}
                    amount={item.amount}
                    icon={FileText}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3 glass-card">
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardDescription>Breakdown of where your money is going.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full rounded-full" />
            ) : (
              <ExpenseDistribution />
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Operating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Marketing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-xs text-muted-foreground">Payroll</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Cash Flow Health</CardTitle>
            <CardDescription>Your current liquidity and financial stability indicators.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Quick Ratio</div>
                  <div className="text-xs text-muted-foreground">Liquid assets vs current liabilities</div>
                </div>
                {loading ? <Skeleton className="h-6 w-12" /> : <div className="text-xl font-bold font-mono">{stats?.quickRatio || 0}</div>}
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Burn Rate</div>
                  <div className="text-xs text-muted-foreground">Monthly cash outflow average</div>
                </div>
                {loading ? <Skeleton className="h-6 w-12" /> : <div className="text-xl font-bold font-mono text-emerald-600"><MoneyText value={stats?.burnRate || 0} /></div>}
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Runway</div>
                  <div className="text-xs text-muted-foreground">Estimated months of operation</div>
                </div>
                {loading ? <Skeleton className="h-6 w-12" /> : <div className="text-xl font-bold font-mono text-indigo-600">{stats?.runway || 0} Months</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, trendUp, loading }: any) {
  return (
    <Card className="overflow-hidden relative glass-card group hover:-translate-y-1 transition-transform duration-300">
      <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-br from-primary/10 to-transparent blur-2xl rounded-bl-full -z-10 group-hover:from-primary/20 transition-colors" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tracking-tight">
          {loading ? <Skeleton className="h-8 w-3/4" /> : <MoneyText value={value} />}
        </div>
        {loading ? (
          <Skeleton className="h-3 w-1/2 mt-2" />
        ) : (
          <p className={cn("text-xs mt-1 flex items-center", trendUp ? "text-green-600" : "text-red-500")}>
            {trendUp ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityItem({ title, subtitle, amount, icon: Icon }: any) {
  const isPositive = amount > 0;
  return (
    <div className="flex items-center">
      <div className="h-9 w-9 rounded-full bg-muted/50 border flex items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="ml-4 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className={cn("ml-auto font-medium text-sm tabular-nums", isPositive ? "text-green-600" : "text-foreground")}>
        {isPositive ? "+" : ""}
        <MoneyText value={amount} />
      </div>
    </div>
  )
}
