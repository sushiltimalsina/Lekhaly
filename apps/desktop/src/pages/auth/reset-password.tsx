"use client";

import * as React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button, Input } from "@lekhaly/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@lekhaly/ui";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { resetPassword } from "@/lib/api/auth";
import { useTranslation } from "@/lib/i18n";

const PASSWORD_REQUIREMENTS = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export default function ResetPasswordPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = React.useState(() => new URLSearchParams(window.location.search));
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [form, setForm] = React.useState({ password: "", confirmPassword: "" });

  const token = searchParams.get("token") ?? "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing or expired.");
      return;
    }

    if (!PASSWORD_REQUIREMENTS.test(form.password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, password: form.password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 overflow-hidden relative">
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Lock className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold font-heading tracking-tight">{t("Reset password")}</CardTitle>
            <CardDescription className="text-base">
              {t("Choose a new password for your account.")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium">
                {t(error)}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                {t("Password updated successfully. Please sign in again.")}
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("New Password")}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-11 bg-muted/30 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("Hide password") : t("Show password")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("Confirm New Password")}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="h-11 bg-muted/30 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? t("Hide password") : t("Show password")}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button disabled={loading || success} type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/25">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Updating...")}
                </>
              ) : (
                t("Update password")
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2 text-center text-sm">
          <Link to="/login" className="inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
            <ArrowLeft className="h-4 w-4" />
            {t("Back to sign in")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
