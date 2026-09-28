"use client";

import * as React from "react";
import { login, register, startGoogleAuth, startLinkedInAuth, startMicrosoftAuth } from "@/lib/api/auth";
import { setToken } from "@/lib/store/auth";
import { useNavigate } from "react-router-dom";
import { Button, GoogleLogo, LinkedInLogo, MicrosoftLogo } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@lekhaly/ui";
import { Building2, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const PASSWORD_REQUIREMENTS = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export default function RegisterPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = React.useState(false);

  const [form, setForm] = React.useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!PASSWORD_REQUIREMENTS.test(form.password)) {
      setError(t("Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("Passwords do not match"));
      return;
    }
    setLoading(true);

    try {
      const { confirmPassword, ...registration } = form;
      await register(registration);
      const session: any = await login({ email: registration.email, password: registration.password });
      if (!session?.accessToken) throw new Error("Registration succeeded, but sign-in could not be completed");
      setToken(session.accessToken, session.refreshToken);
      navigate("/configuration?onboarding=true");
    } catch (err: any) {
      setError(t(err?.message ?? "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  function onGoogleRegister() {
    setError(null);
    startGoogleAuth({ intent: "register" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold font-heading tracking-tight">{t("Create Workspace")}</CardTitle>
            <CardDescription className="text-base">
              {t("Set up your company details to get started")}
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
              <div className="space-y-2">
                <Input
                  required
                  placeholder={t("Company Name")}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="h-11 bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <Input
                  required
                  placeholder={t("Owner Full Name")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 bg-muted/30"
                />
              </div>

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
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={t("Create Password")}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
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
                {passwordFocused && (
                  <p className="px-1 text-xs text-muted-foreground">
                    {t("Use at least 8 characters with uppercase, lowercase, a number, and a symbol.")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={t("Confirm Password")}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    className="h-11 bg-muted/30 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? t("Hide password") : t("Show password")}
                    title={showConfirmPassword ? t("Hide password") : t("Show password")}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPasswordFocused && (
                  <p className="px-1 text-xs text-muted-foreground">
                    {t("This password should match the password above.")}
                  </p>
                )}
              </div>
            </div>

            <Button
              disabled={loading}
              type="submit"
              className="w-full h-11 text-base shadow-lg shadow-primary/25 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 group"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Creating...")}
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full h-11" onClick={onGoogleRegister}>
              <GoogleLogo className="mr-2 h-5 w-5" />
              {t("Continue with Google")}
            </Button>
            <Button type="button" variant="outline" className="w-full h-11" onClick={() => startLinkedInAuth({ intent: "register" })}>
              <LinkedInLogo className="mr-2 h-5 w-5" />
              {t("Continue with LinkedIn")}
            </Button>
            <Button type="button" variant="outline" className="w-full h-11" onClick={() => startMicrosoftAuth({ intent: "register" })}>
              <MicrosoftLogo className="mr-2 h-5 w-5" />
              {t("Continue with Microsoft")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2 text-center text-sm">
          <div className="text-muted-foreground">
            {t("Already have a workspace?")}{" "}
            <Link to="/login" className="font-medium text-purple-600 hover:underline underline-offset-4">
              {t("Sign in instead")}
            </Link>
          </div>
          <div className="px-4 text-xs text-muted-foreground/60">
            {t("By clicking details, you agree to our Terms of Service and Privacy Policy.")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
