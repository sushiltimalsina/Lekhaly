"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getItem, type ItemRecord } from "@/lib/api/items";
import { getInventorySettings, getItemStockLedger, type InventorySettings, type StockLedgerEntry } from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";
import { MoneyText } from "@/components/app/money";
import DataTable, { Column } from "@/components/app/data-table";
import { Button, Card, CardContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Box,
  Calendar,
  Edit,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  FileText,
  Hash,
  Layers,
  Package,
  RefreshCw,
  Tag,
} from "lucide-react";

type Tab = "overview" | "ledger";

function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300",
    red: "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-300",
    slate: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300",
    violet: "bg-violet-100 text-violet-700 ring-violet-600/20 dark:bg-violet-900/20 dark:text-violet-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset", colors[color] || colors.slate)}>
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-none transition-shadow hover:shadow-md">
      <CardContent className="pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <div className={cn("text-[10px] font-bold uppercase tracking-widest", accent || "text-muted-foreground")}>{label}</div>
            <div className="mt-2 text-2xl font-black tabular-nums">{value}</div>
            {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
          </div>
          {Icon ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "item";
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function saveBlob(blob: Blob, fileName: string) {
  const picker = (window as any).showSaveFilePicker as
    | ((opts: {
        suggestedName?: string;
        types?: Array<{ description?: string; accept: Record<string, string[]> }>;
      }) => Promise<any>)
    | undefined;

  if (picker) {
    try {
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const mime =
        ext === "csv"
          ? "text/csv"
          : ext === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      const handle = await picker({
        suggestedName: fileName,
        types: [{ description: "Export file", accept: { [mime]: [`.${ext}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch {
      // Fall back to default download if the picker is cancelled or unavailable.
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function ItemDetailPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;
  const initialTab = searchParams.get("tab") === "ledger" ? "ledger" : "overview";
  const sourceFrom = searchParams.get("from");
  const backHref = sourceFrom === "stock-ledger" ? "/reports/stock-ledger" : sourceFrom === "warehouses" ? "/inventory/warehouses" : "/items";
  const backLabel = sourceFrom === "stock-ledger" ? "Back to Stock Ledger" : sourceFrom === "warehouses" ? "Back to Warehouses" : "Back to all items";

  const [item, setItem] = React.useState<ItemRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [settings, setSettings] = React.useState<InventorySettings | null>(null);
  const [ledger, setLedger] = React.useState<{
    openingQty?: number;
    openingAmt?: number;
    debitQty?: number;
    debitAmt?: number;
    creditQty?: number;
    creditAmt?: number;
    closingQty?: number;
    closingAmt?: number;
    entries: StockLedgerEntry[];
  } | null>(null);
  const [ledgerLoading, setLedgerLoading] = React.useState(false);

  const features = inventoryFeatures(settings);
  const isGoods = item?.type === "goods";
  const tracked = Boolean(isGoods && item?.trackInventory !== false && features.inventory);

  async function loadItem() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [itemData, inv] = await Promise.all([getItem(id), getInventorySettings()]);
      setItem(itemData);
      setSettings(inv);
    } catch (e: any) {
      setError(e?.message || "Failed to load item");
    } finally {
      setLoading(false);
    }
  }

  async function loadLedger() {
    if (!id || !tracked) return;
    setLedgerLoading(true);
    try {
      const res = await getItemStockLedger(id);
      setLedger(res);
    } catch {
      setLedger(null);
    } finally {
      setLedgerLoading(false);
    }
  }

  React.useEffect(() => {
    loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  React.useEffect(() => {
    setTab(searchParams.get("tab") === "ledger" ? "ledger" : "overview");
  }, [searchParams]);

  React.useEffect(() => {
    if (tab === "ledger" || tab === "overview") loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tracked, tab]);

  function renderSourceCell(r: StockLedgerEntry) {
    const sourceNumber = r.invoiceNumber || r.voucherNumber || r.voucherType || "Voucher";
    if (!r.voucherId) {
      return <span className="text-xs text-muted-foreground">Opening / manual</span>;
    }

    return (
      <div className="flex flex-col items-start gap-1.5">
        {r.partyId && r.partyName ? (
          <Link
            href={`/reports/ledger?partyId=${encodeURIComponent(r.partyId)}`}
            onClick={(event) => event.stopPropagation()}
            className="max-w-[210px] truncate text-sm font-bold text-foreground hover:text-orange-500 hover:underline"
            title={`Open ledger for ${r.partyName}`}
          >
            {r.partyName}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">No party</span>
        )}
        <Link
          href={`/vouchers/${r.voucherId}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          title="Open source voucher"
        >
          {sourceNumber}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const ledgerColumns: Column<StockLedgerEntry>[] = [
    { key: "date", header: "Date", width: 120, cell: (r) => <span className="text-xs font-medium">{new Date(r.date).toLocaleDateString()}</span> },
    {
      key: "source",
      header: "Source",
      width: 240,
      cell: renderSourceCell,
    },
    ...(features.warehouses
      ? [
          {
            key: "location",
            header: "Location",
            width: 160,
            cell: (r: StockLedgerEntry) => <span className="text-xs">{[r.warehouseName, r.binName].filter(Boolean).join(" / ") || "-"}</span>,
          } as Column<StockLedgerEntry>,
        ]
      : []),
    { key: "in", header: <span className="block text-right text-emerald-600">In</span>, align: "right", width: 90, cell: (r) => <span className="font-medium tabular-nums text-emerald-600">{r.qtyIn || "-"}</span> },
    { key: "out", header: <span className="block text-right text-red-600">Out</span>, align: "right", width: 90, cell: (r) => <span className="font-medium tabular-nums text-red-600">{r.qtyOut || "-"}</span> },
    { key: "rate", header: <span className="block text-right">Rate</span>, align: "right", width: 120, cell: (r) => <MoneyText value={r.rate} className="text-xs" /> },
    { key: "bal", header: <span className="block text-right font-black">Balance</span>, align: "right", width: 100, cell: (r) => <span className="font-black tabular-nums">{r.runningQty ?? 0}</span> },
    { key: "amt", header: <span className="block text-right">Value</span>, align: "right", width: 140, cell: (r) => <MoneyText value={r.runningAmt ?? 0} className="font-semibold" /> },
  ];

  const buildExportRows = () => {
    const summaryRows = [
      ["Name", item?.name ?? ""],
      ["SKU", item?.sku ?? ""],
      ["Type", isGoods ? "Goods" : "Services"],
      ["Unit", item?.unit ?? ""],
      ["Sales Price", item?.salesPrice ?? 0],
      ["Purchase Price", item?.purchasePrice ?? 0],
      ["Opening Qty", ledger?.openingQty ?? 0],
      ["Debit / Inward", ledger?.debitQty ?? 0],
      ["Credit / Outward", ledger?.creditQty ?? 0],
      ["Closing Qty", ledger?.closingQty ?? 0],
      ["Closing Amount", ledger?.closingAmt ?? 0],
    ];
    const movementHeader = ["Date", "Source", "Location", "In", "Out", "Rate", "Balance", "Value"];
    const movementRows = (ledger?.entries ?? []).map((entry) => [
      new Date(entry.date).toLocaleDateString(),
      [entry.partyName, entry.invoiceNumber || entry.voucherNumber || entry.voucherType || "Opening / manual"].filter(Boolean).join(" - "),
      [entry.warehouseName, entry.binName].filter(Boolean).join(" / "),
      entry.qtyIn || "",
      entry.qtyOut || "",
      entry.rate ?? 0,
      entry.runningQty ?? 0,
      entry.runningAmt ?? 0,
    ]);
    return { summaryRows, movementHeader, movementRows };
  };

  const exportCsv = async () => {
    const { summaryRows, movementHeader, movementRows } = buildExportRows();
    const rows = [["Item Summary"], ...summaryRows, [], ["Stock Movements"], movementHeader, ...movementRows];
    await saveBlob(new Blob([rows.map((row) => row.map(csvEscape).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" }), `${safeFileName(item?.name ?? "item")}_stock.csv`);
  };

  const exportExcel = async () => {
    const { summaryRows, movementHeader, movementRows } = buildExportRows();
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Item Summary"], ...summaryRows]), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([movementHeader, ...movementRows]), "Stock Ledger");
    const output = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    await saveBlob(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${safeFileName(item?.name ?? "item")}_stock.xlsx`);
  };

  const exportPdf = async () => {
    const { summaryRows, movementHeader, movementRows } = buildExportRows();
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`${item?.name ?? "Item"} - Stock Report`, 40, 36);
    autoTable(doc, { body: summaryRows.map((row) => row.map(String)), startY: 54, theme: "grid", styles: { fontSize: 9 } });
    autoTable(doc, { head: [movementHeader], body: movementRows.map((row) => row.map((value) => String(value ?? ""))), startY: (doc as any).lastAutoTable.finalY + 18, styles: { fontSize: 8 }, headStyles: { fillColor: [31, 41, 55] } });
    await saveBlob(doc.output("blob"), `${safeFileName(item?.name ?? "item")}_stock.pdf`);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-40 rounded-3xl bg-muted" />
        <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted" />)}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-xl font-bold text-muted-foreground">{error || "Item not found"}</h2>
        <Link href="/items">
          <Button variant="outline" className="mt-4 rounded-xl">Back to Items</Button>
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Package },
    ...(tracked ? [{ key: "ledger" as Tab, label: "Stock Ledger", icon: BarChart3 }] : []),
  ];

  const setTabAndUrl = (nextTab: Tab) => {
    setTab(nextTab);
    const params = new URLSearchParams();
    if (nextTab === "ledger") params.set("tab", "ledger");
    if (sourceFrom) params.set("from", sourceFrom);
    const query = params.toString();
    router.replace(query ? `/items/${id}?${query}` : `/items/${id}`);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href={backHref} className="transition-colors hover:text-foreground">{sourceFrom === "stock-ledger" ? "Stock Ledger" : sourceFrom === "warehouses" ? "Warehouses" : "Items"}</Link>
        <span>/</span>
        <span className="max-w-[300px] truncate font-medium text-foreground">{item.name}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full border border-transparent bg-transparent px-4 text-sm font-bold text-slate-950 transition-colors hover:border-orange-600 hover:bg-orange-600 hover:text-white dark:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{backLabel}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-10 w-fit rounded-full bg-emerald-600 px-4 text-white shadow-lg shadow-emerald-500/15 hover:bg-emerald-700">
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px] rounded-2xl p-2">
            <DropdownMenuItem onClick={exportPdf} className="cursor-pointer rounded-xl"><FileText className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={exportExcel} className="cursor-pointer rounded-xl"><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)</DropdownMenuItem>
            <DropdownMenuItem onClick={exportCsv} className="cursor-pointer rounded-xl"><FileDown className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-6 sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-gradient-to-bl from-primary/5 to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 to-violet-500/10 shadow-lg shadow-primary/5">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{item.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.sku ? <Badge color="violet"><Hash className="mr-1 h-3 w-3" />{item.sku}</Badge> : null}
                <Badge color={isGoods ? "emerald" : "blue"}>{isGoods ? "Goods" : "Services"}</Badge>
                {item.unit ? <Badge><Box className="mr-1 h-3 w-3" />{item.unit}</Badge> : null}
                {item.isKit ? <Badge color="amber">Kit</Badge> : null}
                {item.isSerialized ? <Badge color="blue">Serialized</Badge> : null}
                {item.tracksBatch ? <Badge>Batch</Badge> : null}
                {item.tracksExpiry ? <Badge color="red"><Calendar className="mr-1 h-3 w-3" />Expiry</Badge> : null}
              </div>
              {item.hsCode ? <div className="mt-2 text-xs text-muted-foreground">HS Code: <span className="font-mono font-medium">{item.hsCode}</span></div> : null}
            </div>
          </div>
          <div className="relative z-20 flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl" onClick={() => { loadItem(); loadLedger(); }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {id ? (
              <Link
                href={`/items/new?edit=${encodeURIComponent(id)}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Edit className="h-4 w-4" /> Edit
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {tabs.length > 1 ? (
        <div className="flex w-fit gap-1 rounded-2xl bg-muted/50 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTabAndUrl(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sales Price" value={<MoneyText value={item.salesPrice ?? 0} />} icon={Tag} accent="text-emerald-600" />
            <StatCard label="Purchase Price" value={<MoneyText value={item.purchasePrice ?? 0} />} icon={Tag} accent="text-blue-600" />
            {tracked ? <StatCard label="Closing Stock" value={ledger?.closingQty ?? 0} sub={<MoneyText value={ledger?.closingAmt ?? 0} />} icon={Layers} accent="text-violet-600" /> : null}
            {tracked ? <StatCard label="Reorder Level" value={item.reorderLevel ?? 0} sub={`Safety stock: ${item.safetyStock ?? 0}`} icon={AlertTriangle} accent={(ledger?.closingQty ?? 0) <= (item.reorderLevel ?? 0) ? "text-red-600" : "text-muted-foreground"} /> : null}
          </div>

          {tracked && ledger ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Opening" value={ledger.openingQty ?? 0} sub={<MoneyText value={ledger.openingAmt ?? 0} />} icon={Package} />
              <StatCard label="Inward (Debit)" value={ledger.debitQty ?? 0} sub={<MoneyText value={ledger.debitAmt ?? 0} />} icon={ArrowDown} accent="text-emerald-600" />
              <StatCard label="Outward (Credit)" value={ledger.creditQty ?? 0} sub={<MoneyText value={ledger.creditAmt ?? 0} />} icon={ArrowUp} accent="text-red-600" />
              <Card className="overflow-hidden border-border/50 bg-primary/5 shadow-none">
                <CardContent className="pb-4 pt-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Closing Balance</div>
                  <div className="mt-2 text-3xl font-black tabular-nums">{ledger.closingQty ?? 0}</div>
                  <MoneyText value={ledger.closingAmt ?? 0} className="mt-1 text-sm font-semibold" />
                </CardContent>
              </Card>
            </div>
          ) : null}

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Item Details</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Type", value: isGoods ? "Goods" : "Services" },
                  { label: "Unit", value: item.unit || "-" },
                  { label: "SKU", value: item.sku || "-" },
                  { label: "HS Code", value: item.hsCode || "-" },
                  { label: "Track Inventory", value: item.trackInventory !== false && isGoods ? "Yes" : "No" },
                  { label: "Serialized", value: item.isSerialized ? "Yes" : "No" },
                  { label: "Kit Item", value: item.isKit ? "Yes" : "No" },
                  { label: "Batch Tracking", value: item.tracksBatch ? "Required" : "Not required" },
                  { label: "Lot Tracking", value: item.tracksLot ? "Required" : "Not required" },
                  { label: "Expiry Tracking", value: item.tracksExpiry ? "Required" : "Not required" },
                  { label: "Reorder Level", value: String(item.reorderLevel ?? 0) },
                  { label: "Safety Stock", value: String(item.safetyStock ?? 0) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-border/40 py-2.5 last:border-0">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "ledger" && tracked ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Opening" value={ledger?.openingQty ?? 0} sub={<MoneyText value={ledger?.openingAmt ?? 0} />} />
            <StatCard label="Debit / Inward" value={ledger?.debitQty ?? 0} sub={<MoneyText value={ledger?.debitAmt ?? 0} />} accent="text-emerald-600" />
            <StatCard label="Credit / Outward" value={ledger?.creditQty ?? 0} sub={<MoneyText value={ledger?.creditAmt ?? 0} />} accent="text-red-600" />
            <Card className="border-border/50 bg-emerald-600/5 shadow-none">
              <CardContent className="pt-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Closing</div>
                <div className="mt-2 text-2xl font-black tabular-nums">{ledger?.closingQty ?? 0}</div>
                <MoneyText value={ledger?.closingAmt ?? 0} className="text-xs font-semibold" />
              </CardContent>
            </Card>
          </div>
          <Card className="min-h-[400px] overflow-hidden border-border/50 shadow-xl">
            <DataTable
              rows={ledger?.entries ?? []}
              columns={ledgerColumns}
              loading={ledgerLoading}
              emptyText="No stock movements found"
              className="border-none"
              onRowClick={(row) => {
                if (row.voucherId) router.push(`/vouchers/${row.voucherId}`);
              }}
            />
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default function ItemDetailPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading item...</div>}>
      <ItemDetailPageContent />
    </React.Suspense>
  );
}
