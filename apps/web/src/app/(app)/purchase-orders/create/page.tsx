import PageHeader from "@/components/app/page-header";

export default function CreatePurchaseOrderPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Purchase Order"
                description="Generate a new purchase order for a vendor."
            />
            <div className="rounded-2xl border bg-card p-12 flex flex-col items-center justify-center text-center">
                <div className="text-lg font-bold">New Purchase Order</div>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    The purchase order creation form is under development.
                </p>
            </div>
        </div>
    );
}
