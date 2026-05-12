import PageHeader from "@/components/app/page-header";
import { Hammer } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 blur-3xl scale-150 animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/10 shadow-xl shadow-primary/5">
          <Hammer className="h-10 w-10 text-primary" />
        </div>
      </div>

      <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/50 bg-clip-text text-transparent">
        Coming Soon
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground leading-relaxed">
        We&apos;re crafting this module with care. It will be available soon.
        Meanwhile, you can continue using invoices, vouchers, reports, and settings.
      </p>

      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/60">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        Under active development
      </div>
    </div>
  );
}

