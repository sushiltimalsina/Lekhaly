import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Switch } from "@lekhaly/ui";
import { deleteUnit, listUnits, type UnitRecord } from "@/lib/api/units";
import { deleteItemGroup, listItemGroups, type ItemGroupRecord } from "@/lib/api/item-groups";
import { listBillSundries, deleteBillSundry, type BillSundryRecord } from "@/lib/api/bill-sundries";
import { listPaymentMethods, deletePaymentMethod } from "@/lib/api/payment-methods";
import { listSaleTypes, deleteSaleType } from "@/lib/api/sale-types";
import { listPurchaseTypes, deletePurchaseType } from "@/lib/api/purchase-types";
import { Trash2, Ruler, Layers, Calculator, Plus, AlertCircle, ChevronDown, ChevronRight, Search, Pencil, Monitor, Hash, Shield, CreditCard, Calendar, Tag, ShoppingBag, PackageCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import AddUnitDialog from "@/components/app/add-unit-dialog";
import AddItemGroupDialog from "@/components/app/add-item-group-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import AddPaymentMethodDialog from "@/components/app/add-payment-method-dialog";
import AddSaleTypeDialog from "@/components/app/add-sale-type-dialog";
import AddPurchaseTypeDialog from "@/components/app/add-purchase-type-dialog";
import ConfirmDialog from "@/components/app/confirm-dialog";
import { useDateFormat } from "@/lib/date-format";
import { getSettings, setCalendarPreference, setDefaultDateRange, subscribeSettings } from "@/lib/store/settings";
import { getCurrencySettings, setCurrencySymbol, setNumberFormat, subscribeUi } from "@/lib/store/ui";
import { MoneyText } from "@/components/app/money";
import { getCompany, updateCompany } from "@/lib/api/auth";
import { getInventorySettings, updateInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listWarehouses, type Warehouse } from "@/lib/api/warehouses";

function NumberingRow({ 
  label, 
  prefix, 
  seq, 
  suffix,
  onPrefixChange, 
  onSeqChange, 
  onSuffixChange,
  onSave 
}: { 
  label: string; 
  prefix?: string; 
  seq?: number; 
  suffix?: string;
  onPrefixChange: (v: string) => void; 
  onSeqChange: (v: number) => void; 
  onSuffixChange: (v: string) => void;
  onSave: () => void; 
}) {
  const p = prefix || "";
  const s = suffix || "";
  const formattedPrefix = p ? (p.endsWith("-") ? p : `${p}-`) : "";
  const formattedSuffix = s ? (s.startsWith("-") ? s : `-${s}`) : "";
  const preview = `${formattedPrefix}${seq || 1}${formattedSuffix}`;

  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-extrabold uppercase tracking-tight text-muted-foreground/80">{label}</label>
        <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-bold">
          {preview}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        <div className="col-span-2">
          <Input 
            value={prefix || ""} 
            placeholder="PRE"
            onChange={e => onPrefixChange(e.target.value)}
            onBlur={onSave}
            className="h-9 rounded-xl font-mono text-xs text-center border-dashed"
          />
        </div>
        <div className="col-span-3">
          <Input 
            type="number"
            value={seq || 1} 
            onChange={e => onSeqChange(parseInt(e.target.value) || 1)}
            onBlur={onSave}
            className="h-9 rounded-xl font-mono text-xs text-center"
          />
        </div>
        <div className="col-span-2">
          <Input 
            value={suffix || ""} 
            placeholder="SUF"
            onChange={e => onSuffixChange(e.target.value)}
            onBlur={onSave}
            className="h-9 rounded-xl font-mono text-xs text-center border-dashed"
          />
        </div>
      </div>
    </div>
  );
}

function InventoryToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border bg-background/80 px-4 py-3">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 disabled:opacity-50"
      />
    </label>
  );
}

export default function ConfigurationPage() {
  const [searchParams] = useSearchParams();
  const focus = searchParams.get("focus");
  const unitsRef = React.useRef<HTMLDivElement | null>(null);
  const groupsRef = React.useRef<HTMLDivElement | null>(null);
  const sundriesRef = React.useRef<HTMLDivElement | null>(null);

  const [units, setUnits] = React.useState<UnitRecord[]>([]);
  const [groups, setGroups] = React.useState<ItemGroupRecord[]>([]);
  const [sundries, setSundries] = React.useState<BillSundryRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = React.useState<any[]>([]);
  const [saleTypes, setSaleTypes] = React.useState<any[]>([]);
  const [purchaseTypes, setPurchaseTypes] = React.useState<any[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [addUnitOpen, setAddUnitOpen] = React.useState(false);
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);
  const [addSundryOpen, setAddSundryOpen] = React.useState(false);
  const [addPaymentMethodOpen, setAddPaymentMethodOpen] = React.useState(false);
  const [addSaleTypeOpen, setAddSaleTypeOpen] = React.useState(false);
  const [addPurchaseTypeOpen, setAddPurchaseTypeOpen] = React.useState(false);

  const [editUnit, setEditUnit] = React.useState<UnitRecord | undefined>();
  const [editGroup, setEditGroup] = React.useState<ItemGroupRecord | undefined>();
  const [editSundry, setEditSundry] = React.useState<BillSundryRecord | undefined>();
  const [editPaymentMethod, setEditPaymentMethod] = React.useState<any | undefined>();
  const [editSaleType, setEditSaleType] = React.useState<any | undefined>();
  const [editPurchaseType, setEditPurchaseType] = React.useState<any | undefined>();

  // Visibility state
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  // Search state
  const [qUnits, setQUnits] = React.useState("");
  const [qGroups, setQGroups] = React.useState("");
  const [qSundries, setQSundries] = React.useState("");
  const [qPaymentMethods, setQPaymentMethods] = React.useState("");
  const [qSaleTypes, setQSaleTypes] = React.useState("");
  const [qPurchaseTypes, setQPurchaseTypes] = React.useState("");

  // System Preferences State
  const { dateFormat, setDateFormat } = useDateFormat();
  const [currencySymbol, setCurrencySymbolState] = React.useState(getCurrencySettings().currencySymbol);
  const [numberFormat, setNumberFormatState] = React.useState(getCurrencySettings().numberFormat);
  const [calendarPreference, setCalendarPreferenceState] = React.useState<"BS" | "AD">("BS");
  const [defaultDateRange, setDefaultDateRangeState] = React.useState<string>("this_month");

  // Company Settings State
  const [company, setCompany] = React.useState<any>(null);
  const [companyForm, setCompanyForm] = React.useState<any>({});

  // Custom Dialog States
  const [confirmState, setConfirmState] = React.useState<{
    id: string;
    name: string;
    type: "unit" | "group" | "sundry" | "payment-method" | "sale-type" | "purchase-type";
    open: boolean;
  }>({ id: "", name: "", type: "unit", open: false });

  const [alertState, setAlertState] = React.useState<{
    title: string;
    message: string;
    open: boolean;
  }>({ title: "", message: "", open: false });

  const fetchData = async () => {
    setLoading(true);
    const normalizeList = <T,>(input: unknown): T[] => {
      if (Array.isArray(input)) return input as T[];
      const obj = input as { items?: T[]; data?: T[] } | null;
      return obj?.items ?? obj?.data ?? [];
    };
    try {
      const [uRes, gRes, sRes, pmRes, stRes, ptRes, cRes, invRes, whRes] = await Promise.all([
        listUnits({ take: 100 }),
        listItemGroups({ take: 100 }),
        listBillSundries({ take: 100 }),
        listPaymentMethods({ take: 100 }),
        listSaleTypes({ take: 100 }),
        listPurchaseTypes({ take: 100 }),
        getCompany(),
        getInventorySettings(),
        listWarehouses({ isActive: true })
      ]);
      setUnits(normalizeList<UnitRecord>(uRes));
      setGroups(normalizeList<ItemGroupRecord>(gRes));
      setSundries(normalizeList<BillSundryRecord>(sRes));
      setPaymentMethods(normalizeList<any>(pmRes).sort((a, b) => b.name.localeCompare(a.name)));
      setSaleTypes(normalizeList<any>(stRes).sort((a, b) => b.name.localeCompare(a.name)));
      setPurchaseTypes(normalizeList<any>(ptRes).sort((a, b) => b.name.localeCompare(a.name)));
      setCompany(cRes);
      setCompanyForm(cRes);
      setInventorySettings(invRes);
      setWarehouses(normalizeList<Warehouse>(whRes));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load configuration data.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeUi((next) => {
      setCurrencySymbolState(next.currencySymbol);
      setNumberFormatState(next.numberFormat);
    });
    return () => { unsubscribe(); };
  }, []);

  React.useEffect(() => {
    const s = getSettings();
    setCalendarPreferenceState(s.calendarPreference);
    setDefaultDateRangeState(s.defaultDateRange);
    const unsubscribe = subscribeSettings((next) => {
      setCalendarPreferenceState(next.calendarPreference);
      setDefaultDateRangeState(next.defaultDateRange);
    });
    return () => { unsubscribe(); };
  }, []);

  React.useEffect(() => {
    if (!loading) {
      if (focus === "units") {
        setExpandedSection("units");
        unitsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (focus === "groups") {
        setExpandedSection("groups");
        groupsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (focus === "sundries") {
        setExpandedSection("sundries");
        sundriesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [focus, loading]);

  const onRemoveUnit = (id: string) => {
    const item = units.find(u => u.id === id);
    if (!item) return;
    setConfirmState({ id, name: item.name, type: "unit", open: true });
  };

  const onRemoveGroup = (id: string) => {
    const item = groups.find(g => g.id === id);
    if (!item) return;
    setConfirmState({ id, name: item.name, type: "group", open: true });
  };

  const onRemoveSundry = (id: string) => {
    const item = sundries.find(s => s.id === id);
    if (!item) return;
    
    const systemNames = ["Discount", "Shipping & Handling", "Packaging Charges", "Insurance", "Round Off", "VAT"];
    if (systemNames.includes(item.name)) {
      setAlertState({
        title: "System Default",
        message: `The bill sundry '${item.name}' is a system default and cannot be deleted.`,
        open: true
      });
      return;
    }
    setConfirmState({ id, name: item.name, type: "sundry", open: true });
  };
  
  const onRemovePaymentMethod = (id: string) => {
    const item = paymentMethods.find(pm => pm.id === id);
    if (!item) return;
    setConfirmState({ id, name: item.name, type: "payment-method", open: true });
  };
  
  const onRemoveSaleType = (id: string) => {
    const item = saleTypes.find(st => st.id === id);
    if (!item) return;
    setConfirmState({ id, name: item.name, type: "sale-type", open: true });
  };

  const onRemovePurchaseType = (id: string) => {
    const item = purchaseTypes.find(pt => pt.id === id);
    if (!item) return;
    setConfirmState({ id, name: item.name, type: "purchase-type", open: true });
  };

  const saveCompanySettings = async (updates: any) => {
    setBusy(true);
    setError(null);
    try {
      const res = await updateCompany({ ...companyForm, ...updates });
      setCompany(res);
      setCompanyForm(res);
      // Optional: Show success toast/message
    } catch (e: any) {
      setError(e?.message ?? "Failed to update company settings.");
    } finally {
      setBusy(false);
    }
  };

  const saveInventorySettings = async (updates: Partial<InventorySettings>) => {
    if (!inventorySettings) return;
    setBusy(true);
    setError(null);
    try {
      const res = await updateInventorySettings({ ...inventorySettings, ...updates });
      setInventorySettings(res);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update inventory settings.");
    } finally {
      setBusy(false);
    }
  };
  const handleConfirmDelete = async () => {
    const { id, name, type } = confirmState;
    setBusy(true);
    setConfirmState(prev => ({ ...prev, open: false }));
    try {
      if (type === "unit") {
        await deleteUnit(id);
        setUnits(prev => prev.filter(u => u.id !== id));
      } else if (type === "group") {
        await deleteItemGroup(id);
        setGroups(prev => prev.filter(g => g.id !== id));
      } else if (type === "sundry") {
        await deleteBillSundry(id);
        setSundries(prev => prev.filter(s => s.id !== id));
      } else if (type === "payment-method") {
        await deletePaymentMethod(id);
        setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      } else if (type === "sale-type") {
        await deleteSaleType(id);
        setSaleTypes(prev => prev.filter(st => st.id !== id));
      } else if (type === "purchase-type") {
        await deletePurchaseType(id);
        setPurchaseTypes(prev => prev.filter(pt => pt.id !== id));
      }
    } catch (e: any) {
       const readableType = type.charAt(0).toUpperCase() + type.slice(1);
       setAlertState({
         title: "Delete Failed",
         message: `${readableType} '${name}' cannot be deleted because it is currently used by items or in the accounting part. If you want to delete this ${type}, make sure you remove all related items or accounting system first.`,
         open: true
       });
    } finally {
      setBusy(false);
    }
  };

  const filteredUnits = units.filter(u => u.name.toLowerCase().includes(qUnits.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(qGroups.toLowerCase()));
  const filteredSundries = sundries.filter(s => s.name.toLowerCase().includes(qSundries.toLowerCase()));
  const filteredPaymentMethods = paymentMethods.filter(pm => pm.name.toLowerCase().includes(qPaymentMethods.toLowerCase()));
  const filteredSaleTypes = saleTypes.filter(st => st.name.toLowerCase().includes(qSaleTypes.toLowerCase()));
  const filteredPurchaseTypes = purchaseTypes.filter(pt => pt.name.toLowerCase().includes(qPurchaseTypes.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration"
        description="Manage item units, groups, and bill sundries used across the system."
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto text-red-800 hover:bg-accent dark:hover:bg-accent/20">
            Dismiss
          </Button>
        </div>
      )}

      {/* items-start ensures cards don't stretch to fill the row height when collapsed */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Units Section */}
        <Card ref={unitsRef} className={cn("glass-card overflow-hidden", focus === "units" && "ring-2 ring-blue-500/50")}>
          <CardHeader 
            onClick={() => setExpandedSection(expandedSection === "units" ? null : "units")}
            className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expandedSection === "units" ? "pb-2" : "pb-4")}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                 {expandedSection === "units" ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
               </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-blue-500" />
                  Units
                </CardTitle>
                <CardDescription>Measurement units for items</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setAddUnitOpen(true); }} className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> Add New
              </Button>
            </div>
          </CardHeader>
          {expandedSection === "units" && (
            <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search units..."
                  value={qUnits}
                  onChange={e => setQUnits(e.target.value)}
                  className="pl-9 rounded-xl border-border"
                />
              </div>
              <div className="grid gap-2">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading units...</div>
                ) : filteredUnits.length ? (
                  filteredUnits.map(u => (
                    <div key={u.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm transition-all hover:bg-muted/40">
                      <span className="font-medium text-foreground">{u.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditUnit(u); setAddUnitOpen(true); }}
                          disabled={busy}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveUnit(u.id)}
                          disabled={busy}
                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                    {qUnits ? `No units matching "${qUnits}"` : "No units added yet."}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Groups Section */}
        <Card ref={groupsRef} className={cn("glass-card overflow-hidden", focus === "groups" && "ring-2 ring-orange-500/50")}>
          <CardHeader 
            onClick={() => setExpandedSection(expandedSection === "groups" ? null : "groups")}
            className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expandedSection === "groups" ? "pb-2" : "pb-4")}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                 {expandedSection === "groups" ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
               </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-orange-500" />
                  Groups
                </CardTitle>
                <CardDescription>Item categorization groups</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setAddGroupOpen(true); }} className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> Add New
              </Button>
            </div>
          </CardHeader>
          {expandedSection === "groups" && (
            <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-1 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={qGroups}
                  onChange={e => setQGroups(e.target.value)}
                  className="pl-9 rounded-xl border-border"
                />
              </div>
              <div className="grid gap-2">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading groups...</div>
                ) : filteredGroups.length ? (
                  filteredGroups.map(g => (
                    <div key={g.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm transition-all hover:bg-muted/40">
                      <span className="font-medium text-foreground">{g.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditGroup(g); setAddGroupOpen(true); }}
                          disabled={busy}
                          className="h-8 w-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveGroup(g.id)}
                          disabled={busy}
                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                    {qGroups ? `No groups matching "${qGroups}"` : "No groups added yet."}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Bill Sundries Section */}
        <Card ref={sundriesRef} className={cn("glass-card overflow-hidden lg:col-span-2", focus === "sundries" && "ring-2 ring-indigo-500/50")}>
          <CardHeader 
            onClick={() => setExpandedSection(expandedSection === "sundries" ? null : "sundries")}
            className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expandedSection === "sundries" ? "pb-2" : "pb-4")}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                 {expandedSection === "sundries" ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
               </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-500" />
                  Bill Sundries
                </CardTitle>
                <CardDescription>Predefined additional charges or discounts</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setAddSundryOpen(true); }} className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> Add New
              </Button>
            </div>
          </CardHeader>
          {expandedSection === "sundries" && (
            <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search bill sundries..."
                  value={qSundries}
                  onChange={e => setQSundries(e.target.value)}
                  className="pl-9 rounded-xl border-border"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {loading ? (
                  <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">Loading sundries...</div>
                ) : filteredSundries.length ? (
                  filteredSundries.map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4 transition-all hover:bg-muted/40">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          s.type === "add" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 font-medium" : "bg-red-100 text-red-600 dark:bg-red-950/30 font-medium"
                        )}>
                          {s.type === "add" ? <Plus className="h-5 w-5" /> : <Calculator className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 font-semibold text-foreground truncate">
                            {s.name}
                            {["Discount", "Shipping & Handling", "Packaging Charges", "Insurance", "Round Off", "VAT"].includes(s.name) && (
                               <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0">System</span>
                            )}
                          </div>
                          <div className="font-mono text-xs uppercase tracking-tight text-muted-foreground truncate">
                            {s.rate ? `${s.rate}%` : "Manual"} • {s.type} {s.account?.name ? `• ${s.account.name}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditSundry(s); setAddSundryOpen(true); }}
                          disabled={busy}
                          className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!["Discount", "Shipping & Handling", "Packaging Charges", "Insurance", "Round Off", "VAT"].includes(s.name) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveSundry(s.id)}
                            disabled={busy}
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                    {qSundries ? `No sundries matching "${qSundries}"` : "No predefined sundries found."}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Payment Methods Section */}
        <Card className={cn("glass-card overflow-hidden", expandedSection === "payment-methods" && "ring-2 ring-emerald-500/50")}>
          <CardHeader 
            onClick={() => setExpandedSection(expandedSection === "payment-methods" ? null : "payment-methods")}
            className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expandedSection === "payment-methods" ? "pb-2" : "pb-4")}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                 {expandedSection === "payment-methods" ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
               </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Manage available payment options</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditPaymentMethod(undefined); setAddPaymentMethodOpen(true); }} className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> Add New
              </Button>
            </div>
          </CardHeader>
          {expandedSection === "payment-methods" && (
            <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payment methods..."
                  value={qPaymentMethods}
                  onChange={e => setQPaymentMethods(e.target.value)}
                  className="pl-9 rounded-xl border-border"
                />
              </div>
              <div className="grid gap-2">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
                ) : filteredPaymentMethods.length ? (
                  filteredPaymentMethods.map(pm => (
                    <div key={pm.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm transition-all hover:bg-muted/40">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{pm.name}</span>
                        {!pm.isActive && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">Inactive</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setEditPaymentMethod(pm); setAddPaymentMethodOpen(true); }}
                          disabled={busy}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); onRemovePaymentMethod(pm.id); }}
                          disabled={busy}
                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                    No payment methods found.
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Trade Types Section (Sales & Purchase) */}
        <Card className={cn("glass-card overflow-hidden", expandedSection === "trade-types" && "ring-2 ring-indigo-500/50")}>
          <CardHeader 
            onClick={() => setExpandedSection(expandedSection === "trade-types" ? null : "trade-types")}
            className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expandedSection === "trade-types" ? "pb-2" : "pb-4")}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                 {expandedSection === "trade-types" ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
               </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-indigo-500" />
                  Trade Types
                </CardTitle>
                <CardDescription>Manage available sales and purchase categories</CardDescription>
              </div>
            </div>
          </CardHeader>
          {expandedSection === "trade-types" && (
            <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Sales Types Section */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center dark:bg-emerald-900/30">
                        <Tag className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-sm">Sales Types</h3>
                    </div>
                    <Button size="sm" onClick={() => { setEditSaleType(undefined); setAddSaleTypeOpen(true); }} className="h-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search sales types..."
                      value={qSaleTypes}
                      onChange={e => setQSaleTypes(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {loading ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : filteredSaleTypes.length ? (
                      filteredSaleTypes.map(st => (
                        <div key={st.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm transition-all hover:border-emerald-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-emerald-900/50">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{st.name}</span>
                            {!st.isActive && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Inactive</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditSaleType(st); setAddSaleTypeOpen(true); }}
                              disabled={busy}
                              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveSaleType(st.id)}
                              disabled={busy}
                              className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        {qSaleTypes ? "No matching sales types." : "No sales types added."}
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Types Section */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-orange-100 flex items-center justify-center dark:bg-orange-900/30">
                        <ShoppingBag className="h-4 w-4 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-sm">Purchase Types</h3>
                    </div>
                    <Button size="sm" onClick={() => { setEditPurchaseType(undefined); setAddPurchaseTypeOpen(true); }} className="h-8 rounded-xl bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search purchase types..."
                      value={qPurchaseTypes}
                      onChange={e => setQPurchaseTypes(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {loading ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : filteredPurchaseTypes.length ? (
                      filteredPurchaseTypes.map(pt => (
                        <div key={pt.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm transition-all hover:border-orange-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-orange-900/50">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{pt.name}</span>
                            {!pt.isActive && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Inactive</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditPurchaseType(pt); setAddPurchaseTypeOpen(true); }}
                              disabled={busy}
                              className="h-7 w-7 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemovePurchaseType(pt.id)}
                              disabled={busy}
                              className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        {qPurchaseTypes ? "No matching purchase types." : "No purchase types added."}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
          )}
        </Card>

        {/* Inventory Configuration Section */}
        <Card className={cn("glass-card overflow-hidden lg:col-span-2", expandedSection === "inventory" && "ring-2 ring-emerald-500/50")}>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
            onClick={() => setExpandedSection(expandedSection === "inventory" ? null : "inventory")}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors">
                  {expandedSection === "inventory" ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Inventory Configuration</CardTitle>
                    <CardDescription>Choose how this company maintains stock movements</CardDescription>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl"
                onClick={(e) => { e.stopPropagation(); fetchData(); }}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          
          {expandedSection === "inventory" && (
            <CardContent className="space-y-5 pt-0 animate-in fade-in slide-in-from-top-1">
              {!inventorySettings ? (
                <div className="py-12 text-center text-sm text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
                  {loading ? "Loading inventory settings..." : "Inventory settings are currently unavailable."}
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <InventoryToggleRow label="Inventory Tracking" description="Maintain item stock quantities" checked={inventorySettings.inventoryTrackingEnabled} onChange={(v) => saveInventorySettings({ inventoryTrackingEnabled: v })} />
                    <InventoryToggleRow label="Allow Negative Stock" description="Permit outbound movements below available stock" checked={inventorySettings.allowNegativeStock} disabled={!inventorySettings.inventoryTrackingEnabled} onChange={(v) => saveInventorySettings({ allowNegativeStock: v })} />
                    <InventoryToggleRow label="Warehouses" description="Track stock by storage location" checked={inventorySettings.warehousesEnabled} disabled={!inventorySettings.inventoryTrackingEnabled} onChange={(v) => saveInventorySettings({ warehousesEnabled: v })} />
                    <InventoryToggleRow label="Bins" description="Track stock inside warehouse bins" checked={inventorySettings.binsEnabled} disabled={!inventorySettings.inventoryTrackingEnabled || !inventorySettings.warehousesEnabled} onChange={(v) => saveInventorySettings({ binsEnabled: v })} />
                    <InventoryToggleRow label="Batch Tracking" description="Allow batch numbers on stock movements" checked={inventorySettings.batchTrackingEnabled} disabled={!inventorySettings.inventoryTrackingEnabled} onChange={(v) => saveInventorySettings({ batchTrackingEnabled: v })} />
                    <InventoryToggleRow label="Lot Tracking" description="Allow lot numbers on stock movements" checked={inventorySettings.lotTrackingEnabled} disabled={!inventorySettings.inventoryTrackingEnabled} onChange={(v) => saveInventorySettings({ lotTrackingEnabled: v })} />
                    <InventoryToggleRow label="Expiry Tracking" description="Store expiry dates and expiry alerts" checked={inventorySettings.expiryTrackingEnabled} disabled={!inventorySettings.inventoryTrackingEnabled} onChange={(v) => saveInventorySettings({ expiryTrackingEnabled: v })} />
                    <InventoryToggleRow label="Serial Numbers" description="Track unique serial numbers per unit" checked={inventorySettings.serialTrackingEnabled} disabled={!inventorySettings.inventoryTrackingEnabled} onChange={(v) => saveInventorySettings({ serialTrackingEnabled: v })} />
                    <InventoryToggleRow label="Kits & Assemblies" description="Enable BOM and kit assembly flows" checked={inventorySettings.kitsEnabled} disabled={!inventorySettings.inventoryTrackingEnabled} onChange={(v) => saveInventorySettings({ kitsEnabled: v })} />
                    <InventoryToggleRow label="Require Warehouse" description="Require warehouse on stock movements" checked={inventorySettings.requireWarehouseOnMovements} disabled={!inventorySettings.inventoryTrackingEnabled || !inventorySettings.warehousesEnabled} onChange={(v) => saveInventorySettings({ requireWarehouseOnMovements: v })} />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 pt-4 border-t">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Default Warehouse</label>
                      <select
                        value={inventorySettings.defaultWarehouseId ?? ""}
                        disabled={!inventorySettings.warehousesEnabled}
                        onChange={(event) => saveInventorySettings({ defaultWarehouseId: event.target.value || null })}
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      >
                        <option value="">No default warehouse</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Costing Method</label>
                      <select
                        value={inventorySettings.costingMethod}
                        onChange={(event) => saveInventorySettings({ costingMethod: event.target.value as InventorySettings["costingMethod"] })}
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      >
                        <option value="moving_average">Moving average</option>
                        <option value="fifo">FIFO</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* System & Regional Preferences Section */}
        <Card className={cn("glass-card overflow-hidden lg:col-span-2")}>
          <CardHeader 
            onClick={() => setExpandedSection(expandedSection === "regional" ? null : "regional")}
            className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expandedSection === "regional" ? "pb-2" : "pb-4")}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                 {expandedSection === "regional" ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
               </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  System & Regional Preferences
                </CardTitle>
                <CardDescription>Setup your business calendar, currency, and date formats</CardDescription>
              </div>
            </div>
          </CardHeader>
          {expandedSection === "regional" && (
            <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200 lg:p-8">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {/* Calendar preference */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-blue-500" />
                      Calendar Input
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Default calendar for entry</p>
                  </div>
                  <div className="flex p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl w-full">
                    {(["BS", "AD"] as const).map(pref => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setCalendarPreference(pref)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200",
                          calendarPreference === pref 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-500/50" 
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                        )}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date display format */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-emerald-500" />
                      Display Format
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">How dates appear in lists</p>
                  </div>
                  <div className="flex p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl w-full">
                    {(["bs", "ad"] as const).map(pref => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setDateFormat(pref)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all duration-200",
                          dateFormat === pref 
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-500/50" 
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                        )}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date range default */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Search className="h-4 w-4 text-orange-500" />
                      Default range
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Initial filter for reports</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl">
                    {(["today", "this_week", "this_month", "this_quarter", "this_year"] as const).map(range => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setDefaultDateRange(range)}
                        className={cn(
                          "py-2 px-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all duration-200 border",
                          defaultDateRange === range 
                            ? "bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-500/30" 
                            : "bg-transparent border-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
                        )}
                      >
                        {range.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency settings */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-indigo-500" />
                      Currency & Format
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Formatting and symbol</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl w-full">
                      {(["रु.", "NPR", "Rs."] as const).map(symbol => (
                        <button
                          key={symbol}
                          type="button"
                          onClick={() => setCurrencySymbol(symbol)}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all duration-200",
                            currencySymbol === symbol 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-500/50" 
                              : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                          )}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                    <div className="flex p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl w-full">
                      {(["en-IN", "en-US"] as const).map(format => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => setNumberFormat(format)}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all duration-200",
                            numberFormat === format 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-500/50" 
                              : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                          )}
                        >
                          {format === "en-IN" ? "1,23,456" : "123,456"}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-xl border bg-muted/30 dark:bg-muted/10 px-4 py-2 text-center">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Preview</div>
                      <div className="text-sm font-bold text-indigo-600">
                        <MoneyText value={1234567.89} />
                      </div>
                    </div>
                </div>
              </div>
            </div>

              <div className="mt-8 pt-8 border-t border-border/10">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-indigo-500" />
                    <div className="text-sm font-bold text-foreground">Print Logo on Documents</div>
                  </div>
                  <Switch 
                    checked={companyForm.printLogo ?? true} 
                    onCheckedChange={(v) => {
                      setCompanyForm({...companyForm, printLogo: v});
                      saveCompanySettings({ printLogo: v });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Voucher Numbering Section */}
        <Card className="glass-card overflow-hidden lg:col-span-2">
          <CardHeader onClick={() => setExpandedSection(expandedSection === "numbering" ? null : "numbering")} className="cursor-pointer hover:bg-accent/10 transition-colors select-none border-b border-border/10">
            <div className="flex items-center gap-4">
              {expandedSection === "numbering" ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground animate-in fade-in" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground animate-in fade-in" />
              )}
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-indigo-500" />
                <div>
                  <CardTitle className="text-lg">Voucher Numbering</CardTitle>
                  <CardDescription>Setup prefixes and sequences for all document series</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          {expandedSection === "numbering" && (
            <CardContent className="space-y-6 animate-in fade-in slide-in-from-top-1 pt-6">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Important:</strong> Numbering settings should be finalized before issuing the first voucher. You can change the prefix and suffix freely until the first invoice or voucher is issued in each series.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                {/* Sales Invoice */}
                <NumberingRow 
                  label="Sales Invoice" 
                  prefix={companyForm.invoicePrefix}
                  seq={companyForm.nextInvoiceNumber}
                  suffix={companyForm.invoiceSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, invoicePrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextInvoiceNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, invoiceSuffix: v})}
                  onSave={() => saveCompanySettings({ invoicePrefix: companyForm.invoicePrefix, nextInvoiceNumber: companyForm.nextInvoiceNumber, invoiceSuffix: companyForm.invoiceSuffix })}
                />
                
                {/* Purchase Invoice */}
                <NumberingRow 
                  label="Purchase Invoice" 
                  prefix={companyForm.purchasePrefix}
                  seq={companyForm.nextPurchaseNumber}
                  suffix={companyForm.purchaseSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, purchasePrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextPurchaseNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, purchaseSuffix: v})}
                  onSave={() => saveCompanySettings({ purchasePrefix: companyForm.purchasePrefix, nextPurchaseNumber: companyForm.nextPurchaseNumber, purchaseSuffix: companyForm.purchaseSuffix })}
                />

                {/* Sales Return */}
                <NumberingRow 
                  label="Sales Return" 
                  prefix={companyForm.salesReturnPrefix}
                  seq={companyForm.nextSalesReturnNumber}
                  suffix={companyForm.salesReturnSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, salesReturnPrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextSalesReturnNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, salesReturnSuffix: v})}
                  onSave={() => saveCompanySettings({ salesReturnPrefix: companyForm.salesReturnPrefix, nextSalesReturnNumber: companyForm.nextSalesReturnNumber, salesReturnSuffix: companyForm.salesReturnSuffix })}
                />

                {/* Purchase Return */}
                <NumberingRow 
                  label="Purchase Return" 
                  prefix={companyForm.purchaseReturnPrefix}
                  seq={companyForm.nextPurchaseReturnNumber}
                  suffix={companyForm.purchaseReturnSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, purchaseReturnPrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextPurchaseReturnNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, purchaseReturnSuffix: v})}
                  onSave={() => saveCompanySettings({ purchaseReturnPrefix: companyForm.purchaseReturnPrefix, nextPurchaseReturnNumber: companyForm.nextPurchaseReturnNumber, purchaseReturnSuffix: companyForm.purchaseReturnSuffix })}
                />

                {/* Receipt Voucher */}
                <NumberingRow 
                  label="Receipt Voucher" 
                  prefix={companyForm.receiptPrefix}
                  seq={companyForm.nextReceiptNumber}
                  suffix={companyForm.receiptSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, receiptPrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextReceiptNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, receiptSuffix: v})}
                  onSave={() => saveCompanySettings({ receiptPrefix: companyForm.receiptPrefix, nextReceiptNumber: companyForm.nextReceiptNumber, receiptSuffix: companyForm.receiptSuffix })}
                />

                {/* Payment Voucher */}
                <NumberingRow 
                  label="Payment Voucher" 
                  prefix={companyForm.paymentPrefix}
                  seq={companyForm.nextPaymentNumber}
                  suffix={companyForm.paymentSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, paymentPrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextPaymentNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, paymentSuffix: v})}
                  onSave={() => saveCompanySettings({ paymentPrefix: companyForm.paymentPrefix, nextPaymentNumber: companyForm.nextPaymentNumber, paymentSuffix: companyForm.paymentSuffix })}
                />

                {/* Journal Voucher */}
                <NumberingRow 
                  label="Journal Voucher" 
                  prefix={companyForm.journalPrefix}
                  seq={companyForm.nextJournalNumber}
                  suffix={companyForm.journalSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, journalPrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextJournalNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, journalSuffix: v})}
                  onSave={() => saveCompanySettings({ journalPrefix: companyForm.journalPrefix, nextJournalNumber: companyForm.nextJournalNumber, journalSuffix: companyForm.journalSuffix })}
                />

                {/* Quotation */}
                <NumberingRow 
                  label="Quotation" 
                  prefix={companyForm.quotationPrefix}
                  seq={companyForm.nextQuotationNumber}
                  suffix={companyForm.quotationSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, quotationPrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextQuotationNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, quotationSuffix: v})}
                  onSave={() => saveCompanySettings({ quotationPrefix: companyForm.quotationPrefix, nextQuotationNumber: companyForm.nextQuotationNumber, quotationSuffix: companyForm.quotationSuffix })}
                />

                {/* Sales Order */}
                <NumberingRow 
                  label="Sales Order" 
                  prefix={companyForm.orderPrefix}
                  seq={companyForm.nextOrderNumber}
                  suffix={companyForm.orderSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, orderPrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextOrderNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, orderSuffix: v})}
                  onSave={() => saveCompanySettings({ orderPrefix: companyForm.orderPrefix, nextOrderNumber: companyForm.nextOrderNumber, orderSuffix: companyForm.orderSuffix })}
                />

                {/* Purchase Order */}
                <NumberingRow 
                  label="Purchase Order" 
                  prefix={companyForm.purchaseOrderPrefix}
                  seq={companyForm.nextPurchaseOrderNumber}
                  suffix={companyForm.purchaseOrderSuffix}
                  onPrefixChange={v => setCompanyForm({...companyForm, purchaseOrderPrefix: v.toUpperCase()})}
                  onSeqChange={v => setCompanyForm({...companyForm, nextPurchaseOrderNumber: v})}
                  onSuffixChange={v => setCompanyForm({...companyForm, purchaseOrderSuffix: v})}
                  onSave={() => saveCompanySettings({ purchaseOrderPrefix: companyForm.purchaseOrderPrefix, nextPurchaseOrderNumber: companyForm.nextPurchaseOrderNumber, purchaseOrderSuffix: companyForm.purchaseOrderSuffix })}
                />
              </div>
            </CardContent>
          )}
        </Card>

        <div className="space-y-6">
          {/* Fiscal Year & Security Section */}
          <Card className="glass-card overflow-hidden">
            <CardHeader onClick={() => setExpandedSection(expandedSection === "security" ? null : "security")} className="cursor-pointer hover:bg-accent/10 transition-colors select-none">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Fiscal & Security
              </CardTitle>
              <CardDescription>Lock dates and start month</CardDescription>
            </CardHeader>
            {expandedSection === "security" && (
              <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Account Lock Date
                    </label>
                    <Input 
                      type="date"
                      value={companyForm.lockDate ? new Date(companyForm.lockDate).toISOString().split('T')[0] : ""}
                      onChange={e => {
                        const d = e.target.value;
                        setCompanyForm({...companyForm, lockDate: d || null});
                        saveCompanySettings({ lockDate: d || null });
                      }}
                      className="rounded-xl h-11"
                    />
                    <p className="text-[10px] text-muted-foreground italic">No vouchers can be added/modified on or before this date.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      FY Start Month
                    </label>
                    <select 
                      value={companyForm.fiscalYearStartMonth || 4} 
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        setCompanyForm({...companyForm, fiscalYearStartMonth: v});
                        saveCompanySettings({ fiscalYearStartMonth: v });
                      }}
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                        <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Global Credit Management */}
          <Card className="glass-card overflow-hidden">
            <CardHeader onClick={() => setExpandedSection(expandedSection === "credit" ? null : "credit")} className="cursor-pointer hover:bg-accent/10 transition-colors select-none">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                Credit Management
              </CardTitle>
              <CardDescription>Global business credit safety</CardDescription>
            </CardHeader>
            {expandedSection === "credit" && (
              <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Default Credit Limit (Rs.)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        type="number"
                        value={companyForm.creditLimitAmount || 0} 
                        onChange={e => setCompanyForm({...companyForm, creditLimitAmount: parseFloat(e.target.value)})}
                        onBlur={() => saveCompanySettings({ creditLimitAmount: companyForm.creditLimitAmount })}
                        className="pl-9 h-11 rounded-xl font-bold text-emerald-600"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">This is the default limit for new customers unless overridden individually.</p>
                  </div>

                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <AddUnitDialog
        open={addUnitOpen}
        onClose={() => { setAddUnitOpen(false); setEditUnit(undefined); }}
        onSuccess={() => fetchData()}
        unit={editUnit}
      />
      <AddItemGroupDialog
        open={addGroupOpen}
        onClose={() => { setAddGroupOpen(false); setEditGroup(undefined); }}
        onSuccess={() => fetchData()}
        group={editGroup}
      />
      <AddBillSundryDialog
        open={addSundryOpen}
        onClose={() => { setAddSundryOpen(false); setEditSundry(undefined); }}
        onSuccess={() => fetchData()}
        sundry={editSundry}
      />

      <AddPaymentMethodDialog
        open={addPaymentMethodOpen}
        onClose={() => { setAddPaymentMethodOpen(false); setEditPaymentMethod(undefined); }}
        onSuccess={() => { fetchData(); setEditPaymentMethod(undefined); }}
        initialData={editPaymentMethod}
      />

      <AddSaleTypeDialog
        open={addSaleTypeOpen}
        onClose={() => { setAddSaleTypeOpen(false); setEditSaleType(undefined); }}
        onSuccess={() => { fetchData(); setEditSaleType(undefined); }}
        initialData={editSaleType}
      />
      <AddPurchaseTypeDialog
        open={addPurchaseTypeOpen}
        onClose={() => { setAddPurchaseTypeOpen(false); setEditPurchaseType(undefined); }}
        onSuccess={() => { fetchData(); setEditPurchaseType(undefined); }}
        initialData={editPurchaseType}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={`Delete ${confirmState.type.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")}`}
        description={`Are you sure you want to delete '${confirmState.name}'? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
        loading={busy}
      />

      <ConfirmDialog
        open={alertState.open}
        title={alertState.title}
        description={alertState.message}
        variant="danger"
        confirmText="OK"
        onConfirm={() => setAlertState(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
