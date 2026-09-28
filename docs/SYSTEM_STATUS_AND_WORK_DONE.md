# Lekhaly - Exhaustive System Status, Architecture & Master Work Report

**Document Version:** 2.0.0 (Master Exhaustive Edition)  
**Last Updated:** September 2026  
**Repository:** `sushiltimalsina/Lekhaly`  
**File Location:** `docs/SYSTEM_STATUS_AND_WORK_DONE.md`

---

## 1. High-Level Executive Summary

**Lekhaly** is an enterprise-grade, Nepal-first ERP, Double-Entry Accounting, and Inventory Management platform. It is engineered as a Turborepo monorepo supporting **Multi-Tenancy**, the **Bikram Sambat (BS)** calendar system, **13% Nepal VAT Compliance (IRD)**, and an **Offline-First Desktop / Web architecture**.

### System Architecture Overview

```
                               ┌─────────────────────────────────────────────────────────┐
                               │                    Lekhaly Monorepo                     │
                               │              (Turborepo + pnpm workspaces)              │
                               └────────────────────────────┬────────────────────────────┘
                                                            │
                 ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
                 │                                          │                                          │
      ┌──────────▼──────────┐                    ┌──────────▼──────────┐                    ┌──────────▼──────────┐
      │     apps/web        │                    │    apps/desktop     │                    │      apps/api       │
      │   Next.js 15 App    │                    │     Tauri + Vite    │                    │   NestJS REST API   │
      │   (React 19 + TW)   │                    │   (React Router)    │                    │ (Prisma + Postgres) │
      └──────────┬──────────┘                    └──────────┬──────────┘                    └──────────┬──────────┘
                 │                                          │                                          │
                 └──────────────────────────┬───────────────┴──────────────────────────────────────────┘
                                            │ Shared Internal Packages
                ┌───────────────────────────┼───────────────────────────┐
                │                           │                           │
      ┌─────────▼─────────┐       ┌─────────▼─────────┐       ┌─────────▼─────────┐
      │  packages/schemas │       │    packages/ui    │       │  packages/utils   │
      │   (Zod Schemas)   │       │  (UI Components)  │       │ (BS/AD Dates+Math)│
      └───────────────────┘       └───────────────────┘       └───────────────────┘
```

---

## 2. Complete Database & Domain Entity Schema (`@lekhaly/db`)

The backend database contains **38 Prisma Models & Enums** fully migrated in PostgreSQL:

### Core Enums
- **`CoaType`**: `asset`, `liability`, `equity`, `income`, `expense`
- **`VoucherType`**: `sales_invoice`, `sales_return`, `purchase`, `purchase_return`, `receipt`, `payment`, `journal`, `opening`, `reversal`, `contra`
- **`VoucherStatus`**: `draft`, `pending_post`, `posted`, `void`
- **`PartyType`**: `customer`, `supplier`, `both`
- **`ItemType`**: `goods`, `services`
- **`AuditActorType`**: `user`, `system`, `sync`, `api_client`, `ai_client`
- **`OutboxStatus`**: `pending`, `processed`, `failed`
- **`PdfJobStatus`**: `pending`, `processing`, `done`, `failed`

### Database Entities Breakdown
1. **Company Profile & Configuration (`Company`):**
   - Base currency (`NPR`), Timezone (`Asia/Kathmandu`), Fiscal Year Start Month (Month 4 / Baisakh).
   - Nepal PAN & VAT numbers, Registered Address, Phone, Email, Logo printing flag.
   - Dynamic document prefixes & FY suffixes: `invoicePrefix` (`SI`), `purchasePrefix` (`PURI`), `salesReturnPrefix` (`SR`), `purchaseReturnPrefix` (`PR`), `orderPrefix` (`SO`), `quotationPrefix` (`QT`), `purchaseOrderPrefix` (`PO`), `receiptPrefix` (`RV`), `paymentPrefix` (`PV`), `journalPrefix` (`JV`), `contraPrefix` (`CV`), default suffix `80/81`.
   - Atomic sequence counters: `nextInvoiceNumber`, `nextPurchaseNumber`, `nextReceiptNumber`, etc.
   - Lock date control to freeze historical fiscal periods.

2. **Security & RBAC (`User`, `Role`, `RolePermission`, `UserStatus`):**
   - Argon2/Bcrypt password hashing, JWT Access/Refresh tokens.
   - TOTP 2-Factor Authentication (`totpSecretEnc`, recovery codes).
   - Granular RBAC permissions (`Admin`, `Accountant`, `Sales`, `Inventory`, `Viewer`).

3. **Chart of Accounts (`ChartOfAccount`):**
   - Hierarchical account structure (Assets, Liabilities, Equity, Income, Expenses).
   - Automatic seeding of 15 default accounts (Cash, Bank, A/R, A/P, VAT Receivable, VAT Payable, Sales, COGS, Discounts, Shipping, Round Off, Owner's Capital).

4. **Voucher & Double-Entry Ledger (`Voucher`, `VoucherLine`, `VoucherAttachment`):**
   - Atomic multi-line vouchers enforcing $\sum \text{Debit} = \sum \text{Credit}$.
   - Full support for Payment, Receipt, Journal, Contra, Sales Invoice, Purchase Invoice, and Returns.

5. **Sales Pipeline (`Quotation`, `SalesOrder`, `Invoice`, `ProformaInvoice`):**
   - Quotation / Estimate with expiry tracking and 1-tap conversion to Order / Invoice.
   - Sales Orders with line items, fulfillment tracking, and stock reservations.
   - Tax Invoices with line items (`InvoiceLine`), tax codes (`TaxCode`), discounts, and bill sundries (`InvoiceSundry`).
   - Proforma Invoices with device-specific numbering (`PRF-D1-0001`).

6. **Procurement Pipeline (`PurchaseOrder`, `Invoice`, `Voucher`):**
   - Purchase Orders with supplier terms and expected arrival dates.
   - Purchase Invoices linking to supplier PAN/VAT and calculating input VAT credits.
   - Purchase Returns (Debit Notes) adjusting supplier ledgers and inventory.

7. **Inventory & Multi-Warehouse (`Item`, `ItemGroup`, `Unit`, `Warehouse`, `WarehouseBin`, `StockLedger`, `StockCount`, `ItemComponent`, `SerialNumber`, `InventorySettings`, `LandedCostAllocation`):**
   - Physical Goods vs. Non-stock Services.
   - Multi-godown tracking, Stock Adjustments, Inter-warehouse Transfers.
   - Bill of Materials (BOM) / Assembly Orders (`ItemComponent`).
   - Physical Stock Count audits with automated variance journal entries.
   - Batch & Lot tracking with Expiry Dates.
   - Inward Goods Receipt Notes (GRN) and Outward Stock Dispatches.

8. **Parties & CRM (`Party`):**
   - Customer and Supplier master with PAN/VAT, addresses, credit limits, opening balances, and contact persons.

9. **Taxation & Bill Sundries (`TaxCode`, `BillSundry`, `VatRegisterLine`):**
   - Pre-configured: Nepal VAT 13%, Digital Service Tax 2%, Excise Duty 0%.
   - Pre-configured Bill Sundries: Discount (Less), Shipping (Add), Packaging (Add), Insurance (Add), Round Off (Add).
   - Detailed VAT Register recording taxable sales/purchases, tax-exempt transactions, and VAT amounts.

10. **Banking & Reconciliation (`BankAccount`, `BankStatement`, `BankStatementLine`):**
    - Bank accounts linked to Asset Ledgers.
    - Statement import headers and line-by-line reconciliation with posted vouchers.

11. **Fiscal Sessions & Cash Register (`FiscalSession`):**
    - Cash drawer opening balance, active session tracking, cash drop, and end-of-day closing counts.

12. **Device Management & Offline Sync (`Device`, `DeviceUserLink`, `SyncState`, `OutboxEvent`, `ApiIdempotency`):**
    - Device pairing, trusted status, proforma sequence counters, idempotency keys, outbox events for background worker sync.

13. **Audit Trail & System Jobs (`AuditLog`, `AuditSnapshot`, `PdfJob`, `ChangeLog`):**
    - Full entity audit logging with before/after JSON snapshots.
    - Background PDF rendering queue.

---

## 3. Backend REST API (`apps/api`) - 31 Modules Breakdown

Built with **NestJS**, **Prisma**, and **PostgreSQL**:

| # | Module | Key Controller Endpoints & Capabilities |
| :-: | :--- | :--- |
| 1 | **`auth`** | `POST /auth/login`, `POST /auth/register` (with auto master-data creation), `POST /auth/refresh`, `POST /auth/2fa/setup`, `POST /auth/2fa/verify`, `POST /auth/logout-all`. |
| 2 | **`users`** | `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`, User status toggle. |
| 3 | **`roles`** | `GET /roles`, `POST /roles`, `PATCH /roles/:id`, Granular permission assignment. |
| 4 | **`accounts`** | `GET /accounts` (COA tree/flat), `POST /accounts`, `PATCH /accounts/:id`, `GET /accounts/:id/ledger`. |
| 5 | **`vouchers`** | `GET /vouchers`, `POST /vouchers` (Receipt/Payment/Journal/Contra), `GET /vouchers/:id`, `POST /vouchers/:id/post`, `POST /vouchers/:id/void`. |
| 6 | **`invoices`** | `GET /invoices`, `POST /invoices` (Sales/Purchase/Returns), `GET /invoices/:id`, `POST /invoices/:id/void`, Full tax & sundry calculation. |
| 7 | **`quotations`** | `GET /quotations`, `POST /quotations`, `GET /quotations/:id`, `POST /quotations/:id/convert`. |
| 8 | **`sales-orders`** | `GET /sales-orders`, `POST /sales-orders`, `GET /sales-orders/:id`, `PATCH /sales-orders/:id/status`. |
| 9 | **`purchase-orders`**| `GET /purchase-orders`, `POST /purchase-orders`, `GET /purchase-orders/:id`, `POST /purchase-orders/:id/receive`. |
| 10 | **`proforma`** | `GET /proforma`, `POST /proforma`, Device offline proforma mapping. |
| 11 | **`parties`** | `GET /parties` (Filter by customer/supplier), `POST /parties`, `PATCH /parties/:id`, `GET /parties/:id/statement`. |
| 12 | **`items`** | `GET /items`, `POST /items`, `PATCH /items/:id`, `GET /items/:id/stock`, Barcode lookup. |
| 13 | **`item-groups`** | `GET /item-groups`, `POST /item-groups`, `PATCH /item-groups/:id`. |
| 14 | **`units`** | `GET /units` (Pcs, Kg, Box, Ltr, etc.), `POST /units`. |
| 15 | **`warehouses`** | `GET /warehouses`, `POST /warehouses`, `PATCH /warehouses/:id`, Multi-location stock. |
| 16 | **`inventory`** | Stock Adjustments, Transfers, Assemblies (BOM), Stock Counts, Goods Receipt (GRN), Dispatches, Reservations, Reorder alerts, Batch lots, Period close. |
| 17 | **`taxes`** | `GET /taxes`, `POST /taxes`, Tax Code management (VAT 13%, DST 2%, Excise). |
| 18 | **`bill-sundries`**| `GET /bill-sundries`, `POST /bill-sundries` (Discount, Shipping, Insurance, Packaging, Round off). |
| 19 | **`sale-types`** | `GET /sale-types`, `POST /sale-types` (Local Taxable, Export, Tax Exempt). |
| 20 | **`purchase-types`**| `GET /purchase-types`, `POST /purchase-types` (Local Taxable, Import, Exempt). |
| 21 | **`payment-methods`**| `GET /payment-methods` (Cash, Bank, Fonepay, Cheque, eSewa). |
| 22 | **`banking`** | Bank accounts, Bank statement upload, Line-by-line reconciliation matching. |
| 23 | **`fiscal-sessions`**| Cash drawer sessions: Open day, close day, cash drop, Z-Report totals. |
| 24 | **`expenses`** | Expense category management, Daily office expense vouchers. |
| 25 | **`reports`** | 21 Financial, tax, inventory, and ledger report computation engines. |
| 26 | **`devices`** | Device authorization, proforma prefix allocation (`PRF-D1`), pairing status. |
| 27 | **`sync`** | `POST /sync/reserve-number`, `POST /sync/push-outbox`, `GET /sync/delta`. |
| 28 | **`outbox`** | Background transaction queue for distributed/async event handling. |
| 29 | **`pdf`** | Headless PDF generation for Invoices, Vouchers, and Ledger statements. |
| 30 | **`audit`** | Before/after change diff logging with user/system attribution. |
| 31 | **`health`** | System health, database connection checks, uptime monitoring. |

---

## 4. Web Application (`apps/web`) - Complete Feature Set

Built with **Next.js 15 (App Router)**, **React 19**, and **Tailwind CSS**:

- **Authentication Flows:** Login, Register (with auto-provisioning), 2FA setup/verify, Session auto-refresh.
- **Executive Dashboard:** Live metrics (Today Sales, Cash in Hand, Bank Balances, Receivables, Payables), Profit & Loss graph, and Quick Action buttons.
- **Nepali Calendar Support:** **Bikram Sambat (BS)** date picker integrated across every transaction and report, with instant BS $\leftrightarrow$ AD synchronization.
- **Complete Sales Suite:** Invoices, Quotations, Sales Orders, Credit Notes (Returns), Multi-item grid with live VAT 13% and Bill Sundry calculations.
- **Complete Purchase Suite:** Purchase Orders, Invoices, Debit Notes (Returns).
- **Voucher Suite:** Payments, Receipts, General Journals, Contras with live debit/credit balancing verification.
- **Inventory Suite:** Items master, Multi-warehouse transfers, Stock adjustments, Stock count audits, Batch/expiry dates, Dispatches, Goods receipts.
- **CRM / Party Khata:** Customer & Vendor directories, party ledger statements, credit limit alerts.
- **Configuration & Settings:** Chart of Accounts tree, Banking portal, Users & Roles, Company profile, PAN/VAT, Theme settings (Light / Dark / System).

---

## 5. Desktop Application (`apps/desktop`) - Complete Feature Set

Built with **Tauri**, **Vite**, and **React Router DOM**:

- **100% Feature Parity (66 Pages):** All 66 pages from the web app were ported and adapted for React Router.
- **Offline-First Storage Engine (`client.ts`):**
  - Uses browser/Tauri **IndexedDB** (`lekhaly-offline-db` / `pending-api-requests`).
  - Detects network failure or offline state (`navigator.onLine === false`).
  - Automatically intercepts creations (Invoices, Vouchers, Orders) and saves them as local drafts.
- **Auto Background Replay Sync:**
  - Listens to network online events and automatically flushes and replays queued transactions to the backend in chronological sequence.
- **Desktop App Shell:**
  - Collapsible Sidebar & Header.
  - Offline Sync Status Banner with pending transaction counter.
  - Global Command Palette (`Ctrl+K` / `Cmd+K`).
  - Unsaved Form Changes Guard.
  - 30-Minute Idle Auto-Logout security lock.

---

## 6. Financial & Tax Reports Complete (21+ Reports)

| # | Report Name | Accounting Purpose & Key Metrics |
| :-: | :--- | :--- |
| 1 | **Balance Sheet** | Statement of Financial Position (Assets = Liabilities + Equity). |
| 2 | **Profit & Loss (P&L)** | Gross Profit, Operating Expenses, Operating Profit, Net Profit. |
| 3 | **Trial Balance** | Total Debit vs Total Credit ledger balance verification. |
| 4 | **Cash Flow Statement** | Operating, Investing, and Financing cash movements. |
| 5 | **General Ledger** | Transaction-level ledger with running balances for any account. |
| 6 | **Day Book** | Chronological record of all daily transactions. |
| 7 | **VAT Register** | Nepal IRD-compliant Sales & Purchase VAT register. |
| 8 | **Tax Summary** | Output VAT vs Input VAT and net VAT liability. |
| 9 | **Sales Register** | Item-by-item sales log with customer PAN and tax amounts. |
| 10 | **Purchase Register** | Inward purchase log with vendor PAN and input VAT claimed. |
| 11 | **Sales Return Register** | Credit notes log with reference invoice tracking. |
| 12 | **Purchase Return Register**| Debit notes log with supplier reference tracking. |
| 13 | **Stock Ledger** | Item-wise inward/outward quantity movements and unit valuations. |
| 14 | **Stock Valuation** | Total inventory value under FIFO / Weighted Average. |
| 15 | **Stock Aging** | Holding duration buckets (0-30, 31-60, 61-90, 90+ days). |
| 16 | **Party Aging (Receivables)**| Customer overdue debt recovery buckets. |
| 17 | **Party Aging (Payables)** | Supplier credit payout scheduling buckets. |
| 18 | **Receivable Summary** | Top debtor balances with credit limit warnings. |
| 19 | **Payable Summary** | Top creditor balances. |
| 20 | **Financial Ratios** | Current Ratio, Quick Ratio, Debt-to-Equity, Net Margin. |
| 21 | **Expense Details** | Breakdown of office expenses by category and payment method. |

---

## 7. Current System Gaps & Next Steps (To Reach 100% Production Readiness)

The following items represent the remaining 10–15% required for complete enterprise deployment:

1. **Missing Dedicated UIs (Backend exists, UI to be created):**
   - **Expenses & Petty Cash UI:** Dedicated `/expenses` page for logging daily office expenses.
   - **Cashier POS / Day-Close UI:** Dedicated screen for cash drawer opening and end-of-day Z-Report closing.
   - **Audit Trail UI:** Admin screen under Settings to inspect system change logs.
   - **Authorized Devices UI:** Screen under Settings to view and manage linked desktop/mobile devices.
2. **External Nepal Integrations (Currently Stubbed/Mock):**
   - **Digital Wallet & Dynamic QR:** Direct Fonepay / eSewa merchant API dynamic QR generation with webhook confirmations.
   - **Nepal Bank Statement Importer:** Parser for `.CSV` / `.OFX` bank statements from major Nepali banks (Nabil, NIC Asia, Global IME).
   - **Nepal IRD CBMS Sync:** Real-time billing transmission to the Inland Revenue Department portal.
   - **Direct SMS / WhatsApp Dispatch:** Automated invoice and payment reminder messaging (ताकेता).
3. **Desktop Native Hardware Integration:**
   - Native ESC/POS driver for 59mm / 80mm Bluetooth & USB thermal receipt printers.
   - Barcode label sticker generator for inventory items.
4. **Data Import & Migration Tools:**
   - Bulk Excel/CSV onboarding wizard for Chart of Accounts, Items, Customers, and Opening Balances.
