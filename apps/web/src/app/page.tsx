"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/store/auth";

export default function HomePage() {
  const router = useRouter();

  React.useEffect(() => {
    const token = getToken();
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        Loading...
      </div>
    </div>
  );
}
