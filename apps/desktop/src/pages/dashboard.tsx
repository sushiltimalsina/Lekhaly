// apps/desktop/src/pages/dashboard.tsx
import React from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevenueChart, ExpenseDistribution } from "@/components/app/dashboard-charts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-gradient">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Overview of your business performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex border-border/50">Download Report</Button>
          <Button className="shadow-lg shadow-primary/25 px-6">New Transaction</Button>
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={210000}
          icon={DollarSign}
          trend="+20.1% from last month"
          trendUp={true}
        />
        <MetricCard
          title="Receivables"
          value={84500}
          icon={Users}
          trend="+180.1% from last month"
          trendUp={true}
        />
        <MetricCard
          title="Payables"
          value={43200}
          icon={CreditCard}
          trend="-5.4% from last month"
          trendUp={false}
        />
        <MetricCard
          title="Cash at Hand"
          value={125000}
          icon={Activity}
          trend="+12% since last hour"
          trendUp={true}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 glass-card border-none bg-card/60">
          <CardHeader>
            <CardTitle className="text-lg">Financial Overview</CardTitle>
            <CardDescription className="text-xs">Visualizing your monthly cash flow (Revenue vs Expenses).</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3 glass-card border-none bg-card/60">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Latest financial transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ActivityItem
                title="Sales Invoice #INV-1021"
                subtitle="Sold to John Doe"
                amount={12500}
                icon={FileText}
              />
              <ActivityItem
                title="Receipt from ABC Traders"
                subtitle="Bank Deposit"
                amount={12500}
                icon={DollarSign}
              />
              <ActivityItem
                title="Office Supplies"
                subtitle="Stationery Purchase"
                amount={-2500}
                icon={CreditCard}
              />
              <ActivityItem
                title="Consulting Receipt"
                subtitle="Service Income"
                amount={50000}
                icon={DollarSign}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3 glass-card border-none bg-card/60">
          <CardHeader>
            <CardTitle className="text-lg">Expense Distribution</CardTitle>
            <CardDescription className="text-xs">Breakdown of where your money is going.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseDistribution />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-muted-foreground font-medium">Operating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground font-medium">Marketing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] text-muted-foreground font-medium">Payroll</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[10px] text-muted-foreground font-medium">Utilities</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-4 glass-card border-none bg-card/60">
          <CardHeader>
            <CardTitle className="text-lg">Cash Flow Health</CardTitle>
            <CardDescription className="text-xs">Your current liquidity and financial stability indicators.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between group hover:bg-primary/10 transition-colors">
                <div>
                  <div className="text-sm font-semibold">Quick Ratio</div>
                  <div className="text-[11px] text-muted-foreground">Liquid assets vs current liabilities</div>
                </div>
                <div className="text-xl font-bold font-mono text-primary">1.8</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between group hover:bg-emerald-500/10 transition-colors">
                <div>
                  <div className="text-sm font-semibold">Burn Rate</div>
                  <div className="text-[11px] text-muted-foreground">Monthly cash outflow average</div>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600"><MoneyText value={12400} /></div>
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between group hover:bg-indigo-500/10 transition-colors">
                <div>
                  <div className="text-sm font-semibold">Runway</div>
                  <div className="text-[11px] text-muted-foreground">Estimated months of operation</div>
                </div>
                <div className="text-xl font-bold font-mono text-indigo-600">14 Months</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, trendUp }: any) {
  return (
    <Card className="overflow-hidden relative glass-card border-none bg-card/60 group hover:-translate-y-1 transition-all duration-300">
      <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-br from-primary/10 to-transparent blur-2xl rounded-bl-full -z-10 group-hover:from-primary/20 transition-colors" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tracking-tight">
          <MoneyText value={value} />
        </div>
        <p className={cn("text-[10px] mt-1.5 flex items-center font-bold px-2 py-0.5 rounded-full w-fit bg-background/50", trendUp ? "text-emerald-500" : "text-rose-500")}>
          {trendUp ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
          {trend}
        </p>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ title, subtitle, amount, icon: Icon }: any) {
  const isPositive = amount > 0;
  return (
    <div className="flex items-center group cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-xl transition-colors">
      <div className="h-10 w-10 rounded-xl bg-muted/50 border flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <Icon className="h-4 w-4" />
      </div>
      <div className="ml-4 space-y-1">
        <p className="text-sm font-semibold leading-none">{title}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>
      </div>
      <div className={cn("ml-auto font-bold text-sm tabular-nums", isPositive ? "text-emerald-500" : "text-rose-500")}>
        {isPositive ? "+" : ""}
        <MoneyText value={amount} />
      </div>
    </div>
  )
}
