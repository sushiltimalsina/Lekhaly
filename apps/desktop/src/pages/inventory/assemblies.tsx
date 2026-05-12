"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import DualDateInput from "@/components/app/dual-date-input";
import SearchableSelect from "@/components/app/searchable-select";
import { MoneyText } from "@/components/app/money";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import {
  Hammer, Save, AlertTriangle, CheckCircle2, ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Zap, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listItems, getItem, assembleItem, disassembleItem, type ItemRecord } from "@/lib/api/items";
import { listBillSundries, type BillSundryRecord } from "@/lib/api/bill-sundries";
import { toBs } from "@/lib/dates/bs";
import { inventoryFeatures } from "@/lib/inventory-features";

type DateValue = { ad: string; bs: string };
type VLine = { id: string; itemId: string; qty: string; unit: string; rate: string; amount: number };
type SundryLine = { id: string; sundryId: string; amount: string; type: "add" | "less"; percent: string };

const mkLine = (): VLine => ({ id: crypto.randomUUID(), itemId: "", qty: "", unit: "", rate: "", amount: 0 });
const mkSundry = (): SundryLine => ({ id: crypto.randomUUID(), sundryId: "", amount: "", type: "add", percent: "" });
const calc = (l: VLine): VLine => ({ ...l, amount: (Number(l.qty) || 0) * (Number(l.rate) || 0) });

export default function AssemblyOrdersPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  
  const [allItems, setAllItems] = React.useState<ItemRecord[]>([]);
  const [allSundries, setAllSundries] = React.useState<BillSundryRecord[]>([]);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  
  const [mode, setMode] = React.useState<"assemble" | "disassemble">("assemble");
  const [memo, setMemo] = React.useState("");
  const now = new Date().toISOString().slice(0, 10);
  const [date, setDate] = React.useState<DateValue>({ ad: now, bs: toBs(now) });
  
  const [consumedLines, setConsumedLines] = React.useState<VLine[]>([mkLine()]);
  const [generatedLines, setGeneratedLines] = React.useState<VLine[]>([mkLine()]);
  const [sundries, setSundries] = React.useState<SundryLine[]>([]);
  
  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [addSundryOpen, setAddSundryOpen] = React.useState(false);

  const loadItems = React.useCallback(async () => {
    try { const d = await listItems({ take: 1000 }); setAllItems(Array.isArray(d) ? d : []); } catch {}
  }, []);
  
  const loadSundries = React.useCallback(async () => {
    try { const d = await listBillSundries({ isActive: true, take: 100 }); setAllSundries(Array.isArray(d) ? d : (d as any)?.items || []); } catch {}
  }, []);

  const loadInventorySettings = React.useCallback(async () => {
    try { setInventorySettings(await getInventorySettings()); } catch { setInventorySettings(null); }
  }, []);

  React.useEffect(() => { loadItems(); loadSundries(); loadInventorySettings(); }, [loadItems, loadSundries, loadInventorySettings]);

  const itemOpts = React.useMemo(() => allItems.filter(i => i.type !== "services").map(i => ({ id: i.id, name: `${i.name}${i.sku ? ` [${i.sku}]` : ""}`, _raw: i })), [allItems]);
  const sundryOpts = React.useMemo(() => allSundries.map(s => ({ id: s.id, name: s.name, _raw: s })), [allSundries]);
  const features = inventoryFeatures(inventorySettings);

  const updateLine = (s: React.Dispatch<React.SetStateAction<VLine[]>>, i: number, p: Partial<VLine>) => s(prev => prev.map((l, idx) => idx === i ? calc({ ...l, ...p }) : l));
  const addRow = (s: React.Dispatch<React.SetStateAction<VLine[]>>) => s(p => [...p, mkLine()]);
  const delRow = (s: React.Dispatch<React.SetStateAction<VLine[]>>, i: number) => s(p => p.length <= 1 ? p : p.filter((_, idx) => idx !== i));

  const consumedTotal = consumedLines.reduce((s, l) => s + l.amount, 0);
  const sundryTotal = sundries.reduce((s, e) => {
    const amt = Number(e.amount) || 0;
    return s + (e.type === "add" ? amt : -amt);
  }, 0);
  const generatedQty = generatedLines.reduce((s, l) => s + (Number(l.qty) || 0), 0);
  const generatedCost = consumedTotal + sundryTotal;

  React.useEffect(() => {
    if (mode === "assemble" && generatedLines.length > 0 && generatedQty > 0) {
      const rate = generatedCost / generatedQty;
      setGeneratedLines(prev => prev.map(l => l.itemId ? { ...l, rate: rate.toFixed(2), amount: (Number(l.qty) || 0) * rate } : l));
    }
  }, [consumedTotal, sundryTotal, generatedQty, mode]);

  React.useEffect(() => {
    if (consumedTotal > 0) {
      setSundries(prev => prev.map(s => {
        if (s.percent) {
          const amt = ((consumedTotal * Number(s.percent)) / 100).toFixed(2);
          return { ...s, amount: amt };
        }
        return s;
      }));
    }
  }, [consumedTotal]);

  const handleKitSelected = async (itemId: string, targetQty: number, bomSetter: React.Dispatch<React.SetStateAction<VLine[]>>) => {
    if (!itemId) return;
    try {
      const detail = await getItem(itemId);
      if (detail?.components?.length) {
        const lines: VLine[] = detail.components.map(comp => {
          const ci = allItems.find(i => i.id === comp.componentId);
          const q = Number(comp.qty) * targetQty;
          const r = Number(ci?.purchasePrice ?? 0);
          return { id: crypto.randomUUID(), itemId: comp.componentId, qty: String(q), unit: ci?.unit || "pcs", rate: String(r), amount: q * r };
        });
        bomSetter(lines.length > 0 ? lines : [mkLine()]);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    setError(null); setSuccess(null);
    if (!features.kits) return setError("Enable Kits & Assemblies in Inventory Configuration to use this page.");
    const kitLines = (mode === "assemble" ? generatedLines : consumedLines).filter(l => l.itemId && Number(l.qty) > 0);
    const compLines = (mode === "assemble" ? consumedLines : generatedLines).filter(l => l.itemId && Number(l.qty) > 0);
    const validSundries = sundries.filter(s => s.sundryId && Number(s.amount) > 0).map(s => ({ sundryId: s.sundryId, amount: Number(s.amount) }));

    if (!kitLines.length) return setError("Add the finished good item.");
    if (!compLines.length) return setError("Add at least one component item.");

    setSubmitting(true);
    try {
      const components = compLines.map(cl => ({ componentId: cl.itemId, consumedQty: Number(cl.qty) }));
      for (const kit of kitLines) {
        if (mode === "assemble") await assembleItem(kit.itemId, Number(kit.qty), memo.trim() || undefined, components, validSundries);
        else await disassembleItem(kit.itemId, Number(kit.qty), components, validSundries);
      }
      const kitName = allItems.find(i => i.id === kitLines[0].itemId)?.name ?? "Item";
      setSuccess(`${mode === "assemble" ? "Assembled" : "Disassembled"} ${kitLines[0].qty} × ${kitName} successfully.`);
      resetForm();
      await loadItems();
    } catch (e: any) { setError(e?.message ?? "Operation failed."); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setConsumedLines([mkLine()]); setGeneratedLines([mkLine()]); setSundries([]); setMemo("");
  };

  const renderGrid = (
    label: string, color: string, lines: VLine[], setter: React.Dispatch<React.SetStateAction<VLine[]>>,
    isKitSide: boolean, readOnlyRate: boolean
  ) => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">{label}</div>
        <Button 
          type="button" 
          onClick={() => addRow(setter)} 
          className={cn("h-8 rounded-xl px-4 text-[11px] font-bold text-white shadow-lg border-none transition-all active:scale-95", color.split(" ")[0])}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Row
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100/70 dark:bg-zinc-900/40">
            <tr>
              <th className="w-[50px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">S.N.</th>
              <th className="min-w-[280px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Particulars</th>
              <th className="w-[120px] px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Qty</th>
              <th className="w-[80px] px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Unit</th>
              <th className="w-[140px] px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Rate</th>
              <th className="w-[150px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Amount</th>
              <th className="w-[50px]" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => {
              return (
                <tr key={line.id} className="border-t border-slate-200/70 dark:border-zinc-800/60">
                  <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <SearchableSelect
                        options={itemOpts}
                        valueId={line.itemId}
                        leftIcon={<Search className="h-4 w-4" />}
                        getLabel={(it: any) => `${it.name}${it._raw?.sku ? ` [${it._raw.sku}]` : ""}`}
                        getDetail={(it: any) => it._raw?.type === "services" ? "Service" : `${it._raw?.stock ?? 0} ${it._raw?.unit ?? "Units"}`}
                        onChange={(id, opt) => {
                          const raw = (opt as any)?._raw as ItemRecord | undefined;
                          updateLine(setter, idx, { itemId: id, unit: raw?.unit || "", rate: readOnlyRate ? line.rate : String(Number(raw?.purchasePrice ?? 0)) });
                          if (isKitSide && raw?.isKit) {
                            const q = Number(line.qty) || 1;
                            handleKitSelected(id, q, mode === "assemble" ? setConsumedLines : setGeneratedLines);
                          }
                        }}
                        placeholder="Search item…"
                        buttonClassName={cn("h-11 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700", !line.itemId && "pr-[90px]")}
                      />
                      {!line.itemId && (
                        <Button
                          type="button"
                          onClick={() => setAddItemOpen(true)}
                          className={cn("absolute right-1.5 top-1/2 -translate-y-1/2 h-8 rounded-xl px-3 text-[10px] font-medium text-white border-none shadow-sm transition-all", accentColor, accentHover)}
                        >
                          <Plus className="mr-1 h-3 w-3" /> New
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Input type="number" min="0" step="any" value={line.qty} onChange={e => {
                      updateLine(setter, idx, { qty: e.target.value });
                      if (isKitSide && line.itemId) { const q = Number(e.target.value) || 0; if (q > 0) handleKitSelected(line.itemId, q, mode === "assemble" ? setConsumedLines : setGeneratedLines); }
                    }} className="h-11 rounded-2xl text-center font-medium bg-white dark:bg-zinc-900" placeholder="0" />
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">{line.unit || "—"}</td>
                  <td className="px-4 py-3">
                    {readOnlyRate
                      ? <div className="h-11 flex items-center justify-center text-sm font-medium text-muted-foreground bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700"><MoneyText value={Number(line.rate) || 0} /></div>
                      : <Input type="number" min="0" step="any" value={line.rate} onChange={e => updateLine(setter, idx, { rate: e.target.value })} className="h-11 rounded-2xl text-center font-medium bg-white dark:bg-zinc-900" placeholder="0.00" />
                    }
                  </td>
                  <td className="px-4 py-3 text-right font-semibold"><MoneyText value={line.amount} /></td>
                  <td className="px-4 py-3 text-center">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => delRow(setter, idx)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/30">
              <td colSpan={5} className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</td>
              <td className="px-4 py-4 text-right"><MoneyText value={lines.reduce((s, l) => s + l.amount, 0)} className="text-base font-black" /></td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );

  const accentColor = mode === "assemble" ? "bg-emerald-600" : "bg-rose-600";
  const accentShadow = mode === "assemble" ? "shadow-emerald-500/20" : "shadow-rose-500/20";
  const accentHover = mode === "assemble" ? "hover:bg-emerald-700" : "hover:bg-rose-700";

  return (
    <div className="space-y-6 pb-20 text-foreground">
      <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4">
          <Button onClick={() => navigate("/inventory")} className={cn("rounded-full h-10 px-4 bg-white text-slate-900 border border-slate-200 transition-colors shadow-sm", mode === "assemble" ? "hover:!bg-emerald-600 hover:!text-white hover:!border-emerald-600" : "hover:!bg-rose-600 hover:!text-white hover:!border-rose-600", "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
          </Button>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-xl", accentColor, accentShadow)}><Hammer className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-bold italic tracking-tight text-slate-900 dark:text-slate-100">Assemble / Disassemble Stock</h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Consume materials to build finished goods, or break them down.</p>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>}
        {success && <div className="mb-4 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> {success}</div>}

        {!inventorySettings ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-muted-foreground dark:border-zinc-800">
            Loading inventory configuration...
          </div>
        ) : !features.kits ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-muted-foreground dark:border-zinc-800">
            Enable Kits & Assemblies in Inventory Configuration to assemble or disassemble stock.
          </div>
        ) : (
          <>
        <section className="mb-6 flex flex-col sm:flex-row items-end justify-between gap-4">
          <div className="flex gap-2 w-full sm:w-[320px]">
            <button type="button" onClick={() => { setMode("assemble"); resetForm(); }} className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-2xl h-11 text-sm font-bold transition-all border-2", mode === "assemble" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-transparent text-muted-foreground border-border hover:border-emerald-300")}><ArrowUp className="h-4 w-4" /> Assemble</button>
            <button type="button" onClick={() => { setMode("disassemble"); resetForm(); }} className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-2xl h-11 text-sm font-bold transition-all border-2", mode === "disassemble" ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20" : "bg-transparent text-muted-foreground border-border hover:border-rose-300")}><ArrowDown className="h-4 w-4" /> Disassemble</button>
          </div>
          <div className="w-full sm:w-auto ml-auto">
            <DualDateInput label="Voucher Date" value={date} accentColor={accentColor} onChange={setDate} />
          </div>
        </section>

        {renderGrid(mode === "assemble" ? "Items Consumed (Raw Materials)" : "Items Consumed (Finished Good)", accentColor, consumedLines, setConsumedLines, mode === "disassemble", false)}

        {/* BILL SUNDRY */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bill Sundries</div>
            <Button type="button" onClick={() => setSundries(p => [...p, mkSundry()])} className={cn("h-8 rounded-xl text-white border-none font-bold text-xs px-4 shadow-lg transition-all active:scale-95", accentColor, accentHover, accentShadow)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Sundry
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100/70 dark:bg-zinc-900/40">
                <tr>
                  <th className="w-[50px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">S.N.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Sundry Name</th>
                  <th className="w-[100px] px-4 py-3 text-center text-xs font-semibold text-muted-foreground">%</th>
                  <th className="w-[180px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="w-[60px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {sundries.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground font-medium">No sundries added</td></tr>
                )}
                {sundries.map((sun, idx) => (
                  <tr key={sun.id} className="border-t border-slate-200/70 dark:border-zinc-800/60">
                    <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <SearchableSelect
                          options={sundryOpts}
                          valueId={sun.sundryId}
                          leftIcon={<Search className="h-4 w-4" />}
                          onChange={(id, opt) => {
                            const raw = (opt as any)?._raw as BillSundryRecord | undefined;
                            setSundries(p => p.map((x, i) => i === idx ? { ...x, sundryId: id, type: raw?.type || "add" } : x));
                          }}
                          placeholder="Select Sundry…"
                          buttonClassName={cn("h-11 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700", !sun.sundryId && "pr-[120px]")}
                        />
                        {!sun.sundryId && (
                          <Button
                            type="button"
                            onClick={() => setAddSundryOpen(true)}
                            className={cn("absolute right-1.5 top-1/2 -translate-y-1/2 h-8 rounded-xl px-3 text-[10px] font-medium text-white border-none shadow-sm transition-all", accentColor, accentHover)}
                          >
                            <Plus className="mr-1 h-3 w-3" /> Define New
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={sun.percent}
                        onChange={e => {
                          const p = e.target.value;
                          const amt = p ? ((consumedTotal * Number(p)) / 100).toFixed(2) : sun.amount;
                          setSundries(prev => prev.map((x, i) => i === idx ? { ...x, percent: p, amount: amt } : x));
                        }}
                        className="h-11 rounded-2xl text-center font-medium bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700"
                        placeholder="0%"
                      />
                    </td>
                    <td className="px-4 py-3 text-right relative flex items-center justify-end">
                      <span className={cn("text-xs font-black mr-2", sun.type === "add" ? "text-slate-400" : "text-rose-400")}>{sun.type === "add" ? "+" : "-"}</span>
                      <Input type="number" min="0" step="any" value={sun.amount} onChange={e => setSundries(p => p.map((x, i) => i === idx ? { ...x, amount: e.target.value, percent: "" } : x))} className={cn("h-11 rounded-2xl text-right font-medium w-32", sun.type === "add" ? "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700" : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 text-rose-600")} placeholder="0.00" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => setSundries(p => p.filter((_, i) => i !== idx))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sundries.length > 0 && (
                  <tr className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/30">
                    <td colSpan={2} className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Sundries</td>
                    <td className="px-4 py-4 text-right"><MoneyText value={sundryTotal} className="text-base font-black" /></td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 mb-8">
          {renderGrid(mode === "assemble" ? "Items Generated (Finished Good)" : "Items Generated (Components Returned)", accentColor, generatedLines, setGeneratedLines, mode === "assemble", mode === "assemble")}
        </div>

        {/* NARRATION AT THE END */}
        <div className="mb-8 p-6 rounded-[2rem] bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Transaction Narration
          </div>
          <Input 
            value={memo} 
            onChange={e => setMemo(e.target.value)} 
            placeholder="Add batch notes, production details, or specific instructions for this document..." 
            className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-zinc-700 text-sm shadow-inner" 
          />
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="text-muted-foreground">Consumed: <MoneyText value={consumedTotal} className="font-bold text-foreground" /></span>
            {mode === "assemble" && sundryTotal !== 0 && <span className="text-muted-foreground">{sundryTotal > 0 ? "+" : "-"} Sundries: <MoneyText value={Math.abs(sundryTotal)} className="font-bold text-violet-600" /></span>}
            <span className="text-muted-foreground">→ Generated: <MoneyText value={mode === "assemble" ? generatedCost : generatedLines.reduce((s, l) => s + l.amount, 0)} className="font-bold text-foreground" /></span>
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={resetForm} variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-300"><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
            <Button onClick={handleSubmit} disabled={submitting} className={cn("rounded-2xl h-12 px-10 font-bold text-white shadow-lg border-none transition-all active:scale-95", accentColor, accentHover, accentShadow)}><Save className="mr-2 h-4 w-4" /> {submitting ? "Saving…" : "Save Document"}</Button>
          </div>
        </div>
          </>
        )}
      </div>

      <AddItemDialog open={addItemOpen} onClose={() => setAddItemOpen(false)} onSuccess={async () => { await loadItems(); setAddItemOpen(false); }} />
      <AddBillSundryDialog open={addSundryOpen} onClose={() => setAddSundryOpen(false)} onSuccess={async () => { await loadSundries(); setAddSundryOpen(false); }} />
    </div>
  );
}
