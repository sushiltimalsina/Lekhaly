// apps/desktop/src/app.tsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getToken } from "@/lib/store/auth";

// Shell Components
import Sidebar from "@/components/app/sidebar";
import Topbar from "@/components/app/topbar";
import QuickActionsRail from "@/components/app/quick-actions";
import OfflineSyncBanner from "@/components/app/offline-sync-banner";
import CommandPalette from "@/components/app/command-palette";
import { cn } from "@/lib/utils";

// Pages
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import SalesListPage from "@/pages/sales/index";
import SalesDetailPage from "@/pages/sales/view";
import SalesCreatePage from "@/pages/sales/create";
import SalesReturnListPage from "@/pages/sales-return";
import SalesReturnCreatePage from "@/pages/sales-return/create";

import CustomersListPage from "@/pages/customers/index";
import CustomersNewPage from "@/pages/customers/new";
import VendorsListPage from "@/pages/vendors/index";
import VendorsNewPage from "@/pages/vendors/new";
import ItemsListPage from "@/pages/items/index";
import NewItemPage from "@/pages/items/new";

import PurchaseListPage from "@/pages/purchase/index";
import PurchaseDetailPage from "@/pages/purchase/view";
import PurchaseCreatePage from "@/pages/purchase/create";
import PurchaseReturnListPage from "@/pages/purchase-return";
import PurchaseReturnCreatePage from "@/pages/purchase-return/create";

import VouchersListPage from "@/pages/vouchers/index";
import VoucherDetailPage from "@/pages/vouchers/view";
import ReceiptCreatePage from "@/pages/vouchers/receipt-create";
import PaymentCreatePage from "@/pages/vouchers/payment-create";
import JournalCreatePage from "@/pages/vouchers/journal-create";

import SalesOrdersListPage from "@/pages/sales-orders/index";
import SalesOrderDetailPage from "@/pages/sales-orders/view";
import SalesOrderCreatePage from "@/pages/sales-orders/create";

import QuotationsListPage from "@/pages/quotations";
import QuotationCreatePage from "@/pages/quotations/create";

import PurchaseOrderCreatePage from "@/pages/purchase-orders/create";

import ReportsDashboardPage from "@/pages/reports/index";
import LedgerReportPage from "@/pages/reports/ledger";
import TrialBalanceReportPage from "@/pages/reports/trial-balance";
import ProfitLossPage from "@/pages/reports/pl";
import BalanceSheetPage from "@/pages/reports/balance-sheet";
import SalesRegisterPage from "@/pages/reports/sales-register";
import PurchaseRegisterPage from "@/pages/reports/purchase-register";
import DayBookPage from "@/pages/reports/day-book";
import PartyAgingReportPage from "@/pages/reports/party-aging";
import StockSummaryReportPage from "@/pages/reports/stock-summary";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isCreationPage = pathname.includes("/create") || pathname.includes("/view/") || pathname.includes("/new");

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {!isCreationPage && (
        <div
          className="hidden md:block flex-shrink-0"
          style={{ width: "var(--sidebar-width, 84px)" }}
        >
          <Sidebar className="fixed inset-y-0 z-20" />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        {!isCreationPage && <Topbar />}
        <OfflineSyncBanner />
        <CommandPalette />

        {/* Content Wrapper */}
        <main className={cn(
          "flex-1 scroll-smooth",
          isCreationPage ? "overflow-hidden" : "overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar"
        )}>
          <div className={cn(
            "mx-auto animate-fade-in flex",
            isCreationPage ? "max-w-none w-full h-full" : "max-w-7xl gap-6"
          )}>
            <div className="min-w-0 flex-1 h-full">{children}</div>
            {!isCreationPage && <QuickActionsRail />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Sales Module */}
                <Route path="/sales" element={<SalesListPage />} />
                <Route path="/sales/view/:id" element={<SalesDetailPage />} />
                <Route path="/sales/create" element={<ProtectedRoute><SalesCreatePage /></ProtectedRoute>} />
                <Route path="/sales-return" element={<ProtectedRoute><SalesReturnListPage /></ProtectedRoute>} />
                <Route path="/sales-return/create" element={<ProtectedRoute><SalesReturnCreatePage /></ProtectedRoute>} />

                <Route path="/customers" element={<ProtectedRoute><CustomersListPage /></ProtectedRoute>} />
                <Route path="/customers/new" element={<ProtectedRoute><CustomersNewPage /></ProtectedRoute>} />
                <Route path="/vendors" element={<ProtectedRoute><VendorsListPage /></ProtectedRoute>} />
                <Route path="/vendors/new" element={<ProtectedRoute><VendorsNewPage /></ProtectedRoute>} />

                <Route path="/items" element={<ProtectedRoute><ItemsListPage /></ProtectedRoute>} />
                <Route path="/items/new" element={<ProtectedRoute><NewItemPage /></ProtectedRoute>} />

                <Route path="/purchase" element={<ProtectedRoute><PurchaseListPage /></ProtectedRoute>} />
                <Route path="/purchase/view/:id" element={<PurchaseDetailPage />} />
                <Route path="/purchase/create" element={<PurchaseCreatePage />} />
                <Route path="/purchase-return" element={<ProtectedRoute><PurchaseReturnListPage /></ProtectedRoute>} />
                <Route path="/purchase-return/create" element={<ProtectedRoute><PurchaseReturnCreatePage /></ProtectedRoute>} />

                <Route path="/quotations" element={<ProtectedRoute><QuotationsListPage /></ProtectedRoute>} />
                <Route path="/quotations/create" element={<ProtectedRoute><QuotationCreatePage /></ProtectedRoute>} />

                {/* Vouchers Module */}
                <Route path="/vouchers" element={<VouchersListPage />} />
                <Route path="/vouchers/view/:id" element={<VoucherDetailPage />} />
                <Route path="/receipts/create" element={<ReceiptCreatePage />} />
                <Route path="/payments/create" element={<PaymentCreatePage />} />
                <Route path="/journals/create" element={<JournalCreatePage />} />

                {/* Sales Orders Module */}
                <Route path="/sales-orders" element={<SalesOrdersListPage />} />
                <Route path="/sales-orders/view/:id" element={<SalesOrderDetailPage />} />
                <Route path="/sales-orders/create" element={<SalesOrderCreatePage />} />

                {/* Purchase Orders Module */}
                <Route path="/purchase-orders/create" element={<PurchaseOrderCreatePage />} />

                {/* Reports Module */}
                <Route path="/reports" element={<ReportsDashboardPage />} />
                <Route path="/reports/ledger" element={<LedgerReportPage />} />
                <Route path="/reports/trial-balance" element={<TrialBalanceReportPage />} />
                <Route path="/reports/pl" element={<ProfitLossPage />} />
                <Route path="/reports/balance-sheet" element={<BalanceSheetPage />} />
                <Route path="/reports/sales-register" element={<SalesRegisterPage />} />
                <Route path="/reports/purchase-register" element={<PurchaseRegisterPage />} />
                <Route path="/reports/day-book" element={<DayBookPage />} />
                <Route path="/reports/party-aging" element={<PartyAgingReportPage />} />
                <Route path="/reports/stock-summary" element={<StockSummaryReportPage />} />
                {/* Fallback */}
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <h1 className="text-4xl font-bold text-muted-foreground/30">404</h1>
                    <p className="text-muted-foreground">The page you're looking for was not found or is still under construction.</p>
                  </div>
                } />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
