"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { listUnits, type UnitRecord, deleteUnit } from "@/lib/api/units";
import { listItemGroups, type ItemGroupRecord, deleteItemGroup } from "@/lib/api/item-groups";
import { listBillSundries, type BillSundryRecord, deleteBillSundry } from "@/lib/api/bill-sundries";
import { listPaymentMethods, deletePaymentMethod } from "@/lib/api/payment-methods";
import { listSaleTypes, deleteSaleType } from "@/lib/api/sale-types";
import { listPurchaseTypes, deletePurchaseType } from "@/lib/api/purchase-types";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

import AddUnitDialog from "@/components/app/add-unit-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import AddPaymentMethodDialog from "@/components/app/add-payment-method-dialog";
import AddSaleTypeDialog from "@/components/app/add-sale-type-dialog";
import AddPurchaseTypeDialog from "@/components/app/add-purchase-type-dialog";
import ConfirmDialog from "@/components/app/confirm-dialog";
import AddFiscalSessionDialog from "./components/AddFiscalSessionDialog";

import { getCompany, updateCompany } from "@/lib/api/auth";
import { listFiscalSessions, switchFiscalSession, lockFiscalSession, type FiscalSessionRecord } from "@/lib/api/fiscal-sessions";
import { getInventorySettings, updateInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listWarehouses, type Warehouse } from "@/lib/api/warehouses";

// Refactored Components
import { UnitsPanel } from "./components/UnitsPanel";
import { GroupsPanel } from "./components/GroupsPanel";
import { SundriesPanel } from "./components/SundriesPanel";
import { PaymentMethodsPanel } from "./components/PaymentMethodsPanel";
import { TradeTypesPanel } from "./components/TradeTypesPanel";
import { RegionalPreferences } from "./components/RegionalPreferences";
import { VoucherNumbering } from "./components/VoucherNumbering";
import { FiscalSecurityPanel, CreditManagementPanel } from "./components/SecurityCreditPanels";
import { FiscalSessionsPanel } from "./components/FiscalSessionsPanel";
import { InventoryConfigurationPanel } from "./components/InventoryConfigurationPanel";

export default function ConfigurationPage() {
  return (
    <React.Suspense fallback={null}>
      <ConfigurationContent />
    </React.Suspense>
  );
}

function ConfigurationContent() {
  const searchParams = useSearchParams();
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
  const [sessions, setSessions] = React.useState<FiscalSessionRecord[]>([]);
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
  const [addSessionOpen, setAddSessionOpen] = React.useState(false);

  const [editUnit, setEditUnit] = React.useState<UnitRecord | undefined>();
  const [editGroup, setEditGroup] = React.useState<ItemGroupRecord | undefined>();
  const [editSundry, setEditSundry] = React.useState<BillSundryRecord | undefined>();
  const [editPaymentMethod, setEditPaymentMethod] = React.useState<any | undefined>();
  const [editSaleType, setEditSaleType] = React.useState<any | undefined>();
  const [editPurchaseType, setEditPurchaseType] = React.useState<any | undefined>();

  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  const [company, setCompany] = React.useState<any>(null);
  const [companyForm, setCompanyForm] = React.useState<any>({});

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
      const [uRes, gRes, sRes, pmRes, stRes, ptRes, cRes, sessRes, invRes, whRes] = await Promise.all([
        listUnits({ take: 100 }),
        listItemGroups({ take: 100 }),
        listBillSundries({ take: 100 }),
        listPaymentMethods({ take: 100 }),
        listSaleTypes({ take: 100 }),
        listPurchaseTypes({ take: 100 }),
        getCompany(),
        listFiscalSessions(),
        getInventorySettings(),
        listWarehouses({ isActive: true })
      ]);
      setUnits(normalizeList<UnitRecord>(uRes));
      setGroups(normalizeList<ItemGroupRecord>(gRes));
      setSundries(normalizeList<BillSundryRecord>(sRes).map(s => ({
         ...s,
         id: s.id || (s as any)._id
      })));
      setPaymentMethods(normalizeList<any>(pmRes).sort((a, b) => b.name.localeCompare(a.name)));
      setSaleTypes(normalizeList<any>(stRes).sort((a, b) => b.name.localeCompare(a.name)));
      setPurchaseTypes(normalizeList<any>(ptRes).sort((a, b) => b.name.localeCompare(a.name)));
      setCompany(cRes);
      setCompanyForm(cRes);
      setSessions(normalizeList<FiscalSessionRecord>(sessRes));
      setInventorySettings(invRes);
      setWarehouses(normalizeList<Warehouse>(whRes));
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
         message: `${readableType} '${name}' cannot be deleted because it is currently used.`,
         open: true
       });
    } finally {
      setBusy(false);
    }
  };

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

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <UnitsPanel 
          units={units}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "units"}
          onToggle={() => setExpandedSection(expandedSection === "units" ? null : "units")}
          onAdd={() => setAddUnitOpen(true)}
          onEdit={(u) => { setEditUnit(u); setAddUnitOpen(true); }}
          onRemove={(id) => setConfirmState({ id, name: units.find(u => u.id === id)?.name || "", type: "unit", open: true })}
          focus={focus === "units"}
          forwardedRef={unitsRef}
        />

        <GroupsPanel 
          groups={groups}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "groups"}
          onToggle={() => setExpandedSection(expandedSection === "groups" ? null : "groups")}
          onAdd={() => setAddGroupOpen(true)}
          onEdit={(g) => { setEditGroup(g); setAddGroupOpen(true); }}
          onRemove={(id) => setConfirmState({ id, name: groups.find(g => g.id === id)?.name || "", type: "group", open: true })}
          focus={focus === "groups"}
          forwardedRef={groupsRef}
        />

        <SundriesPanel 
          sundries={sundries}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "sundries"}
          onToggle={() => setExpandedSection(expandedSection === "sundries" ? null : "sundries")}
          onAdd={() => setAddSundryOpen(true)}
          onEdit={(s) => { setEditSundry(s); setAddSundryOpen(true); }}
          onRemove={(id) => setConfirmState({ id, name: sundries.find(s => s.id === id)?.name || "", type: "sundry", open: true })}
          focus={focus === "sundries"}
          forwardedRef={sundriesRef}
        />

        <PaymentMethodsPanel
          paymentMethods={paymentMethods}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "payment-methods"}
          onToggle={() => setExpandedSection(expandedSection === "payment-methods" ? null : "payment-methods")}
          onAdd={() => { setEditPaymentMethod(undefined); setAddPaymentMethodOpen(true); }}
          onEdit={(pm) => { setEditPaymentMethod(pm); setAddPaymentMethodOpen(true); }}
          onRemove={(id) => setConfirmState({ id, name: paymentMethods.find(pm => pm.id === id)?.name || "", type: "payment-method", open: true })}
          focus={focus === "payment-methods"}
        />

        <TradeTypesPanel
          saleTypes={saleTypes}
          purchaseTypes={purchaseTypes}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "trade-types"}
          onToggle={() => setExpandedSection(expandedSection === "trade-types" ? null : "trade-types")}
          onAddSaleType={() => { setEditSaleType(undefined); setAddSaleTypeOpen(true); }}
          onEditSaleType={(st) => { setEditSaleType(st); setAddSaleTypeOpen(true); }}
          onRemoveSaleType={(id) => setConfirmState({ id, name: saleTypes.find(st => st.id === id)?.name || "", type: "sale-type", open: true })}
          onAddPurchaseType={() => { setEditPurchaseType(undefined); setAddPurchaseTypeOpen(true); }}
          onEditPurchaseType={(pt) => { setEditPurchaseType(pt); setAddPurchaseTypeOpen(true); }}
          onRemovePurchaseType={(id) => setConfirmState({ id, name: purchaseTypes.find(pt => pt.id === id)?.name || "", type: "purchase-type", open: true })}
          focus={focus === "trade-types"}
        />

        <FiscalSessionsPanel 
          sessions={sessions}
          activeSessionId={company?.activeFiscalSessionId}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "sessions"}
          onToggle={() => setExpandedSection(expandedSection === "sessions" ? null : "sessions")}
          onAdd={() => setAddSessionOpen(true)}
          onSwitch={async (id) => {
            setBusy(true);
            try {
              await switchFiscalSession(id);
              await fetchData();
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
          onToggleLock={async (id, lock) => {
            setBusy(true);
            try {
              await lockFiscalSession(id, lock);
              await fetchData();
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />

        <InventoryConfigurationPanel
          settings={inventorySettings}
          warehouses={warehouses}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "inventory"}
          onToggle={() => setExpandedSection(expandedSection === "inventory" ? null : "inventory")}
          onSave={saveInventorySettings}
        />

        <RegionalPreferences 
          expanded={expandedSection === "regional"}
          onToggle={() => setExpandedSection(expandedSection === "regional" ? null : "regional")}
          printLogo={companyForm.printLogo ?? true}
          onPrintLogoChange={(v) => {
             setCompanyForm({...companyForm, printLogo: v});
             saveCompanySettings({ printLogo: v });
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <VoucherNumbering 
          expanded={expandedSection === "numbering"}
          onToggle={() => setExpandedSection(expandedSection === "numbering" ? null : "numbering")}
          companyForm={companyForm}
          setCompanyForm={setCompanyForm}
          onSave={saveCompanySettings}
        />

        <div className="space-y-6">
          <FiscalSecurityPanel 
            expanded={expandedSection === "security"}
            onToggle={() => setExpandedSection(expandedSection === "security" ? null : "security")}
            companyForm={companyForm}
            setCompanyForm={setCompanyForm}
            onSave={saveCompanySettings}
          />

          <CreditManagementPanel 
            expanded={expandedSection === "credit"}
            onToggle={() => setExpandedSection(expandedSection === "credit" ? null : "credit")}
            companyForm={companyForm}
            setCompanyForm={setCompanyForm}
            onSave={saveCompanySettings}
          />
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

      <AddFiscalSessionDialog
        open={addSessionOpen}
        onClose={() => setAddSessionOpen(false)}
        onSuccess={() => fetchData()}
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
