const fs = require('fs');

// 1. purchase/create/page.tsx
{
  const file = 'c:/Lekhaly/apps/web/src/app/(app)/purchase/create/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useNextVoucherNumber')) {
    content = content.replace(
      'import { useExcelPaste } from "@/hooks/use-excel-paste";',
      'import { useExcelPaste } from "@/hooks/use-excel-paste";\nimport { useNextVoucherNumber } from "@/hooks/use-next-voucher-number";'
    );
    content = content.replace(
      'function PurchaseCreateContent() {\n    const [mounted, setMounted] = React.useState(false);',
      'function PurchaseCreateContent() {\n    const [mounted, setMounted] = React.useState(false);\n    const searchParamsForSkip = useSearchParams();\n    const isEditModeForSkip = !!searchParamsForSkip.get("id");\n    const { preview: nextPurchasePreview } = useNextVoucherNumber("purchase", isEditModeForSkip);'
    );
    content = content.replace(
      'value={form.referenceNo}\n                                    onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}\n                                    placeholder="Reference No."\n                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"\n                                    disabled={true}',
      'value={form.referenceNo || (isEditMode ? "System generated" : nextPurchasePreview)}\n                                    onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}\n                                    placeholder="Reference No."\n                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-200"\n                                    disabled={true}'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched purchase create');
  }
}

// 2. purchase-return/create/page.tsx
{
  const file = 'c:/Lekhaly/apps/web/src/app/(app)/purchase-return/create/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useNextVoucherNumber')) {
    content = content.replace(
      'import { useUiState } from "@/lib/store/ui";',
      'import { useUiState } from "@/lib/store/ui";\nimport { useNextVoucherNumber } from "@/hooks/use-next-voucher-number";'
    );
    content = content.replace(
      'function PurchaseReturnCreateContent() {\n    const [mounted, setMounted] = React.useState(false);',
      'function PurchaseReturnCreateContent() {\n    const [mounted, setMounted] = React.useState(false);\n    const searchParamsForSkip = useSearchParams();\n    const isEditModeForSkip = !!searchParamsForSkip.get("id");\n    const { preview: nextReturnPreview } = useNextVoucherNumber("purchaseReturn", isEditModeForSkip);'
    );
    content = content.replace(
      'value={form.referenceNo || form.voucherNumber}',
      'value={form.referenceNo || form.voucherNumber || (isEditMode ? "System generated" : nextReturnPreview)}'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched purchase-return create');
  }
}

// 3. sales-orders/create/page.tsx
{
  const file = 'c:/Lekhaly/apps/web/src/app/(app)/sales-orders/create/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useNextVoucherNumber')) {
    content = content.replace(
      'import { useUiState } from "@/lib/store/ui";',
      'import { useUiState } from "@/lib/store/ui";\nimport { useNextVoucherNumber } from "@/hooks/use-next-voucher-number";'
    );
    content = content.replace(
      'function SalesOrderCreateContent() {\n    const [mounted, setMounted] = React.useState(false);',
      'function SalesOrderCreateContent() {\n    const [mounted, setMounted] = React.useState(false);\n    const searchParamsForSkip = useSearchParams();\n    const isEditModeForSkip = !!searchParamsForSkip.get("id");\n    const { preview: nextOrderPreview } = useNextVoucherNumber("order", isEditModeForSkip);'
    );
    content = content.replace(
      'orderNoDisplay: "System generated",',
      'orderNoDisplay: "System generated",'
    );
    content = content.replace(
      'value={form.orderNoDisplay}',
      'value={form.orderNoDisplay !== "System generated" ? form.orderNoDisplay : (isEditMode ? "System generated" : nextOrderPreview)}'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched sales-orders create');
  }
}

// 4. quotations/create/page.tsx
{
  const file = 'c:/Lekhaly/apps/web/src/app/(app)/quotations/create/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useNextVoucherNumber')) {
    content = content.replace(
      'import { useUiState } from "@/lib/store/ui";',
      'import { useUiState } from "@/lib/store/ui";\nimport { useNextVoucherNumber } from "@/hooks/use-next-voucher-number";'
    );
    content = content.replace(
      'function QuotationCreateContent() {\n    const [mounted, setMounted] = React.useState(false);',
      'function QuotationCreateContent() {\n    const [mounted, setMounted] = React.useState(false);\n    const searchParamsForSkip = useSearchParams();\n    const isEditModeForSkip = !!searchParamsForSkip.get("id");\n    const { preview: nextQuotationPreview } = useNextVoucherNumber("quotation", isEditModeForSkip);'
    );
    content = content.replace(
      'value={form.quotationNoDisplay}',
      'value={form.quotationNoDisplay !== "System generated" ? form.quotationNoDisplay : (isEditMode ? "System generated" : nextQuotationPreview)}'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched quotations create');
  }
}

// 5. receipts/create/page.tsx
{
  const file = 'c:/Lekhaly/apps/web/src/app/(app)/receipts/create/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useNextVoucherNumber')) {
    content = content.replace(
      'import { useRouter } from "next/navigation";',
      'import { useRouter } from "next/navigation";\nimport { useNextVoucherNumber } from "@/hooks/use-next-voucher-number";'
    );
    content = content.replace(
      'export default function ReceiptCreatePage() {',
      'export default function ReceiptCreatePage() {\n    const { preview: nextReceiptPreview } = useNextVoucherNumber("receipt");'
    );
    content = content.replace(
      'value={form.voucherNo}',
      'value={form.voucherNo === "NEW" ? nextReceiptPreview : form.voucherNo}'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched receipts create');
  }
}

// 6. payments/create/page.tsx
{
  const file = 'c:/Lekhaly/apps/web/src/app/(app)/payments/create/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useNextVoucherNumber')) {
    content = content.replace(
      'import { useRouter } from "next/navigation";',
      'import { useRouter } from "next/navigation";\nimport { useNextVoucherNumber } from "@/hooks/use-next-voucher-number";'
    );
    content = content.replace(
      'export default function PaymentCreatePage() {',
      'export default function PaymentCreatePage() {\n    const { preview: nextPaymentPreview } = useNextVoucherNumber("payment");'
    );
    content = content.replace(
      'value={form.voucherNo}',
      'value={form.voucherNo === "NEW" ? nextPaymentPreview : form.voucherNo}'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched payments create');
  }
}

// 7. journals/create/page.tsx
{
  const file = 'c:/Lekhaly/apps/web/src/app/(app)/journals/create/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useNextVoucherNumber')) {
    content = content.replace(
      'import { useRouter } from "next/navigation";',
      'import { useRouter } from "next/navigation";\nimport { useNextVoucherNumber } from "@/hooks/use-next-voucher-number";'
    );
    content = content.replace(
      'export default function JournalCreatePage() {',
      'export default function JournalCreatePage() {\n    const { preview: nextJournalPreview } = useNextVoucherNumber("journal");'
    );
    content = content.replace(
      'value={form.voucherNo}',
      'value={form.voucherNo === "NEW" ? nextJournalPreview : form.voucherNo}'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched journals create');
  }
}

// 8. contras/create/page.tsx
{
  const file = 'c:/Lekhaly/apps/web/src/app/(app)/contras/create/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useNextVoucherNumber')) {
    content = content.replace(
      'import { useRouter } from "next/navigation";',
      'import { useRouter } from "next/navigation";\nimport { useNextVoucherNumber } from "@/hooks/use-next-voucher-number";'
    );
    content = content.replace(
      'export default function ContraCreatePage() {',
      'export default function ContraCreatePage() {\n    const { preview: nextContraPreview } = useNextVoucherNumber("contra");'
    );
    content = content.replace(
      'value={form.voucherNo}',
      'value={form.voucherNo === "NEW" ? nextContraPreview : form.voucherNo}'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched contras create');
  }
}
