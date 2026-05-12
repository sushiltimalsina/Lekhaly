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
import { createItem, listItems, assembleItem, disassembleItem } from "@/lib/api/items";
import { createItemGroup, listItemGroups } from "@/lib/api/item-groups";
import { createUnit, listUnits } from "@/lib/api/units";
import {
  adjustInventoryStock,
  getInventoryAlerts,
  getInventorySettings,
  getItemStockLedger,
  getStockReport,
  InventoryAlerts,
  type InventorySettings,
  StockLedgerEntry,
  StockReportRow,
  transferInventoryStock,
} from "@/lib/api/inventory";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";
import { inventoryFeatures } from "@/lib/inventory-features";

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
const STOCK_METRIC_KEYS: StockColumnKey[] = [
  "onHandQty",
  "reservedQty",
  "availableQty",
  "openingQty",
  "openingAvgPrice",
  "openingAmt",
  "purchaseQty",
  "purchaseAvgPrice",
  "purchaseAmt",
  "saleQty",
  "saleAvgPrice",
  "saleAmt",
  "closingQty",
  "closingPrice",
  "closingAmt",
];
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

const IMPORT_FIELDS: Array<{ key: ImportFieldKey; label: string; required?: boolean }> = [
  { key: "name", label: "Item Name", required: true },
  { key: "sku", label: "SKU (Unique ID)" },
  { key: "hsCode", label: "HS Code" },
  { key: "unit", label: "Unit" },
  { key: "group", label: "Group" },
  { key: "type", label: "Type (goods/services)" },
  { key: "salesPrice", label: "Sales Price" },
  { key: "purchasePrice", label: "Purchase Price" },
  { key: "reorderLevel", label: "Reorder Level" },
  { key: "safetyStock", label: "Safety Stock" },
  { key: "openingQty", label: "Opening Qty" },
  { key: "openingPrice", label: "Opening Price" },
];

type InventoryAccount = { id: string; name: string };
type ImportFieldKey =
  | "name"
  | "sku"
  | "hsCode"
  | "unit"
  | "group"
  | "type"
  | "salesPrice"
  | "purchasePrice"
  | "reorderLevel"
  | "safetyStock"
  | "openingQty"
  | "openingPrice";

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
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [transferSubmitting, setTransferSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  // Assemble / Disassemble
  const [assembleOpen, setAssembleOpen] = React.useState(false);
  const [assembleItem_, setAssembleItem] = React.useState<ItemRow | null>(null);
  const [assembleQty, setAssembleQty] = React.useState("");
  const [assembleMemo, setAssembleMemo] = React.useState("");
  const [assembleMode, setAssembleMode] = React.useState<"assemble" | "disassemble">("assemble");
  const [assembleSubmitting, setAssembleSubmitting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [importWizardOpen, setImportWizardOpen] = React.useState(false);
  const [importStep, setImportStep] = React.useState<1 | 2 | 3>(1);
  const [importHeaders, setImportHeaders] = React.useState<string[]>([]);
  const [importRows, setImportRows] = React.useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = React.useState<Partial<Record<ImportFieldKey, number>>>({});
  const [duplicateRule, setDuplicateRule] = React.useState<"create_only" | "skip_existing">("skip_existing");
  const [autoCreateMasters, setAutoCreateMasters] = React.useState(true);
  const [importSummary, setImportSummary] = React.useState<{ created: number; skipped: number; failed: number } | null>(null);
  const [importRowIssues, setImportRowIssues] = React.useState<Array<{ row: number; message: string }>>([]);
  const [importFailedRows, setImportFailedRows] = React.useState<Array<{ row: number; values: string[]; reason: string }>>([]);
  const [previewPage, setPreviewPage] = React.useState(1);
  const [previewPageSize, setPreviewPageSize] = React.useState(100);
  const [previewErrorsOnly, setPreviewErrorsOnly] = React.useState(false);
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
  const popupOpen = dateMenuOpen || columnsMenuOpen || exportMenuOpen || adjustOpen || transferOpen || importWizardOpen;
  const features = inventoryFeatures(inventorySettings);
  const defaultVisibleColumnKeys = React.useMemo(
    () => features.inventory ? DEFAULT_VISIBLE_STOCK_COLUMNS : DEFAULT_VISIBLE_STOCK_COLUMNS.filter((key) => !STOCK_METRIC_KEYS.includes(key)),
    [features.inventory]
  );
  const allVisibleColumnKeys = React.useMemo(
    () => features.inventory ? ALL_STOCK_COLUMNS : ALL_STOCK_COLUMNS.filter((key) => !STOCK_METRIC_KEYS.includes(key)),
    [features.inventory]
  );
  const columnPickerOptions = React.useMemo(
    () => features.inventory ? COLUMN_PICKER_OPTIONS : COLUMN_PICKER_OPTIONS.filter((column) => !STOCK_METRIC_KEYS.includes(column.key)),
    [features.inventory]
  );

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

  React.useEffect(() => {
    let cancelled = false;
    getInventorySettings()
      .then((settings) => { if (!cancelled) setInventorySettings(settings); })
      .catch(() => { if (!cancelled) setInventorySettings(null); });
    return () => { cancelled = true; };
  }, []);

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
    if (!features.inventory) {
      setAlerts(null);
      setAlertFilter("all");
      return;
    }
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
  }, [rows.length, features.inventory]);

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
    setVisibleColumnKeys(defaultVisibleColumnKeys);
    setColumnsMenuOpen(false);
  };
  const showAllColumns = () => {
    setVisibleColumnKeys(allVisibleColumnKeys);
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
    setVisibleColumnKeys(defaultVisibleColumnKeys);
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
    if (!features.inventory) return;
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
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground leading-none">{r.name}</span>
            {features.kits && Boolean((r as any).isKit) && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 ring-1 ring-purple-300/50">
                KIT
              </span>
            )}
            {features.serial && Boolean((r as any).isSerialized) && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 ring-1 ring-blue-300/50">
                SERIAL
              </span>
            )}
            {features.inventory && Boolean((r as any).isLowStock) && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400 ring-1 ring-red-300/50">
                LOW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {features.inventory && (
              <button
                type="button"
                onClick={() => openLedger(r)}
                className="inline-flex h-6 items-center gap-1 rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <Eye className="h-3 w-3" />
                Ledger
              </button>
            )}
            {features.kits && Boolean((r as any).isKit) && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAssembleItem(r);
                    setAssembleMode("assemble");
                    setAssembleQty("1");
                    setAssembleMemo("");
                    setAssembleOpen(true);
                  }}
                  className="inline-flex h-6 items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 text-[10px] font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 transition-colors"
                >
                  ▲ Assemble
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssembleItem(r);
                    setAssembleMode("disassemble");
                    setAssembleQty("1");
                    setAssembleMemo("");
                    setAssembleOpen(true);
                  }}
                  className="inline-flex h-6 items-center gap-1 rounded border border-slate-200 px-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  ▼ Disassemble
                </button>
              </>
            )}
          </div>
        </div>
      ),
      width: 280,
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
      header: headerSortButton("Closing Qty", sortBy === "closing_qty_asc" || sortBy === "closing_qty_desc", () =>
        setSortBy((prev) => (prev === "closing_qty_asc" ? "closing_qty_desc" : "closing_qty_asc"))
      ),
      align: "right",
      cell: (r) => {
        const qty = Number(r.closingQty ?? 0);
        const minStock = Number((r as any).minStockLevel ?? 0);
        const isLow = (r as any).isLowStock || (minStock > 0 && qty < minStock);
        const isZero = qty <= 0;
        return (
          <span className={cn(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mono-numbers",
            isZero
              ? "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/20 dark:text-red-400"
              : isLow
              ? "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-900/20 dark:text-amber-400"
              : "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400"
          )}>
            {qty}
            {isLow && !isZero && <span className="ml-1 text-[9px] opacity-70">▼min</span>}
          </span>
        );
      },
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
    const configuredKeys = features.inventory ? visibleColumnKeys : visibleColumnKeys.filter((key) => !STOCK_METRIC_KEYS.includes(key));
    const selected = new Set(configuredKeys);
    const base = configuredKeys.filter((key) => !DEPENDENT_STOCK_KEYS.includes(key));
    if (selected.has(MASTER_STOCK_KEY)) {
      return [...base, ...DEPENDENT_STOCK_KEYS];
    }
    return base;
  }, [visibleColumnKeys, features.inventory]);

  const columns: Column<ItemRow>[] = computedVisibleKeys.map((key) => allColumns[key]).filter(Boolean);

  const goodsRows = rows.filter((r) => r.type === "goods");

  const applyAlertFilter = (next: AlertFilter) => {
    setAlertFilter((prev) => (prev === next ? "all" : next));
  };

  const submitAdjustment = async () => {
    setActionError(null);
    setActionSuccess(null);
    if (!features.inventory) {
      setActionError("Enable Inventory Tracking in Configuration to adjust stock.");
      return;
    }
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
        batchNo: features.batch ? adjustForm.batchNo || undefined : undefined,
        lotNo: features.lot ? adjustForm.lotNo || undefined : undefined,
        expiryDate: features.expiry ? adjustForm.expiryDate || undefined : undefined,
        allowNegativeOverride: features.negativeStock && adjustForm.allowNegativeOverride ? true : undefined,
        overrideReason: features.negativeStock && adjustForm.allowNegativeOverride ? adjustForm.overrideReason || undefined : undefined,
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
    if (!features.warehouses) {
      setActionError("Enable Warehouses in Inventory Configuration to transfer stock.");
      return;
    }
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
        fromBinId: features.bins ? transferForm.fromBinId || undefined : undefined,
        toWarehouseId: transferForm.toWarehouseId,
        toBinId: features.bins ? transferForm.toBinId || undefined : undefined,
        qty,
        rate: transferForm.rate ? Number(transferForm.rate) : undefined,
        date: transferForm.date,
        memo: transferForm.memo || undefined,
        batchNo: features.batch ? transferForm.batchNo || undefined : undefined,
        lotNo: features.lot ? transferForm.lotNo || undefined : undefined,
        expiryDate: features.expiry ? transferForm.expiryDate || undefined : undefined,
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

  const submitAssemble = async () => {
    setActionError(null);
    setActionSuccess(null);
    if (!features.kits) {
      setActionError("Enable Kits & Assemblies in Inventory Configuration to assemble stock.");
      return;
    }
    const qty = Number(assembleQty);
    if (!assembleItem_ || !Number.isFinite(qty) || qty <= 0) {
      setActionError("Select a kit item and enter a valid quantity.");
      return;
    }
    setAssembleSubmitting(true);
    try {
      if (assembleMode === "assemble") {
        await assembleItem(assembleItem_.id, qty, assembleMemo || undefined);
        setActionSuccess(`Assembled ${qty} unit(s) of ${assembleItem_.name}.`);
      } else {
        await disassembleItem(assembleItem_.id, qty);
        setActionSuccess(`Disassembled ${qty} unit(s) of ${assembleItem_.name}.`);
      }
      setAssembleOpen(false);
      await refresh();
    } catch (e: any) {
      setActionError(e?.message ?? `Failed to ${assembleMode}.`);
    } finally {
      setAssembleSubmitting(false);
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

  const detectMapping = (headers: string[]) => {
    const normalized = headers.map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
    const idx = (keys: string[]) => normalized.findIndex((h) => keys.includes(h));
    return {
      name: idx(["name", "itemname"]),
      sku: idx(["sku", "code", "uniqueid", "unique"]),
      hsCode: idx(["hscode", "hs"]),
      unit: idx(["unit"]),
      group: idx(["group", "groupname", "itemgroup"]),
      type: idx(["type"]),
      salesPrice: idx(["salesprice", "saleprice"]),
      purchasePrice: idx(["purchaseprice", "buyprice"]),
      reorderLevel: idx(["reorderlevel", "reorder"]),
      safetyStock: idx(["safetystock", "safety"]),
      openingQty: idx(["openingqty", "openingquantity"]),
      openingPrice: idx(["openingprice", "openingrate"]),
    } as Partial<Record<ImportFieldKey, number>>;
  };

  const handleImportFile = async (file?: File | null) => {
    if (!file) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) throw new Error("CSV has no data rows.");
      const headers = parseCsvLine(lines[0]);
      const rows = lines.slice(1).map((line) => parseCsvLine(line));
      const mapping = detectMapping(headers);
      if ((mapping.name ?? -1) < 0) throw new Error("CSV must include a 'name' or 'item name' column.");
      setImportHeaders(headers);
      setImportRows(rows);
      setFieldMapping(mapping);
      setImportStep(2);
      setImportSummary(null);
      setPreviewPage(1);
      setPreviewErrorsOnly(false);
      setImportWizardOpen(true);
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to import CSV.");
    } finally {
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  const preImportIssues = React.useMemo(() => {
    const issues: Array<{ row: number; message: string }> = [];
    const nameIdx = fieldMapping.name ?? -1;
    const skuIdx = fieldMapping.sku ?? -1;
    const typeIdx = fieldMapping.type ?? -1;
    const seenSku = new Set<string>();
    for (let i = 0; i < importRows.length; i += 1) {
      const row = importRows[i];
      const rowNo = i + 2;
      const name = nameIdx >= 0 ? (row[nameIdx] || "").trim() : "";
      if (!name) {
        issues.push({ row: rowNo, message: "Missing Item Name" });
      }
      const sku = skuIdx >= 0 ? (row[skuIdx] || "").trim() : "";
      if (skuIdx >= 0 && !sku) {
        issues.push({ row: rowNo, message: "Missing SKU (required for safe duplicate check)" });
      }
      if (sku) {
        const key = sku.toLowerCase();
        if (seenSku.has(key)) issues.push({ row: rowNo, message: `Duplicate SKU in file: ${sku}` });
        seenSku.add(key);
      }
      if (typeIdx >= 0) {
        const t = (row[typeIdx] || "").trim().toLowerCase();
        if (t && t !== "goods" && t !== "services") {
          issues.push({ row: rowNo, message: `Invalid type '${row[typeIdx]}'` });
        }
      }
    }
    return issues;
  }, [fieldMapping, importRows]);

  const importPreview = React.useMemo(() => {
    const total = importRows.length;
    const issueRows = new Set(preImportIssues.map((i) => i.row));
    const invalid = issueRows.size;
    const valid = Math.max(0, total - invalid);
    return { valid, invalid };
  }, [importRows, preImportIssues]);

  const runImportWizard = async () => {
    const nameIdx = fieldMapping.name ?? -1;
    if (nameIdx < 0) {
      setActionError("Item Name mapping is required.");
      return;
    }
    setImporting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const fetchAllItems = async () => {
        const out: Awaited<ReturnType<typeof listItems>> = [];
        let skip = 0;
        const take = 1000;
        while (true) {
          const page = await listItems({ skip, take });
          const rows = Array.isArray(page) ? page : [];
          out.push(...rows);
          if (rows.length < take) break;
          skip += take;
        }
        return out;
      };

      const [existingItems, existingGroups, existingUnits] = await Promise.all([
        fetchAllItems(),
        listItemGroups({ take: 1000 }),
        listUnits({ take: 1000 }),
      ]);
      const existingSkuMap = new Map(
        (Array.isArray(existingItems) ? existingItems : [])
          .map((i) => [String(i.sku || "").trim().toLowerCase(), i] as const)
          .filter(([k]) => Boolean(k))
      );
      const groupMap = new Map((Array.isArray(existingGroups) ? existingGroups : []).map((g) => [g.name.trim().toLowerCase(), g]));
      const unitSet = new Set((Array.isArray(existingUnits) ? existingUnits : []).map((u) => u.name.trim().toLowerCase()));

      const toNum = (raw?: string) => {
        if (!raw) return undefined;
        const v = Number(raw);
        return Number.isFinite(v) ? v : undefined;
      };

      let created = 0;
      let skipped = 0;
      let failed = 0;
      const rowIssues: Array<{ row: number; message: string }> = [];
      const failedRows: Array<{ row: number; values: string[]; reason: string }> = [];
      for (let rowIdx = 0; rowIdx < importRows.length; rowIdx += 1) {
        const row = importRows[rowIdx];
        const rowNo = rowIdx + 2;
        const name = (row[nameIdx] || "").trim();
        if (!name) {
          skipped += 1;
          rowIssues.push({ row: rowNo, message: "Missing Item Name" });
          continue;
        }
        const sku = fieldMapping.sku !== undefined && fieldMapping.sku >= 0 ? (row[fieldMapping.sku] || "").trim() : "";
        if (!sku) {
          failed += 1;
          rowIssues.push({ row: rowNo, message: "Missing SKU (required)" });
          failedRows.push({ row: rowNo, values: row, reason: "Missing SKU (required)" });
          continue;
        }
        const skuKey = sku.toLowerCase();
        const existingBySku = existingSkuMap.get(skuKey);
        if (existingBySku) {
          const incomingType = fieldMapping.type !== undefined && fieldMapping.type >= 0 && (row[fieldMapping.type] || "").trim().toLowerCase() === "services" ? "services" : "goods";
          const incomingHs = fieldMapping.hsCode !== undefined && fieldMapping.hsCode >= 0 ? ((row[fieldMapping.hsCode] || "").trim() || null) : null;
          const incomingUnit = fieldMapping.unit !== undefined && fieldMapping.unit >= 0 ? ((row[fieldMapping.unit] || "").trim() || null) : null;
          const incomingSales = fieldMapping.salesPrice !== undefined && fieldMapping.salesPrice >= 0 ? toNum((row[fieldMapping.salesPrice] || "").trim()) ?? null : null;
          const incomingPurchase = fieldMapping.purchasePrice !== undefined && fieldMapping.purchasePrice >= 0 ? toNum((row[fieldMapping.purchasePrice] || "").trim()) ?? null : null;
          const incomingReorder = fieldMapping.reorderLevel !== undefined && fieldMapping.reorderLevel >= 0 ? toNum((row[fieldMapping.reorderLevel] || "").trim()) ?? null : null;
          const incomingSafety = fieldMapping.safetyStock !== undefined && fieldMapping.safetyStock >= 0 ? toNum((row[fieldMapping.safetyStock] || "").trim()) ?? null : null;

          const sameData =
            String(existingBySku.name || "").trim() === name &&
            String(existingBySku.hsCode || "") === String(incomingHs || "") &&
            String(existingBySku.unit || "") === String(incomingUnit || "") &&
            String(existingBySku.type || "goods") === incomingType &&
            Number(existingBySku.salesPrice ?? 0) === Number(incomingSales ?? 0) &&
            Number(existingBySku.purchasePrice ?? 0) === Number(incomingPurchase ?? 0) &&
            Number(existingBySku.reorderLevel ?? 0) === Number(incomingReorder ?? 0) &&
            Number(existingBySku.safetyStock ?? 0) === Number(incomingSafety ?? 0);

          if (sameData) {
            skipped += 1;
            rowIssues.push({ row: rowNo, message: `No change for existing SKU: ${sku}` });
            continue;
          }

          if (duplicateRule === "skip_existing") {
            skipped += 1;
            rowIssues.push({ row: rowNo, message: `Skipped existing SKU (data differs): ${sku}` });
            continue;
          }

          failed += 1;
          rowIssues.push({ row: rowNo, message: `SKU already exists with different data: ${sku}` });
          failedRows.push({ row: rowNo, values: row, reason: `SKU already exists with different data: ${sku}` });
          continue;
        }

        try {
          let groupId: string | undefined;
          if (fieldMapping.group !== undefined && fieldMapping.group >= 0) {
            const groupName = (row[fieldMapping.group] || "").trim();
            if (groupName) {
              const gKey = groupName.toLowerCase();
              let group = groupMap.get(gKey);
              if (!group && autoCreateMasters) {
                group = await createItemGroup({ name: groupName });
                groupMap.set(gKey, group);
              }
              groupId = group?.id;
            }
          }

          const unit = fieldMapping.unit !== undefined && fieldMapping.unit >= 0 ? (row[fieldMapping.unit] || "").trim() : "";
          if (unit && !unitSet.has(unit.toLowerCase()) && autoCreateMasters) {
            await createUnit({ name: unit });
            unitSet.add(unit.toLowerCase());
          }

          await createItem({
            name,
            sku: sku || undefined,
            hsCode: fieldMapping.hsCode !== undefined && fieldMapping.hsCode >= 0 ? (row[fieldMapping.hsCode] || "").trim() || undefined : undefined,
            unit: unit || undefined,
            groupId,
            type: fieldMapping.type !== undefined && fieldMapping.type >= 0 && (row[fieldMapping.type] || "").trim().toLowerCase() === "services" ? "services" : "goods",
            salesPrice: fieldMapping.salesPrice !== undefined && fieldMapping.salesPrice >= 0 ? toNum((row[fieldMapping.salesPrice] || "").trim()) : undefined,
            purchasePrice: fieldMapping.purchasePrice !== undefined && fieldMapping.purchasePrice >= 0 ? toNum((row[fieldMapping.purchasePrice] || "").trim()) : undefined,
            reorderLevel: fieldMapping.reorderLevel !== undefined && fieldMapping.reorderLevel >= 0 ? toNum((row[fieldMapping.reorderLevel] || "").trim()) : undefined,
            safetyStock: fieldMapping.safetyStock !== undefined && fieldMapping.safetyStock >= 0 ? toNum((row[fieldMapping.safetyStock] || "").trim()) : undefined,
            openingQty: fieldMapping.openingQty !== undefined && fieldMapping.openingQty >= 0 ? toNum((row[fieldMapping.openingQty] || "").trim()) : undefined,
            openingPrice: fieldMapping.openingPrice !== undefined && fieldMapping.openingPrice >= 0 ? toNum((row[fieldMapping.openingPrice] || "").trim()) : undefined,
          });
          existingSkuMap.set(skuKey, { sku } as any);
          created += 1;
        } catch (e: any) {
          failed += 1;
          const reason = e?.message ?? "Row failed";
          rowIssues.push({ row: rowNo, message: reason });
          failedRows.push({ row: rowNo, values: row, reason });
        }
      }

      await refresh();
      setImportSummary({ created, skipped, failed });
      setImportRowIssues(rowIssues);
      setImportFailedRows(failedRows);
      setImportStep(3);
      setActionSuccess(`Import complete. Created: ${created}, Skipped: ${skipped}, Failed: ${failed}.`);
    } catch (e: any) {
      setActionError(e?.message ?? "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const downloadFailedRowsCsv = async () => {
    if (importFailedRows.length === 0) return;
    const header = ["Row", ...importHeaders, "Reason"];
    const lines = importFailedRows.map((r) => [String(r.row), ...importHeaders.map((_, i) => r.values[i] || ""), r.reason]);
    const csv = [header, ...lines].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    await saveBlob(blob, "inventory_import_failed_rows.csv");
  };

  const rowIssueMap = React.useMemo(() => {
    const source = importSummary ? importRowIssues : preImportIssues;
    const map = new Map<number, string>();
    for (const issue of source) {
      if (!map.has(issue.row)) map.set(issue.row, issue.message);
    }
    return map;
  }, [importSummary, importRowIssues, preImportIssues]);

  const previewRows = React.useMemo(() => {
    const rows = importRows.map((values, idx) => {
      const rowNumber = idx + 2;
      return { rowNumber, values, issue: rowIssueMap.get(rowNumber) };
    });
    return previewErrorsOnly ? rows.filter((r) => Boolean(r.issue)) : rows;
  }, [importRows, previewErrorsOnly, rowIssueMap]);

  const previewTotalPages = Math.max(1, Math.ceil(previewRows.length / previewPageSize));
  const safePreviewPage = Math.min(previewPage, previewTotalPages);
  const pagedPreviewRows = React.useMemo(() => {
    const start = (safePreviewPage - 1) * previewPageSize;
    return previewRows.slice(start, start + previewPageSize);
  }, [previewRows, safePreviewPage, previewPageSize]);

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
            {features.inventory && (
              <Button variant="outline" className="rounded-xl border-border/50" onClick={() => setAdjustOpen(true)}>
                Adjust Stock
              </Button>
            )}
            {features.warehouses && (
              <Button variant="outline" className="rounded-xl border-border/50" onClick={() => setTransferOpen(true)}>
                Transfer Stock
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-xl border-border/50"
              onClick={() => {
                setImportWizardOpen(true);
                setImportStep(1);
                setImportSummary(null);
              }}
              disabled={importing}
              title="Import CSV"
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importing..." : "Import CSV"}
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
          {features.inventory && <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Low Stock (Goods)</div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
              {goodsRows.filter((r) => Boolean(r.isLowStock)).length}
            </div>
          </div>}
          {features.inventory && <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Total Value (Goods)</div>
            <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
              <MoneyText value={goodsRows.reduce((sum, r) => sum + Number(r.closingAmt ?? 0), 0)} />
            </div>
          </div>}
        </div>
        {features.inventory && alerts ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" onClick={() => applyAlertFilter("belowReorder")} className={cn("rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3 text-left dark:border-amber-900/40 dark:bg-amber-950/20", alertFilter === "belowReorder" && "ring-2 ring-amber-400")}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Below Reorder</div>
              <div className="mt-1 text-lg font-black text-amber-800 dark:text-amber-300">{alerts.counts.belowReorder}</div>
            </button>
            <button type="button" onClick={() => applyAlertFilter("zeroStock")} className={cn("rounded-xl border border-red-200/70 bg-red-50/50 px-4 py-3 text-left dark:border-red-900/40 dark:bg-red-950/20", alertFilter === "zeroStock" && "ring-2 ring-red-400")}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400">Zero Stock</div>
              <div className="mt-1 text-lg font-black text-red-800 dark:text-red-300">{alerts.counts.zeroStock}</div>
            </button>
            {features.expiry && <button type="button" onClick={() => applyAlertFilter("expiringSoon")} className={cn("rounded-xl border border-blue-200/70 bg-blue-50/50 px-4 py-3 text-left dark:border-blue-900/40 dark:bg-blue-950/20", alertFilter === "expiringSoon" && "ring-2 ring-blue-400")}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">Expiring Soon</div>
              <div className="mt-1 text-lg font-black text-blue-800 dark:text-blue-300">{alerts.counts.expiringSoon}</div>
            </button>}
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
                      {columnPickerOptions.map((column) => {
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
      {importWizardOpen ? (
        <div className="fixed inset-0 z-[1600] bg-black/30 backdrop-blur-sm p-4" onClick={() => setImportWizardOpen(false)}>
          <div className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <div className="text-base font-black tracking-tight">Import Items Wizard</div>
                <div className="text-xs text-muted-foreground">Upload, map columns, review data, and import with migration rules.</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setImportWizardOpen(false)}>Close</Button>
            </div>
            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
              <div className={cn("rounded-xl border px-3 py-2", importStep === 1 ? "border-primary bg-primary/10 text-primary" : "border-slate-200 dark:border-slate-800")}>1. Upload File</div>
              <div className={cn("rounded-xl border px-3 py-2", importStep === 2 ? "border-primary bg-primary/10 text-primary" : "border-slate-200 dark:border-slate-800")}>2. Map Fields & Rules</div>
              <div className={cn("rounded-xl border px-3 py-2", importStep === 3 ? "border-primary bg-primary/10 text-primary" : "border-slate-200 dark:border-slate-800")}>3. Preview & Import</div>
            </div>

            {importStep === 1 ? (
              <div className="space-y-4">
                <div
                  className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center dark:border-slate-700"
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleImportFile(e.dataTransfer.files?.[0] || null);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold">Drop CSV here or choose file</div>
                  <div className="mt-1 text-xs text-muted-foreground">Supported format: `.csv` with header row</div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button onClick={() => importFileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Choose CSV</Button>
                    <Button variant="outline" onClick={() => { void downloadImportTemplate(); }}><Download className="mr-2 h-4 w-4" />Download Template</Button>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                  Recommended: verify SKU is unique before import to avoid duplicate conflicts.
                </div>
              </div>
            ) : null}

            {importStep === 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="text-[10px] uppercase text-muted-foreground">Rows</div><div className="text-lg font-black">{importRows.length}</div></div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="text-[10px] uppercase text-muted-foreground">Columns</div><div className="text-lg font-black">{importHeaders.length}</div></div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="text-[10px] uppercase text-muted-foreground">Mapped</div><div className="text-lg font-black">{Object.values(fieldMapping).filter((x) => typeof x === "number" && x >= 0).length}</div></div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="text-[10px] uppercase text-muted-foreground">Required</div><div className="text-lg font-black">{(fieldMapping.name ?? -1) >= 0 ? "OK" : "Missing"}</div></div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {IMPORT_FIELDS.map((f) => (
                    <div key={f.key} className={cn("flex items-center justify-between gap-3 rounded-xl border p-2.5 dark:border-slate-800", f.required && (fieldMapping[f.key] ?? -1) < 0 ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" : "border-slate-200")}>
                      <div className="text-sm font-medium">{f.label}{f.required ? <span className="text-red-500"> *</span> : null}</div>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                        value={fieldMapping[f.key] ?? -1}
                        onChange={(e) => setFieldMapping((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
                      >
                        <option value={-1}>Not mapped</option>
                        {importHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={idx}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="mb-2 text-sm font-semibold">Duplicate handling</div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={duplicateRule === "skip_existing"} onChange={() => setDuplicateRule("skip_existing")} />
                      Skip existing SKU
                    </label>
                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input type="radio" checked={duplicateRule === "create_only"} onChange={() => setDuplicateRule("create_only")} />
                      Create all (fail duplicates)
                    </label>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="mb-2 text-sm font-semibold">Master data</div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={autoCreateMasters} onChange={(e) => setAutoCreateMasters(e.target.checked)} />
                      Auto-create missing Group/Unit
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setImportStep(1)}>Back</Button>
                  <Button onClick={() => setImportStep(3)} disabled={(fieldMapping.name ?? -1) < 0}>Next</Button>
                </div>
              </div>
            ) : null}

            {importStep === 3 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">Valid: <span className="font-semibold">{importPreview.valid}</span></div>
                  <div className={cn("rounded-xl p-3 text-sm", importPreview.invalid > 0 ? "border border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20" : "border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40")}>
                    Invalid: <span className="font-semibold">{importPreview.invalid}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">Rule: <span className="font-semibold">{duplicateRule === "skip_existing" ? "Skip existing" : "Create all"}</span></div>
                  <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">Masters: <span className="font-semibold">{autoCreateMasters ? "Auto-create" : "Strict"}</span></div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                  {importSummary ? (
                    <div>
                      Created: <span className="font-semibold">{importSummary.created}</span>, Skipped: <span className="font-semibold">{importSummary.skipped}</span>, Failed: <span className="font-semibold">{importSummary.failed}</span>
                    </div>
                  ) : <div className="text-muted-foreground">Review rows and click Import Now.</div>}
                </div>
                {(preImportIssues.length > 0 || importRowIssues.length > 0) ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="mb-2 font-semibold text-amber-800 dark:text-amber-300">Row Issues</div>
                    <div className="max-h-28 overflow-auto space-y-1 text-amber-900 dark:text-amber-200">
                      {(importSummary ? importRowIssues : preImportIssues).slice(0, 50).map((issue, idx) => (
                        <div key={`${issue.row}-${idx}`}>Row {issue.row}: {issue.message}</div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="max-h-[280px] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="p-2 text-left">Row</th>
                        {importHeaders.map((h, idx) => <th key={`${h}-${idx}`} className="p-2 text-left">{h}</th>)}
                        <th className="p-2 text-left">Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPreviewRows.map((row) => (
                        <tr key={row.rowNumber} className={cn("border-t border-slate-200 dark:border-slate-800", row.issue ? "bg-rose-50/40 dark:bg-rose-950/20" : "")}>
                          <td className="p-2 mono-numbers">{row.rowNumber}</td>
                          {importHeaders.map((_, ci) => <td key={ci} className="p-2">{row.values[ci] || ""}</td>)}
                          <td className="p-2 text-rose-700 dark:text-rose-300">{row.issue || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={previewErrorsOnly}
                        onChange={(e) => {
                          setPreviewErrorsOnly(e.target.checked);
                          setPreviewPage(1);
                        }}
                      />
                      Show only rows with issues
                    </label>
                    <div className="flex items-center gap-2">
                      <span>Rows per page</span>
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2"
                        value={previewPageSize}
                        onChange={(e) => {
                          setPreviewPageSize(Number(e.target.value));
                          setPreviewPage(1);
                        }}
                      >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                        <option value={500}>500</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Button variant="outline" size="sm" onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} disabled={safePreviewPage <= 1}>Prev</Button>
                    <span>Page {safePreviewPage} / {previewTotalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPreviewPage((p) => Math.min(previewTotalPages, p + 1))} disabled={safePreviewPage >= previewTotalPages}>Next</Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {importSummary && importFailedRows.length > 0 ? (
                    <Button variant="outline" onClick={() => { void downloadFailedRowsCsv(); }}>
                      <Download className="mr-2 h-4 w-4" />
                      Failed Rows CSV
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={() => setImportStep(2)}>Back</Button>
                  <Button onClick={() => { void runImportWizard(); }} disabled={importing || importPreview.valid === 0}>
                    {importing ? "Importing..." : "Import Now"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {features.inventory && adjustOpen ? (
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
                {goodsRows.map((r) => <option key={r.id} value={r.id}>{r.name}{r.sku ? ` [${r.sku}]` : ""}</option>)}
              </select>
              <Input placeholder="Quantity (+in / -out)" value={adjustForm.qty} onChange={(e) => setAdjustForm((p) => ({ ...p, qty: e.target.value }))} />
              <Input placeholder="Rate (optional)" value={adjustForm.rate} onChange={(e) => setAdjustForm((p) => ({ ...p, rate: e.target.value }))} />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm sm:col-span-2" value={adjustForm.accountId} onChange={(e) => setAdjustForm((p) => ({ ...p, accountId: e.target.value }))}>
                <option value="">Select offset account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {features.batch && <Input placeholder="Batch no (optional)" value={adjustForm.batchNo} onChange={(e) => setAdjustForm((p) => ({ ...p, batchNo: e.target.value }))} />}
              {features.lot && <Input placeholder="Lot no (optional)" value={adjustForm.lotNo} onChange={(e) => setAdjustForm((p) => ({ ...p, lotNo: e.target.value }))} />}
              {features.expiry && <Input placeholder="Expiry (YYYY-MM-DD, optional)" value={adjustForm.expiryDate} onChange={(e) => setAdjustForm((p) => ({ ...p, expiryDate: e.target.value }))} />}
              <Input placeholder="Memo (optional)" value={adjustForm.memo} onChange={(e) => setAdjustForm((p) => ({ ...p, memo: e.target.value }))} />
              {features.negativeStock && <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={adjustForm.allowNegativeOverride} onChange={(e) => setAdjustForm((p) => ({ ...p, allowNegativeOverride: e.target.checked }))} />
                Allow negative override
              </label>}
              {features.negativeStock && adjustForm.allowNegativeOverride ? (
                <Input className="sm:col-span-2" placeholder="Override reason" value={adjustForm.overrideReason} onChange={(e) => setAdjustForm((p) => ({ ...p, overrideReason: e.target.value }))} />
              ) : null}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={submitAdjustment} disabled={adjustSubmitting}>{adjustSubmitting ? "Posting..." : "Post Adjustment"}</Button>
            </div>
          </div>
        </div>
      ) : null}
      {features.warehouses && transferOpen ? (
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
                {goodsRows.map((r) => <option key={r.id} value={r.id}>{r.name}{r.sku ? ` [${r.sku}]` : ""}</option>)}
              </select>
              <Input placeholder="From warehouse ID" value={transferForm.fromWarehouseId} onChange={(e) => setTransferForm((p) => ({ ...p, fromWarehouseId: e.target.value }))} />
              <Input placeholder="To warehouse ID" value={transferForm.toWarehouseId} onChange={(e) => setTransferForm((p) => ({ ...p, toWarehouseId: e.target.value }))} />
              {features.bins && <Input placeholder="From bin ID (optional)" value={transferForm.fromBinId} onChange={(e) => setTransferForm((p) => ({ ...p, fromBinId: e.target.value }))} />}
              {features.bins && <Input placeholder="To bin ID (optional)" value={transferForm.toBinId} onChange={(e) => setTransferForm((p) => ({ ...p, toBinId: e.target.value }))} />}
              <Input placeholder="Quantity" value={transferForm.qty} onChange={(e) => setTransferForm((p) => ({ ...p, qty: e.target.value }))} />
              <Input placeholder="Rate (optional)" value={transferForm.rate} onChange={(e) => setTransferForm((p) => ({ ...p, rate: e.target.value }))} />
              {features.batch && <Input placeholder="Batch no (optional)" value={transferForm.batchNo} onChange={(e) => setTransferForm((p) => ({ ...p, batchNo: e.target.value }))} />}
              {features.lot && <Input placeholder="Lot no (optional)" value={transferForm.lotNo} onChange={(e) => setTransferForm((p) => ({ ...p, lotNo: e.target.value }))} />}
              {features.expiry && <Input placeholder="Expiry (YYYY-MM-DD, optional)" value={transferForm.expiryDate} onChange={(e) => setTransferForm((p) => ({ ...p, expiryDate: e.target.value }))} />}
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
                <div className="text-xs text-muted-foreground">{ledgerItem?.name} {ledgerItem?.sku ? `[${ledgerItem.sku}]` : ""}</div>
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

      {/* ── Assemble / Disassemble Modal ── */}
      {features.kits && assembleOpen && assembleItem_ ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {assembleMode === "assemble" ? "▲ Assemble Kit" : "▼ Disassemble Kit"}
              </h3>
              <button type="button" onClick={() => setAssembleOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-sm">
              <span className="font-semibold">{assembleItem_.name}</span>
              <span className="ml-2 text-muted-foreground">({assembleItem_.sku || 'No SKU'})</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {assembleMode === "assemble"
                ? "Components will be deducted from stock and assembled units added."
                : "Assembled units will be removed and components returned to stock."}
            </p>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground font-medium">Quantity</span>
              <Input
                type="number"
                min="1"
                step="1"
                value={assembleQty}
                onChange={(e) => setAssembleQty(e.target.value)}
                placeholder="Enter quantity"
                autoFocus
              />
            </label>
            {assembleMode === "assemble" && (
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground font-medium">Memo (optional)</span>
                <Input
                  value={assembleMemo}
                  onChange={(e) => setAssembleMemo(e.target.value)}
                  placeholder="e.g. Production batch #42"
                />
              </label>
            )}
            {actionError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-700">{actionError}</div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" className="rounded-2xl h-10 px-5" onClick={() => setAssembleOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitAssemble}
                disabled={assembleSubmitting}
                className={cn(
                  "rounded-2xl h-10 px-6 text-white shadow-lg",
                  assembleMode === "assemble"
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                    : "bg-slate-600 hover:bg-slate-700 shadow-slate-500/20"
                )}
              >
                {assembleSubmitting
                  ? "Processing..."
                  : assembleMode === "assemble" ? "▲ Assemble" : "▼ Disassemble"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
