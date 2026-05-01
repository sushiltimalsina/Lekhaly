"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import DualDateInput from "@/components/app/dual-date-input";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { ArrowUpDown, CalendarDays, Check, Columns, Download, Eye, Plus, RotateCcw, Search, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { listAccounts } from "@/lib/api/accounts";
import { createItem } from "@/lib/api/items";
import {
  adjustInventoryStock,
  getInventoryAlerts,
  getItemStockLedger,
  getStockReport,
  InventoryAlerts,
  StockLedgerEntry,
  StockReportRow,
  transferInventoryStock,
} from "@/lib/api/inventory";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";

type ItemRow = StockReportRow;
type DateValue = { ad: string; bs: string };
type AlertFilter = "all" | "belowReorder" | "zeroStock" | "expiringSoon" | "noMovement";
type StockColumnKey =
  | "sno"
  | "sku"
  | "name"
  | "hsCode"
  | "type"
  | "parentGroup"
  | "unit"
  | "onHandQty"
  | "reservedQty"
  | "availableQty"
  | "openingQty"
  | "openingAvgPrice"
  | "openingAmt"
  | "purchaseQty"
  | "purchaseAvgPrice"
  | "purchaseAmt"
  | "saleQty"
  | "saleAvgPrice"
  | "saleAmt"
  | "closingQty"
  | "closingPrice"
  | "closingAmt";

const STOCK_COLUMN_STORAGE_KEY = "lekhaly.items.visibleColumns";

const STOCK_COLUMN_OPTIONS: { key: StockColumnKey; label: string; defaultVisible: boolean }[] = [
  { key: "sno", label: "S.No.", defaultVisible: true },
  { key: "sku", label: "SKU (Unique ID)", defaultVisible: true },
  { key: "name", label: "Item Name", defaultVisible: true },
  { key: "hsCode", label: "HS Code", defaultVisible: false },
  { key: "type", label: "Type", defaultVisible: true },
  { key: "parentGroup", label: "Group", defaultVisible: true },
  { key: "unit", label: "Unit", defaultVisible: true },
  { key: "onHandQty", label: "On Hand", defaultVisible: false },
  { key: "reservedQty", label: "Reserved", defaultVisible: false },
  { key: "availableQty", label: "Available", defaultVisible: false },
  { key: "openingQty", label: "Opening Qty", defaultVisible: false },
  { key: "openingAvgPrice", label: "Opening Rate", defaultVisible: false },
  { key: "openingAmt", label: "Opening Amount", defaultVisible: false },
  { key: "purchaseQty", label: "Inward Qty", defaultVisible: false },
  { key: "purchaseAvgPrice", label: "Inward Avg Rate", defaultVisible: false },
  { key: "purchaseAmt", label: "Inward Amount", defaultVisible: false },
  { key: "saleQty", label: "Outward Qty", defaultVisible: false },
  { key: "saleAvgPrice", label: "Outward Avg Rate", defaultVisible: false },
  { key: "saleAmt", label: "Outward Amount", defaultVisible: false },
  { key: "closingQty", label: "Closing Quantity", defaultVisible: true },
  { key: "closingPrice", label: "Closing Price", defaultVisible: true },
  { key: "closingAmt", label: "Closing Amount", defaultVisible: true },
];

const DEFAULT_VISIBLE_STOCK_COLUMNS = STOCK_COLUMN_OPTIONS
  .filter((column) => column.defaultVisible)
  .map((column) => column.key);
const ALL_STOCK_COLUMNS = STOCK_COLUMN_OPTIONS.map((column) => column.key);
const MASTER_STOCK_KEY: StockColumnKey = "availableQty";
const DEPENDENT_STOCK_KEYS: StockColumnKey[] = ["onHandQty", "reservedQty", "availableQty"];
const COLUMN_PICKER_OPTIONS = STOCK_COLUMN_OPTIONS.filter(
  (column) => !["onHandQty", "reservedQty"].includes(column.key)
);

const TYPE_FILTER_CYCLE: Array<"all" | "goods" | "services"> = ["all", "goods", "services"];
const DATE_PRESETS = [
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_month",
  "this_quarter",
  "this_year",
  "last_month",
  "last_quarter",
  "last_year",
] as const;
type DatePreset = (typeof DATE_PRESETS)[number];
const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last_7_days: "Last 7 Days",
  last_30_days: "Last 30 Days",
  this_month: "This Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  last_month: "Last Month",
  last_quarter: "Last Quarter",
  last_year: "Last Year",
};

type InventoryAccount = { id: string; name: string };

function csvEscape(value: unknown) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, "\"\"")}"`;
  return str;
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function n(v: unknown) {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function normalizeStockRow(r: ItemRow): ItemRow {
  const openingQty = n(r.openingQty);
  const openingAvgPrice = n(r.openingAvgPrice);
  const openingAmt = n(r.openingAmt) || openingQty * openingAvgPrice;

  const purchaseQty = n(r.purchaseQty);
  const purchaseAvgPrice = n(r.purchaseAvgPrice);
  const purchaseAmt = n(r.purchaseAmt) || purchaseQty * purchaseAvgPrice;

  const saleQty = n(r.saleQty);
  const saleAvgPrice = n(r.saleAvgPrice);
  const saleAmt = n(r.saleAmt) || saleQty * saleAvgPrice;

  const closingQty = n(r.closingQty) || openingQty + purchaseQty - saleQty;
  const closingAmt = n(r.closingAmt) || openingAmt + purchaseAmt - saleAmt;
  const closingPrice = n(r.closingPrice) || (closingQty !== 0 ? closingAmt / closingQty : 0);
  const onHandQty = n((r as any).onHandQty) || closingQty;
  const reservedQty = n((r as any).reservedQty);
  const availableQty = n((r as any).availableQty) || (onHandQty - reservedQty);

  return {
    ...r,
    onHandQty,
    reservedQty,
    availableQty,
    openingQty,
    openingAvgPrice,
    openingAmt,
    purchaseQty,
    purchaseAvgPrice,
    purchaseAmt,
    saleQty,
    saleAvgPrice,
    saleAmt,
    closingQty,
    closingAmt,
    closingPrice,
  };
}

function getPresetDates(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarter = Math.floor(month / 3);
  const today = new Date(year, month, now.getDate());
  const yesterday = new Date(year, month, now.getDate() - 1);
  const last7Start = new Date(year, month, now.getDate() - 6);
  const last30Start = new Date(year, month, now.getDate() - 29);

  const thisMonthStart = new Date(year, month, 1);
  const thisMonthEnd = new Date(year, month + 1, 0);
  const thisQuarterStart = new Date(year, quarter * 3, 1);
  const thisQuarterEnd = new Date(year, quarter * 3 + 3, 0);
  const thisYearStart = new Date(year, 0, 1);
  const thisYearEnd = new Date(year, 11, 31);

  const lastMonthStart = new Date(year, month - 1, 1);
  const lastMonthEnd = new Date(year, month, 0);
  const lastQuarterStart = new Date(year, (quarter - 1) * 3, 1);
  const lastQuarterEnd = new Date(year, quarter * 3, 0);
  const lastYearStart = new Date(year - 1, 0, 1);
  const lastYearEnd = new Date(year - 1, 11, 31);

  switch (preset) {
    case "today":
      return { from: toIsoDate(today), to: toIsoDate(today) };
    case "yesterday":
      return { from: toIsoDate(yesterday), to: toIsoDate(yesterday) };
    case "last_7_days":
      return { from: toIsoDate(last7Start), to: toIsoDate(today) };
    case "last_30_days":
      return { from: toIsoDate(last30Start), to: toIsoDate(today) };
    case "this_month":
      return { from: toIsoDate(thisMonthStart), to: toIsoDate(thisMonthEnd) };
    case "this_quarter":
      return { from: toIsoDate(thisQuarterStart), to: toIsoDate(thisQuarterEnd) };
    case "this_year":
      return { from: toIsoDate(thisYearStart), to: toIsoDate(thisYearEnd) };
    case "last_month":
      return { from: toIsoDate(lastMonthStart), to: toIsoDate(lastMonthEnd) };
    case "last_quarter":
      return { from: toIsoDate(lastQuarterStart), to: toIsoDate(lastQuarterEnd) };
    case "last_year":
      return { from: toIsoDate(lastYearStart), to: toIsoDate(lastYearEnd) };
  }
}

export default function ItemsPage() {
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "goods" | "services">("all");
  const [groupFilter, setGroupFilter] = React.useState("all");
  const [unitFilter, setUnitFilter] = React.useState("all");
  const [fromDate, setFromDate] = React.useState<DateValue>({ ad: "", bs: "" });
  const [toDate, setToDate] = React.useState<DateValue>({ ad: "", bs: "" });
  const [sortBy, setSortBy] = React.useState<
    | "alpha_asc"
    | "alpha_desc"
    | "opening_qty_asc"
    | "opening_qty_desc"
    | "opening_rate_asc"
    | "opening_rate_desc"
    | "opening_amt_asc"
    | "opening_amt_desc"
    | "inward_qty_asc"
    | "inward_qty_desc"
    | "inward_rate_asc"
    | "inward_rate_desc"
    | "inward_amt_asc"
    | "inward_amt_desc"
    | "outward_qty_asc"
    | "outward_qty_desc"
    | "outward_rate_asc"
    | "outward_rate_desc"
    | "outward_amt_asc"
    | "outward_amt_desc"
    | "closing_qty_asc"
    | "closing_qty_desc"
    | "closing_price_asc"
    | "closing_price_desc"
    | "closing_amt_asc"
    | "closing_amt_desc"
  >("alpha_asc");
  const [rows, setRows] = React.useState<ItemRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = React.useState<StockColumnKey[]>(DEFAULT_VISIBLE_STOCK_COLUMNS);
  const [columnsReady, setColumnsReady] = React.useState(false);
  const [activeDatePreset, setActiveDatePreset] = React.useState<DatePreset | null>(null);
  const [dateMenuOpen, setDateMenuOpen] = React.useState(false);
  const [columnsMenuOpen, setColumnsMenuOpen] = React.useState(false);
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const [ledgerOpen, setLedgerOpen] = React.useState(false);
  const [ledgerItem, setLedgerItem] = React.useState<ItemRow | null>(null);
  const [ledgerEntries, setLedgerEntries] = React.useState<StockLedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = React.useState(false);
  const [alerts, setAlerts] = React.useState<InventoryAlerts | null>(null);
  const [alertFilter, setAlertFilter] = React.useState<AlertFilter>("all");
  const [accounts, setAccounts] = React.useState<InventoryAccount[]>([]);
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [transferSubmitting, setTransferSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [adjustForm, setAdjustForm] = React.useState({
    itemId: "",
    date: toIsoDate(new Date()),
    qty: "",
    rate: "",
    accountId: "",
    memo: "",
    batchNo: "",
    lotNo: "",
    expiryDate: "",
    allowNegativeOverride: false,
    overrideReason: "",
  });
  const [transferForm, setTransferForm] = React.useState({
    itemId: "",
    fromWarehouseId: "",
    fromBinId: "",
    toWarehouseId: "",
    toBinId: "",
    qty: "",
    rate: "",
    date: toIsoDate(new Date()),
    memo: "",
    batchNo: "",
    lotNo: "",
    expiryDate: "",
  });
  const dateMenuWrapRef = React.useRef<HTMLDivElement | null>(null);
  const columnsMenuWrapRef = React.useRef<HTMLDivElement | null>(null);
  const exportMenuWrapRef = React.useRef<HTMLDivElement | null>(null);
  const importFileRef = React.useRef<HTMLInputElement | null>(null);
  const popupOpen = dateMenuOpen || columnsMenuOpen || exportMenuOpen || adjustOpen || transferOpen;

  React.useEffect(() => {
    if (!popupOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDateMenuOpen(false);
        setColumnsMenuOpen(false);
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [popupOpen]);

  React.useEffect(() => {
    if (!popupOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [popupOpen]);

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STOCK_COLUMN_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StockColumnKey[];
        const allowed = new Set(STOCK_COLUMN_OPTIONS.map((column) => column.key));
        const next = parsed.filter((key) => allowed.has(key));
        if (next.length > 0) setVisibleColumnKeys(next);
      } catch {
        window.localStorage.removeItem(STOCK_COLUMN_STORAGE_KEY);
      }
    }
    setColumnsReady(true);
  }, []);

  React.useEffect(() => {
    if (!columnsReady) return;
    window.localStorage.setItem(STOCK_COLUMN_STORAGE_KEY, JSON.stringify(visibleColumnKeys));
  }, [columnsReady, visibleColumnKeys]);

  async function refresh(nextFromAd = fromDate.ad, nextToAd = toDate.ad) {
    setLoading(true);
    setError(null);
    try {
      const data = await getStockReport({
        from: nextFromAd ? new Date(nextFromAd).toISOString() : undefined,
        to: nextToAd ? new Date(nextToAd).toISOString() : undefined,
      });
      setRows((Array.isArray(data) ? data : []).map(normalizeStockRow));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load stock report");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate.ad, toDate.ad]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getInventoryAlerts({ expiringWithinDays: 30, noMovementDays: 90, limit: 100 });
        if (!cancelled) setAlerts(res);
      } catch {
        if (!cancelled) setAlerts(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rows.length]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listAccounts({ isActive: true, take: 1000 });
        if (!cancelled) {
          const accountRows = Array.isArray(res) ? res : [];
          setAccounts(accountRows.filter((a) => a.isPostable !== false).map((a) => ({ id: a.id, name: a.name })));
        }
      } catch {
        if (!cancelled) setAccounts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetColumns = () => {
    setVisibleColumnKeys(DEFAULT_VISIBLE_STOCK_COLUMNS);
    setColumnsMenuOpen(false);
  };
  const showAllColumns = () => {
    setVisibleColumnKeys(ALL_STOCK_COLUMNS);
    setColumnsMenuOpen(false);
  };
  const clearDates = () => {
    setFromDate({ ad: "", bs: "" });
    setToDate({ ad: "", bs: "" });
    setActiveDatePreset(null);
    setDateMenuOpen(false);
  };
  const resetAllFilters = () => {
    setQ("");
    setTypeFilter("all");
    setGroupFilter("all");
    setUnitFilter("all");
    clearDates();
    setVisibleColumnKeys(DEFAULT_VISIBLE_STOCK_COLUMNS);
    setDateMenuOpen(false);
    setColumnsMenuOpen(false);
    setExportMenuOpen(false);
    setSortBy("alpha_asc");
  };
  const applyDatePreset = (preset: DatePreset) => {
    const range = getPresetDates(preset);
    setFromDate({ ad: range.from, bs: "" });
    setToDate({ ad: range.to, bs: "" });
    setActiveDatePreset(preset);
    setDateMenuOpen(false);
  };
  const toggleTypeFilter = () => {
    const idx = TYPE_FILTER_CYCLE.indexOf(typeFilter);
    const next = TYPE_FILTER_CYCLE[(idx + 1) % TYPE_FILTER_CYCLE.length];
    setTypeFilter(next);
  };
  const groupOptions = React.useMemo(() => {
    const groups = Array.from(new Set(rows.map((r) => (r.parentGroup || "—").trim()).filter(Boolean)));
    return ["all", ...groups];
  }, [rows]);
  const toggleGroupFilter = () => {
    const idx = groupOptions.indexOf(groupFilter);
    const next = groupOptions[(idx + 1) % groupOptions.length] || "all";
    setGroupFilter(next);
  };
  const unitOptions = React.useMemo(() => {
    const units = Array.from(new Set(rows.map((r) => (r.unit || "—").trim()).filter(Boolean)));
    return ["all", ...units];
  }, [rows]);
  const toggleUnitFilter = () => {
    const idx = unitOptions.indexOf(unitFilter);
    const next = unitOptions[(idx + 1) % unitOptions.length] || "all";
    setUnitFilter(next);
  };
  const sortPill = (active: boolean) => (
    <ArrowUpDown className={cn("ml-1 h-3.5 w-3.5", active ? "text-foreground" : "text-muted-foreground")} />
  );
  const headerSortButton = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center text-xs font-semibold transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {sortPill(active)}
    </button>
  );
  const toggleColumn = (key: StockColumnKey) => {
    setVisibleColumnKeys((current) => {
      if (!current.includes(key)) return [...current, key];
      if (current.length === 1) return current;
      return current.filter((columnKey) => columnKey !== key);
    });
  };
  const openLedger = async (row: ItemRow) => {
    setLedgerItem(row);
    setLedgerOpen(true);
    setLedgerLoading(true);
    try {
      const res = await getItemStockLedger(row.id, {
        from: fromDate.ad ? new Date(fromDate.ad).toISOString() : undefined,
        to: toDate.ad ? new Date(toDate.ad).toISOString() : undefined,
      });
      setLedgerEntries(Array.isArray(res?.entries) ? res.entries : []);
    } catch {
      setLedgerEntries([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const filtered = rows.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (groupFilter !== "all" && (r.parentGroup || "—").trim() !== groupFilter) return false;
    if (unitFilter !== "all" && (r.unit || "—").trim() !== unitFilter) return false;
    if (!q.trim()) return true;
    return `${r.name} ${r.sku ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });
  const alertFiltered = filtered.filter((r) => {
    if (alertFilter === "all") return true;
    if (alertFilter === "belowReorder") return Boolean(r.isLowStock);
    if (alertFilter === "zeroStock") return Number(r.onHandQty ?? r.closingQty ?? 0) <= 0;
    if (alertFilter === "expiringSoon") {
      return Boolean(alerts?.expiringSoon.some((e) => e.itemId === r.id));
    }
    if (alertFilter === "noMovement") {
      return Boolean(alerts?.noMovement.some((e) => e.itemId === r.id));
    }
    return true;
  });
  const sorted = [...alertFiltered].sort((a, b) => {
    switch (sortBy) {
      case "alpha_desc":
        return b.name.localeCompare(a.name);
      case "opening_qty_asc":
        return Number(a.openingQty ?? 0) - Number(b.openingQty ?? 0);
      case "opening_qty_desc":
        return Number(b.openingQty ?? 0) - Number(a.openingQty ?? 0);
      case "opening_rate_asc":
        return Number(a.openingAvgPrice ?? 0) - Number(b.openingAvgPrice ?? 0);
      case "opening_rate_desc":
        return Number(b.openingAvgPrice ?? 0) - Number(a.openingAvgPrice ?? 0);
      case "opening_amt_asc":
        return Number(a.openingAmt ?? 0) - Number(b.openingAmt ?? 0);
      case "opening_amt_desc":
        return Number(b.openingAmt ?? 0) - Number(a.openingAmt ?? 0);
      case "inward_qty_asc":
        return Number(a.purchaseQty ?? 0) - Number(b.purchaseQty ?? 0);
      case "inward_qty_desc":
        return Number(b.purchaseQty ?? 0) - Number(a.purchaseQty ?? 0);
      case "inward_rate_asc":
        return Number(a.purchaseAvgPrice ?? 0) - Number(b.purchaseAvgPrice ?? 0);
      case "inward_rate_desc":
        return Number(b.purchaseAvgPrice ?? 0) - Number(a.purchaseAvgPrice ?? 0);
      case "inward_amt_asc":
        return Number(a.purchaseAmt ?? 0) - Number(b.purchaseAmt ?? 0);
      case "inward_amt_desc":
        return Number(b.purchaseAmt ?? 0) - Number(a.purchaseAmt ?? 0);
      case "outward_qty_asc":
        return Number(a.saleQty ?? 0) - Number(b.saleQty ?? 0);
      case "outward_qty_desc":
        return Number(b.saleQty ?? 0) - Number(a.saleQty ?? 0);
      case "outward_rate_asc":
        return Number(a.saleAvgPrice ?? 0) - Number(b.saleAvgPrice ?? 0);
      case "outward_rate_desc":
        return Number(b.saleAvgPrice ?? 0) - Number(a.saleAvgPrice ?? 0);
      case "outward_amt_asc":
        return Number(a.saleAmt ?? 0) - Number(b.saleAmt ?? 0);
      case "outward_amt_desc":
        return Number(b.saleAmt ?? 0) - Number(a.saleAmt ?? 0);
      case "closing_qty_asc":
        return Number(a.closingQty ?? 0) - Number(b.closingQty ?? 0);
      case "closing_qty_desc":
        return Number(b.closingQty ?? 0) - Number(a.closingQty ?? 0);
      case "closing_price_asc":
        return Number(a.closingPrice ?? 0) - Number(b.closingPrice ?? 0);
      case "closing_price_desc":
        return Number(b.closingPrice ?? 0) - Number(a.closingPrice ?? 0);
      case "closing_amt_asc":
        return Number(a.closingAmt ?? 0) - Number(b.closingAmt ?? 0);
      case "closing_amt_desc":
        return Number(b.closingAmt ?? 0) - Number(a.closingAmt ?? 0);
      case "alpha_asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const allColumns: Record<StockColumnKey, Column<ItemRow>> = {
    sno: {
      key: "sno",
      header: "S.No.",
      align: "center",
      cell: (_r, idx) => (
        <span className="mono-numbers text-muted-foreground">{idx + 1}</span>
      ),
      width: 70,
    },
    sku: {
      key: "sku",
      header: "SKU (Unique ID)",
      cell: (r) => <div className="text-muted-foreground uppercase">{r.sku ?? "—"}</div>,
      width: 120,
    },
    name: {
      key: "name",
      header: headerSortButton("Item Name", sortBy === "alpha_asc" || sortBy === "alpha_desc", () =>
        setSortBy((prev) => (prev === "alpha_asc" ? "alpha_desc" : "alpha_asc"))
      ),
      cell: (r) => (
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-foreground">{r.name}</div>
          <button
            type="button"
            onClick={() => openLedger(r)}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Eye className="h-3.5 w-3.5" />
            Ledger
          </button>
        </div>
      ),
      width: 220,
    },
    hsCode: {
      key: "hsCode",
      header: "HS Code",
      cell: (r) => <div className="text-muted-foreground">{r.hsCode ?? "—"}</div>,
      width: 110,
    },
    type: {
      key: "type",
      header: (
        <button
          type="button"
          onClick={toggleTypeFilter}
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Type: {typeFilter === "all" ? "All" : typeFilter === "goods" ? "Goods" : "Services"}
        </button>
      ),
      cell: (r) => <div className="text-muted-foreground capitalize">{r.type}</div>,
      width: 130
    },
    parentGroup: {
      key: "parentGroup",
      header: (
        <button
          type="button"
          onClick={toggleGroupFilter}
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Group: {groupFilter === "all" ? "All" : groupFilter}
        </button>
      ),
      cell: (r) => <div className="text-muted-foreground">{r.parentGroup ?? "—"}</div>,
      width: 180
    },
    unit: {
      key: "unit",
      header: (
        <button
          type="button"
          onClick={toggleUnitFilter}
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Unit: {unitFilter === "all" ? "All" : unitFilter}
        </button>
      ),
      cell: (r) => <div className="text-muted-foreground">{r.unit ?? "—"}</div>,
      width: 100
    },
    onHandQty: {
      key: "onHandQty",
      header: "On Hand",
      align: "right",
      cell: (r) => <span className="mono-numbers">{Number(r.onHandQty ?? r.closingQty ?? 0)}</span>,
      width: 110
    },
    reservedQty: {
      key: "reservedQty",
      header: "Reserved",
      align: "right",
      cell: (r) => <span className="mono-numbers">{Number(r.reservedQty ?? 0)}</span>,
      width: 100
    },
    availableQty: {
      key: "availableQty",
      header: "Available",
      align: "right",
      cell: (r) => <span className="mono-numbers">{Number(r.availableQty ?? r.closingQty ?? 0)}</span>,
      width: 110
    },
    openingQty: {
      key: "openingQty",
      header: headerSortButton("Opening Qty", sortBy === "opening_qty_asc" || sortBy === "opening_qty_desc", () =>
        setSortBy((prev) => (prev === "opening_qty_asc" ? "opening_qty_desc" : "opening_qty_asc"))
      ),
      align: "right",
      cell: (r) => (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset mono-numbers bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-500/20">
          {r.openingQty || 0}
        </span>
      ),
      width: 110,
    },
    openingAvgPrice: {
      key: "openingAvgPrice",
      header: headerSortButton("Opening Rate", sortBy === "opening_rate_asc" || sortBy === "opening_rate_desc", () =>
        setSortBy((prev) => (prev === "opening_rate_asc" ? "opening_rate_desc" : "opening_rate_asc"))
      ),
      align: "right",
      cell: (r) => <MoneyText value={Number(r.openingAvgPrice ?? 0)} />,
      width: 130,
    },
    openingAmt: {
      key: "openingAmt",
      header: headerSortButton("Opening Amount", sortBy === "opening_amt_asc" || sortBy === "opening_amt_desc", () =>
        setSortBy((prev) => (prev === "opening_amt_asc" ? "opening_amt_desc" : "opening_amt_asc"))
      ),
      align: "right",
      cell: (r) => <MoneyText value={Number(r.openingAmt ?? 0)} />,
      width: 140,
    },
    purchaseQty: {
      key: "purchaseQty",
      header: headerSortButton("Inward Qty", sortBy === "inward_qty_asc" || sortBy === "inward_qty_desc", () =>
        setSortBy((prev) => (prev === "inward_qty_asc" ? "inward_qty_desc" : "inward_qty_asc"))
      ),
      align: "right",
      cell: (r) => <span className="mono-numbers">{r.purchaseQty || 0}</span>,
      width: 110,
    },
    purchaseAvgPrice: {
      key: "purchaseAvgPrice",
      header: headerSortButton("Inward Avg Rate", sortBy === "inward_rate_asc" || sortBy === "inward_rate_desc", () =>
        setSortBy((prev) => (prev === "inward_rate_asc" ? "inward_rate_desc" : "inward_rate_asc"))
      ),
      align: "right",
      cell: (r) => <MoneyText value={Number(r.purchaseAvgPrice ?? 0)} />,
      width: 140,
    },
    purchaseAmt: {
      key: "purchaseAmt",
      header: headerSortButton("Inward Amount", sortBy === "inward_amt_asc" || sortBy === "inward_amt_desc", () =>
        setSortBy((prev) => (prev === "inward_amt_asc" ? "inward_amt_desc" : "inward_amt_asc"))
      ),
      align: "right",
      cell: (r) => <MoneyText value={Number(r.purchaseAmt ?? 0)} />,
      width: 140,
    },
    saleQty: {
      key: "saleQty",
      header: headerSortButton("Outward Qty", sortBy === "outward_qty_asc" || sortBy === "outward_qty_desc", () =>
        setSortBy((prev) => (prev === "outward_qty_asc" ? "outward_qty_desc" : "outward_qty_asc"))
      ),
      align: "right",
      cell: (r) => <span className="mono-numbers">{r.saleQty || 0}</span>,
      width: 110,
    },
    saleAvgPrice: {
      key: "saleAvgPrice",
      header: headerSortButton("Outward Avg Rate", sortBy === "outward_rate_asc" || sortBy === "outward_rate_desc", () =>
        setSortBy((prev) => (prev === "outward_rate_asc" ? "outward_rate_desc" : "outward_rate_asc"))
      ),
      align: "right",
      cell: (r) => <MoneyText value={Number(r.saleAvgPrice ?? 0)} />,
      width: 150,
    },
    saleAmt: {
      key: "saleAmt",
      header: headerSortButton("Outward Amount", sortBy === "outward_amt_asc" || sortBy === "outward_amt_desc", () =>
        setSortBy((prev) => (prev === "outward_amt_asc" ? "outward_amt_desc" : "outward_amt_asc"))
      ),
      align: "right",
      cell: (r) => <MoneyText value={Number(r.saleAmt ?? 0)} />,
      width: 140,
    },
    closingQty: {
      key: "closingQty",
      header: headerSortButton("Closing Quantity", sortBy === "closing_qty_asc" || sortBy === "closing_qty_desc", () =>
        setSortBy((prev) => (prev === "closing_qty_asc" ? "closing_qty_desc" : "closing_qty_asc"))
      ),
      align: "right",
      cell: (r) => (
        <span className={cn(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mono-numbers",
          (r.closingQty || 0) < 10
            ? "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/20 dark:text-red-400"
            : "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400"
        )}>
          {Number(r.closingQty ?? 0)}
        </span>
      ),
      width: 140,
    },
    closingPrice: {
      key: "closingPrice",
      header: headerSortButton("Closing Price", sortBy === "closing_price_asc" || sortBy === "closing_price_desc", () =>
        setSortBy((prev) => (prev === "closing_price_asc" ? "closing_price_desc" : "closing_price_asc"))
      ),
      align: "right",
      cell: (r) => <MoneyText value={Number(r.closingPrice ?? 0)} />,
      width: 120,
    },
    closingAmt: {
      key: "closingAmt",
      header: headerSortButton("Closing Amount", sortBy === "closing_amt_asc" || sortBy === "closing_amt_desc", () =>
        setSortBy((prev) => (prev === "closing_amt_asc" ? "closing_amt_desc" : "closing_amt_asc"))
      ),
      align: "right",
      cell: (r) => <MoneyText value={Number(r.closingAmt ?? 0)} />,
      width: 140,
    },
  };

  const computedVisibleKeys = React.useMemo(() => {
    const selected = new Set(visibleColumnKeys);
    const base = visibleColumnKeys.filter((key) => !DEPENDENT_STOCK_KEYS.includes(key));
    if (selected.has(MASTER_STOCK_KEY)) {
      return [...base, ...DEPENDENT_STOCK_KEYS];
    }
    return base;
  }, [visibleColumnKeys]);

  const columns: Column<ItemRow>[] = computedVisibleKeys.map((key) => allColumns[key]).filter(Boolean);

  const goodsRows = rows.filter((r) => r.type === "goods");

  const applyAlertFilter = (next: AlertFilter) => {
    setAlertFilter((prev) => (prev === next ? "all" : next));
  };

  const submitAdjustment = async () => {
    setActionError(null);
    setActionSuccess(null);
    if (!adjustForm.itemId || !adjustForm.accountId || !adjustForm.date) {
      setActionError("Item, account and date are required.");
      return;
    }
    const qty = Number(adjustForm.qty);
    if (!Number.isFinite(qty) || qty === 0) {
      setActionError("Quantity must be non-zero.");
      return;
    }
    setAdjustSubmitting(true);
    try {
      await adjustInventoryStock({
        itemId: adjustForm.itemId,
        accountId: adjustForm.accountId,
        date: adjustForm.date,
        qty,
        rate: adjustForm.rate ? Number(adjustForm.rate) : undefined,
        memo: adjustForm.memo || undefined,
        batchNo: adjustForm.batchNo || undefined,
        lotNo: adjustForm.lotNo || undefined,
        expiryDate: adjustForm.expiryDate || undefined,
        allowNegativeOverride: adjustForm.allowNegativeOverride || undefined,
        overrideReason: adjustForm.allowNegativeOverride ? adjustForm.overrideReason || undefined : undefined,
      });
      setActionSuccess("Stock adjustment posted.");
      setAdjustOpen(false);
      await refresh();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to post stock adjustment.");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const submitTransfer = async () => {
    setActionError(null);
    setActionSuccess(null);
    if (!transferForm.itemId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.date) {
      setActionError("Item, source warehouse, destination warehouse and date are required.");
      return;
    }
    const qty = Number(transferForm.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setActionError("Transfer quantity must be greater than zero.");
      return;
    }
    setTransferSubmitting(true);
    try {
      await transferInventoryStock({
        itemId: transferForm.itemId,
        fromWarehouseId: transferForm.fromWarehouseId,
        fromBinId: transferForm.fromBinId || undefined,
        toWarehouseId: transferForm.toWarehouseId,
        toBinId: transferForm.toBinId || undefined,
        qty,
        rate: transferForm.rate ? Number(transferForm.rate) : undefined,
        date: transferForm.date,
        memo: transferForm.memo || undefined,
        batchNo: transferForm.batchNo || undefined,
        lotNo: transferForm.lotNo || undefined,
        expiryDate: transferForm.expiryDate || undefined,
      });
      setActionSuccess("Stock transfer posted.");
      setTransferOpen(false);
      await refresh();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to post stock transfer.");
    } finally {
      setTransferSubmitting(false);
    }
  };

  const buildExportRows = () => {
    const columnsForExport = visibleColumnKeys;
    const header = columnsForExport.map((key) => STOCK_COLUMN_OPTIONS.find((c) => c.key === key)?.label ?? String(key));
    const lineRows = sorted.map((r, idx) =>
      columnsForExport.map((key) => {
        switch (key) {
          case "sno": return idx + 1;
          case "sku": return r.sku ?? "";
          case "name": return r.name;
          case "hsCode": return r.hsCode ?? "";
          case "type": return r.type;
          case "parentGroup": return r.parentGroup ?? "";
          case "unit": return r.unit ?? "";
          case "onHandQty": return Number(r.onHandQty ?? 0);
          case "reservedQty": return Number(r.reservedQty ?? 0);
          case "availableQty": return Number(r.availableQty ?? 0);
          case "openingQty": return Number(r.openingQty ?? 0);
          case "openingAvgPrice": return Number(r.openingAvgPrice ?? 0);
          case "openingAmt": return Number(r.openingAmt ?? 0);
          case "purchaseQty": return Number(r.purchaseQty ?? 0);
          case "purchaseAvgPrice": return Number(r.purchaseAvgPrice ?? 0);
          case "purchaseAmt": return Number(r.purchaseAmt ?? 0);
          case "saleQty": return Number(r.saleQty ?? 0);
          case "saleAvgPrice": return Number(r.saleAvgPrice ?? 0);
          case "saleAmt": return Number(r.saleAmt ?? 0);
          case "closingQty": return Number(r.closingQty ?? 0);
          case "closingPrice": return Number(r.closingPrice ?? 0);
          case "closingAmt": return Number(r.closingAmt ?? 0);
          default: return "";
        }
      })
    );
    return { header, lineRows };
  };

  const saveBlob = async (blob: Blob, fileName: string) => {
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
        // Fall back to default download behavior if user cancels or API errors.
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportRowsCsv = async () => {
    const { header, lineRows } = buildExportRows();
    const csv = [header, ...lineRows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    await saveBlob(blob, `inventory_export_${toIsoDate(new Date())}.csv`);
    setExportMenuOpen(false);
    setActionSuccess(`Exported ${sorted.length} rows as CSV.`);
  };

  const exportRowsExcel = async () => {
    const { header, lineRows } = buildExportRows();
    const XLSX = await import("xlsx");
    const data = lineRows.map((row) =>
      Object.fromEntries(header.map((h, i) => [h, row[i]]))
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    const output = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await saveBlob(blob, `inventory_export_${toIsoDate(new Date())}.xlsx`);
    setExportMenuOpen(false);
    setActionSuccess(`Exported ${sorted.length} rows as Excel.`);
  };

  const exportRowsPdf = async () => {
    const { header, lineRows } = buildExportRows();
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    doc.setFontSize(11);
    doc.text(`Items Inventory Export - ${toIsoDate(new Date())}`, 40, 32);
    autoTable(doc, {
      head: [header],
      body: lineRows.map((row) => row.map((c) => String(c ?? ""))),
      startY: 44,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [31, 41, 55] },
      margin: { left: 20, right: 20 },
    });
    const pdfBlob = doc.output("blob");
    await saveBlob(pdfBlob, `inventory_export_${toIsoDate(new Date())}.pdf`);
    setExportMenuOpen(false);
    setActionSuccess(`Exported ${sorted.length} rows as PDF.`);
  };

  const handleImportFile = async (file?: File | null) => {
    if (!file) return;
    setActionError(null);
    setActionSuccess(null);
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) throw new Error("CSV has no data rows.");
      const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
      const idx = (keys: string[]) => headers.findIndex((h) => keys.includes(h));
      const nameIdx = idx(["name", "itemname"]);
      if (nameIdx < 0) throw new Error("CSV must include a 'name' or 'item name' column.");
      const skuIdx = idx(["sku", "code"]);
      const hsIdx = idx(["hscode", "hs"]);
      const unitIdx = idx(["unit"]);
      const typeIdx = idx(["type"]);
      const salesIdx = idx(["salesprice", "saleprice"]);
      const purchaseIdx = idx(["purchaseprice", "buyprice"]);
      const reorderIdx = idx(["reorderlevel", "reorder"]);
      const safetyIdx = idx(["safetystock", "safety"]);
      const openingQtyIdx = idx(["openingqty", "openingquantity"]);
      const openingPriceIdx = idx(["openingprice", "openingrate"]);

      let success = 0;
      let failed = 0;
      for (let i = 1; i < lines.length; i += 1) {
        const cols = parseCsvLine(lines[i]);
        const name = (cols[nameIdx] || "").trim();
        if (!name) continue;
        try {
          await createItem({
            name,
            sku: skuIdx >= 0 ? (cols[skuIdx] || "").trim() || undefined : undefined,
            hsCode: hsIdx >= 0 ? (cols[hsIdx] || "").trim() || undefined : undefined,
            unit: unitIdx >= 0 ? (cols[unitIdx] || "").trim() || undefined : undefined,
            type: typeIdx >= 0 && (cols[typeIdx] || "").trim().toLowerCase() === "services" ? "services" : "goods",
            salesPrice: salesIdx >= 0 && cols[salesIdx] ? Number(cols[salesIdx]) : undefined,
            purchasePrice: purchaseIdx >= 0 && cols[purchaseIdx] ? Number(cols[purchaseIdx]) : undefined,
            reorderLevel: reorderIdx >= 0 && cols[reorderIdx] ? Number(cols[reorderIdx]) : undefined,
            safetyStock: safetyIdx >= 0 && cols[safetyIdx] ? Number(cols[safetyIdx]) : undefined,
            openingQty: openingQtyIdx >= 0 && cols[openingQtyIdx] ? Number(cols[openingQtyIdx]) : undefined,
            openingPrice: openingPriceIdx >= 0 && cols[openingPriceIdx] ? Number(cols[openingPriceIdx]) : undefined,
          });
          success += 1;
        } catch {
          failed += 1;
        }
      }
      await refresh();
      setActionSuccess(`Import complete. Created: ${success}, Failed: ${failed}.`);
      if (failed > 0) setActionError("Some rows failed (likely duplicate name or invalid numeric values).");
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to import CSV.");
    } finally {
      setImporting(false);
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  const downloadImportTemplate = async () => {
    const header = [
      "Item Name",
      "SKU",
      "HS Code",
      "Unit",
      "Type",
      "Sales Price",
      "Purchase Price",
      "Reorder Level",
      "Safety Stock",
      "Opening Qty",
      "Opening Price"
    ];
    const sampleRows = [
      ["Premium Rice 25kg", "RICE-25", "100630", "Bag", "goods", "2300", "2100", "15", "10", "120", "2050"],
      ["Consulting Service", "SERV-CONSULT", "", "Hour", "services", "1500", "0", "0", "0", "0", "0"]
    ];
    const csv = [header, ...sampleRows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    await saveBlob(blob, "inventory_import_template.csv");
    setActionSuccess("Import template downloaded.");
  };

  return (
    <div className="relative isolate space-y-6">
      {popupOpen ? (
        <div
          className="fixed inset-0 z-[1000] bg-white/35 backdrop-blur-md dark:bg-slate-950/55"
          onClick={() => {
            setDateMenuOpen(false);
            setColumnsMenuOpen(false);
            setExportMenuOpen(false);
          }}
        />
      ) : null}
      <PageHeader
        title="Items Inventory"
        description="Manage your product catalog, prices, and stock levels."
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={importFileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                void handleImportFile(e.target.files?.[0] || null);
              }}
            />
            <Button variant="outline" className="rounded-xl border-border/50" onClick={() => setAdjustOpen(true)}>
              Adjust Stock
            </Button>
            <Button variant="outline" className="rounded-xl border-border/50" onClick={() => setTransferOpen(true)}>
              Transfer Stock
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-border/50"
              onClick={() => importFileRef.current?.click()}
              disabled={importing}
              title="Import CSV"
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importing..." : "Import CSV"}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-border/50"
              onClick={() => { void downloadImportTemplate(); }}
              title="Download CSV import template"
            >
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
            <div ref={exportMenuWrapRef} className="relative">
            <Button
              variant="outline"
              className="rounded-xl border-border/50"
              onClick={() => {
                setDateMenuOpen(false);
                setColumnsMenuOpen(false);
                setExportMenuOpen((v) => !v);
              }}
              title="Export"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {exportMenuOpen && createPortal(
              <div
                className="fixed z-[1300] w-72 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl dark:border-slate-800/90 dark:bg-slate-950"
                style={{
                  top: (exportMenuWrapRef.current?.getBoundingClientRect().bottom || 0) + window.scrollY,
                  left: (exportMenuWrapRef.current?.getBoundingClientRect().left || 0) + window.scrollX,
                }}
              >
                <div className="px-3 text-xs uppercase tracking-widest text-muted-foreground">Export Options</div>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                <button type="button" onClick={() => { void exportRowsCsv(); }} className="flex w-full items-center justify-between rounded-lg p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span>CSV (.csv)</span><Download className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { void exportRowsExcel(); }} className="flex w-full items-center justify-between rounded-lg p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span>Excel (.xlsx)</span><Download className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { void exportRowsPdf(); }} className="flex w-full items-center justify-between rounded-lg p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span>PDF (.pdf)</span><Download className="h-4 w-4" />
                </button>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                <div className="px-3 pb-1 text-[11px] text-muted-foreground">
                  You can choose a save location if your browser/desktop runtime supports file picker.
                </div>
              </div>,
              document.body
            )}
            </div>
            <Button variant="outline" onClick={() => setAddGroupOpen(true)} className="rounded-xl border-border/50">
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
            <Button onClick={() => setAddItemOpen(true)} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Items</div>
            <div className="mt-2 text-2xl font-black">{rows.length}</div>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Low Stock (Goods)</div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
              {goodsRows.filter((r) => Boolean(r.isLowStock)).length}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Total Value (Goods)</div>
            <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
              <MoneyText value={goodsRows.reduce((sum, r) => sum + Number(r.closingAmt ?? 0), 0)} />
            </div>
          </div>
        </div>
        {alerts ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" onClick={() => applyAlertFilter("belowReorder")} className={cn("rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3 text-left dark:border-amber-900/40 dark:bg-amber-950/20", alertFilter === "belowReorder" && "ring-2 ring-amber-400")}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Below Reorder</div>
              <div className="mt-1 text-lg font-black text-amber-800 dark:text-amber-300">{alerts.counts.belowReorder}</div>
            </button>
            <button type="button" onClick={() => applyAlertFilter("zeroStock")} className={cn("rounded-xl border border-red-200/70 bg-red-50/50 px-4 py-3 text-left dark:border-red-900/40 dark:bg-red-950/20", alertFilter === "zeroStock" && "ring-2 ring-red-400")}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400">Zero Stock</div>
              <div className="mt-1 text-lg font-black text-red-800 dark:text-red-300">{alerts.counts.zeroStock}</div>
            </button>
            <button type="button" onClick={() => applyAlertFilter("expiringSoon")} className={cn("rounded-xl border border-blue-200/70 bg-blue-50/50 px-4 py-3 text-left dark:border-blue-900/40 dark:bg-blue-950/20", alertFilter === "expiringSoon" && "ring-2 ring-blue-400")}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">Expiring Soon</div>
              <div className="mt-1 text-lg font-black text-blue-800 dark:text-blue-300">{alerts.counts.expiringSoon}</div>
            </button>
            <button type="button" onClick={() => applyAlertFilter("noMovement")} className={cn("rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-900/40", alertFilter === "noMovement" && "ring-2 ring-slate-400")}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">No Movement</div>
              <div className="mt-1 text-lg font-black text-slate-800 dark:text-slate-200">{alerts.counts.noMovement}</div>
            </button>
          </div>
        ) : null}

        <div
          className={cn(
            "flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-950",
            popupOpen && "pointer-events-none select-none blur-[3px] opacity-70"
          )}
        >
          <FiltersBar
            className="bg-transparent p-0 mb-0"
            left={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, SKU..."
                    className="pl-9"
                  />
                </div>
                <div ref={dateMenuWrapRef} className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl px-3 text-xs font-semibold"
                    onClick={() => {
                      setColumnsMenuOpen(false);
                      setDateMenuOpen((v) => !v);
                    }}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {activeDatePreset ? DATE_PRESET_LABELS[activeDatePreset] : "Date Filter"}
                  </Button>
                  {dateMenuOpen && createPortal(
                    <div className="fixed z-[1300] w-[420px] p-2 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-md bg-white dark:bg-slate-950 opacity-100" style={{top: (dateMenuWrapRef.current?.getBoundingClientRect().bottom || 0) + window.scrollY, left: (dateMenuWrapRef.current?.getBoundingClientRect().left || 0) + window.scrollX}} >
                      <div className="px-3 text-xs uppercase tracking-widest text-muted-foreground">Date Presets</div>
                      <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {DATE_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => applyDatePreset(preset)}
                            className={cn(
                              "rounded-lg border px-2 py-2 text-xs font-semibold text-left",
                              activeDatePreset === preset
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                                : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
                            )}
                          >
                            {DATE_PRESET_LABELS[preset]}
                          </button>
                        ))}
                      </div>
                      <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                      <div className="p-2">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Custom</div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <DualDateInput
                            label="From"
                            value={fromDate}
                            onChange={(next) => {
                              setFromDate(next);
                              setActiveDatePreset(null);
                            }}
                            accentColor="bg-indigo-600"
                            className="space-y-0"
                          />
                          <DualDateInput
                            label="To"
                            value={toDate}
                            onChange={(next) => {
                              setToDate(next);
                              setActiveDatePreset(null);
                            }}
                            accentColor="bg-indigo-600"
                            className="space-y-0"
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearDates}
                            disabled={!fromDate.ad && !toDate.ad}
                            className="h-9 rounded-lg px-3 text-xs"
                          >
                            <X className="mr-1.5 h-3.5 w-3.5" />
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                    , document.body)}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetAllFilters}
                    className="h-10 rounded-xl px-3 text-xs font-semibold whitespace-nowrap"
                    title="Reset all filters"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>
              </div>
            }
            right={
              <div ref={columnsMenuWrapRef} className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 rounded-md px-3 text-xs"
                  onClick={() => {
                    setDateMenuOpen(false);
                    setColumnsMenuOpen((v) => !v);
                  }}
                >
                  <Columns className="mr-2 h-4 w-4" />
                  Columns
                </Button>
                {columnsMenuOpen && createPortal(
                  <div className="fixed z-[1300] w-72 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl dark:border-slate-800/90 dark:bg-slate-950 opacity-100" style={{top: (columnsMenuWrapRef.current?.getBoundingClientRect().top || 0) + window.scrollY - 20, left: (columnsMenuWrapRef.current?.getBoundingClientRect().right || 0) + window.scrollX - 288}} >
                    <div className="px-3 text-xs uppercase tracking-widest text-muted-foreground">
                      Visible Columns
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                    <div className="relative max-h-[360px] overflow-y-auto pr-1">
                      {COLUMN_PICKER_OPTIONS.map((column) => {
                        const selected = visibleColumnKeys.includes(column.key);
                        const displayLabel =
                          column.key === MASTER_STOCK_KEY
                            ? "Show Reserved + Available"
                            : column.label;
                        return (
                          <button
                            key={column.key}
                            type="button"
                            onClick={() => toggleColumn(column.key)}
                            className="relative z-10 flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <span className="min-w-0 flex-1 whitespace-normal break-words leading-5 text-sm text-slate-700 dark:text-slate-200">
                              {displayLabel}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 flex h-5 w-5 items-center justify-center rounded border",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border"
                              )}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={showAllColumns}
                        className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Show all
                      </button>
                      <button
                        type="button"
                        onClick={resetColumns}
                        className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Default
                      </button>
                      <button
                        type="button"
                        onClick={() => setColumnsMenuOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                  , document.body)}
              </div>
            }
          />
          {error ? (
            <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {actionError ? (
            <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
              {actionError}
            </div>
          ) : null}
          {actionSuccess ? (
            <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">
              {actionSuccess}
            </div>
          ) : null}
          {alertFilter !== "all" ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
              <span>Alert filter active: {alertFilter}</span>
              <Button variant="outline" size="sm" onClick={() => setAlertFilter("all")}>Clear</Button>
            </div>
          ) : null}
          <DataTable
            rows={sorted}
            columns={columns}
            loading={loading}
            className={cn(
              "border-0 shadow-none",
              popupOpen && "opacity-0 pointer-events-none select-none"
            )}
          />
        </div>
      </div>

      <AddItemDialog
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        onSuccess={() => {
          refresh();
        }}
      />

      <AddGroupDialog
        open={addGroupOpen}
        onClose={() => setAddGroupOpen(false)}
        onSuccess={() => {
          // No need to refresh stock report but could refresh group list if we had one
        }}
      />
      {adjustOpen ? (
        <div className="fixed inset-0 z-[1600] bg-black/30 backdrop-blur-sm p-4" onClick={() => setAdjustOpen(false)}>
          <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold">Stock Adjustment</div>
              <Button size="sm" variant="outline" onClick={() => setAdjustOpen(false)}>Close</Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input placeholder="Date (YYYY-MM-DD)" value={adjustForm.date} onChange={(e) => setAdjustForm((p) => ({ ...p, date: e.target.value }))} />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={adjustForm.itemId} onChange={(e) => setAdjustForm((p) => ({ ...p, itemId: e.target.value }))}>
                <option value="">Select item</option>
                {goodsRows.map((r) => <option key={r.id} value={r.id}>{r.name}{r.sku ? ` (${r.sku})` : ""}</option>)}
              </select>
              <Input placeholder="Quantity (+in / -out)" value={adjustForm.qty} onChange={(e) => setAdjustForm((p) => ({ ...p, qty: e.target.value }))} />
              <Input placeholder="Rate (optional)" value={adjustForm.rate} onChange={(e) => setAdjustForm((p) => ({ ...p, rate: e.target.value }))} />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm sm:col-span-2" value={adjustForm.accountId} onChange={(e) => setAdjustForm((p) => ({ ...p, accountId: e.target.value }))}>
                <option value="">Select offset account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <Input placeholder="Batch no (optional)" value={adjustForm.batchNo} onChange={(e) => setAdjustForm((p) => ({ ...p, batchNo: e.target.value }))} />
              <Input placeholder="Lot no (optional)" value={adjustForm.lotNo} onChange={(e) => setAdjustForm((p) => ({ ...p, lotNo: e.target.value }))} />
              <Input placeholder="Expiry (YYYY-MM-DD, optional)" value={adjustForm.expiryDate} onChange={(e) => setAdjustForm((p) => ({ ...p, expiryDate: e.target.value }))} />
              <Input placeholder="Memo (optional)" value={adjustForm.memo} onChange={(e) => setAdjustForm((p) => ({ ...p, memo: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={adjustForm.allowNegativeOverride} onChange={(e) => setAdjustForm((p) => ({ ...p, allowNegativeOverride: e.target.checked }))} />
                Allow negative override
              </label>
              {adjustForm.allowNegativeOverride ? (
                <Input className="sm:col-span-2" placeholder="Override reason" value={adjustForm.overrideReason} onChange={(e) => setAdjustForm((p) => ({ ...p, overrideReason: e.target.value }))} />
              ) : null}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={submitAdjustment} disabled={adjustSubmitting}>{adjustSubmitting ? "Posting..." : "Post Adjustment"}</Button>
            </div>
          </div>
        </div>
      ) : null}
      {transferOpen ? (
        <div className="fixed inset-0 z-[1600] bg-black/30 backdrop-blur-sm p-4" onClick={() => setTransferOpen(false)}>
          <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold">Stock Transfer</div>
              <Button size="sm" variant="outline" onClick={() => setTransferOpen(false)}>Close</Button>
            </div>
            <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              Enter warehouse and bin IDs directly. Warehouse master UI endpoints are not yet exposed in desktop API.
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input placeholder="Date (YYYY-MM-DD)" value={transferForm.date} onChange={(e) => setTransferForm((p) => ({ ...p, date: e.target.value }))} />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={transferForm.itemId} onChange={(e) => setTransferForm((p) => ({ ...p, itemId: e.target.value }))}>
                <option value="">Select item</option>
                {goodsRows.map((r) => <option key={r.id} value={r.id}>{r.name}{r.sku ? ` (${r.sku})` : ""}</option>)}
              </select>
              <Input placeholder="From warehouse ID" value={transferForm.fromWarehouseId} onChange={(e) => setTransferForm((p) => ({ ...p, fromWarehouseId: e.target.value }))} />
              <Input placeholder="To warehouse ID" value={transferForm.toWarehouseId} onChange={(e) => setTransferForm((p) => ({ ...p, toWarehouseId: e.target.value }))} />
              <Input placeholder="From bin ID (optional)" value={transferForm.fromBinId} onChange={(e) => setTransferForm((p) => ({ ...p, fromBinId: e.target.value }))} />
              <Input placeholder="To bin ID (optional)" value={transferForm.toBinId} onChange={(e) => setTransferForm((p) => ({ ...p, toBinId: e.target.value }))} />
              <Input placeholder="Quantity" value={transferForm.qty} onChange={(e) => setTransferForm((p) => ({ ...p, qty: e.target.value }))} />
              <Input placeholder="Rate (optional)" value={transferForm.rate} onChange={(e) => setTransferForm((p) => ({ ...p, rate: e.target.value }))} />
              <Input placeholder="Batch no (optional)" value={transferForm.batchNo} onChange={(e) => setTransferForm((p) => ({ ...p, batchNo: e.target.value }))} />
              <Input placeholder="Lot no (optional)" value={transferForm.lotNo} onChange={(e) => setTransferForm((p) => ({ ...p, lotNo: e.target.value }))} />
              <Input placeholder="Expiry (YYYY-MM-DD, optional)" value={transferForm.expiryDate} onChange={(e) => setTransferForm((p) => ({ ...p, expiryDate: e.target.value }))} />
              <Input placeholder="Memo (optional)" value={transferForm.memo} onChange={(e) => setTransferForm((p) => ({ ...p, memo: e.target.value }))} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={submitTransfer} disabled={transferSubmitting}>{transferSubmitting ? "Posting..." : "Post Transfer"}</Button>
            </div>
          </div>
        </div>
      ) : null}
      {ledgerOpen ? (
        <div className="fixed inset-0 z-[1600] bg-black/30 backdrop-blur-sm p-4" onClick={() => setLedgerOpen(false)}>
          <div
            className="mx-auto mt-10 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Stock Movement Timeline</div>
                <div className="text-xs text-muted-foreground">{ledgerItem?.name} {ledgerItem?.sku ? `(${ledgerItem.sku})` : ""}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setLedgerOpen(false)}>Close</Button>
            </div>
            <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Voucher</th>
                    <th className="p-2 text-right">In</th>
                    <th className="p-2 text-right">Out</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerLoading ? (
                    <tr><td className="p-3 text-center text-muted-foreground" colSpan={6}>Loading…</td></tr>
                  ) : ledgerEntries.length === 0 ? (
                    <tr><td className="p-3 text-center text-muted-foreground" colSpan={6}>No movements found.</td></tr>
                  ) : ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="p-2">{String(entry.date).slice(0, 10)}</td>
                      <td className="p-2">
                        <span>{entry.voucherNumber || "Opening"}</span>
                        {entry.voucherType ? <span className="ml-1 text-xs text-muted-foreground">({entry.voucherType})</span> : null}
                      </td>
                      <td className="p-2 text-right mono-numbers">{entry.qtyIn || 0}</td>
                      <td className="p-2 text-right mono-numbers">{entry.qtyOut || 0}</td>
                      <td className="p-2 text-right mono-numbers">{entry.rate || 0}</td>
                      <td className="p-2 text-right mono-numbers">{entry.amount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
