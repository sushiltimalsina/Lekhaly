"use client";

import * as React from "react";
import { Hash, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";

interface NumberingRowProps {
  label: string;
  prefix?: string;
  seq?: number;
  suffix?: string;
  onPrefixChange: (v: string) => void;
  onSeqChange: (v: number) => void;
  onSuffixChange: (v: string) => void;
  onSave: () => void;
}

function NumberingRow({ 
  label, 
  prefix, 
  seq, 
  suffix,
  onPrefixChange, 
  onSeqChange, 
  onSuffixChange,
  onSave 
}: NumberingRowProps) {
  const p = prefix || "";
  const s = suffix || "";
  const formattedPrefix = p ? (p.endsWith("-") ? p : `${p}-`) : "";
  const formattedSuffix = s ? (s.startsWith("-") ? s : `-${s}`) : "";
  const preview = `${formattedPrefix}${seq || 1}${formattedSuffix}`;

  return (
    <div className="space-y-2 text-foreground">
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

interface VoucherNumberingProps {
  expanded: boolean;
  onToggle: () => void;
  companyForm: any;
  setCompanyForm: (v: any) => void;
  onSave: (updates: any) => void;
}

export function VoucherNumbering({
  expanded,
  onToggle,
  companyForm,
  setCompanyForm,
  onSave
}: VoucherNumberingProps) {
  return (
    <Card className="glass-card overflow-hidden lg:col-span-2">
      <CardHeader onClick={onToggle} className="cursor-pointer hover:bg-accent/10 transition-colors select-none">
        <div className="flex items-center gap-4">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground animate-in fade-in" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground animate-in fade-in" />
          )}
          <div className="flex items-center gap-2 text-foreground">
            <Hash className="h-5 w-5 text-indigo-500" />
            <div>
              <CardTitle className="text-lg">Voucher Numbering</CardTitle>
              <CardDescription>Setup prefixes and sequences for all document series</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-6 animate-in fade-in slide-in-from-top-1 pt-2">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Important:</strong> Numbering settings should be finalized before issuing the first voucher. You can change the prefix and suffix freely until the first invoice or voucher is issued in each series.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <NumberingRow 
              label="Sales Invoice" 
              prefix={companyForm.invoicePrefix}
              seq={companyForm.nextInvoiceNumber}
              suffix={companyForm.invoiceSuffix}
              onPrefixChange={v => setCompanyForm({...companyForm, invoicePrefix: v.toUpperCase()})}
              onSeqChange={v => setCompanyForm({...companyForm, nextInvoiceNumber: v})}
              onSuffixChange={v => setCompanyForm({...companyForm, invoiceSuffix: v})}
              onSave={() => onSave({ 
                invoicePrefix: companyForm.invoicePrefix, 
                nextInvoiceNumber: companyForm.nextInvoiceNumber, 
                invoiceSuffix: companyForm.invoiceSuffix 
              })}
            />
            <NumberingRow 
              label="Purchase Invoice" 
              prefix={companyForm.purchasePrefix}
              seq={companyForm.nextPurchaseNumber}
              suffix={companyForm.purchaseSuffix}
              onPrefixChange={v => setCompanyForm({...companyForm, purchasePrefix: v.toUpperCase()})}
              onSeqChange={v => setCompanyForm({...companyForm, nextPurchaseNumber: v})}
              onSuffixChange={v => setCompanyForm({...companyForm, purchaseSuffix: v})}
              onSave={() => onSave({ 
                purchasePrefix: companyForm.purchasePrefix, 
                nextPurchaseNumber: companyForm.nextPurchaseNumber, 
                purchaseSuffix: companyForm.purchaseSuffix 
              })}
            />
            <NumberingRow 
              label="Sales Return" 
              prefix={companyForm.salesReturnPrefix}
              seq={companyForm.nextSalesReturnNumber}
              suffix={companyForm.salesReturnSuffix}
              onPrefixChange={v => setCompanyForm({...companyForm, salesReturnPrefix: v.toUpperCase()})}
              onSeqChange={v => setCompanyForm({...companyForm, nextSalesReturnNumber: v})}
              onSuffixChange={v => setCompanyForm({...companyForm, salesReturnSuffix: v})}
              onSave={() => onSave({ 
                salesReturnPrefix: companyForm.salesReturnPrefix, 
                nextSalesReturnNumber: companyForm.nextSalesReturnNumber, 
                salesReturnSuffix: companyForm.salesReturnSuffix 
              })}
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
              onSave={() => onSave({ 
                purchaseReturnPrefix: companyForm.purchaseReturnPrefix, 
                nextPurchaseReturnNumber: companyForm.nextPurchaseReturnNumber, 
                purchaseReturnSuffix: companyForm.purchaseReturnSuffix 
              })}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
