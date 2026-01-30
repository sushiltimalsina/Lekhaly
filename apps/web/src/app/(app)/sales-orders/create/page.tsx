import PageHeader from "@/components/app/page-header";

export default function CreateSalesOrderPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Sales Order"
                description="Generate a new sales order for a customer."
            />
            <div className="rounded-2xl border bg-card p-12 flex flex-col items-center justify-center text-center">
                <div className="text-lg font-bold">New Sales Order</div>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    The sales order creation form is under development.
                </p>
            </div>
        </div>
    );
}
