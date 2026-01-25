import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_BASE = "http://localhost:4000/v1";

function getApiBase() {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!envBase) return DEFAULT_API_BASE;
  let base = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
  if (base.endsWith("/v1")) base = base.slice(0, -3);
  if (base.endsWith("/v1/")) base = base.slice(0, -4);
  return base;
}

export async function POST(req: NextRequest) {
  const apiBase = getApiBase();
  const url = `${apiBase}/v1/auth/login`;

  const body = await req.text();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}
