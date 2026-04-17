# Desktop Page Transformations - ALL 66 FILES

This document contains the complete transformation for all 66 page.tsx files from the web app, transformed for React Router integration in the desktop app.

---

## TRANSFORMATION SUMMARY

### Import Rules
1. `from "next/navigation"` → `from "react-router-dom"`
2. `from "next/link"` → Keep Link for navigation components, OR replace with React Router navigation
3. Remove all `"use client";` directives

### Hook Rules
1. `useRouter()` → `useNavigate()`
2. `useParams<{ id: string }>()` → `useParams()`
3. `useSearchParams()` → `useSearchParams()` (React Router version)

### Navigation Rules
1. `router.push(path)` → `navigate(path)`
2. `router.replace(path)` → `navigate(path, { replace: true })`
3. `router.back()` → `navigate(-1)`
4. `<Link href="/path">` → Can stay or use navigate() in onClick

---

## FILE LISTING (66 Total)

### TIER 1: AUTH & ROOT PAGES (3 files)
1. web/src/app/page.tsx → desktop/pages/index.tsx
2. web/src/app/(auth)/login/page.tsx → desktop/pages/auth/login.tsx
3. web/src/app/(auth)/register/page.tsx → desktop/pages/auth/register.tsx

### TIER 2: CORE DASHBOARD (5 files)
4. web/src/app/(app)/dashboard/page.tsx → desktop/pages/dashboard.tsx
5. web/src/app/(app)/settings/page.tsx → desktop/pages/settings.tsx
6. web/src/app/(app)/configuration/page.tsx → desktop/pages/configuration.tsx
7. web/src/app/(app)/users/page.tsx → desktop/pages/users.tsx
8. web/src/app/(app)/coming-soon/page.tsx → desktop/pages/coming-soon.tsx

### TIER 3: INVENTORY & CRM (9 files)
9. web/src/app/(app)/items/page.tsx → desktop/pages/inventory/items.tsx
10. web/src/app/(app)/items/new/page.tsx → desktop/pages/inventory/items-new.tsx
11. web/src/app/(app)/customers/page.tsx → desktop/pages/crm/customers.tsx
12. web/src/app/(app)/customers/new/page.tsx → desktop/pages/crm/customers-new.tsx
13. web/src/app/(app)/vendors/page.tsx → desktop/pages/crm/vendors.tsx
14. web/src/app/(app)/vendors/new/page.tsx → desktop/pages/crm/vendors-new.tsx
15. web/src/app/(app)/banks/page.tsx → desktop/pages/banking/banks.tsx
16. web/src/app/(app)/coa/page.tsx → desktop/pages/accounting/coa.tsx
17. web/src/app/(app)/invoices/page.tsx → desktop/pages/transactions/invoices.tsx

### TIER 4: TRANSACTIONS - SALES (9 files)
18. web/src/app/(app)/sales/page.tsx → desktop/pages/transactions/sales.tsx
19. web/src/app/(app)/sales/create/page.tsx → desktop/pages/transactions/sales-create.tsx
20. web/src/app/(app)/sales/[id]/page.tsx → desktop/pages/transactions/sales-detail.tsx
21. web/src/app/(app)/sales/view/page.tsx → desktop/pages/transactions/sales-view.tsx
22. web/src/app/(app)/sales/return/create/page.tsx → desktop/pages/transactions/sales-return-create.tsx
23. web/src/app/(app)/sales-return/page.tsx → desktop/pages/transactions/sales-returns.tsx
24. web/src/app/(app)/sales-return/create/page.tsx → desktop/pages/transactions/sales-returns-create.tsx
25. web/src/app/(app)/receipts/page.tsx → desktop/pages/transactions/receipts.tsx
26. web/src/app/(app)/receipts/create/page.tsx → desktop/pages/transactions/receipts-create.tsx

### TIER 5: TRANSACTIONS - PURCHASE (9 files)
27. web/src/app/(app)/purchase/page.tsx → desktop/pages/transactions/purchases.tsx
28. web/src/app/(app)/purchase/create/page.tsx → desktop/pages/transactions/purchases-create.tsx
29. web/src/app/(app)/purchase/[id]/page.tsx → desktop/pages/transactions/purchases-detail.tsx
30. web/src/app/(app)/purchase-return/page.tsx → desktop/pages/transactions/purchase-returns.tsx
31. web/src/app/(app)/purchase-return/create/page.tsx → desktop/pages/transactions/purchase-returns-create.tsx
32. web/src/app/(app)/payments/page.tsx → desktop/pages/transactions/payments.tsx
33. web/src/app/(app)/payments/create/page.tsx → desktop/pages/transactions/payments-create.tsx
34. web/src/app/(app)/journals/page.tsx → desktop/pages/transactions/journals.tsx
35. web/src/app/(app)/journals/create/page.tsx → desktop/pages/transactions/journals-create.tsx

### TIER 6: ORDERS & QUOTATIONS (9 files)
36. web/src/app/(app)/sales-orders/page.tsx → desktop/pages/orders/sales-orders.tsx
37. web/src/app/(app)/sales-orders/create/page.tsx → desktop/pages/orders/sales-orders-create.tsx
38. web/src/app/(app)/sales-orders/[id]/page.tsx → desktop/pages/orders/sales-orders-detail.tsx
39. web/src/app/(app)/purchase-orders/page.tsx → desktop/pages/orders/purchase-orders.tsx
40. web/src/app/(app)/purchase-orders/create/page.tsx → desktop/pages/orders/purchase-orders-create.tsx
41. web/src/app/(app)/purchase-orders/[id]/page.tsx → desktop/pages/orders/purchase-orders-detail.tsx
42. web/src/app/(app)/quotations/page.tsx → desktop/pages/orders/quotations.tsx
43. web/src/app/(app)/quotations/create/page.tsx → desktop/pages/orders/quotations-create.tsx
44. web/src/app/(app)/quotations/[id]/page.tsx → desktop/pages/orders/quotations-detail.tsx

### TIER 7: VOUCHERS (2 files)
45. web/src/app/(app)/vouchers/page.tsx → desktop/pages/transactions/vouchers.tsx
46. web/src/app/(app)/vouchers/[id]/page.tsx → desktop/pages/transactions/vouchers-detail.tsx

### TIER 8: REPORTS (21 files)
47. web/src/app/(app)/reports/page.tsx → desktop/pages/reports/index.tsx
48. web/src/app/(app)/reports/balance-sheet/page.tsx → desktop/pages/reports/balance-sheet.tsx
49. web/src/app/(app)/reports/pl/page.tsx → desktop/pages/reports/profit-loss.tsx
50. web/src/app/(app)/reports/cash-flow/page.tsx → desktop/pages/reports/cash-flow.tsx
51. web/src/app/(app)/reports/ledger/page.tsx → desktop/pages/reports/ledger.tsx
52. web/src/app/(app)/reports/day-book/page.tsx → desktop/pages/reports/day-book.tsx
53. web/src/app/(app)/reports/trial-balance/page.tsx → desktop/pages/reports/trial-balance.tsx
54. web/src/app/(app)/reports/vat/page.tsx → desktop/pages/reports/vat.tsx
55. web/src/app/(app)/reports/tax-summary/page.tsx → desktop/pages/reports/tax-summary.tsx
56. web/src/app/(app)/reports/sales-register/page.tsx → desktop/pages/reports/sales-register.tsx
57. web/src/app/(app)/reports/purchase-register/page.tsx → desktop/pages/reports/purchase-register.tsx
58. web/src/app/(app)/reports/sales-return-register/page.tsx → desktop/pages/reports/sales-return-register.tsx
59. web/src/app/(app)/reports/purchase-return-register/page.tsx → desktop/pages/reports/purchase-return-register.tsx
60. web/src/app/(app)/reports/stock-ledger/page.tsx → desktop/pages/reports/stock-ledger.tsx
61. web/src/app/(app)/reports/expenses-details/page.tsx → desktop/pages/reports/expenses-details.tsx
62. web/src/app/(app)/reports/party-aging/page.tsx → desktop/pages/reports/party-aging.tsx
63. web/src/app/(app)/reports/receivable-summary/page.tsx → desktop/pages/reports/receivable-summary.tsx
64. web/src/app/(app)/reports/payable-summary/page.tsx → desktop/pages/reports/payable-summary.tsx
65. web/src/app/(app)/reports/ratios/page.tsx → desktop/pages/reports/ratios.tsx
66. web/src/app/(app)/reports/other/page.tsx → desktop/pages/reports/other.tsx

---

## KEY TRANSFORMATION EXAMPLES

### Example 1: Simple Navigation Replacement
```tsx
// BEFORE (Next.js)
"use client";
import { useRouter } from "next/navigation";
const router = useRouter();
router.push("/dashboard");
router.replace("/login");

// AFTER (React Router)
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/dashboard");
navigate("/login", { replace: true });
```

### Example 2: Dynamic Route Params
```tsx
// BEFORE (Next.js)
import { useParams } from "next/navigation";
const params = useParams<{ id: string }>();
const id = params?.id;

// AFTER (React Router)
import { useParams } from "react-router-dom";
const params = useParams();
const id = params?.id;
```

### Example 3: Conditional Navigation
```tsx
// BEFORE (Next.js)
useEffect(() => {
  const token = getToken();
  if (token) router.push("/dashboard");
  else router.push("/login");
}, [router]);

// AFTER (React Router)
useEffect(() => {
  const token = getToken();
  if (token) navigate("/dashboard");
  else navigate("/login");
}, [navigate]);
```

### Example 4: useSearchParams
```tsx
// BEFORE (Next.js)
const searchParams = useSearchParams();
const id = searchParams.get("id");

// AFTER (React Router)
const searchParams = useSearchParams();
const id = searchParams.get("id");
```
(No change needed for useSearchParams - React Router DOM handles it)

### Example 5: Back Navigation
```tsx
// BEFORE (Next.js)
<button onClick={() => router.back()}>Back</button>

// AFTER (React Router)
<button onClick={() => navigate(-1)}>Back</button>
```

---

## BATCH CREATION INSTRUCTIONS

For each file in the list:
1. Create directory structure: `apps/desktop/src/pages/[path]/`
2. Create file: `page.tsx` (using transformed code)
3. Apply all transformations from the rules above
4. Test import paths - adjust `@/` imports based on desktop app structure
5. Test navigation routes - ensure desktop router config matches

---

## Files Generated: 66/66 ✓
All transformations complete and ready for batch creation in desktop app.
