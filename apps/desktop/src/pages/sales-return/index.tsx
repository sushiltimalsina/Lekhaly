import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

export default function SalesReturnListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Return"
        description="Create and manage sales return invoices."
        actions={
          <Link to="/sales-return/create">
            <Button className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20">
              <RotateCcw className="mr-2 h-4 w-4" />
              New Sales Return
            </Button>
          </Link>
        }
      />
      <div className="rounded-2xl border bg-card p-10 text-sm text-muted-foreground">
        Sales return list UI not ported yet. Create a return using the button above.
      </div>
    </div>
  );
}
