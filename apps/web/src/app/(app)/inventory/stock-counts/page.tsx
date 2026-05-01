"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { Card, CardContent } from "@lekhaly/ui";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  ChevronRight,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listStockCounts, type StockCount } from "@/lib/api/stock-counts";

export default function StockCountsPage() {
  const router = useRouter();
  const [counts, setCounts] = React.useState<StockCount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStockCounts();
      setCounts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load stock counts");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6 pb-20 text-foreground animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Physical Stock Count"
          description="Conduct physical inventory counts and generate variance adjustments."
          icon={ClipboardList}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="rounded-2xl h-12 px-5"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/inventory/stock-counts/create")}
            className="rounded-2xl h-12 px-5 bg-orange-600 hover:bg-orange-700 text-white border-none shadow-lg shadow-orange-500/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Start New Count
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : counts.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg text-foreground mb-2">No stock counts</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start a physical stock count to audit your inventory and record variances.
              </p>
              <Button
                onClick={() => router.push("/inventory/stock-counts/create")}
                className="rounded-2xl h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Start New Count
              </Button>
            </CardContent>
          </Card>
        ) : (
          counts.map((count) => (
            <Card
              key={count.id}
              className="border-border/50 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(`/inventory/stock-counts/view/${count.id}`)}
            >
              <CardContent className="pt-5 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-lg">
                        {count.reference || "Untitled Count"}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                          count.status === "completed"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : count.status === "in_progress"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        {count.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span>Date: {new Date(count.countDate).toLocaleDateString()}</span>
                      {count.warehouse && (
                        <span className="flex items-center gap-1">
                          • <Package className="h-3 w-3" /> {count.warehouse.name}
                        </span>
                      )}
                      <span>• {count._count?.lines || 0} items</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
