"use client";

import * as React from "react";
import { Shield, CreditCard, Calendar, Monitor } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";

interface FiscalSecurityPanelProps {
  expanded: boolean;
  onToggle: () => void;
  companyForm: any;
  setCompanyForm: (v: any) => void;
  onSave: (updates: any) => void;
}

export function FiscalSecurityPanel({
  expanded,
  onToggle,
  companyForm,
  setCompanyForm,
  onSave
}: FiscalSecurityPanelProps) {
  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader onClick={onToggle} className="cursor-pointer hover:bg-accent/10 transition-colors select-none">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <Shield className="h-5 w-5 text-red-500" />
          Fiscal & Security
        </CardTitle>
        <CardDescription>Lock dates and start month</CardDescription>
      </CardHeader>
      {expanded && (
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
                  onSave({ lockDate: d || null });
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
                  onSave({ fiscalYearStartMonth: v });
                }}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
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
  );
}

interface CreditManagementPanelProps {
  expanded: boolean;
  onToggle: () => void;
  companyForm: any;
  setCompanyForm: (v: any) => void;
  onSave: (updates: any) => void;
}

export function CreditManagementPanel({
  expanded,
  onToggle,
  companyForm,
  setCompanyForm,
  onSave
}: CreditManagementPanelProps) {
  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader onClick={onToggle} className="cursor-pointer hover:bg-accent/10 transition-colors select-none">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <CreditCard className="h-5 w-5 text-emerald-500" />
          Credit Management
        </CardTitle>
        <CardDescription>Global business credit safety</CardDescription>
      </CardHeader>
      {expanded && (
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
                  onBlur={() => onSave({ creditLimitAmount: companyForm.creditLimitAmount })}
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
  );
}
