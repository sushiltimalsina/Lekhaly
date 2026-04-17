import * as React from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "@/lib/store/auth";

export default function HomePage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = getToken();
    navigate(token ? "/dashboard" : "/login", { replace: true });
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        Loading...
      </div>
    </div>
  );
}
