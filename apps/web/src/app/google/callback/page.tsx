"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@lekhaly/ui";
import { completeTotpLogin } from "@/lib/api/auth";
import { setToken } from "@/lib/store/auth";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [challengeToken, setChallengeToken] = React.useState<string | null>(null);
  const [onboarding, setOnboarding] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const challenge = params.get("challenge_token");
    const isOnboarding = params.get("onboarding") === "company";
    window.history.replaceState(null, "", "/google/callback");
    if (accessToken) {
      setToken(accessToken, refreshToken ?? undefined);
      router.replace(isOnboarding ? "/configuration?onboarding=true" : "/dashboard");
      return;
    }
    if (challenge) {
      setChallengeToken(challenge);
      setOnboarding(isOnboarding);
      return;
    }
    router.replace("/login");
  }, [router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!challengeToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await completeTotpLogin({ challengeToken, code });
      if (!result?.accessToken) throw new Error("Invalid login response");
      setToken(result.accessToken, result.refreshToken);
      router.replace(onboarding ? "/configuration?onboarding=true" : "/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (!challengeToken) return null;

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <Input
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="6-digit authenticator code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify code"}
        </Button>
      </form>
    </main>
  );
}
