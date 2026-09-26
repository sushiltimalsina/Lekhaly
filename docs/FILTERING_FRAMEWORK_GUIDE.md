# Lekhaly System-Wide Filtering Framework

The `AdvancedFilterBar` framework is the unified, configuration-driven filtering infrastructure across the entire **Lekhaly Accounting & ERP System**.

---

## Core Principles
1. **Single Reusable Component**: Zero duplicated filter UI components per accounting module.
2. **Page-Specific Declarative Configuration**: Pages pass a `config` object defining search, date ranges, primary/secondary filters, columns, theme, and optional action slots.
3. **No Hardcoded "Run Report" Button**: Automatic reactive filtering on change. Optional page action buttons (e.g. Export, Print, Generate Report) are injected via the `actions` slot.
4. **100% Backward Compatibility**: Existing pages passing legacy flat props continue working without breaking changes.

---

## System Configuration Examples

### 1. Sales Invoice List Page
```tsx
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

export default function SalesInvoiceList() {
    const [filterState, setFilterState] = useState({});

    return (
        <AdvancedFilterBar
            config={{
                theme: { accentColor: "emerald" },
                search: { placeholder: "Search invoice number, customer..." },
                dateRange: { enabled: true, defaultRange: "this_month" },
                filters: [
                    { key: "status", label: "Status", type: "select", options: [
                        { value: "draft", label: "Draft" },
                        { value: "posted", label: "Posted" },
                        { value: "cancelled", label: "Cancelled" }
                    ]},
                    { key: "paymentStatus", label: "Payment", type: "select", options: [
                        { value: "unpaid", label: "Unpaid" },
                        { value: "partially_paid", label: "Partially Paid" },
                        { value: "paid", label: "Paid" }
                    ]},
                    { key: "warehouse", label: "Warehouse", priority: "secondary", type: "select", options: warehouses },
                    { key: "amount", label: "Invoice Amount", priority: "secondary", type: "amount-range" }
                ],
                columns: [
                    { key: "invoiceNo", label: "Invoice No", locked: true },
                    { key: "voucherDate", label: "Date" },
                    { key: "partyName", label: "Customer" },
                    { key: "totalAmount", label: "Total Amount" },
                    { key: "status", label: "Status" }
                ]
            }}
            onChange={(state) => setFilterState(state)}
            actions={
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                    <Plus className="mr-2 h-4 w-4" /> New Invoice
                </Button>
            }
        />
    );
}
```

---

### 2. Purchase Order List Page
```tsx
<AdvancedFilterBar
    config={{
        theme: { accentColor: "orange" },
        search: { placeholder: "Search PO number, supplier..." },
        dateRange: { enabled: true, defaultRange: "this_quarter" },
        filters: [
            { key: "party", label: "Supplier", type: "select", options: supplierOptions },
            { key: "status", label: "Status", type: "select", options: [
                { value: "open", label: "Open" },
                { value: "received", label: "Received" },
                { value: "closed", label: "Closed" }
            ]},
            { key: "warehouse", label: "Warehouse", priority: "secondary", type: "select", options: warehouseOptions }
        ]
    }}
    onChange={handleFilterChange}
/>
```

---

### 3. Sales Register (With Year Comparison & Export Actions)
```tsx
<AdvancedFilterBar
    config={{
        theme: { accentColor: "indigo" },
        search: { placeholder: "Search register entries..." },
        dateRange: { enabled: true, defaultRange: "this_year", allowComparison: true },
        filters: [
            { key: "customer", label: "Customer", type: "select", options: customerOptions },
            { key: "salesperson", label: "Salesperson", priority: "secondary", type: "select", options: salesPersonOptions },
            { key: "taxStatus", label: "Tax Category", priority: "secondary", type: "select", options: taxOptions }
        ]
    }}
    onChange={handleRegisterFilter}
    actions={
        <>
            <Button variant="outline" onClick={handleExportCSV}>Export CSV</Button>
            <Button variant="outline" onClick={handlePrint}>Print</Button>
        </>
    }
/>
```

---

### 4. Party Aging Report
```tsx
<AdvancedFilterBar
    config={{
        theme: { accentColor: "violet" },
        search: { placeholder: "Search party name..." },
        dateRange: { enabled: true, defaultRange: "today", label: "As of Date" },
        filters: [
            { key: "partyType", label: "Type", type: "select", options: [
                { value: "customer", label: "Customers (Receivables)" },
                { value: "vendor", label: "Suppliers (Payables)" }
            ]},
            { key: "agingBucket", label: "Aging Bucket", priority: "secondary", type: "select", options: [
                { value: "0_30", label: "0-30 Days" },
                { value: "31_60", label: "31-60 Days" },
                { value: "61_90", label: "61-90 Days" },
                { value: "90_plus", label: "90+ Days" }
            ]}
        ]
    }}
    onChange={handleAgingFilter}
/>
```

---

### 5. Stock Aging & Valuation
```tsx
<AdvancedFilterBar
    config={{
        theme: { accentColor: "sky" },
        search: { placeholder: "Search item code or name..." },
        dateRange: { enabled: true, defaultRange: "this_month" },
        filters: [
            { key: "warehouse", label: "Warehouse", type: "select", options: warehouseOptions },
            { key: "category", label: "Category", type: "select", options: categoryOptions },
            { key: "stockValue", label: "Stock Value", priority: "secondary", type: "amount-range" }
        ]
    }}
    onChange={handleStockFilter}
/>
```

---

### 6. Simple Master List (Customers / Suppliers / Accounts)
```tsx
<AdvancedFilterBar
    config={{
        theme: { accentColor: "slate" },
        search: { placeholder: "Search customer name, phone, VAT..." },
        dateRange: { enabled: false }, // Master list doesn't require date range
        filters: [
            { key: "category", label: "Group/Category", type: "select", options: partyCategories },
            { key: "status", label: "Status", type: "select", options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
            ]}
        ]
    }}
    onChange={handleMasterFilter}
/>
```
