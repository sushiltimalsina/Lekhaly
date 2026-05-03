// apps/desktop/src/pages/inventory/warehouses.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import {
  Warehouse,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Save,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createBin,
  deleteBin,
  reorderWarehouses,
  reorderBins,
  type Warehouse as WarehouseType,
} from "@/lib/api/warehouses";
import { SortableList } from "@/components/app/sortable-list";

export default function WarehousesPage() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = React.useState<WarehouseType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createCode, setCreateCode] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const [editId, setEditId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editCode, setEditCode] = React.useState("");

  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const [addBinWarehouseId, setAddBinWarehouseId] = React.useState<string | null>(null);
  const [binName, setBinName] = React.useState("");
  const [binCode, setBinCode] = React.useState("");
  const [addingBin, setAddingBin] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWarehouses();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleCreate = async () => {
    if (!createName.trim()) { setError("Warehouse name is required"); return; }
    setCreating(true); setError(null);
    try {
      await createWarehouse({ name: createName.trim(), code: createCode.trim() || undefined });
      setSuccess("Warehouse created successfully");
      setCreateOpen(false); setCreateName(""); setCreateCode("");
      await refresh();
    } catch (e: any) { setError(e?.message ?? "Failed to create warehouse"); }
    finally { setCreating(false); }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) { setError("Warehouse name is required"); return; }
    setError(null);
    try {
      await updateWarehouse(id, { name: editName.trim(), code: editCode.trim() || undefined });
      setSuccess("Warehouse updated"); setEditId(null); await refresh();
    } catch (e: any) { setError(e?.message ?? "Failed to update warehouse"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete warehouse "${name}"?`)) return;
    try { await deleteWarehouse(id); setSuccess("Warehouse removed"); await refresh(); }
    catch (e: any) { setError(e?.message ?? "Failed to delete warehouse"); }
  };

  const handleAddBin = async (warehouseId: string) => {
    if (!binName.trim()) { setError("Bin name is required"); return; }
    setAddingBin(true); setError(null);
    try {
      await createBin(warehouseId, { name: binName.trim(), code: binCode.trim() || undefined });
      setSuccess("Bin added"); setAddBinWarehouseId(null); setBinName(""); setBinCode("");
      await refresh();
    } catch (e: any) { setError(e?.message ?? "Failed to add bin"); }
    finally { setAddingBin(false); }
  };

  const handleDeleteBin = async (binId: string, name: string) => {
    if (!confirm(`Delete bin "${name}"?`)) return;
    try { await deleteBin(binId); setSuccess("Bin removed"); await refresh(); }
    catch (e: any) { setError(e?.message ?? "Failed to delete bin"); }
  };

  const handleReorderWarehouses = async (newItems: WarehouseType[]) => {
    setWarehouses(newItems);
    try {
      await reorderWarehouses(newItems.map((wh, i) => ({ id: wh.id, sortOrder: i })));
    } catch (e: any) {
      setError(e?.message ?? "Failed to reorder warehouses");
      refresh();
    }
  };

  const handleReorderBins = async (warehouseId: string, newItems: any[]) => {
    const next = warehouses.map(wh => {
      if (wh.id === warehouseId) return { ...wh, bins: newItems };
      return wh;
    });
    setWarehouses(next);
    try {
      await reorderBins(newItems.map((bin, i) => ({ id: bin.id, sortOrder: i })));
    } catch (e: any) {
      setError(e?.message ?? "Failed to reorder bins");
      refresh();
    }
  };

  return (
    <div className="space-y-6 pb-20 text-foreground animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <button onClick={() => navigate("/inventory")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="h-3 w-3" /> Back to Inventory
          </button>
          <PageHeader title="Warehouses" description="Manage storage locations and bins for your inventory." icon={Warehouse} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="rounded-2xl h-12 px-5">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-2xl h-12 px-5 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20">
            <Plus className="mr-2 h-4 w-4" /> New Warehouse
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{success}</div>
      )}

      {createOpen && (
        <Card className="border-blue-200 dark:border-blue-800/50 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Create Warehouse</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input placeholder="Warehouse name *" value={createName} onChange={(e) => setCreateName(e.target.value)} className="rounded-xl" autoFocus />
              <Input placeholder="Code (optional)" value={createCode} onChange={(e) => setCreateCode(e.target.value)} className="rounded-xl" />
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={creating} className="rounded-2xl h-10 bg-blue-600 hover:bg-blue-700 text-white flex-1">
                  <Save className="mr-2 h-4 w-4" />{creating ? "Saving…" : "Save"}
                </Button>
                <Button variant="ghost" onClick={() => { setCreateOpen(false); setCreateName(""); setCreateCode(""); }} className="rounded-2xl h-10">Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : warehouses.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg text-foreground mb-2">No warehouses yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create your first warehouse to start tracking inventory locations.</p>
              <Button onClick={() => setCreateOpen(true)} className="rounded-2xl h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white"><Plus className="mr-2 h-4 w-4" /> Create Warehouse</Button>
            </CardContent>
          </Card>
        ) : (
          <SortableList
            items={warehouses}
            onReorder={handleReorderWarehouses}
            getId={(wh) => wh.id}
            renderItem={(wh) => (
              <Card className="border-border/50 shadow-md overflow-hidden transition-shadow hover:shadow-lg w-full mb-3">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setExpandedId(expandedId === wh.id ? null : wh.id)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0">
                      {expandedId === wh.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0"><Warehouse className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0 text-left">
                      {editId === wh.id ? (
                        <div className="flex items-center gap-2">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-lg h-9 text-sm max-w-[200px]" autoFocus />
                          <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} placeholder="Code" className="rounded-lg h-9 text-sm max-w-[120px]" />
                          <Button size="sm" onClick={() => handleUpdate(wh.id)} className="h-9 rounded-lg bg-blue-600 text-white text-xs">Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-9 rounded-lg text-xs">Cancel</Button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{wh.name}</span>
                            {wh.code && <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{wh.code}</span>}
                            {!wh.isActive && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Inactive</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{wh._count?.bins ?? wh.bins.length} bins</span>
                            <span>{wh.totalStockQty ?? 0} units on hand</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {editId !== wh.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditId(wh.id); setEditName(wh.name); setEditCode(wh.code ?? ""); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(wh.id, wh.name)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>

                  {expandedId === wh.id && (
                    <div className="mt-4 ml-12 pl-4 border-l-2 border-blue-100 dark:border-blue-900/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bins / Locations</h4>
                        <Button variant="outline" size="sm" onClick={() => { setAddBinWarehouseId(wh.id); setBinName(""); setBinCode(""); }} className="rounded-xl h-8 text-xs"><Plus className="mr-1 h-3 w-3" /> Add Bin</Button>
                      </div>
                      {addBinWarehouseId === wh.id && (
                        <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                          <Input placeholder="Bin name *" value={binName} onChange={(e) => setBinName(e.target.value)} className="rounded-lg h-8 text-sm flex-1" autoFocus />
                          <Input placeholder="Code" value={binCode} onChange={(e) => setBinCode(e.target.value)} className="rounded-lg h-8 text-sm w-24" />
                          <Button size="sm" disabled={addingBin} onClick={() => handleAddBin(wh.id)} className="h-8 rounded-lg bg-blue-600 text-white text-xs">{addingBin ? "…" : "Add"}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddBinWarehouseId(null)} className="h-8 rounded-lg text-xs"><X className="h-3 w-3" /></Button>
                        </div>
                      )}
                      {wh.bins.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No bins defined.</p>
                      ) : (
                        <SortableList
                          items={wh.bins}
                          onReorder={(newBins) => handleReorderBins(wh.id, newBins)}
                          getId={(bin) => bin.id}
                          renderItem={(bin) => (
                            <div className="flex w-full items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group text-foreground">
                              <div className="flex items-center gap-3 text-left">
                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">{bin.name}</span>
                                {bin.code && <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{bin.code}</span>}
                                {!bin.isActive && <span className="text-[10px] uppercase font-bold text-red-500">Inactive</span>}
                              </div>
                              <button onClick={() => handleDeleteBin(bin.id, bin.name)} className="h-7 w-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-muted-foreground hover:text-red-600" title="Remove bin"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          )}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          />
        )}
      </div>
    </div>
  );
}
