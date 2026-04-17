import PageHeader from "@/components/app/page-header";

export default function ComingSoonPage() {
  return (
    <div>
      <PageHeader title="Coming Soon" description="This module is under development" />

      <div className="rounded-2xl border bg-card p-6">
        <div className="text-sm font-semibold">Weâ€™re building this</div>
        <p className="mt-2 text-sm text-muted-foreground">
          This page will be available soon. Meanwhile, you can continue using invoices,
          vouchers, reports and settings.
        </p>
      </div>
    </div>
  );
}

