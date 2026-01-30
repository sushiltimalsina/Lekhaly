import PageHeader from "@/components/app/page-header";

export default function CreateQuotationPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Quotation"
                description="Generate a new quotation or estimate for a customer."
            />
            <div className="rounded-2xl border bg-card p-12 flex flex-col items-center justify-center text-center">
                <div className="text-lg font-bold">New Quotation</div>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    The quotation creation form is under development.
                </p>
            </div>
        </div>
    );
}
