"use client";

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@lekhaly/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@lekhaly/ui";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/api/auth";
import { useTranslation } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);
      setSubmitted(true);
      if (result?.resetUrl && result?.resetToken) {
        navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
      }
    } catch (err: any) {
      setError(err?.message ?? "Unable to send reset link");
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
              <Mail className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold font-heading tracking-tight">{t("Forgot password")}</CardTitle>
            <CardDescription className="text-base">
              {t("Enter your email and we’ll send a secure reset link.")}
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
            {submitted && !error && (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                {t("If an account exists for that email, a reset link has been prepared.")}
              </div>
            )}

            <div className="space-y-2">
              <Input
                required
                type="email"
                autoComplete="email"
                placeholder={t("Email Address")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-muted/30"
              />
            </div>

            <Button disabled={loading} type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/25">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Sending...")}
                </>
              ) : (
                t("Send reset link")
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
