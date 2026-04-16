import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

export default function PurchaseReturnListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Return"
        description="Create and manage purchase return vouchers."
        actions={
          <Link to="/purchase-return/create">
            <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20">
              <RotateCcw className="mr-2 h-4 w-4" />
              New Purchase Return
            </Button>
          </Link>
        }
      />
      <div className="rounded-2xl border bg-card p-10 text-sm text-muted-foreground">
        Purchase return list UI not ported yet. Create a return using the button above.
      </div>
    </div>
  );
}
