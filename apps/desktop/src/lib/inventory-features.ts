import type { InventorySettings } from "@/lib/api/inventory";

export type InventoryFeatureSet = {
  inventory: boolean;
  warehouses: boolean;
  bins: boolean;
  batch: boolean;
  lot: boolean;
  expiry: boolean;
  serial: boolean;
  kits: boolean;
  requireWarehouse: boolean;
  negativeStock: boolean;
};

export function inventoryFeatures(settings: InventorySettings | null | undefined): InventoryFeatureSet {
  const inventory = Boolean(settings?.inventoryTrackingEnabled);
  const warehouses = inventory && Boolean(settings?.warehousesEnabled);
  return {
    inventory,
    warehouses,
    bins: warehouses && Boolean(settings?.binsEnabled),
    batch: inventory && Boolean(settings?.batchTrackingEnabled),
    lot: inventory && Boolean(settings?.lotTrackingEnabled),
    expiry: inventory && Boolean(settings?.expiryTrackingEnabled),
    serial: inventory && Boolean(settings?.serialTrackingEnabled),
    kits: inventory && Boolean(settings?.kitsEnabled),
    requireWarehouse: warehouses && Boolean(settings?.requireWarehouseOnMovements),
    negativeStock: inventory && Boolean(settings?.allowNegativeStock),
  };
}

export function hasLineTracking(features: InventoryFeatureSet) {
  return features.warehouses || features.bins || features.batch || features.lot || features.expiry || features.serial;
}

export function hasItemPolicyTracking(features: InventoryFeatureSet) {
  return features.serial || features.batch || features.lot || features.expiry || features.kits;
}

