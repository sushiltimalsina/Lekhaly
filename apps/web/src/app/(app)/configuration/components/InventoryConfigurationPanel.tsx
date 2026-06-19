"use client";

import * as React from "react";
import { PackageCheck, ChevronDown, ChevronRight } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import type { InventorySettings } from "@/lib/api/inventory";
import type { Warehouse } from "@/lib/api/warehouses";

function ToggleRow({
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
    <label className="flex items-start justify-between gap-4 rounded-xl border bg-background px-4 py-3">
      <span className="min-w-0">
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

export function InventoryConfigurationPanel({
  settings,
  warehouses,
  loading,
  busy,
  expanded,
  onToggle,
  onRefresh,
  onSave
}: {
  settings: InventorySettings | null;
  warehouses: Warehouse[];
  loading: boolean;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onSave: (updates: Partial<InventorySettings>) => void;
}) {
  return (
    <Card className={cn("glass-card overflow-hidden lg:col-span-2", expanded && "ring-2 ring-emerald-500/50")}>
      <CardHeader 
        onClick={onToggle}
        className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expanded ? "pb-2" : "pb-4")}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
            {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              Inventory Configuration
            </CardTitle>
            <CardDescription>Choose how this company maintains stock movements</CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled={busy || loading} onClick={(e) => { e.stopPropagation(); onRefresh(); }} className="rounded-xl">
          Refresh
        </Button>
      </CardHeader>

      {expanded && (
        <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
          {!settings ? (
            <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
              Loading inventory settings...
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow label="Inventory Tracking" description="Maintain item stock quantities" checked={settings.inventoryTrackingEnabled} onChange={(v) => onSave({ inventoryTrackingEnabled: v })} />
                <ToggleRow label="Allow Negative Stock" description="Permit outbound movements below available stock" checked={settings.allowNegativeStock} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ allowNegativeStock: v })} />
                <ToggleRow label="Warehouses" description="Track stock by storage location" checked={settings.warehousesEnabled} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ warehousesEnabled: v })} />
                <ToggleRow label="Bins" description="Track stock inside warehouse bins" checked={settings.binsEnabled} disabled={!settings.inventoryTrackingEnabled || !settings.warehousesEnabled} onChange={(v) => onSave({ binsEnabled: v })} />
                <ToggleRow label="Batch Tracking" description="Allow batch numbers on stock movements" checked={settings.batchTrackingEnabled} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ batchTrackingEnabled: v })} />
                <ToggleRow label="Lot Tracking" description="Allow lot numbers on stock movements" checked={settings.lotTrackingEnabled} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ lotTrackingEnabled: v })} />
                <ToggleRow label="Expiry Tracking" description="Store expiry dates and expiry alerts" checked={settings.expiryTrackingEnabled} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ expiryTrackingEnabled: v })} />
                <ToggleRow label="Serial Numbers" description="Track unique serial numbers per unit" checked={settings.serialTrackingEnabled} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ serialTrackingEnabled: v })} />
                <ToggleRow label="Kits & Assemblies" description="Enable BOM and kit assembly flows" checked={settings.kitsEnabled} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ kitsEnabled: v })} />
                <ToggleRow label="Goods Receipt Workflow" description="Receive purchase orders through a GRN register before purchase invoicing" checked={settings.goodsReceiptWorkflowEnabled} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ goodsReceiptWorkflowEnabled: v })} />
                <ToggleRow label="Delivery / Dispatch Workflow" description="Issue stock against sales orders through a dispatch register" checked={settings.dispatchWorkflowEnabled} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ dispatchWorkflowEnabled: v })} />
                <ToggleRow label="Approve Stock Adjustments" description="Require approval before manual stock adjustments post to ledger" checked={settings.adjustmentApprovalRequired} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ adjustmentApprovalRequired: v })} />
                <ToggleRow label="Approve Stock Transfers" description="Require approval before warehouse/bin transfers post" checked={settings.transferApprovalRequired} disabled={!settings.inventoryTrackingEnabled || !settings.warehousesEnabled} onChange={(v) => onSave({ transferApprovalRequired: v })} />
                <ToggleRow label="Approve Negative Stock Overrides" description="Require approval when a movement needs negative stock override" checked={settings.negativeStockApprovalRequired} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ negativeStockApprovalRequired: v })} />
                <ToggleRow label="Approve Reversals" description="Require approval before reversing approved stock movements" checked={settings.reversalApprovalRequired} disabled={!settings.inventoryTrackingEnabled} onChange={(v) => onSave({ reversalApprovalRequired: v })} />
                <ToggleRow label="Require Warehouse" description="Require warehouse on stock movements" checked={settings.requireWarehouseOnMovements} disabled={!settings.inventoryTrackingEnabled || !settings.warehousesEnabled} onChange={(v) => onSave({ requireWarehouseOnMovements: v })} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Default Warehouse</label>
                  <select
                    value={settings.defaultWarehouseId ?? ""}
                    disabled={!settings.warehousesEnabled}
                    onChange={(event) => onSave({ defaultWarehouseId: event.target.value || null })}
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    <option value="">No default warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Costing Method</label>
                  <select
                    value={settings.costingMethod}
                    onChange={(event) => onSave({ costingMethod: event.target.value as InventorySettings["costingMethod"] })}
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
  );
}
