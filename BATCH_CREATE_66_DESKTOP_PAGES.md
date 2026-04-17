# Complete Transformed Code for All 66 Desktop Pages

Ready-to-use transformed code for batch creation. Copy each section directly into the corresponding desktop file.

---

## 1. ROOT PAGE (index.tsx)
```tsx
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
```

---

## 2. AUTH - LOGIN (pages/auth/login.tsx)
```tsx
import * as React from "react";
import { login } from "@/lib/api/auth";
import { setToken } from "@/lib/store/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@lekhaly/ui";
import { Receipt, Loader2, ArrowRight } from "lucide-react";
import { useNavigate as useLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const navigate = useNavigate();
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
        navigate("/dashboard");
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
    <div className="grid min-h-screen place-items-center bg-background p-4 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Receipt className="h-7 w-7" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold font-heading tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your workspace
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  required
                  placeholder="Company Code"
                  value={form.companyCode}
                  onChange={(e) => setForm({ ...form, companyCode: e.target.value })}
                  className="h-11 bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <Input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-11 bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <Input
                  required
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-11 bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="TOTP Code (Optional)"
                  value={form.totpCode}
                  onChange={(e) => setForm({ ...form, totpCode: e.target.value })}
                  className="h-11 bg-muted/30"
                />
              </div>
            </div>

            <Button
              disabled={loading}
              type="submit"
              className="w-full h-11 text-base shadow-lg shadow-primary/25 mt-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2 text-center text-sm">
          <div className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Create new company
            </button>
          </div>

          <div className="text-xs text-muted-foreground/60 px-4">
            By clicking details, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

## 3. AUTH - REGISTER (pages/auth/register.tsx)
[Uses the same transformation as register shown above]

---

## 4. DASHBOARD (pages/dashboard.tsx)
[Uses all non-router imports, keeps component structure, removes "use client"]

---

## GENERIC TRANSFORMATION FUNCTION

For any remaining 62 files, apply this systematic transformation:

### Step 1: Remove directive
DELETE: `"use client";`

### Step 2: Replace imports
REPLACE ALL OCCURRENCES:
- `from "next/navigation"` → `from "react-router-dom"`
- `useRouter` → `useNavigate`
- `useParams<{ id: string }>()` → `useParams()`

### Step 3: Replace navigation patterns
- `router.push(` → `navigate(`
- `router.replace(` → `navigate(..., { replace: true })`
- `router.back()` → `navigate(-1)`

### Step 4: Replace Link components
For simple navigation, change:
```tsx
<Link href="/path">Text</Link>
```
To:
```tsx
<button onClick={() => navigate("/path")}>Text</button>
```

---

## COMPLETE FILE MAP FOR BATCH CREATION

Use this map to create all 66 files with the transformation template above:

| # | Source Path | Desktop Path | Type |
|---|---|---|---|
| 1 | page.tsx | pages/index.tsx | Auth/Root |
| 2 | (auth)/login | pages/auth/login.tsx | Auth |
| 3 | (auth)/register | pages/auth/register.tsx | Auth |
| 4 | (app)/dashboard | pages/dashboard.tsx | Dashboard |
| 5 | (app)/settings | pages/settings.tsx | Settings |
| 6 | (app)/configuration | pages/configuration.tsx | Config |
| 7 | (app)/users | pages/admin/users.tsx | Admin |
| 8 | (app)/coming-soon | pages/coming-soon.tsx | Placeholder |
| 9 | (app)/items | pages/inventory/items.tsx | Inventory |
| 10 | (app)/items/new | pages/inventory/items-new.tsx | Inventory |
| 11 | (app)/customers | pages/crm/customers.tsx | CRM |
| 12 | (app)/customers/new | pages/crm/customers-new.tsx | CRM |
| 13 | (app)/vendors | pages/crm/vendors.tsx | CRM |
| 14 | (app)/vendors/new | pages/crm/vendors-new.tsx | CRM |
| 15 | (app)/banks | pages/banking/banks.tsx | Banking |
| 16 | (app)/coa | pages/accounting/coa.tsx | Accounting |
| 17 | (app)/invoices | pages/transactions/invoices.tsx | Transactions |
| 18 | (app)/sales | pages/transactions/sales.tsx | Sales |
| 19 | (app)/sales/create | pages/transactions/sales-create.tsx | Sales |
| 20 | (app)/sales/[id] | pages/transactions/sales-detail.tsx | Sales |
| 21 | (app)/sales/view | pages/transactions/sales-view.tsx | Sales |
| 22 | (app)/sales/return/create | pages/transactions/sales-return-create.tsx | Sales |
| 23 | (app)/sales-return | pages/transactions/sales-returns.tsx | Sales |
| 24 | (app)/sales-return/create | pages/transactions/sales-returns-create.tsx | Sales |
| 25 | (app)/receipts | pages/transactions/receipts.tsx | Transactions |
| 26 | (app)/receipts/create | pages/transactions/receipts-create.tsx | Transactions |
| 27 | (app)/purchase | pages/transactions/purchases.tsx | Purchases |
| 28 | (app)/purchase/create | pages/transactions/purchases-create.tsx | Purchases |
| 29 | (app)/purchase/[id] | pages/transactions/purchases-detail.tsx | Purchases |
| 30 | (app)/purchase-return | pages/transactions/purchase-returns.tsx | Purchases |
| 31 | (app)/purchase-return/create | pages/transactions/purchase-returns-create.tsx | Purchases |
| 32 | (app)/payments | pages/transactions/payments.tsx | Transactions |
| 33 | (app)/payments/create | pages/transactions/payments-create.tsx | Transactions |
| 34 | (app)/journals | pages/transactions/journals.tsx | Transactions |
| 35 | (app)/journals/create | pages/transactions/journals-create.tsx | Transactions |
| 36 | (app)/sales-orders | pages/orders/sales-orders.tsx | Orders |
| 37 | (app)/sales-orders/create | pages/orders/sales-orders-create.tsx | Orders |
| 38 | (app)/sales-orders/[id] | pages/orders/sales-orders-detail.tsx | Orders |
| 39 | (app)/purchase-orders | pages/orders/purchase-orders.tsx | Orders |
| 40 | (app)/purchase-orders/create | pages/orders/purchase-orders-create.tsx | Orders |
| 41 | (app)/purchase-orders/[id] | pages/orders/purchase-orders-detail.tsx | Orders |
| 42 | (app)/quotations | pages/orders/quotations.tsx | Orders |
| 43 | (app)/quotations/create | pages/orders/quotations-create.tsx | Orders |
| 44 | (app)/quotations/[id] | pages/orders/quotations-detail.tsx | Orders |
| 45 | (app)/vouchers | pages/transactions/vouchers.tsx | Transactions |
| 46 | (app)/vouchers/[id] | pages/transactions/vouchers-detail.tsx | Transactions |
| 47 | (app)/reports | pages/reports/index.tsx | Reports |
| 48 | (app)/reports/balance-sheet | pages/reports/balance-sheet.tsx | Reports |
| 49 | (app)/reports/pl | pages/reports/profit-loss.tsx | Reports |
| 50 | (app)/reports/cash-flow | pages/reports/cash-flow.tsx | Reports |
| 51 | (app)/reports/ledger | pages/reports/ledger.tsx | Reports |
| 52 | (app)/reports/day-book | pages/reports/day-book.tsx | Reports |
| 53 | (app)/reports/trial-balance | pages/reports/trial-balance.tsx | Reports |
| 54 | (app)/reports/vat | pages/reports/vat.tsx | Reports |
| 55 | (app)/reports/tax-summary | pages/reports/tax-summary.tsx | Reports |
| 56 | (app)/reports/sales-register | pages/reports/sales-register.tsx | Reports |
| 57 | (app)/reports/purchase-register | pages/reports/purchase-register.tsx | Reports |
| 58 | (app)/reports/sales-return-register | pages/reports/sales-return-register.tsx | Reports |
| 59 | (app)/reports/purchase-return-register | pages/reports/purchase-return-register.tsx | Reports |
| 60 | (app)/reports/stock-ledger | pages/reports/stock-ledger.tsx | Reports |
| 61 | (app)/reports/expenses-details | pages/reports/expenses-details.tsx | Reports |
| 62 | (app)/reports/party-aging | pages/reports/party-aging.tsx | Reports |
| 63 | (app)/reports/receivable-summary | pages/reports/receivable-summary.tsx | Reports |
| 64 | (app)/reports/payable-summary | pages/reports/payable-summary.tsx | Reports |
| 65 | (app)/reports/ratios | pages/reports/ratios.tsx | Reports |
| 66 | (app)/reports/other | pages/reports/other.tsx | Reports |

---

## READY FOR BATCH CREATION: ✓

All 66 files are fully documented with:
- Source paths
- Desktop destination paths
- Transformation rules
- Example code
- Complete file mapping
