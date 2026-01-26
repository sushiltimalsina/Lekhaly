"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCompany, updateCompany } from "@/lib/api/auth";
import { useDateFormat } from "@/lib/date-format";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySettings, setCurrencySymbol, setNumberFormat, subscribeUi } from "@/lib/store/ui";
import { MoneyText } from "@/components/app/money";
import { getSettings, setCalendarPreference, subscribeSettings } from "@/lib/store/settings";

type CompanyForm = {
  companyName?: string;
  companyCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  panVat?: string;
};

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const { dateFormat, setDateFormat } = useDateFormat();
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">("system");
  const [currencySymbol, setCurrencySymbolState] = React.useState(getCurrencySettings().currencySymbol);
  const [numberFormat, setNumberFormatState] = React.useState(getCurrencySettings().numberFormat);
  const [calendarPreference, setCalendarPreferenceState] = React.useState<"BS" | "AD">("BS");

  const [form, setForm] = React.useState<CompanyForm>({
    companyName: "",
    companyCode: "",
    address: "",
    phone: "",
    email: "",
    panVat: "",
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("lekhaly-theme") as "light" | "dark" | "system" | null;
    const savedTheme = stored || "system";
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, []);

  React.useEffect(() => {
    return subscribeUi((next) => {
      setCurrencySymbolState(next.currencySymbol);
      setNumberFormatState(next.numberFormat);
    });
  }, []);

  React.useEffect(() => {
    setCalendarPreferenceState(getSettings().calendarPreference);
    return subscribeSettings((next) => {
      setCalendarPreferenceState(next.calendarPreference);
    });
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  const setTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);
    localStorage.setItem("lekhaly-theme", newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new CustomEvent("lekhaly-theme-change", { detail: { theme: newTheme } }));
  };

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res: any = await getCompany();
      setForm({
        companyName: res?.companyName ?? "",
        companyCode: res?.companyCode ?? "",
        address: res?.address ?? "",
        phone: res?.phone ?? "",
        email: res?.email ?? "",
        panVat: res?.panVat ?? res?.pan ?? res?.vat ?? "",
      });
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to load company settings");
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      await updateCompany({
        companyName: form.companyName,
        address: form.address,
        phone: form.phone,
        email: form.email,
        panVat: form.panVat,
      });
      setMsg("Saved successfully");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Company and system preferences"
        actions={
          <Button
            onClick={onSave}
            disabled={saving || loading}
            className="shadow-lg shadow-primary/20"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      {msg && (
        <div className="rounded-xl border bg-card px-4 py-3 text-sm animate-in fade-in slide-in-from-top-1">
          {msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Basic company profile used on invoices and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Company Name"
              value={form.companyName ?? ""}
              onChange={(v) => setForm({ ...form, companyName: v })}
            />
            <Field
              label="Company Code"
              value={form.companyCode ?? ""}
              onChange={(v) => setForm({ ...form, companyCode: v })}
              disabled
              hint="Company code is fixed"
            />
            <Field
              label="Address"
              value={form.address ?? ""}
              onChange={(v) => setForm({ ...form, address: v })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Phone"
                value={form.phone ?? ""}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <Field
                label="Email"
                value={form.email ?? ""}
                onChange={(v) => setForm({ ...form, email: v })}
              />
            </div>
            <Field
              label="PAN/VAT"
              value={form.panVat ?? ""}
              onChange={(v) => setForm({ ...form, panVat: v })}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Calendar Preference</CardTitle>
              <CardDescription>
                Choose the primary calendar for date inputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCalendarPreference("BS")}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                    calendarPreference === "BS"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  BS (Bikram Sambat)
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarPreference("AD")}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                    calendarPreference === "AD"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  AD (Gregorian)
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Date Format</CardTitle>
              <CardDescription>
                Choose your primary date display format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDateFormat("bs")}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                    dateFormat === "bs"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  BS (Bikram Sambat)
                </button>
                <button
                  type="button"
                  onClick={() => setDateFormat("ad")}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                    dateFormat === "ad"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  AD (Gregorian)
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Choose your preferred color theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium transition-all flex flex-col items-center justify-center gap-2",
                    theme === "light"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <Sun className="h-5 w-5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium transition-all flex flex-col items-center justify-center gap-2",
                    theme === "dark"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <Moon className="h-5 w-5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium transition-all flex flex-col items-center justify-center gap-2",
                    theme === "system"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <Monitor className="h-5 w-5" />
                  <span>System</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Currency</CardTitle>
              <CardDescription>
                Configure currency symbol and comma grouping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Symbol
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {(["रु.", "NPR", "Rs."] as const).map((symbol) => (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => setCurrencySymbol(symbol)}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                          currencySymbol === symbol
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "bg-background hover:bg-muted"
                        )}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Number format
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {(["en-IN", "en-US"] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setNumberFormat(format)}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                          numberFormat === format
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "bg-background hover:bg-muted"
                        )}
                      >
                        {format === "en-IN" ? "1,23,45,678" : "123,456,789"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border bg-background px-4 py-3 text-sm">
                  <div className="text-xs text-muted-foreground">Preview</div>
                  <div className="mt-1 text-lg font-semibold">
                    <MoneyText value={1234567.89} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-muted/30"
      />
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
