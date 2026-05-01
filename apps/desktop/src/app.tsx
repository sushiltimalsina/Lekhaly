// apps/desktop/src/app.tsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "@/lib/store/auth";

// Shell Components
import Sidebar from "@/components/app/sidebar";
import Topbar from "@/components/app/topbar";
import QuickActionsRail from "@/components/app/quick-actions";
import OfflineSyncBanner from "@/components/app/offline-sync-banner";
import CommandPalette from "@/components/app/command-palette";
import { cn } from "@/lib/utils";

// Auth Pages
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";

// Main Pages
import DashboardPage from "@/pages/dashboard";
import ComingSoonPage from "@/pages/coming-soon";
import IndexPage from "@/pages/index";

// Sales Module
import SalesListPage from "@/pages/sales/index";
import SalesDetailPage from "@/pages/sales/view";
import SalesCreatePage from "@/pages/sales/create";
import SalesReturnListPage from "@/pages/sales-return/index";
import SalesReturnCreatePage from "@/pages/sales-return/create";

// Customers & Vendors
import CustomersListPage from "@/pages/customers/index";
import CustomersNewPage from "@/pages/customers/new";
import VendorsListPage from "@/pages/vendors/index";
import VendorsNewPage from "@/pages/vendors/new";

// Items
import ItemsListPage from "@/pages/items/index";
import NewItemPage from "@/pages/items/new";

// Inventory
import InventoryDashboardPage from "@/pages/inventory/index";
import WarehousesPage from "@/pages/inventory/warehouses";
import StockAdjustPage from "@/pages/inventory/adjust";
import StockTransferPage from "@/pages/inventory/transfer";
import StockCountsPage from "@/pages/inventory/stock-counts/index";
import CreateStockCountPage from "@/pages/inventory/stock-counts/create";
import ViewStockCountPage from "@/pages/inventory/stock-counts/view";

// Purchase Module
import PurchaseListPage from "@/pages/purchase/index";
import PurchaseDetailPage from "@/pages/purchase/view";
import PurchaseCreatePage from "@/pages/purchase/create";
import PurchaseReturnListPage from "@/pages/purchase-return/index";
import PurchaseReturnCreatePage from "@/pages/purchase-return/create";

// Purchase Orders
import PurchaseOrdersListPage from "@/pages/purchase-orders/index";
import PurchaseOrderDetailPage from "@/pages/purchase-orders/view";
import PurchaseOrderCreatePage from "@/pages/purchase-orders/create";

// Quotations
import QuotationsListPage from "@/pages/quotations/index";
import QuotationDetailPage from "@/pages/quotations/view";
import QuotationCreatePage from "@/pages/quotations/create";

// Sales Orders
import SalesOrdersListPage from "@/pages/sales-orders/index";
import SalesOrderDetailPage from "@/pages/sales-orders/view";
import SalesOrderCreatePage from "@/pages/sales-orders/create";

// Vouchers
import VouchersListPage from "@/pages/vouchers/index";
import VoucherDetailPage from "@/pages/vouchers/view";

// Invoices, Receipts, Payments, Journals
import InvoicesListPage from "@/pages/invoices/index";
import ReceiptsListPage from "@/pages/receipts/index";
import ReceiptCreatePage from "@/pages/receipts/create";
import PaymentsListPage from "@/pages/payments/index";
import PaymentCreatePage from "@/pages/payments/create";
import JournalsListPage from "@/pages/journals/index";
import JournalCreatePage from "@/pages/journals/create";

// Contra
import ContraCreatePage from "@/pages/contras/create";

// Configuration & Settings
import CoaPage from "@/pages/coa";
import BanksPage from "@/pages/banks";
import UsersPage from "@/pages/users";
import ConfigurationPage from "@/pages/configuration";
import SettingsPage from "@/pages/settings";

// Reports
import ReportsDashboardPage from "@/pages/reports/index";
import BalanceSheetPage from "@/pages/reports/balance-sheet";
import CashFlowPage from "@/pages/reports/cash-flow";
import DayBookPage from "@/pages/reports/day-book";
import ExpensesDetailsPage from "@/pages/reports/expenses-details";
import LedgerReportPage from "@/pages/reports/ledger";
import OtherReportPage from "@/pages/reports/other";
import PartyAgingReportPage from "@/pages/reports/party-aging";
import PayableSummaryPage from "@/pages/reports/payable-summary";
import ProfitLossPage from "@/pages/reports/pl";
import PurchaseRegisterPage from "@/pages/reports/purchase-register";
import PurchaseReturnRegisterPage from "@/pages/reports/purchase-return-register";
import RatiosPage from "@/pages/reports/ratios";
import ReceivableSummaryPage from "@/pages/reports/receivable-summary";
import SalesRegisterPage from "@/pages/reports/sales-register";
import SalesReturnRegisterPage from "@/pages/reports/sales-return-register";
import StockLedgerPage from "@/pages/reports/stock-ledger";
import TaxSummaryPage from "@/pages/reports/tax-summary";
import TrialBalanceReportPage from "@/pages/reports/trial-balance";
import VatPage from "@/pages/reports/vat";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const isCreationPage = false;

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof window.setTimeout> | null = null;

    const resetIdleTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (!getToken()) return;

      timeoutId = window.setTimeout(() => {
        clearToken();
        navigate("/login");
      }, 30 * 60 * 1000);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    events.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
    };
  }, [navigate]);

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

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        {!isCreationPage && <Topbar />}
        <OfflineSyncBanner />
        <CommandPalette />

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
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/index" element={<IndexPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/coming-soon" element={<ComingSoonPage />} />

                {/* Sales Module */}
                <Route path="/sales" element={<SalesListPage />} />
                <Route path="/sales/view/:id" element={<SalesDetailPage />} />
                <Route path="/sales/create" element={<SalesCreatePage />} />
                <Route path="/sales-return" element={<SalesReturnListPage />} />
                <Route path="/sales-return/create" element={<SalesReturnCreatePage />} />

                {/* Customers & Vendors */}
                <Route path="/customers" element={<CustomersListPage />} />
                <Route path="/customers/new" element={<CustomersNewPage />} />
                <Route path="/vendors" element={<VendorsListPage />} />
                <Route path="/vendors/new" element={<VendorsNewPage />} />

                {/* Items */}
                <Route path="/items" element={<ItemsListPage />} />
                <Route path="/items/new" element={<NewItemPage />} />

                {/* Inventory */}
                <Route path="/inventory" element={<InventoryDashboardPage />} />
                <Route path="/inventory/warehouses" element={<WarehousesPage />} />
                <Route path="/inventory/adjust" element={<StockAdjustPage />} />
                <Route path="/inventory/transfer" element={<StockTransferPage />} />
                <Route path="/inventory/stock-counts" element={<StockCountsPage />} />
                <Route path="/inventory/stock-counts/create" element={<CreateStockCountPage />} />
                <Route path="/inventory/stock-counts/view/:id" element={<ViewStockCountPage />} />

                {/* Purchase Module */}
                <Route path="/purchase" element={<PurchaseListPage />} />
                <Route path="/purchase/view/:id" element={<PurchaseDetailPage />} />
                <Route path="/purchase/create" element={<PurchaseCreatePage />} />
                <Route path="/purchase-return" element={<PurchaseReturnListPage />} />
                <Route path="/purchase-return/create" element={<PurchaseReturnCreatePage />} />

                {/* Purchase Orders */}
                <Route path="/purchase-orders" element={<PurchaseOrdersListPage />} />
                <Route path="/purchase-orders/view/:id" element={<PurchaseOrderDetailPage />} />
                <Route path="/purchase-orders/create" element={<PurchaseOrderCreatePage />} />

                {/* Quotations */}
                <Route path="/quotations" element={<QuotationsListPage />} />
                <Route path="/quotations/view/:id" element={<QuotationDetailPage />} />
                <Route path="/quotations/create" element={<QuotationCreatePage />} />

                {/* Sales Orders */}
                <Route path="/sales-orders" element={<SalesOrdersListPage />} />
                <Route path="/sales-orders/view/:id" element={<SalesOrderDetailPage />} />
                <Route path="/sales-orders/create" element={<SalesOrderCreatePage />} />

                {/* Vouchers */}
                <Route path="/vouchers" element={<VouchersListPage />} />
                <Route path="/vouchers/view/:id" element={<VoucherDetailPage />} />

                {/* Invoices, Receipts, Payments, Journals */}
                <Route path="/invoices" element={<InvoicesListPage />} />
                <Route path="/receipts" element={<ReceiptsListPage />} />
                <Route path="/receipts/create" element={<ReceiptCreatePage />} />
                <Route path="/payments" element={<PaymentsListPage />} />
                <Route path="/payments/create" element={<PaymentCreatePage />} />
                <Route path="/journals" element={<JournalsListPage />} />
                <Route path="/journals/create" element={<JournalCreatePage />} />
                <Route path="/contras/create" element={<ContraCreatePage />} />

                {/* Configuration & Settings */}
                <Route path="/coa" element={<CoaPage />} />
                <Route path="/banks" element={<BanksPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/configuration" element={<ConfigurationPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Reports */}
                <Route path="/reports" element={<ReportsDashboardPage />} />
                <Route path="/reports/balance-sheet" element={<BalanceSheetPage />} />
                <Route path="/reports/cash-flow" element={<CashFlowPage />} />
                <Route path="/reports/day-book" element={<DayBookPage />} />
                <Route path="/reports/expenses-details" element={<ExpensesDetailsPage />} />
                <Route path="/reports/ledger" element={<LedgerReportPage />} />
                <Route path="/reports/other" element={<OtherReportPage />} />
                <Route path="/reports/party-aging" element={<PartyAgingReportPage />} />
                <Route path="/reports/payable-summary" element={<PayableSummaryPage />} />
                <Route path="/reports/pl" element={<ProfitLossPage />} />
                <Route path="/reports/purchase-register" element={<PurchaseRegisterPage />} />
                <Route path="/reports/purchase-return-register" element={<PurchaseReturnRegisterPage />} />
                <Route path="/reports/ratios" element={<RatiosPage />} />
                <Route path="/reports/receivable-summary" element={<ReceivableSummaryPage />} />
                <Route path="/reports/sales-register" element={<SalesRegisterPage />} />
                <Route path="/reports/sales-return-register" element={<SalesReturnRegisterPage />} />
                <Route path="/reports/stock-ledger" element={<StockLedgerPage />} />
                <Route path="/reports/tax-summary" element={<TaxSummaryPage />} />
                <Route path="/reports/trial-balance" element={<TrialBalanceReportPage />} />
                <Route path="/reports/vat" element={<VatPage />} />

                {/* Fallback */}
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <h1 className="text-4xl font-bold text-muted-foreground/30">404</h1>
                    <p className="text-muted-foreground">The page you are looking for was not found or is still under construction.</p>
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
