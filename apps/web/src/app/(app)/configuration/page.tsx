"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button, Input, NEPAL_ADDRESS_DATA } from "@lekhaly/ui";
import { listUnits, type UnitRecord, deleteUnit, reorderUnits } from "@/lib/api/units";
import { listItemGroups, type ItemGroupRecord, deleteItemGroup, reorderItemGroups } from "@/lib/api/item-groups";
import { listBillSundries, type BillSundryRecord, deleteBillSundry, reorderBillSundries } from "@/lib/api/bill-sundries";
import { listPaymentMethods, deletePaymentMethod, reorderPaymentMethods } from "@/lib/api/payment-methods";
import { listSaleTypes, deleteSaleType, reorderSaleTypes } from "@/lib/api/sale-types";
import { listPurchaseTypes, deletePurchaseType, reorderPurchaseTypes } from "@/lib/api/purchase-types";
import { AlertCircle, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import DualDateInput from "@/components/app/dual-date-input";
import { adToBs, bsToAd } from "@/lib/dates/convert";

import AddUnitDialog from "@/components/app/add-unit-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import AddPaymentMethodDialog from "@/components/app/add-payment-method-dialog";
import AddSaleTypeDialog from "@/components/app/add-sale-type-dialog";
import AddPurchaseTypeDialog from "@/components/app/add-purchase-type-dialog";
import ConfirmDialog from "@/components/app/confirm-dialog";
import AddFiscalSessionDialog from "./components/AddFiscalSessionDialog";
import CreateNextFiscalYearDialog from "./components/CreateNextFiscalYearDialog";
import FiscalSessionLockDialog from "./components/FiscalSessionLockDialog";

import { completeCompanyOnboarding, getCompany, updateCompany } from "@/lib/api/auth";
import { formatVoucherNumber, getActiveFiscalSession, listFiscalSessions, switchFiscalSession, lockFiscalSession, createNextFiscalSession, type FiscalSessionRecord } from "@/lib/api/fiscal-sessions";
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
import { CreditManagementPanel } from "./components/SecurityCreditPanels";
import { FiscalSessionsPanel } from "./components/FiscalSessionsPanel";
import { InventoryConfigurationPanel } from "./components/InventoryConfigurationPanel";

function getFiscalYearEndDate(startBs: string) {
  if (!startBs) return { ad: "", bs: "" };
  const [year, month, day] = startBs.split("-").map(Number);
  let nextYearStartAd = "";

  for (let candidateDay = day; candidateDay > 0; candidateDay -= 1) {
    const candidateBs = `${year + 1}-${String(month).padStart(2, "0")}-${String(candidateDay).padStart(2, "0")}`;
    try {
      const candidateAd = bsToAd(candidateBs);
      if (adToBs(candidateAd) === candidateBs) {
        nextYearStartAd = candidateAd;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!nextYearStartAd) return { ad: "", bs: "" };
  const endAdDate = new Date(`${nextYearStartAd}T12:00:00.000Z`);
  endAdDate.setUTCDate(endAdDate.getUTCDate() - 1);
  const ad = endAdDate.toISOString().slice(0, 10);
  return { ad, bs: adToBs(ad) };
}

function normalizeList<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  const obj = input as { items?: T[]; data?: T[] } | null;
  return obj?.items ?? obj?.data ?? [];
}

export default function ConfigurationPage() {
  return (
    <React.Suspense fallback={null}>
      <ConfigurationContent />
    </React.Suspense>
  );
}

function ConfigurationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const onboarding = searchParams.get("onboarding") === "true";

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
  const [fiscalSessionLockTarget, setFiscalSessionLockTarget] = React.useState<{ id: string; name: string; lock: boolean } | null>(null);
  const [activeFiscalSessionId, setActiveFiscalSessionId] = React.useState<string | undefined>();
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
  const [nextFiscalYearTarget, setNextFiscalYearTarget] = React.useState<{
    sessionId: string;
    startDate: { ad: string; bs: string };
    endDate: { ad: string; bs: string };
  } | null>(null);

  const [editUnit, setEditUnit] = React.useState<UnitRecord | undefined>();
  const [editGroup, setEditGroup] = React.useState<ItemGroupRecord | undefined>();
  const [editSundry, setEditSundry] = React.useState<BillSundryRecord | undefined>();
  const [editPaymentMethod, setEditPaymentMethod] = React.useState<any | undefined>();
  const [editSaleType, setEditSaleType] = React.useState<any | undefined>();
  const [editPurchaseType, setEditPurchaseType] = React.useState<any | undefined>();

  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  const [company, setCompany] = React.useState<any>(null);
  const [companyForm, setCompanyForm] = React.useState<any>({});
  const [fiscalYearStartDate, setFiscalYearStartDate] = React.useState({ ad: "", bs: "" });
  const [fiscalYearEndDate, setFiscalYearEndDate] = React.useState({ ad: "", bs: "" });
  const [companyExpanded, setCompanyExpanded] = React.useState(onboarding);

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
    setError(null);
    try {
      const [uRes, gRes, sRes, pmRes, stRes, ptRes, cRes, sessRes, activeFiscalSession, invRes, whRes] = await Promise.all([
        listUnits({ take: 100 }),
        listItemGroups({ take: 100 }),
        listBillSundries({ take: 100 }),
        listPaymentMethods({ take: 100 }),
        listSaleTypes({ take: 100 }),
        listPurchaseTypes({ take: 100 }),
        getCompany(),
        listFiscalSessions(),
        getActiveFiscalSession(),
        getInventorySettings(),
        listWarehouses({ isActive: true })
      ]);
      setUnits(normalizeList<UnitRecord>(uRes));
      setGroups(normalizeList<ItemGroupRecord>(gRes));
      setSundries(normalizeList<BillSundryRecord>(sRes).map(s => ({
         ...s,
         id: s.id || (s as any)._id
      })));
      setPaymentMethods(normalizeList<any>(pmRes));
      setSaleTypes(normalizeList<any>(stRes));
      setPurchaseTypes(normalizeList<any>(ptRes));
      setCompany(cRes);
      setCompanyForm(cRes);
      setActiveFiscalSessionId(activeFiscalSession?.id);
      const startAd = activeFiscalSession?.startDate.slice(0, 10) ?? "";
      const endAd = activeFiscalSession?.endDate.slice(0, 10) ?? "";
      setFiscalYearStartDate({ ad: startAd, bs: startAd ? adToBs(startAd) : "" });
      setFiscalYearEndDate({ ad: endAd, bs: endAd ? adToBs(endAd) : "" });
      setCompanyExpanded(onboarding || !cRes?.onboardingCompleted);
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
      const res = await updateCompany(updates);
      setCompany(res);
      setCompanyForm(res);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update company settings.");
    } finally {
      setBusy(false);
    }
  };

  const completeOnboarding = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await completeCompanyOnboarding({
        name: companyForm.name,
        address: companyForm.address,
        phone: companyForm.phone,
        mobileNumber: companyForm.mobileNumber,
        email: companyForm.email,
        ownerName: companyForm.ownerName,
        panVatNumber: companyForm.panVatNumber,
        companyRegistrationNumber: companyForm.companyRegistrationNumber,
        localRegistrationNumber: companyForm.localRegistrationNumber,
        dftqcNumber: companyForm.dftqcNumber,
        tole: companyForm.tole,
        province: companyForm.province,
        district: companyForm.district,
        localLevel: companyForm.localLevel,
        ward: companyForm.ward,
        fiscalYearStartMonth: Number(fiscalYearStartDate.bs.slice(5, 7)),
        fiscalYearStartDateBs: fiscalYearStartDate.bs,
      });
      setCompany({ ...company, ...result });
      setCompanyForm((current: any) => ({ ...current, ...result }));
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Failed to complete company setup.");
    } finally {
      setBusy(false);
    }
  };

  const saveInventorySettings = async (updates: Partial<InventorySettings>) => {
    if (!inventorySettings) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Partial<InventorySettings> = { ...inventorySettings, ...updates };
      if (updates.inventoryTrackingEnabled === false) {
        payload.warehousesEnabled = false;
        payload.binsEnabled = false;
        payload.batchTrackingEnabled = false;
        payload.lotTrackingEnabled = false;
        payload.expiryTrackingEnabled = false;
        payload.serialTrackingEnabled = false;
        payload.kitsEnabled = false;
        payload.allowNegativeStock = false;
        payload.requireWarehouseOnMovements = false;
        payload.defaultWarehouseId = null;
      }
      if (updates.warehousesEnabled === false) {
        payload.binsEnabled = false;
        payload.requireWarehouseOnMovements = false;
        payload.defaultWarehouseId = null;
      }
      if (updates.binsEnabled === false) {
        payload.binsEnabled = false;
      }
      const res = await updateInventorySettings(payload);
      const whRes = await listWarehouses({ isActive: true });
      setInventorySettings(res);
      window.dispatchEvent(new CustomEvent("inventory-settings-updated", { detail: res }));
      setWarehouses(normalizeList<Warehouse>(whRes));
    } catch (e: any) {
      setError(e?.message ?? "Failed to update inventory settings.");
    } finally {
      setBusy(false);
    }
  };

  const refreshInventoryConfiguration = async () => {
    setBusy(true);
    setError(null);
    try {
      const [invRes, whRes] = await Promise.all([
        getInventorySettings(),
        listWarehouses({ isActive: true })
      ]);
      setInventorySettings(invRes);
      setWarehouses(normalizeList<Warehouse>(whRes));
    } catch (e: any) {
      setError(e?.message ?? "Failed to refresh inventory settings.");
    } finally {
      setBusy(false);
    }
  };

  const handleReorderUnits = async (newUnits: UnitRecord[]) => {
    setUnits(newUnits);
    try {
      await reorderUnits(newUnits.map((u, i) => ({ id: u.id, sortOrder: i })));
    } catch (e: any) {
      setError(e.message);
      fetchData(); // Rollback
    }
  };

  const handleReorderGroups = async (newGroups: ItemGroupRecord[]) => {
    setGroups(newGroups);
    try {
      await reorderItemGroups(newGroups.map((g, i) => ({ id: g.id, sortOrder: i })));
    } catch (e: any) {
      setError(e.message);
      fetchData(); // Rollback
    }
  };

  const handleReorderSundries = async (newSundries: BillSundryRecord[]) => {
    setSundries(newSundries);
    try {
      await reorderBillSundries(newSundries.map((s, i) => ({ id: s.id, sortOrder: i })));
    } catch (e: any) {
      setError(e.message);
      fetchData(); // Rollback
    }
  };

  const handleReorderPaymentMethods = async (newItems: any[]) => {
    setPaymentMethods(newItems);
    try {
      await reorderPaymentMethods(newItems.map((pm, i) => ({ id: pm.id, sortOrder: i })));
    } catch (e: any) {
      setError(e.message);
      fetchData(); // Rollback
    }
  };

  const handleReorderSaleTypes = async (newItems: any[]) => {
    setSaleTypes(newItems);
    try {
      await reorderSaleTypes(newItems.map((st, i) => ({ id: st.id, sortOrder: i })));
    } catch (e: any) {
      setError(e.message);
      fetchData(); // Rollback
    }
  };

  const handleReorderPurchaseTypes = async (newItems: any[]) => {
    setPurchaseTypes(newItems);
    try {
      await reorderPurchaseTypes(newItems.map((pt, i) => ({ id: pt.id, sortOrder: i })));
    } catch (e: any) {
      setError(e.message);
      fetchData(); // Rollback
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

  const companySetupFieldsComplete = [
    companyForm.name,
    companyForm.email,
    companyForm.ownerName,
    companyForm.province,
    companyForm.district,
    companyForm.localLevel,
  ].every((value) => typeof value === "string" && value.trim().length > 0);
  const fiscalYearDatesComplete = Boolean(fiscalYearStartDate.bs && fiscalYearEndDate.bs && fiscalYearStartDate.ad <= fiscalYearEndDate.ad);
  const fiscalYearInvoiceSuffix = fiscalYearDatesComplete
    ? `${fiscalYearStartDate.bs.slice(2, 4)}/${fiscalYearEndDate.bs.slice(2, 4)}`
    : "--";
  const invoiceNumberExample = fiscalYearDatesComplete
    ? formatVoucherNumber(companyForm.invoicePrefix || "SI", companyForm.nextInvoiceNumber ?? 1, fiscalYearInvoiceSuffix)
    : "--";
  const companyAddressComplete = companySetupFieldsComplete && Number.isInteger(companyForm.ward) && companyForm.ward > 0 && fiscalYearDatesComplete;
  const selectedProvince = NEPAL_ADDRESS_DATA.find((province) => province.name === companyForm.province);
  const selectedDistrict = selectedProvince?.districts.find((district) => district.name === companyForm.district);
  const selectedLocalLevel = selectedDistrict?.localLevels.find((localLevel) => localLevel.name === companyForm.localLevel);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration"
        description={onboarding ? "Finish your company details before using your workspace." : "Manage company details and operating defaults."}
      />

      <section className="border border-border bg-card">
        <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
          onClick={() => setCompanyExpanded((expanded) => !expanded)}
          aria-expanded={companyExpanded}
        >
          <span className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center">
              {companyExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </span>
            <Building2 className="mt-1 h-5 w-5 text-primary" />
            <span>
              <span className="block text-lg font-semibold">Company Information</span>
              <span className="block text-sm text-muted-foreground">{company?.onboardingCompleted ? "Used on invoices, reports, and company documents." : "Add your company details to finish workspace setup."}</span>
            </span>
          </span>
        </button>
        {!company?.onboardingCompleted && (
          <Button onClick={completeOnboarding} disabled={busy || loading || !companyAddressComplete}>
            {busy ? "Saving..." : "Complete Setup"}
          </Button>
        )}
        </div>
        {companyExpanded && <div className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="company-name" className="text-sm font-medium">Company Name{!company?.onboardingCompleted && <span className="text-destructive"> *</span>}</label>
              <Input id="company-name" className="h-11" required={!company?.onboardingCompleted} value={companyForm.name ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-owner-name" className="text-sm font-medium">Owner Name{!company?.onboardingCompleted && <span className="text-destructive"> *</span>}</label>
              <Input id="company-owner-name" className="h-11" required={!company?.onboardingCompleted} value={companyForm.ownerName ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, ownerName: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-phone" className="text-sm font-medium">Phone</label>
              <Input id="company-phone" className="h-11" value={companyForm.phone ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, phone: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-email" className="text-sm font-medium">Company Email{!company?.onboardingCompleted && <span className="text-destructive"> *</span>}</label>
              <Input id="company-email" className="h-11" type="email" required={!company?.onboardingCompleted} value={companyForm.email ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, email: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-mobile-number" className="text-sm font-medium">Mobile Number</label>
              <Input id="company-mobile-number" className="h-11" type="tel" value={companyForm.mobileNumber ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, mobileNumber: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-pan-vat" className="text-sm font-medium">PAN/VAT Number</label>
              <Input id="company-pan-vat" className="h-11" value={companyForm.panVatNumber ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, panVatNumber: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-registration" className="text-sm font-medium">Company Registration Number</label>
              <Input id="company-registration" className="h-11" value={companyForm.companyRegistrationNumber ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, companyRegistrationNumber: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-local-registration" className="text-sm font-medium">Local Registration Number</label>
              <Input id="company-local-registration" className="h-11" value={companyForm.localRegistrationNumber ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, localRegistrationNumber: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-dftqc" className="text-sm font-medium">DFTQC Number</label>
              <Input id="company-dftqc" className="h-11" value={companyForm.dftqcNumber ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, dftqcNumber: event.target.value })} />
            </div>
            <div className="sm:col-span-2 border-t border-border pt-5 mt-1">
              <h3 className="text-sm font-semibold">Address</h3>
            </div>
            <div className="space-y-2">
              <label htmlFor="company-province" className="text-sm font-medium">Province{!company?.onboardingCompleted && <span className="text-destructive"> *</span>}</label>
              <select id="company-province" required={!company?.onboardingCompleted} className="h-11 w-full border border-input bg-background px-3 text-sm" value={companyForm.province ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, province: event.target.value, district: "", localLevel: "", ward: undefined })}>
                <option value="">Select province</option>
                {NEPAL_ADDRESS_DATA.map((province) => <option key={province.code} value={province.name}>{province.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="company-district" className="text-sm font-medium">District{!company?.onboardingCompleted && <span className="text-destructive"> *</span>}</label>
              <select id="company-district" required={!company?.onboardingCompleted} className="h-11 w-full border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedProvince} value={companyForm.district ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, district: event.target.value, localLevel: "", ward: undefined })}>
                <option value="">Select district</option>
                {selectedProvince?.districts.map((district) => <option key={district.code} value={district.name}>{district.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="company-local-level" className="text-sm font-medium">Local Level{!company?.onboardingCompleted && <span className="text-destructive"> *</span>}</label>
              <select id="company-local-level" required={!company?.onboardingCompleted} className="h-11 w-full border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedDistrict} value={companyForm.localLevel ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, localLevel: event.target.value, ward: undefined })}>
                <option value="">Select local level</option>
                {selectedDistrict?.localLevels.map((localLevel) => <option key={localLevel.code} value={localLevel.name}>{localLevel.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="company-ward" className="text-sm font-medium">Ward{!company?.onboardingCompleted && <span className="text-destructive"> *</span>}</label>
              <select id="company-ward" required={!company?.onboardingCompleted} className="h-11 w-full border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedLocalLevel} value={companyForm.ward ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, ward: event.target.value ? Number(event.target.value) : undefined })}>
                <option value="">Select ward</option>
                {selectedLocalLevel?.wards.map((ward) => <option key={ward} value={ward}>Ward {ward}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="company-tole" className="text-sm font-medium">Tole (Local Address)</label>
              <Input id="company-tole" className="h-11" value={companyForm.tole ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, tole: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-address" className="text-sm font-medium">Address Line / Landmark</label>
              <Input id="company-address" className="h-11" value={companyForm.address ?? ""} onChange={(event) => setCompanyForm({ ...companyForm, address: event.target.value })} />
            </div>
            <div className="space-y-4 border-t border-border pt-5 mt-1 sm:col-span-2">
              <div>
                <h3 className="text-sm font-semibold">Fiscal Year</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DualDateInput label="Start Date" required={!company?.onboardingCompleted} disabled={Boolean(company?.onboardingCompleted)} value={fiscalYearStartDate} onChange={(value) => {
                  setFiscalYearStartDate(value);
                  setFiscalYearEndDate(getFiscalYearEndDate(value.bs));
                  setCompanyForm((current: any) => ({ ...current, fiscalYearStartMonth: value.bs ? Number(value.bs.slice(5, 7)) : undefined }));
                }} />
                <DualDateInput label="End Date (calculated)" disabled value={fiscalYearEndDate} onChange={() => {}} />
              </div>
              {!company?.onboardingCompleted && <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Invoice number example</span>
                <span className="font-semibold tabular-nums">{invoiceNumberExample}</span>
              </div>}
            </div>
          </div>
          <div className="flex justify-end gap-3">
          {company?.onboardingCompleted && (
            <Button variant="outline" onClick={() => saveCompanySettings({
              name: companyForm.name,
              address: companyForm.address,
              phone: companyForm.phone,
              mobileNumber: companyForm.mobileNumber,
              email: companyForm.email?.trim() || null,
              ownerName: companyForm.ownerName,
              panVatNumber: companyForm.panVatNumber,
              companyRegistrationNumber: companyForm.companyRegistrationNumber,
              localRegistrationNumber: companyForm.localRegistrationNumber,
              dftqcNumber: companyForm.dftqcNumber,
              province: companyForm.province,
              district: companyForm.district,
              localLevel: companyForm.localLevel,
              ward: companyForm.ward,
              tole: companyForm.tole,
            })} disabled={busy || loading}>
              Save Company Information
            </Button>
          )}
          </div>
        </div>}
      </section>

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
          onReorder={handleReorderUnits}
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
          onReorder={handleReorderGroups}
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
          onReorder={handleReorderSundries}
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
          onReorder={handleReorderPaymentMethods}
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
          onReorderSaleTypes={handleReorderSaleTypes}
          onAddPurchaseType={() => { setEditPurchaseType(undefined); setAddPurchaseTypeOpen(true); }}
          onEditPurchaseType={(pt) => { setEditPurchaseType(pt); setAddPurchaseTypeOpen(true); }}
          onRemovePurchaseType={(id) => setConfirmState({ id, name: purchaseTypes.find(pt => pt.id === id)?.name || "", type: "purchase-type", open: true })}
          onReorderPurchaseTypes={handleReorderPurchaseTypes}
          focus={focus === "trade-types"}
        />

        <FiscalSessionsPanel
          sessions={sessions}
          activeSessionId={activeFiscalSessionId}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "sessions"}
          onToggle={() => setExpandedSection(expandedSection === "sessions" ? null : "sessions")}
          onAdd={() => setAddSessionOpen(true)}
          onCreateNext={(id) => {
            const session = sessions.find((item) => item.id === id);
            if (!session) return;
            const nextStartAdDate = new Date(`${session.endDate.slice(0, 10)}T12:00:00.000Z`);
            nextStartAdDate.setUTCDate(nextStartAdDate.getUTCDate() + 1);
            const startAd = nextStartAdDate.toISOString().slice(0, 10);
            const startDate = { ad: startAd, bs: adToBs(startAd) };
            const endDate = getFiscalYearEndDate(startDate.bs);
            setError(null);
            setNextFiscalYearTarget({ sessionId: id, startDate, endDate });
          }}
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
          onToggleLock={(id, lock) => {
            const session = sessions.find((item) => item.id === id);
            if (session) setFiscalSessionLockTarget({ id, name: session.name, lock });
          }}
        />

        <InventoryConfigurationPanel
          settings={inventorySettings}
          warehouses={warehouses}
          loading={loading}
          busy={busy}
          expanded={expandedSection === "inventory"}
          onToggle={() => setExpandedSection(expandedSection === "inventory" ? null : "inventory")}
          onRefresh={refreshInventoryConfiguration}
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

      <CreateNextFiscalYearDialog
        open={Boolean(nextFiscalYearTarget)}
        sessionId={nextFiscalYearTarget?.sessionId}
        startDate={nextFiscalYearTarget?.startDate}
        endDate={nextFiscalYearTarget?.endDate}
        onClose={() => setNextFiscalYearTarget(null)}
        onSubmit={async (input) => {
          if (!nextFiscalYearTarget) return;
          await createNextFiscalSession(nextFiscalYearTarget.sessionId, input);
          await fetchData();
        }}
      />

      <FiscalSessionLockDialog
        open={Boolean(fiscalSessionLockTarget)}
        sessionName={fiscalSessionLockTarget?.name ?? ""}
        lock={fiscalSessionLockTarget?.lock ?? false}
        onClose={() => setFiscalSessionLockTarget(null)}
        onSubmit={async (credentials) => {
          if (!fiscalSessionLockTarget) return;
          setBusy(true);
          setError(null);
          try {
            await lockFiscalSession(fiscalSessionLockTarget.id, { lock: fiscalSessionLockTarget.lock, ...credentials });
            await fetchData();
            setFiscalSessionLockTarget(null);
          } catch (lockError: any) {
            setError(lockError?.message ?? "Failed to update fiscal-year lock");
            throw lockError;
          } finally {
            setBusy(false);
          }
        }}
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
