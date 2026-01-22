"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import {
  getVoucher,
  previewVoucher,
  postVoucher,
  voidVoucher,
  listVoucherAttachments,
  getVoucherAttachmentUrl,
  deleteVoucherAttachment,
} from "@/lib/api/vouchers";
import { generateVoucherPdf, getPdfJobUrl } from "@/lib/api/pdf";

export default function VoucherDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [voucher, setVoucher] = React.useState<any>(null);
  const [preview, setPreview] = React.useState<any>(null);
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [confirmPost, setConfirmPost] = React.useState(false);
  const [confirmVoid, setConfirmVoid] = React.useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const v = await getVoucher(id);
      setVoucher(v);

      // preview is separate endpoint
      try {
        const p = await previewVoucher(id);
        setPreview(p);
      } catch {
        setPreview(null);
      }

      try {
        const a = await listVoucherAttachments(id);
        const list = Array.isArray(a) ? a : a?.items ?? a?.data ?? [];
        setAttachments(list);
      } catch {
        setAttachments([]);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load voucher");
      setVoucher(null);
      setPreview(null);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const status: DocStatus = (voucher?.status ?? "draft") as DocStatus;

  const totals = React.useMemo(() => {
    const lines: any[] = voucher?.lines ?? preview?.lines ?? [];
    let dr = 0;
    let cr = 0;
    for (const l of lines) {
      dr += Number(l.debit ?? 0);
      cr += Number(l.credit ?? 0);
    }
    return { dr, cr };
  }, [voucher, preview]);

  async function onPost() {
    if (!id) return;
    setActionLoading(true);
    try {
      await postVoucher(id);
      setConfirmPost(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to post voucher");
    } finally {
      setActionLoading(false);
    }
  }

  async function onVoid() {
    if (!id) return;
    setActionLoading(true);
    try {
      await voidVoucher(id);
      setConfirmVoid(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to void voucher");
    } finally {
      setActionLoading(false);
    }
  }

  async function onPdf() {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      const job: any = await generateVoucherPdf(id);
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

  async function openAttachment(attId: string) {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      const res: any = await getVoucherAttachmentUrl(id, attId);
      const url = res?.url ?? res?.signedUrl ?? res;
      if (!url) throw new Error("Attachment URL not returned by server");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setError(e?.message ?? "Failed to open attachment");
    } finally {
      setActionLoading(false);
    }
  }

  async function removeAttachment(attId: string) {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      await deleteVoucherAttachment(id, attId);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete attachment");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={loading ? "Voucher" : `Voucher ${voucher?.voucherNo ?? id?.slice(0, 8).toUpperCase()}`}
        description="Voucher details, preview, posting and attachments"
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
      ) : !voucher ? (
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
                <div className="text-xs text-muted-foreground">Type</div>
                <div className="mt-1 text-sm font-semibold">{voucher?.voucherType ?? "—"}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <Field label="Party" value={voucher?.partyName ?? voucher?.partyId ?? "—"} />
              <Field label="Date (BS)" value={voucher?.voucherDateBs ?? "—"} sub={voucher?.voucherDate?.slice?.(0, 10)} />
              <Field label="Memo" value={voucher?.memo ?? "—"} />
            </div>

            <div className="mt-4 rounded-xl border bg-background p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Debit</span>
                <span className="mono-numbers">
                  <MoneyText value={totals.dr} />
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Credit</span>
                <span className="mono-numbers">
                  <MoneyText value={totals.cr} />
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Difference</span>
                <span className={Math.abs(totals.dr - totals.cr) < 0.0001 ? "text-emerald-600" : "text-red-600"}>
                  <MoneyText value={totals.dr - totals.cr} />
                </span>
              </div>
            </div>
          </div>

          {/* Lines */}
          <div className="rounded-2xl border bg-card p-4 lg:col-span-2">
            <div className="text-sm font-semibold">Lines</div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground">Account/Party</th>
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-right text-xs text-muted-foreground">Debit</th>
                    <th className="px-3 py-2 text-right text-xs text-muted-foreground">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {((voucher?.lines ?? preview?.lines) ?? []).length ? (
                    ((voucher.lines ?? preview?.lines) as any[]).map((l, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="px-3 py-2">
                          <div className="font-medium">{l.accountName ?? l.accountId ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{l.partyName ?? l.partyId ?? ""}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="truncate">{l.description ?? "—"}</div>
                        </td>
                        <td className="px-3 py-2 text-right mono-numbers">
                          <MoneyText value={Number(l.debit ?? 0)} />
                        </td>
                        <td className="px-3 py-2 text-right mono-numbers">
                          <MoneyText value={Number(l.credit ?? 0)} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        No lines
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Attachments */}
            <div className="mt-6">
              <div className="text-sm font-semibold">Attachments</div>
              <div className="mt-2 space-y-2">
                {attachments.length ? (
                  attachments.map((a) => {
                    const attId = a.id ?? a.attachmentId;
                    const name = a.name ?? a.filename ?? a.originalName ?? attId;
                    return (
                      <div key={attId} className="flex items-center justify-between rounded-xl border bg-background px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground mono-numbers">{attId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openAttachment(attId)}
                            disabled={actionLoading}
                            className="rounded-xl border bg-card px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => removeAttachment(attId)}
                            disabled={actionLoading}
                            className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-1.5 text-xs text-red-700 hover:bg-red-600/15 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border bg-background px-3 py-3 text-sm text-muted-foreground">
                    No attachments
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmPost}
        title="Post voucher?"
        description="Posting will finalize the voucher and update ledgers."
        confirmText="Post"
        onConfirm={onPost}
        onCancel={() => setConfirmPost(false)}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={confirmVoid}
        title="Void voucher?"
        description="Voiding will mark this voucher as void."
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
