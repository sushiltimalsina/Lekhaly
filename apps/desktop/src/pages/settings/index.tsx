import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { getCompany, updateCompany } from "@/lib/api/auth";
import { Sun, Moon, Monitor, Printer, Bell, Languages, ShieldAlert, LogOut } from "lucide-react";
import { 
  getSettings, 
  setPrintLayout, 
  setLanguage, 
  setNotifications, 
  subscribeSettings,
  type PrintLayout,
  type Language
} from "@/lib/store/settings";
import { logoutAllSessions } from "@/lib/api/auth";
import { Switch } from "@lekhaly/ui";
import ConfirmDialog from "@/components/app/confirm-dialog";
import { cn } from "@/lib/utils";

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
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">("system");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  
  // Local Settings State
  const [localSettings, setLocalSettings] = React.useState(getSettings());

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
    const unsubscribe = subscribeSettings((next) => {
      setLocalSettings(next);
    });
    return () => unsubscribe();
  }, []);

  const handleLogoutAll = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      await logoutAllSessions();
      setMsg("Successfully logged out from all other sessions.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to logout other sessions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Company profile and app theme"
        actions={
          <Button
            onClick={onSave}
            disabled={saving || loading}
            className="shadow-lg shadow-primary/20"
          >
            {saving ? "Saving…" : "Save Changes"}
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
              <CardTitle>App Theme</CardTitle>
              <CardDescription>
                Choose your preferred colors for the desktop application
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

          {/* Printing & Hardware Section */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-500" />
                Hardware & Printing
              </CardTitle>
              <CardDescription>Configure printer layouts and labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Default Paper Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["a4", "a5", "thermal"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPrintLayout(p)}
                      className={cn(
                        "py-3 rounded-xl border text-xs font-bold uppercase transition-all",
                        localSettings.printLayout === p 
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                          : "bg-background hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Behavior & Language */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-emerald-500" />
                App Behavior & Language
              </CardTitle>
              <CardDescription>Personalize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Language</label>
                <div className="flex p-1 bg-muted/30 rounded-2xl">
                  {(["en", "ne"] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                        localSettings.language === lang 
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {lang === "en" ? "English" : "Nepali (नेपाली)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Alerts & Notifications</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Low Stock Alerts</span>
                    </div>
                    <Switch 
                      checked={localSettings.notifications.lowStock} 
                      onCheckedChange={(v) => setNotifications({ lowStock: v })} 
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium">Overdue Invoice Reminders</span>
                    </div>
                    <Switch 
                      checked={localSettings.notifications.overdueInvoices} 
                      onCheckedChange={(v) => setNotifications({ overdueInvoices: v })} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Sessions */}
          <Card className="glass-card border-red-200/20 dark:border-red-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-5 w-5" />
                Security & Sessions
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                <p className="text-xs text-red-800 dark:text-red-400 font-medium mb-3">
                  Logout from all other devices. This will invalidate all active sessions immediately except the current one.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full rounded-xl"
                  onClick={() => setConfirmOpen(true)}
                  disabled={saving}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Logout All Sessions"
        description="Are you sure you want to logout from all devices? All other sessions will be immediately terminated."
        variant="danger"
        confirmText="Logout All"
        onConfirm={handleLogoutAll}
        onCancel={() => setConfirmOpen(false)}
        loading={saving}
      />
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
