# Default VAT, Discount & Sundries Setup

## Overview
This document explains how default VAT, Discount, and other Bill Sundries are automatically created for new users in the Lekhaly accounting system.

## What Gets Created Automatically

When a new company is registered (via the `/auth/register` endpoint), the system automatically creates:

### 1. **Chart of Accounts (COA)**
The following accounts are created by default:

#### Assets (1000 series)
- `1010` - Cash in Hand
- `1020` - Bank
- `1100` - Accounts Receivable
- `1110` - VAT Receivable
- `1200` - Inventory

#### Liabilities (2000 series)
- `2000` - Accounts Payable
- `2100` - VAT Payable

#### Equity (3000 series)
- `3000` - Owner's Capital

#### Income (4000 series)
- `4000` - Sales
- `4100` - Discount Given
- `4200` - Shipping & Handling Income

#### Expenses (5000 series)
- `5000` - Cost of Goods Sold
- `5100` - Discount Received
- `5200` - Shipping & Handling Expense

### 2. **Tax Codes**
The following tax codes are created:

| Tax Code | Rate | Type | Input Account | Output Account |
|----------|------|------|---------------|----------------|
| VAT 13% | 13.0% | Non-inclusive | VAT Receivable | VAT Payable |
| Digital Service Tax (DST) 2% | 2.0% | Non-inclusive | VAT Receivable | VAT Payable |
| Excise Duty | 0.0% | Non-inclusive | VAT Receivable | VAT Payable |

### 3. **Bill Sundries**
The following bill sundries are created for invoices:

| Name | Type | Default Rate | Account |
|------|------|--------------|---------|
| **Discount** | Less (Deduction) | 0% | Discount Given |
| **Shipping & Handling** | Add (Addition) | 0% | Shipping & Handling Income |
| **Packaging Charges** | Add (Addition) | 0% | Shipping & Handling Income |
| **Insurance** | Add (Addition) | 0% | Shipping & Handling Income |
| **Round Off** | Add (Addition) | 0% | Sales |

### 4. **Default Party**
- **Walk-in Customer** (Customer type)

## Implementation Details

### Location of Code
The default data creation logic is implemented in two places:

1. **Registration Flow** (`apps/api/src/modules/auth/auth.service.ts`)
   - Method: `createDefaultMasterData()`
   - Called during: User registration via `/auth/register`

2. **Seed Script** (`apps/api/prisma/seed.ts`)
   - Function: `createDemoCompany()`
   - Called during: Database seeding for demo/development

### How It Works

When a new user registers:

```typescript
// 1. Company is created
const company = await tx.company.create({ ... });

// 2. Roles and permissions are set up
const [adminRole, accountantRole, salesRole, viewerRole] = await Promise.all([...]);

// 3. User is created and assigned Admin role
const user = await tx.user.create({ ... });

// 4. Default master data is created
await this.createDefaultMasterData(tx, company.id);
```

The `createDefaultMasterData()` method:
1. Creates all default Chart of Accounts
2. Creates Tax Codes (VAT 13%, DST 2%, etc.)
3. Creates Bill Sundries (Discount, Shipping, etc.)
4. Creates default Walk-in Customer party

All of this happens in a **single database transaction**, ensuring data consistency.

## Usage in Invoices

### Using VAT
When creating a sales or purchase invoice:

```typescript
// The VAT 13% tax code is automatically available
const vat13 = await taxCodes.find(tc => tc.name === "VAT 13%");

// Apply to invoice items
invoiceItem.taxCodeId = vat13.id;
```

### Using Discount
When creating an invoice with discount:

```typescript
// The Discount sundry is automatically available
const discount = await billSundries.find(bs => bs.name === "Discount");

// Apply to invoice
invoiceSundry.billSundryId = discount.id;
invoiceSundry.type = "less";
invoiceSundry.amount = 100; // Rs. 100 discount
```

### Using Shipping & Handling
```typescript
// The Shipping & Handling sundry is automatically available
const shipping = await billSundries.find(bs => bs.name === "Shipping & Handling");

// Apply to invoice
invoiceSundry.billSundryId = shipping.id;
invoiceSundry.type = "add";
invoiceSundry.amount = 50; // Rs. 50 shipping charge
```

## Customization

Users can customize these defaults after registration:

### Adding New Tax Codes
Navigate to: **Settings → Tax Codes → Add New**

### Adding New Bill Sundries
Navigate to: **Settings → Bill Sundries → Add New**

### Modifying Chart of Accounts
Navigate to: **Settings → Chart of Accounts**

## Database Schema

### BillSundry Table
```prisma
model BillSundry {
  id        String   @id @default(uuid())
  companyId String
  name      String
  type      String   @default("add") // "add" | "less"
  rate      Decimal? @db.Decimal(10, 2)
  accountId String?
  account   ChartOfAccount? @relation(...)
  isActive  Boolean  @default(true)
  
  @@unique([companyId, name])
}
```

### TaxCode Table
```prisma
model TaxCode {
  id                 String  @id @default(uuid())
  companyId          String
  name               String
  rate               Decimal @db.Decimal(10, 2)
  isInclusive        Boolean @default(false)
  inputTaxAccountId  String?
  outputTaxAccountId String?
  isActive           Boolean @default(true)
}
```

## Testing

To test the default data creation:

1. **Register a new company:**
   ```bash
   POST /auth/register
   {
     "companyCode": "TEST001",
     "companyName": "Test Company",
     "name": "Admin User",
     "email": "admin@test.com",
     "password": "SecurePass123!"
   }
   ```

2. **Verify Tax Codes:**
   ```bash
   GET /taxes
   ```
   Should return VAT 13%, DST 2%, and Excise Duty

3. **Verify Bill Sundries:**
   ```bash
   GET /bill-sundries
   ```
   Should return Discount, Shipping & Handling, Packaging Charges, Insurance, and Round Off

4. **Verify Chart of Accounts:**
   ```bash
   GET /accounts
   ```
   Should return all default accounts (1010, 1020, 1100, etc.)

## Benefits

✅ **Immediate Productivity**: Users can start creating invoices right away without setup
✅ **Nepal Tax Compliance**: VAT 13% is pre-configured per Nepal tax regulations
✅ **Common Use Cases**: Discount and shipping are ready to use
✅ **Consistent Structure**: All companies start with the same baseline
✅ **Extensible**: Users can add more tax codes and sundries as needed

## Notes

- All rates are set to 0 by default for bill sundries (except VAT which is 13%)
- Users can modify rates when applying sundries to invoices
- The "Round Off" sundry is useful for handling fractional currency amounts
- All default data respects the company isolation (multi-tenant architecture)
