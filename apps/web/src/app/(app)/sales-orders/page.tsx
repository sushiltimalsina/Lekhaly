import PageHeader from "@/components/app/page-header";

export default function SalesOrdersPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Sales Orders"
                description="Manage and track customer sales orders."
            />
            <div className="rounded-2xl border bg-card p-12 flex flex-col items-center justify-center text-center">
                <div className="text-lg font-bold">Sales Orders List</div>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    This module is currently under development. Soon you will be able to create and manage sales orders here.
                </p>
            </div>
        </div>
    );
}
