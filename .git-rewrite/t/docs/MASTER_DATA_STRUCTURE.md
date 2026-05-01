# Default Master Data Structure

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEW USER REGISTRATION                        │
│                    POST /auth/register                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CREATE COMPANY & USER                           │
│  • Company created with code, name, settings                     │
│  • Admin, Accountant, Sales, Viewer roles created                │
│  • User created and assigned Admin role                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CREATE DEFAULT MASTER DATA                          │
│              (createDefaultMasterData method)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │ CHART OF     │  │   TAX    │  │    BILL      │
    │  ACCOUNTS    │  │  CODES   │  │  SUNDRIES    │
    └──────────────┘  └──────────┘  └──────────────┘
```

## Chart of Accounts Structure

```
ASSETS (1000 series)
├── 1010 - Cash in Hand
├── 1020 - Bank
├── 1100 - Accounts Receivable
├── 1110 - VAT Receivable
└── 1200 - Inventory

LIABILITIES (2000 series)
├── 2000 - Accounts Payable
└── 2100 - VAT Payable

EQUITY (3000 series)
└── 3000 - Owner's Capital

INCOME (4000 series)
├── 4000 - Sales
├── 4100 - Discount Given
└── 4200 - Shipping & Handling Income

EXPENSES (5000 series)
├── 5000 - Cost of Goods Sold
├── 5100 - Discount Received
└── 5200 - Shipping & Handling Expense
```

## Tax Codes Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        TAX CODES                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  VAT 13%                                                     │
│  ├── Rate: 13.0%                                            │
│  ├── Type: Non-inclusive                                    │
│  ├── Input Tax Account: VAT Receivable (1110)              │
│  └── Output Tax Account: VAT Payable (2100)                │
│                                                              │
│  Digital Service Tax (DST) 2%                               │
│  ├── Rate: 2.0%                                             │
│  ├── Type: Non-inclusive                                    │
│  ├── Input Tax Account: VAT Receivable (1110)              │
│  └── Output Tax Account: VAT Payable (2100)                │
│                                                              │
│  Excise Duty                                                │
│  ├── Rate: 0.0%                                             │
│  ├── Type: Non-inclusive                                    │
│  ├── Input Tax Account: VAT Receivable (1110)              │
│  └── Output Tax Account: VAT Payable (2100)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Bill Sundries Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      BILL SUNDRIES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Discount                                                    │
│  ├── Type: LESS (deduction)                                 │
│  ├── Default Rate: 0%                                       │
│  ├── Account: Discount Given (4100)                         │
│  └── Usage: Reduce invoice total                            │
│                                                              │
│  Shipping & Handling                                        │
│  ├── Type: ADD (addition)                                   │
│  ├── Default Rate: 0%                                       │
│  ├── Account: Shipping & Handling Income (4200)            │
│  └── Usage: Add shipping charges                            │
│                                                              │
│  Packaging Charges                                          │
│  ├── Type: ADD (addition)                                   │
│  ├── Default Rate: 0%                                       │
│  ├── Account: Shipping & Handling Income (4200)            │
│  └── Usage: Add packaging fees                              │
│                                                              │
│  Insurance                                                   │
│  ├── Type: ADD (addition)                                   │
│  ├── Default Rate: 0%                                       │
│  ├── Account: Shipping & Handling Income (4200)            │
│  └── Usage: Add insurance costs                             │
│                                                              │
│  Round Off                                                   │
│  ├── Type: ADD (addition)                                   │
│  ├── Default Rate: 0%                                       │
│  ├── Account: Sales (4000)                                  │
│  └── Usage: Handle fractional amounts                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Invoice Calculation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    INVOICE CALCULATION                       │
└─────────────────────────────────────────────────────────────┘

Step 1: Calculate Item Subtotal
┌──────────────────────────────────────┐
│  Item 1: Qty 10 × Rate Rs. 100      │
│  = Rs. 1,000                         │
│                                      │
│  Item 2: Qty 5 × Rate Rs. 200       │
│  = Rs. 1,000                         │
│                                      │
│  SUBTOTAL = Rs. 2,000                │
└──────────────────────────────────────┘
                 │
                 ▼
Step 2: Apply Bill Sundries (Discount)
┌──────────────────────────────────────┐
│  Discount: 10% of Rs. 2,000          │
│  = Rs. 200 (LESS)                    │
│                                      │
│  SUBTOTAL AFTER DISCOUNT = Rs. 1,800 │
└──────────────────────────────────────┘
                 │
                 ▼
Step 3: Apply Bill Sundries (Additions)
┌──────────────────────────────────────┐
│  Shipping & Handling: Rs. 100 (ADD)  │
│  Packaging: Rs. 50 (ADD)             │
│                                      │
│  SUBTOTAL = Rs. 1,950                │
└──────────────────────────────────────┘
                 │
                 ▼
Step 4: Calculate Tax (VAT 13%)
┌──────────────────────────────────────┐
│  VAT 13% on Rs. 1,950                │
│  = Rs. 253.50                        │
│                                      │
│  TOTAL = Rs. 2,203.50                │
└──────────────────────────────────────┘
                 │
                 ▼
Step 5: Apply Round Off (if needed)
┌──────────────────────────────────────┐
│  Round Off: Rs. 0.50 (ADD)           │
│                                      │
│  FINAL TOTAL = Rs. 2,204.00          │
└──────────────────────────────────────┘
```

## Database Relationships

```
┌──────────────┐
│   Company    │
└──────┬───────┘
       │
       ├─────────────────────────────────────────┐
       │                                         │
       ▼                                         ▼
┌──────────────┐                        ┌──────────────┐
│ BillSundry   │                        │   TaxCode    │
├──────────────┤                        ├──────────────┤
│ id           │                        │ id           │
│ companyId    │                        │ companyId    │
│ name         │                        │ name         │
│ type         │◄───────┐               │ rate         │
│ rate         │        │               │ isInclusive  │
│ accountId    │────┐   │               │ inputAcctId  │──┐
│ isActive     │    │   │               │ outputAcctId │──┤
└──────────────┘    │   │               └──────────────┘  │
                    │   │                                 │
                    │   │                                 │
                    ▼   │                                 ▼
            ┌──────────────┐                    ┌──────────────┐
            │ ChartOfAcct  │                    │ ChartOfAcct  │
            ├──────────────┤                    ├──────────────┤
            │ id           │                    │ id           │
            │ companyId    │                    │ companyId    │
            │ code         │                    │ code         │
            │ name         │                    │ name         │
            │ type         │                    │ type         │
            └──────────────┘                    └──────────────┘
                    │
                    │
                    └───────────────────┐
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ InvoiceSundry    │
                              ├──────────────────┤
                              │ id               │
                              │ invoiceId        │
                              │ billSundryId     │
                              │ name             │
                              │ type             │
                              │ rate             │
                              │ amount           │
                              │ accountId        │
                              └──────────────────┘
```

## Transaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│              REGISTRATION TRANSACTION                        │
│                (All or Nothing)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BEGIN TRANSACTION                                           │
│    │                                                         │
│    ├─► Ensure Permissions                                   │
│    │                                                         │
│    ├─► Create Company                                       │
│    │                                                         │
│    ├─► Create Roles (Admin, Accountant, Sales, Viewer)     │
│    │                                                         │
│    ├─► Assign Permissions to Roles                          │
│    │                                                         │
│    ├─► Create User                                          │
│    │                                                         │
│    ├─► Assign Admin Role to User                            │
│    │                                                         │
│    ├─► Create Default Master Data                           │
│    │   │                                                     │
│    │   ├─► Create Chart of Accounts (15 accounts)          │
│    │   │                                                     │
│    │   ├─► Create Tax Codes (3 codes)                       │
│    │   │                                                     │
│    │   ├─► Create Bill Sundries (5 sundries)               │
│    │   │                                                     │
│    │   └─► Create Default Party (Walk-in Customer)         │
│    │                                                         │
│  COMMIT TRANSACTION                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

```
Authentication
├── POST /auth/register          → Creates company with defaults
└── POST /auth/login             → Login to company

Tax Codes
├── GET    /taxes                → List all tax codes
├── GET    /taxes/:id            → Get specific tax code
├── POST   /taxes                → Create new tax code
├── PUT    /taxes/:id            → Update tax code
└── DELETE /taxes/:id            → Delete tax code

Bill Sundries
├── GET    /bill-sundries        → List all bill sundries
├── GET    /bill-sundries/:id    → Get specific sundry
├── POST   /bill-sundries        → Create new sundry
├── PUT    /bill-sundries/:id    → Update sundry
└── DELETE /bill-sundries/:id    → Soft delete sundry

Chart of Accounts
├── GET    /accounts             → List all accounts
├── GET    /accounts/:id         → Get specific account
├── POST   /accounts             → Create new account
├── PUT    /accounts/:id         → Update account
└── DELETE /accounts/:id         → Delete account
```
