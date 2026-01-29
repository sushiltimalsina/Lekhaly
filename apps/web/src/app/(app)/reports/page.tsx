"use client";

import PageHeader from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  History
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const reports = [
  {
    title: "Trial Balance",
    desc: "Summary of all ledger balances to verify accounting entries.",
    href: "/reports/trial-balance",
    icon: BarChart3,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10"
  },
  {
    title: "Profit & Loss",
    desc: "Detailed income and expense statement for your business performance.",
    href: "/reports/pl",
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    title: "Balance Sheet",
    desc: "Snaphot of assets, liabilities, and equity at a specific point in time.",
    href: "/reports/balance-sheet",
    icon: PieChart,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10"
  },
  {
    title: "Party Aging",
    desc: "Understand outstanding receivables and payables by time periods.",
    href: "/reports/party-aging",
    icon: Clock,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10"
  },
  {
    title: "General Ledger",
    desc: "Complete record of every transaction for every account/party.",
    href: "/reports/ledger",
    icon: BookOpen,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10"
  },
  {
    title: "Cash Flow",
    desc: "Analysis of cash movement in and out of your business.",
    href: "/reports/cash-flow",
    icon: History,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10"
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Financial Reports"
        description="Comprehensive analysis and statements for your business growth."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group block"
          >
            <Card className="h-full border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 glass-card overflow-hidden relative">
              <div className={cn("absolute right-0 top-0 h-24 w-24 blur-3xl -z-10 group-hover:scale-110 transition-transform duration-500", r.bg)} />
              <CardHeader className="pb-2">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-2 ring-1 ring-inset ring-foreground/10", r.bg, r.color)}>
                  <r.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{r.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{r.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                  Generate Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-border/50 glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Bulk Export & Audit</CardTitle>
            <CardDescription className="mt-1">
              Export high-volume data for regulatory compliance or external audits.
            </CardDescription>
          </div>
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
            <Download className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="shadow-lg shadow-primary/10">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Ledger (Excel)
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export Trial Balance (PDF)
            </Button>
            <Button variant="ghost">
              <Download className="mr-2 h-4 w-4" />
              Audit Log (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
