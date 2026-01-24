"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import { getInvoice, postInvoice, voidInvoice } from "@/lib/api/invoices";
import { generateInvoicePdf, getPdfJobUrl } from "@/lib/api/pdf";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay, getDateLabel } from "@/lib/dates/display";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { dateFormat } = useDateFormat();

  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [invoice, setInvoice] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [confirmPost, setConfirmPost] = React.useState(false);
  const [confirmVoid, setConfirmVoid] = React.useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getInvoice(id);
      setInvoice(res);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load invoice");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const status: DocStatus = (invoice?.status ?? "draft") as DocStatus;
  const invoiceDate = getDateDisplay({ ad: invoice?.date, bs: invoice?.dateBs, format: dateFormat });
  const dueDate = getDateDisplay({ ad: invoice?.dueDate, bs: invoice?.dueDateBs, format: dateFormat });

  async function onPost() {
    if (!id) return;
    setActionLoading(true);
    try {
      await postInvoice(id);
      setConfirmPost(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to post invoice");
    } finally {
      setActionLoading(false);
    }
  }

  async function onVoid() {
    if (!id) return;
    setActionLoading(true);
    try {
      await voidInvoice(id);
      setConfirmVoid(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to void invoice");
    } finally {
      setActionLoading(false);
    }
  }

  async function onPdf() {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      const job: any = await generateInvoicePdf(id);
      const jobId = job?.id ?? job?.jobId ?? job?.pdfJobId;
      if (!jobId) throw new Error("PDF job id not returned by server");

      const urlRes: any = await getPdfJobUrl(jobId);
      const url = urlRes?.url ?? urlRes?.signedUrl ?? urlRes;
      if (!url) throw new Error("PDF URL not returned by server");

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate PDF");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={loading ? "Invoice" : `Invoice ${invoice?.invoiceNo ?? id?.slice(0, 8).toUpperCase()}`}
        description="Invoice details, posting and PDF"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.back()}
              className="rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              Back
            </button>

            <button
              onClick={onPdf}
              disabled={actionLoading || loading}
              className="rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              PDF
            </button>

            {status === "draft" ? (
              <button
                onClick={() => setConfirmPost(true)}
                disabled={actionLoading || loading}
                className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-60"
              >
                Post
              </button>
            ) : null}

            {status !== "void" ? (
              <button
                onClick={() => setConfirmVoid(true)}
                disabled={actionLoading || loading}
                className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700 hover:bg-red-600/15 disabled:opacity-60"
              >
                Void
              </button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="mb-3 rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">Loading…</div>
      ) : !invoice ? (
        <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">Not found</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Summary */}
          <div className="rounded-2xl border bg-card p-4 lg:col-span-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1">
                  <StatusBadge status={status} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="mt-1 text-lg font-semibold">
                  <MoneyText value={Number(invoice?.total ?? invoice?.grandTotal ?? 0)} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <Field label="Party" value={invoice?.partyName ?? invoice?.partyId ?? "—"} />
              <Field label={getDateLabel(dateFormat, "Date")} value={invoiceDate.primary} sub={invoiceDate.secondary} />
              <Field label={getDateLabel(dateFormat, "Due")} value={dueDate.primary} sub={dueDate.secondary} />
              <Field label="Type" value={invoice?.type ?? "—"} />
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border bg-card p-4 lg:col-span-2">
            <div className="text-sm font-semibold">Items</div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground">Item</th>
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground">HS Code</th>
                    <th className="px-3 py-2 text-right text-xs text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-right text-xs text-muted-foreground">Rate</th>
                    <th className="px-3 py-2 text-right text-xs text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice?.items ?? []).length ? (
                    (invoice.items as any[]).map((it, idx) => {
                      const qty = Number(it.qty ?? 0);
                      const rate = Number(it.rate ?? 0);
                      const amt = Number(it.amount ?? qty * rate);
                      return (
                        <tr key={idx} className="border-b last:border-b-0">
                          <td className="px-3 py-2">
                            <div className="font-medium">{it.name ?? it.itemName ?? it.itemId ?? "—"}</div>
                            {it.description ? (
                              <div className="text-xs text-muted-foreground">{it.description}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{it.hsCode ?? "—"}</td>
                          <td className="px-3 py-2 text-right mono-numbers">{qty || "—"}</td>
                          <td className="px-3 py-2 text-right mono-numbers">
                            <MoneyText value={rate} />
                          </td>
                          <td className="px-3 py-2 text-right mono-numbers">
                            <MoneyText value={amt} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmPost}
        title="Post invoice?"
        description="Posting will finalize this invoice and update accounts."
        confirmText="Post"
        onConfirm={onPost}
        onCancel={() => setConfirmPost(false)}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={confirmVoid}
        title="Void invoice?"
        description="Voiding will mark this invoice as void and it will not affect totals."
        confirmText="Void"
        variant="danger"
        onConfirm={onVoid}
        onCancel={() => setConfirmVoid(false)}
        loading={actionLoading}
      />
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
      {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

