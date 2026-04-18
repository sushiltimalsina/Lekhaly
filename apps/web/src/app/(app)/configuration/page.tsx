"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Switch } from "@lekhaly/ui";
import { deleteUnit, listUnits, type UnitRecord } from "@/lib/api/units";
import { deleteItemGroup, listItemGroups, type ItemGroupRecord } from "@/lib/api/item-groups";
import { listBillSundries, deleteBillSundry, type BillSundryRecord } from "@/lib/api/bill-sundries";
import { Trash2, Ruler, Layers, Calculator, Plus, AlertCircle, ChevronDown, ChevronRight, Search, Pencil, Monitor, Hash, Shield, CreditCard, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import AddUnitDialog from "@/components/app/add-unit-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import ConfirmDialog from "@/components/app/confirm-dialog";
import { useDateFormat } from "@/lib/date-format";
import { getSettings, setCalendarPreference, setDefaultDateRange, subscribeSettings } from "@/lib/store/settings";
import { getCurrencySettings, setCurrencySymbol, setNumberFormat, subscribeUi } from "@/lib/store/ui";
import { MoneyText } from "@/components/app/money";
import { getCompany, updateCompany } from "@/lib/api/auth";

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

export default function ConfigurationPage() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const unitsRef = React.useRef<HTMLDivElement | null>(null);
  const groupsRef = React.useRef<HTMLDivElement | null>(null);
  const sundriesRef = React.useRef<HTMLDivElement | null>(null);

  const [units, setUnits] = React.useState<UnitRecord[]>([]);
  const [groups, setGroups] = React.useState<ItemGroupRecord[]>([]);
  const [sundries, setSundries] = React.useState<BillSundryRecord[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [addUnitOpen, setAddUnitOpen] = React.useState(false);
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);
  const [addSundryOpen, setAddSundryOpen] = React.useState(false);

  const [editUnit, setEditUnit] = React.useState<UnitRecord | undefined>();
  const [editGroup, setEditGroup] = React.useState<ItemGroupRecord | undefined>();
  const [editSundry, setEditSundry] = React.useState<BillSundryRecord | undefined>();

  // Visibility state
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  // Search state
  const [qUnits, setQUnits] = React.useState("");
  const [qGroups, setQGroups] = React.useState("");
  const [qSundries, setQSundries] = React.useState("");

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
    type: "unit" | "group" | "sundry";
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
      const [uRes, gRes, sRes, cRes] = await Promise.all([
        listUnits({ take: 200 }),
        listItemGroups({ take: 200 }),
        listBillSundries({ take: 200 }),
        getCompany()
      ]);
      setUnits(normalizeList<UnitRecord>(uRes));
      setGroups(normalizeList<ItemGroupRecord>(gRes));
      setSundries(normalizeList<BillSundryRecord>(sRes).map(s => ({
         ...s,
         id: s.id || (s as any)._id
      })));
      setCompany(cRes);
      setCompanyForm(cRes);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load configuration data.");
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

  const saveCompanySettings = async (updates: any) => {
    setBusy(true);
    setError(null);
    try {
      const res = await updateCompany({ ...companyForm, ...updates });
      setCompany(res);
      setCompanyForm(res);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update company settings.");
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
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto text-red-800 hover:bg-accent dark:text-red-400 dark:hover:bg-accent/20">
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
                    <div key={u.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm transition-all hover:bg-muted/40 text-foreground">
                      <span className="font-medium">{u.name}</span>
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                    <div key={g.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm transition-all hover:bg-muted/40 text-foreground">
                      <span className="font-medium">{g.name}</span>
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
                          "flex h-10 w-10 items-center justify-center rounded-xl font-medium",
                          s.type === "add" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30" : "bg-red-100 text-red-600 dark:bg-red-950/30"
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
            </CardContent>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Voucher Numbering Section */}
        <Card className="glass-card overflow-hidden lg:col-span-2">
          <CardHeader onClick={() => setExpandedSection(expandedSection === "numbering" ? null : "numbering")} className="cursor-pointer hover:bg-accent/10 transition-colors select-none">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-indigo-500" />
              <div>
                <CardTitle className="text-lg">Voucher Numbering</CardTitle>
                <CardDescription>Setup prefixes and sequences for all document series</CardDescription>
              </div>
            </div>
          </CardHeader>
          {expandedSection === "numbering" && (
            <CardContent className="space-y-6 animate-in fade-in slide-in-from-top-1 pt-2">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Important:</strong> Numbering settings should be finalized before issuing the first voucher. You can change the prefix and suffix freely until the first invoice or voucher is issued in each series.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
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

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Print Logo on Documents</div>
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
      </div>

      <div className="mt-8"></div>

      <AddUnitDialog
        open={addUnitOpen}
        onClose={() => { setAddUnitOpen(false); setEditUnit(undefined); }}
        onSuccess={() => fetchData()}
        unit={editUnit}
      />
      <AddGroupDialog
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

      <ConfirmDialog
        open={confirmState.open}
        title={`Delete ${confirmState.type.charAt(0).toUpperCase() + confirmState.type.slice(1)}`}
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
