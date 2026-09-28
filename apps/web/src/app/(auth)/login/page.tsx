"use client";

import * as React from "react";
import { completeTotpLogin, login, startGoogleAuth, startLinkedInAuth, startMicrosoftAuth } from "@/lib/api/auth";
import { setToken } from "@/lib/store/auth";
import { useRouter } from "next/navigation";
import { Button, GoogleLogo, LinkedInLogo, MicrosoftLogo } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@lekhaly/ui";
import { Receipt, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const REMEMBERED_EMAIL_KEY = "lekhaly_remembered_email";

export default function LoginPage() {
  const t = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [challengeToken, setChallengeToken] = React.useState<string | null>(null);
  const [totpCode, setTotpCode] = React.useState("");
  const [rememberDevice, setRememberDevice] = React.useState(false);
  const [rememberEmail, setRememberEmail] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });

  React.useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (rememberedEmail) {
      setForm((current) => ({ ...current, email: rememberedEmail }));
      setRememberEmail(true);
    }
  }, []);

  function persistRememberedEmail() {
    if (rememberEmail && form.email.trim()) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, form.email.trim());
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = challengeToken
        ? await completeTotpLogin({ challengeToken, code: totpCode, rememberDevice })
        : await login(form);
      if (res?.requiresTotp && res?.challengeToken) {
        setChallengeToken(res.challengeToken);
        return;
      }
      if (res?.accessToken) {
        persistRememberedEmail();
        setToken(res.accessToken, res.refreshToken);
        router.push("/dashboard");
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Receipt className="h-7 w-7" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold font-heading tracking-tight">{t("Welcome back")}</CardTitle>
            <CardDescription className="text-base">
              {t(challengeToken ? "Enter the code from your authenticator app" : "Enter your credentials to access your workspace")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {t(error)}
              </div>
            )}

            <div className="space-y-4">
              {challengeToken ? (
                <>
                  <Input
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder={t("6-digit code or recovery code")}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 10))}
                    className="h-11 bg-muted/30"
                  />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    {t("Remember this device for 30 days")}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setChallengeToken(null); setTotpCode(""); setRememberDevice(false); }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("Back to email and password")}
                  </button>
                </>
              ) : (
                <>
              <div className="space-y-2">
                <Input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder={t("Email Address")}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-11 bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={t("Password")}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="h-11 bg-muted/30 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t("Hide password") : t("Show password")}
                    title={showPassword ? t("Hide password") : t("Show password")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                    {t("Forgot password?")}
                  </Link>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => {
                    setRememberEmail(e.target.checked);
                    if (!e.target.checked) window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
                  }}
                  className="h-4 w-4 accent-primary"
                />
                <span>
                  {t("Remember email on this device")}
                  <span className="block text-xs">{t("Your password is never saved.")}</span>
                </span>
              </label>
                </>
              )}
            </div>

            <Button
              disabled={loading || (!!challengeToken && totpCode.length !== 6 && totpCode.length !== 10)}
              type="submit"
              className="w-full h-11 text-base shadow-lg shadow-primary/25 mt-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Authenticating...")}
                </>
              ) : (
                <>
                  {t(challengeToken ? "Verify code" : "Sign In")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
            {!challengeToken && (
              <>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>{t("or")}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => startGoogleAuth({ intent: "login" })}
                >
                  <GoogleLogo className="mr-2 h-5 w-5" />
                  {t("Continue with Google")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => startLinkedInAuth({ intent: "login" })}
                >
                  <LinkedInLogo className="mr-2 h-5 w-5" />
                  {t("Continue with LinkedIn")}
                </Button>
                <Button type="button" variant="outline" className="w-full h-11" onClick={() => startMicrosoftAuth({ intent: "login" })}>
                  <MicrosoftLogo className="mr-2 h-5 w-5" />
                  {t("Continue with Microsoft")}
                </Button>
              </>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2 text-center text-sm">
          <div className="text-muted-foreground">
            {t("Don't have an account?")}{" "}
            <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
              {t("Create new company")}
            </Link>
          </div>

          <div className="text-xs text-muted-foreground/60 px-4">
            {t("By clicking details, you agree to our Terms of Service and Privacy Policy.")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
