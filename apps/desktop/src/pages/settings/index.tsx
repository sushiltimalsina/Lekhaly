import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { getTotpStatus, regenerateTotpRecoveryCodes, totpDisable, totpEnable, totpSetup, verifyTotpDisablePassword as verifyTotpDisablePasswordApi, verifyTotpRecoveryPassword } from "@/lib/api/auth";
import { Sun, Moon, Monitor, Printer, Bell, Languages, ShieldAlert, LogOut, KeyRound, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "@/lib/store/auth";
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
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">("system");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [totpEnabled, setTotpEnabled] = React.useState<boolean | null>(null);
  const [totpLoading, setTotpLoading] = React.useState(false);
  const [totpSetupData, setTotpSetupData] = React.useState<any>(null);
  const [totpCode, setTotpCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [recoveryCodesRemaining, setRecoveryCodesRemaining] = React.useState<number | null>(null);
  const [recoveryRegenerateOpen, setRecoveryRegenerateOpen] = React.useState(false);
  const [recoveryRegeneratePassword, setRecoveryRegeneratePassword] = React.useState("");
  const [recoveryRegeneratePasswordError, setRecoveryRegeneratePasswordError] = React.useState<string | null>(null);
  const [recoveryRegenerateTotp, setRecoveryRegenerateTotp] = React.useState("");
  const [recoveryRegenerateChallengeToken, setRecoveryRegenerateChallengeToken] = React.useState<string | null>(null);
  const [totpMessage, setTotpMessage] = React.useState<string | null>(null);
  const [totpDisableOpen, setTotpDisableOpen] = React.useState(false);
  const [totpDisablePassword, setTotpDisablePassword] = React.useState("");
  const [totpDisablePasswordError, setTotpDisablePasswordError] = React.useState<string | null>(null);
  const [totpDisableCode, setTotpDisableCode] = React.useState("");
  const [totpDisableChallengeToken, setTotpDisableChallengeToken] = React.useState<string | null>(null);
  const [totpDisableMethod, setTotpDisableMethod] = React.useState<"authenticator" | "recovery">("authenticator");

  // Local Settings State
  const [localSettings, setLocalSettings] = React.useState(getSettings());

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

  async function loadTotpStatus() {
    try {
      const status = await getTotpStatus();
      setTotpEnabled(status.enabled);
      setRecoveryCodesRemaining(status.recoveryCodesRemaining);
    } catch (e: any) {
      setTotpMessage(e?.message ?? "Failed to load authenticator status");
    }
  }

  async function startTotpSetup() {
    setTotpLoading(true);
    setTotpMessage(null);
    try {
      const setup = await totpSetup();
      setTotpSetupData(setup);
      setTotpCode("");
    } catch (e: any) {
      setTotpMessage(e?.message ?? "Failed to start authenticator setup");
    } finally {
      setTotpLoading(false);
    }
  }

  async function enableTotp() {
    if (totpCode.length !== 6) return;
    setTotpLoading(true);
    setTotpMessage(null);
    try {
      const result = await totpEnable({ code: totpCode });
      setTotpEnabled(true);
      setTotpSetupData(null);
      setTotpCode("");
      setRecoveryCodes(result.backupCodes ?? []);
      setRecoveryCodesRemaining(result.backupCodes?.length ?? 0);
      setTotpMessage("Authenticator enabled. Save your recovery codes now; they will not be shown again.");
    } catch (e: any) {
      setTotpMessage(e?.message ?? "The code could not be verified");
    } finally {
      setTotpLoading(false);
    }
  }

  async function verifyRecoveryRegeneratePassword() {
    if (!recoveryRegeneratePassword) return;
    setTotpLoading(true);
    setTotpMessage(null);
    setRecoveryRegeneratePasswordError(null);
    try {
      const result = await verifyTotpRecoveryPassword({ password: recoveryRegeneratePassword });
      setRecoveryRegenerateChallengeToken(result.challengeToken);
      setRecoveryRegenerateTotp("");
    } catch (e: any) {
      setRecoveryRegeneratePasswordError(e?.message ?? "Password could not be verified");
    } finally {
      setTotpLoading(false);
    }
  }

  async function regenerateRecoveryCodes() {
    if (!recoveryRegenerateChallengeToken || recoveryRegenerateTotp.length !== 6) return;
    setTotpLoading(true);
    setTotpMessage(null);
    try {
      const result = await regenerateTotpRecoveryCodes({
        challengeToken: recoveryRegenerateChallengeToken,
        code: recoveryRegenerateTotp
      });
      setRecoveryCodes(result.backupCodes);
      setRecoveryCodesRemaining(result.recoveryCodesRemaining);
      setRecoveryRegenerateOpen(false);
      setRecoveryRegeneratePassword("");
      setRecoveryRegenerateTotp("");
      setRecoveryRegenerateChallengeToken(null);
      setTotpMessage("Recovery codes replaced. Previous codes no longer work; save this new set now.");
    } catch (e: any) {
      setTotpMessage(e?.message ?? "Could not regenerate recovery codes");
    } finally {
      setTotpLoading(false);
    }
  }

  async function verifyTotpDisablePassword() {
    if (!totpDisablePassword) return;
    setTotpLoading(true);
    setTotpMessage(null);
    setTotpDisablePasswordError(null);
    try {
      const result = await verifyTotpDisablePasswordApi({ password: totpDisablePassword });
      setTotpDisableChallengeToken(result.challengeToken);
      setTotpDisableCode("");
    } catch (e: any) {
      setTotpDisablePasswordError(e?.message ?? "Password could not be verified");
    } finally {
      setTotpLoading(false);
    }
  }

  async function disableTotp() {
    const validCodeLength = totpDisableMethod === "authenticator" ? totpDisableCode.length === 6 : totpDisableCode.length === 10;
    if (!totpDisableChallengeToken || !validCodeLength) return;
    setTotpLoading(true);
    setTotpMessage(null);
    try {
      await totpDisable({ challengeToken: totpDisableChallengeToken, method: totpDisableMethod, code: totpDisableCode });
      clearToken();
      navigate("/login", { replace: true });
    } catch (e: any) {
      setTotpMessage(e?.message ?? "Could not disable two-step verification");
      setTotpLoading(false);
    }
  }

  React.useEffect(() => {
    loadTotpStatus();
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
        title={t("Settings")}
        description={t("Manage your workspace preferences, security, and session controls.")}
      />

      {msg && (
        <div className="rounded-xl border bg-card px-4 py-3 text-sm animate-in fade-in slide-in-from-top-1">
          {t(msg)}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t("Authenticator app")}</CardTitle>
              <CardDescription>{t("Use a time-based code to protect sign-ins to your account.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {totpEnabled === null ? (
                <p className="text-sm text-muted-foreground">{t("Checking authenticator status...")}</p>
              ) : totpEnabled ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t("Two-step verification is enabled.")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("Recovery codes remaining:")} {recoveryCodesRemaining ?? t("Checking...")}
                  </p>
                  {recoveryCodesRemaining !== null && recoveryCodesRemaining <= 2 && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {t(recoveryCodesRemaining === 0 ? "No recovery codes remain." : "Only a few recovery codes remain.")} {t("Generate a fresh set while you still have access to your authenticator.")}
                    </p>
                  )}
                  {!recoveryRegenerateOpen ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">{t("Recovery codes")}</p>
                        <p className="text-xs text-muted-foreground">{t("Replace the full set; old codes stop working.")}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:bg-sky-950/60"
                        onClick={() => { setRecoveryRegenerateOpen(true); setRecoveryRegenerateChallengeToken(null); setRecoveryRegeneratePassword(""); setRecoveryRegenerateTotp(""); setTotpDisableOpen(false); }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t("Regenerate recovery codes")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-md border border-sky-300 bg-sky-50/50 p-3 dark:border-sky-900 dark:bg-sky-950/20">
                      <div className="flex items-center gap-2 text-sky-800 dark:text-sky-200">
                        <KeyRound className="h-4 w-4" />
                        <p className="text-sm font-medium">{t("Confirm recovery-code replacement")}</p>
                      </div>
                      {!recoveryRegenerateChallengeToken ? (
                        <>
                          <p className="text-sm text-muted-foreground">{t("This replaces every existing recovery code. First confirm your current password.")}</p>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            placeholder={t("Current password")}
                            value={recoveryRegeneratePassword}
                            onChange={(e) => {
                              setRecoveryRegeneratePassword(e.target.value);
                              if (recoveryRegeneratePasswordError) setRecoveryRegeneratePasswordError(null);
                            }}
                            className="bg-muted/30"
                          />
                          {recoveryRegeneratePasswordError && (
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">{t(recoveryRegeneratePasswordError)}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="bg-sky-700 text-white hover:bg-sky-800"
                              onClick={verifyRecoveryRegeneratePassword}
                              disabled={totpLoading || !recoveryRegeneratePassword}
                            >
                              {t(totpLoading ? "Checking password..." : "Continue")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => { setRecoveryRegenerateOpen(false); setRecoveryRegeneratePassword(""); setRecoveryRegenerateTotp(""); setRecoveryRegenerateChallengeToken(null); }}
                              disabled={totpLoading}
                            >
                              {t("Cancel")}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">{t("Password confirmed. Enter the current code from your authenticator to replace all existing recovery codes.")}</p>
                          <Input
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder={t("6-digit authenticator code")}
                            value={recoveryRegenerateTotp}
                            onChange={(e) => setRecoveryRegenerateTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="bg-muted/30"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="bg-sky-700 text-white hover:bg-sky-800"
                              onClick={regenerateRecoveryCodes}
                              disabled={totpLoading || recoveryRegenerateTotp.length !== 6}
                            >
                              {t(totpLoading ? "Verifying..." : "Replace recovery codes")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => { setRecoveryRegenerateChallengeToken(null); setRecoveryRegenerateTotp(""); }}
                              disabled={totpLoading}
                            >
                              {t("Back")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => { setRecoveryRegenerateOpen(false); setRecoveryRegeneratePassword(""); setRecoveryRegenerateTotp(""); setRecoveryRegenerateChallengeToken(null); }}
                              disabled={totpLoading}
                            >
                              {t("Cancel")}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {!totpDisableOpen ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">{t("Two-step verification")}</p>
                        <p className="text-xs text-muted-foreground">{t("Turning it off signs you out of all devices.")}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        onClick={() => { setTotpDisableOpen(true); setRecoveryRegenerateOpen(false); }}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        {t("Turn off two-step verification")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-md border border-destructive/30 p-3">
                      {!totpDisableChallengeToken ? (
                        <>
                          <p className="text-sm text-muted-foreground">{t("First confirm your current password. You’ll then choose an authenticator code or recovery code.")}</p>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            placeholder={t("Current password")}
                            value={totpDisablePassword}
                            onChange={(e) => {
                              setTotpDisablePassword(e.target.value);
                              if (totpDisablePasswordError) setTotpDisablePasswordError(null);
                            }}
                            className="bg-muted/30"
                          />
                          {totpDisablePasswordError && (
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">{t(totpDisablePasswordError)}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={verifyTotpDisablePassword} disabled={totpLoading || !totpDisablePassword}>
                              {t(totpLoading ? "Checking password..." : "Continue")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => { setTotpDisableOpen(false); setTotpDisablePassword(""); setTotpDisableCode(""); setTotpDisableChallengeToken(null); }}
                              disabled={totpLoading}
                            >
                              {t("Cancel")}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">{t("Password confirmed. Select a verification method. Turning off two-step verification signs you out of all devices.")}</p>
                          <div role="group" aria-label={t("Verification method")} className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
                            <button
                              type="button"
                              aria-pressed={totpDisableMethod === "authenticator"}
                              onClick={() => { setTotpDisableMethod("authenticator"); setTotpDisableCode(""); }}
                              className={`rounded px-3 py-2 text-sm ${totpDisableMethod === "authenticator" ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              {t("Authenticator app")}
                            </button>
                            <button
                              type="button"
                              aria-pressed={totpDisableMethod === "recovery"}
                              onClick={() => { setTotpDisableMethod("recovery"); setTotpDisableCode(""); }}
                              className={`rounded px-3 py-2 text-sm ${totpDisableMethod === "recovery" ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              {t("Recovery code")}
                            </button>
                          </div>
                          <Input
                            inputMode={totpDisableMethod === "authenticator" ? "numeric" : "text"}
                            autoComplete="one-time-code"
                            maxLength={totpDisableMethod === "authenticator" ? 6 : 10}
                            placeholder={t(totpDisableMethod === "authenticator" ? "6-digit authenticator code" : "10-character recovery code")}
                            value={totpDisableCode}
                            onChange={(e) => setTotpDisableCode(totpDisableMethod === "authenticator"
                              ? e.target.value.replace(/\D/g, "").slice(0, 6)
                              : e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 10))}
                            className="bg-muted/30"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="destructive"
                              onClick={disableTotp}
                              disabled={totpLoading || (totpDisableMethod === "authenticator" ? totpDisableCode.length !== 6 : totpDisableCode.length !== 10)}
                            >
                              {t(totpLoading ? "Verifying..." : "Confirm and turn off")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => { setTotpDisableChallengeToken(null); setTotpDisableCode(""); }}
                              disabled={totpLoading}
                            >
                              {t("Back")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => { setTotpDisableOpen(false); setTotpDisablePassword(""); setTotpDisableCode(""); setTotpDisableChallengeToken(null); }}
                              disabled={totpLoading}
                            >
                              {t("Cancel")}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : totpSetupData ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("Scan this QR code with your authenticator app, then enter its current six-digit code.")}</p>
                  <img src={totpSetupData.qrDataUrl} alt="Authenticator setup QR code" className="h-48 w-48 rounded-md border bg-white p-2" />
                  <p className="break-all text-xs text-muted-foreground">{t("Manual setup key:")} <code>{totpSetupData.base32}</code></p>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder={t("6-digit code")}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="bg-muted/30"
                  />
                  <Button onClick={enableTotp} disabled={totpLoading || totpCode.length !== 6}>
                    {t(totpLoading ? "Verifying..." : "Verify and enable")}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full justify-start bg-emerald-700 text-white hover:bg-emerald-800"
                  onClick={startTotpSetup}
                  disabled={totpLoading || totpEnabled === null}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {t(totpLoading ? "Preparing..." : "Set up authenticator")}
                </Button>
              )}
              {totpMessage && <p className="text-sm text-muted-foreground">{t(totpMessage)}</p>}
              {recoveryCodes.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">{t("One-time recovery codes")}</p>
                  <p className="text-xs text-muted-foreground">{t("Store these somewhere safe. Each code can be used once.")}</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {recoveryCodes.map((code) => <code key={code}>{code}</code>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t("App Theme")}</CardTitle>
              <CardDescription>
                {t("Choose your preferred colors for the desktop application")}
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
                  <span>{t("Light")}</span>
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
                  <span>{t("Dark")}</span>
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
                  <span>{t("System")}</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Printing & Hardware Section */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-500" />
                {t("Hardware & Printing")}
              </CardTitle>
              <CardDescription>{t("Configure printer layouts and labels")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("Default Paper Size")}</label>
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
                {t("App Behavior & Language")}
              </CardTitle>
              <CardDescription>{t("Personalize your experience")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("Select Language")}</label>
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
                      {t(lang === "en" ? "English" : "Nepali (नेपाली)")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("Alerts & Notifications")}</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">{t("Low Stock Alerts")}</span>
                    </div>
                    <Switch
                      checked={localSettings.notifications.lowStock}
                      onCheckedChange={(v) => setNotifications({ lowStock: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium">{t("Overdue Invoice Reminders")}</span>
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
                {t("Security & Sessions")}
              </CardTitle>
              <CardDescription>{t("Manage your account security")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                <p className="text-xs text-red-800 dark:text-red-400 font-medium mb-3">
                  {t("Logout from all other devices. This will invalidate all active sessions immediately except the current one.")}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full rounded-xl"
                  onClick={() => setConfirmOpen(true)}
                  disabled={saving}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("Logout All Sessions")}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t("Logout All Sessions")}
        description={t("Are you sure you want to logout from all devices? All other sessions will be immediately terminated.")}
        variant="danger"
        confirmText={t("Logout All")}
        onConfirm={handleLogoutAll}
        onCancel={() => setConfirmOpen(false)}
        loading={saving}
      />
    </div>
  );
}
