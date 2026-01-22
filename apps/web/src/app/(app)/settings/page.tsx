"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { getCompany, updateCompany } from "@/lib/api/auth";

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

  const [form, setForm] = React.useState<CompanyForm>({
    companyName: "",
    companyCode: "",
    address: "",
    phone: "",
    email: "",
    panVat: "",
  });

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
    <div>
      <PageHeader
        title="Settings"
        description="Company and system preferences"
        actions={
          <button
            onClick={onSave}
            disabled={saving || loading}
            className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        }
      />

      {msg ? (
        <div className="mb-4 rounded-xl border bg-card px-3 py-2 text-sm">
          {msg}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-sm font-semibold">Company</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Basic company profile used on invoices and reports.
          </div>

          <div className="mt-4 grid gap-3">
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
            <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="text-sm font-semibold">Preferences</div>
          <div className="mt-1 text-sm text-muted-foreground">
            UI defaults (more options later).
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border bg-background p-3">
              <div className="text-sm font-medium">Date format</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Bikram Sambat (BS) is primary across Lekhaly.
              </div>
            </div>

            <div className="rounded-xl border bg-background p-3">
              <div className="text-sm font-medium">Currency</div>
              <div className="mt-1 text-sm text-muted-foreground">NPR</div>
            </div>

            <div className="rounded-xl border bg-background p-3">
              <div className="text-sm font-medium">Security</div>
              <div className="mt-1 text-sm text-muted-foreground">
                TOTP and devices management will appear here.
              </div>
            </div>
          </div>
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
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      />
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
