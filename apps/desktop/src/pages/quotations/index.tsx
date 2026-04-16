import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { FileSignature } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuotationsListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Create and manage customer quotations."
        actions={
          <Link to="/quotations/create">
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
              <FileSignature className="mr-2 h-4 w-4" />
              New Quotation
            </Button>
          </Link>
        }
      />
      <div className="rounded-2xl border bg-card p-10 text-sm text-muted-foreground">
        Quotation list UI not ported yet. Create a quotation using the button above.
      </div>
    </div>
  );
}
