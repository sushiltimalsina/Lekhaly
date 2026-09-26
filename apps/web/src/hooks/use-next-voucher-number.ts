"use client";

import * as React from "react";
import { getActiveFiscalSession, formatVoucherNumber, type ActiveFiscalSession } from "@/lib/api/fiscal-sessions";

export type VoucherNumberType =
  | "invoice"
  | "purchase"
  | "salesReturn"
  | "purchaseReturn"
  | "receipt"
  | "payment"
  | "journal"
  | "quotation"
  | "order"
  | "purchaseOrder"
  | "contra";

const DEFAULT_PREFIXES: Record<VoucherNumberType, string> = {
  invoice: "SI",
  salesReturn: "SR",
  purchase: "PUR",
  purchaseReturn: "PR",
  receipt: "RCPT",
  payment: "PAY",
  journal: "JV",
  quotation: "QT",
  order: "SO",
  purchaseOrder: "PO",
  contra: "CNTR",
};

function buildPreview(session: ActiveFiscalSession | null, type: VoucherNumberType): string {
  if (!session) {
    return `${DEFAULT_PREFIXES[type]}-1`;
  }
  switch (type) {
    case "invoice":
      return formatVoucherNumber(session.invoicePrefix || "SI", session.nextInvoiceNumber ?? 1, session.invoiceSuffix);
    case "purchase":
      return formatVoucherNumber(session.purchasePrefix || "PUR", session.nextPurchaseNumber ?? 1, session.purchaseSuffix);
    case "salesReturn":
      return formatVoucherNumber(session.salesReturnPrefix || "SR", session.nextSalesReturnNumber ?? 1, session.salesReturnSuffix);
    case "purchaseReturn":
      return formatVoucherNumber(session.purchaseReturnPrefix || "PR", session.nextPurchaseReturnNumber ?? 1, session.purchaseReturnSuffix);
    case "receipt":
      return formatVoucherNumber(session.receiptPrefix || "RCPT", session.nextReceiptNumber ?? 1, session.receiptSuffix);
    case "payment":
      return formatVoucherNumber(session.paymentPrefix || "PAY", session.nextPaymentNumber ?? 1, session.paymentSuffix);
    case "journal":
      return formatVoucherNumber(session.journalPrefix || "JV", session.nextJournalNumber ?? 1, session.journalSuffix);
    case "quotation":
      return formatVoucherNumber(session.quotationPrefix || "QT", session.nextQuotationNumber ?? 1, session.quotationSuffix);
    case "order":
      return formatVoucherNumber(session.orderPrefix || "SO", session.nextOrderNumber ?? 1, session.orderSuffix);
    case "purchaseOrder":
      return formatVoucherNumber(session.purchaseOrderPrefix || "PO", session.nextPurchaseOrderNumber ?? 1, session.purchaseOrderSuffix);
    case "contra":
      return formatVoucherNumber(session.contraPrefix || "CNTR", session.nextContraNumber ?? 1, session.contraSuffix);
    default:
      return `${DEFAULT_PREFIXES[type]}-1`;
  }
}

/**
 * Hook that fetches the active fiscal session and returns the formatted
 * "next number" preview for a given voucher type.
 * Default prefixes:
 *   - invoice: SI
 *   - salesReturn: SR
 *   - purchase: PUR
 *   - purchaseReturn: PR
 */
export function useNextVoucherNumber(type: VoucherNumberType, skip?: boolean) {
  const [session, setSession] = React.useState<ActiveFiscalSession | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }
    let alive = true;
    getActiveFiscalSession().then((s) => {
      if (alive) {
        setSession(s);
        setLoading(false);
      }
    }).catch(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [skip]);

  const preview = React.useMemo(() => {
    return buildPreview(session, type);
  }, [session, type]);

  return { preview, session, loading };
}
