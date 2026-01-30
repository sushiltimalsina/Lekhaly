import PageHeader from "@/components/app/page-header";

export default function QuotationsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Quotations"
                description="Manage and track customer quotations and estimates."
            />
            <div className="rounded-2xl border bg-card p-12 flex flex-col items-center justify-center text-center">
                <div className="text-lg font-bold">Quotations List</div>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    This module is currently under development. Soon you will be able to create and manage quotations for your customers here.
                </p>
            </div>
        </div>
    );
}
