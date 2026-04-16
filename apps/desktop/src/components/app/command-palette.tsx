// apps/desktop/src/components/app/command-palette.tsx
import * as React from "react";
import { useNavigate, Link } from "react-router-dom";

type CommandItem = {
  label: string;
  href: string;
  keywords?: string[];
};

const commands: CommandItem[] = [
  { label: "Dashboard", href: "/dashboard", keywords: ["home", "overview"] },
  { label: "Vouchers", href: "/vouchers", keywords: ["entries", "journal"] },
  { label: "Invoices", href: "/sales", keywords: ["sales", "bill"] },
  { label: "Payments", href: "/payments/create", keywords: ["receipt"] },
  { label: "Customers", href: "/customers", keywords: ["party"] },
  { label: "Vendors", href: "/vendors", keywords: ["supplier"] },
  { label: "Items", href: "/items", keywords: ["stock", "inventory"] },
  { label: "Reports", href: "/reports", keywords: ["analysis", "ledger"] },
  { label: "Settings", href: "/settings", keywords: ["preferences"] },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const text = `${c.label} ${(c.keywords ?? []).join(" ")}`.toLowerCase();
      return text.includes(q);
    });
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute left-1/2 top-[12vh] w-full max-w-xl -translate-x-1/2">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules or actions..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded-md border px-2 py-1 text-xs text-muted-foreground">Esc</kbd>
          </div>
          <div className="max-h-[360px] overflow-y-auto p-2">
            {filtered.length ? (
              filtered.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    navigate(item.href);
                  }}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.href}</span>
                </Link>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results
              </div>
            )}
          </div>
          <div className="border-t bg-background px-4 py-2 text-xs text-muted-foreground">
            Tip: Press Ctrl+K anytime to open.
          </div>
        </div>
      </div>
    </div>
  );
}
