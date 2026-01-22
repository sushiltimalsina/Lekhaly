"use client";

import * as React from "react";
import { register } from "@/lib/api/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    companyCode: "",
    companyName: "",
    name: "",
    email: "",
    password: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(form);
      router.push("/login");
    } catch (err: any) {
      setError(err?.message ?? "Registration failed");
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
        <h1 className="text-lg font-semibold">Create your company</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          This will set up a new Lekhaly account
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
            placeholder="Company name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
        </div>

        <button
          disabled={loading}
          type="submit"
          className="mt-4 w-full rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create company"}
        </button>

        <div className="mt-4 text-center text-sm">
          <a href="/login" className="text-primary hover:underline">
            Back to login
          </a>
        </div>
      </form>
    </div>
  );
}
