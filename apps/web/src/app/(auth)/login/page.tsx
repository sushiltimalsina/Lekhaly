"use client";

import * as React from "react";
import { login } from "@/lib/api/auth";
import { setToken } from "@/lib/store/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    companyCode: "",
    email: "",
    password: "",
    totpCode: "",
    rememberDevice: true,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await login(form);
      if (res?.accessToken) {
        setToken(res.accessToken);
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
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border bg-card p-6"
      >
        <h1 className="text-lg font-semibold">Sign in to Lekhaly</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Use your company code and account
        </p>

        {error ? (
          <div className="mb-3 rounded-lg border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          <input
            required
            placeholder="Company code"
            value={form.companyCode}
            onChange={(e) => setForm({ ...form, companyCode: e.target.value })}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <input
            placeholder="TOTP code (if enabled)"
            value={form.totpCode}
            onChange={(e) => setForm({ ...form, totpCode: e.target.value })}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="mt-4 w-full rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="mt-4 text-center text-sm">
          <a href="/register" className="text-primary hover:underline">
            Create a new company
          </a>
        </div>
      </form>
    </div>
  );
}
