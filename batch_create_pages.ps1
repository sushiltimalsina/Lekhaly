$webRoot = "c:\Lekhaly\apps\web\src\app"
$desktopRoot = "c:\Lekhaly\apps\desktop\src\pages"

# Mapping from web paths to desktop paths
$mapping = @{
    "(app)/items/page.tsx" = "inventory/items.tsx"
    "(app)/items/new/page.tsx" = "inventory/items-new.tsx"
    "(app)/customers/page.tsx" = "crm/customers.tsx"
    "(app)/customers/new/page.tsx" = "crm/customers-new.tsx"
    "(app)/vendors/page.tsx" = "crm/vendors.tsx"
    "(app)/vendors/new/page.tsx" = "crm/vendors-new.tsx"
    "(app)/banks/page.tsx" = "banking/banks.tsx"
    "(app)/coa/page.tsx" = "accounting/coa.tsx"
    "(app)/invoices/page.tsx" = "transactions/invoices.tsx"
    "(app)/sales/page.tsx" = "transactions/sales.tsx"
    "(app)/sales/create/page.tsx" = "transactions/sales-create.tsx"
    "(app)/sales/[id]/page.tsx" = "transactions/sales-detail.tsx"
    "(app)/sales/view/page.tsx" = "transactions/sales-view.tsx"
    "(app)/sales/return/create/page.tsx" = "transactions/sales-return-create.tsx"
    "(app)/sales-return/page.tsx" = "transactions/sales-returns.tsx"
    "(app)/sales-return/create/page.tsx" = "transactions/sales-returns-create.tsx"
    "(app)/receipts/page.tsx" = "transactions/receipts.tsx"
    "(app)/receipts/create/page.tsx" = "transactions/receipts-create.tsx"
    "(app)/purchase/page.tsx" = "transactions/purchases.tsx"
    "(app)/purchase/create/page.tsx" = "transactions/purchases-create.tsx"
    "(app)/purchase/[id]/page.tsx" = "transactions/purchases-detail.tsx"
    "(app)/purchase-return/page.tsx" = "transactions/purchase-returns.tsx"
    "(app)/purchase-return/create/page.tsx" = "transactions/purchase-returns-create.tsx"
    "(app)/payments/page.tsx" = "transactions/payments.tsx"
    "(app)/payments/create/page.tsx" = "transactions/payments-create.tsx"
    "(app)/journals/page.tsx" = "transactions/journals.tsx"
    "(app)/journals/create/page.tsx" = "transactions/journals-create.tsx"
    "(app)/sales-orders/page.tsx" = "orders/sales-orders.tsx"
    "(app)/sales-orders/create/page.tsx" = "orders/sales-orders-create.tsx"
    "(app)/sales-orders/[id]/page.tsx" = "orders/sales-orders-detail.tsx"
    "(app)/purchase-orders/page.tsx" = "orders/purchase-orders.tsx"
    "(app)/purchase-orders/create/page.tsx" = "orders/purchase-orders-create.tsx"
    "(app)/purchase-orders/[id]/page.tsx" = "orders/purchase-orders-detail.tsx"
    "(app)/quotations/page.tsx" = "orders/quotations.tsx"
    "(app)/quotations/create/page.tsx" = "orders/quotations-create.tsx"
    "(app)/quotations/[id]/page.tsx" = "orders/quotations-detail.tsx"
    "(app)/vouchers/page.tsx" = "transactions/vouchers.tsx"
    "(app)/vouchers/[id]/page.tsx" = "transactions/vouchers-detail.tsx"
    "(app)/reports/page.tsx" = "reports/index.tsx"
    "(app)/reports/balance-sheet/page.tsx" = "reports/balance-sheet.tsx"
    "(app)/reports/pl/page.tsx" = "reports/profit-loss.tsx"
    "(app)/reports/cash-flow/page.tsx" = "reports/cash-flow.tsx"
    "(app)/reports/ledger/page.tsx" = "reports/ledger.tsx"
    "(app)/reports/day-book/page.tsx" = "reports/day-book.tsx"
    "(app)/reports/trial-balance/page.tsx" = "reports/trial-balance.tsx"
    "(app)/reports/vat/page.tsx" = "reports/vat.tsx"
    "(app)/reports/tax-summary/page.tsx" = "reports/tax-summary.tsx"
    "(app)/reports/sales-register/page.tsx" = "reports/sales-register.tsx"
    "(app)/reports/purchase-register/page.tsx" = "reports/purchase-register.tsx"
    "(app)/reports/sales-return-register/page.tsx" = "reports/sales-return-register.tsx"
    "(app)/reports/purchase-return-register/page.tsx" = "reports/purchase-return-register.tsx"
    "(app)/reports/stock-ledger/page.tsx" = "reports/stock-ledger.tsx"
    "(app)/reports/expenses-details/page.tsx" = "reports/expenses-details.tsx"
    "(app)/reports/party-aging/page.tsx" = "reports/party-aging.tsx"
    "(app)/reports/receivable-summary/page.tsx" = "reports/receivable-summary.tsx"
    "(app)/reports/payable-summary/page.tsx" = "reports/payable-summary.tsx"
    "(app)/reports/ratios/page.tsx" = "reports/ratios.tsx"
    "(app)/reports/other/page.tsx" = "reports/other.tsx"
}

function Transform-Content {
    param([string]$content)

    # Remove "use client";
    $content = $content -replace '^\s*"use client";\s*\n', ''

    # Replace imports
    $content = $content -replace 'from "next/navigation"', 'from "react-router-dom"'
    $content = $content -replace 'import { useRouter }', 'import { useNavigate }'
    $content = $content -replace 'import Link from "next/link"', 'import Link from "react-router-dom"'

    # Replace useRouter with useNavigate
    $content = $content -replace 'const router = useRouter\(\)', 'const navigate = useNavigate()'

    # Replace router method calls
    $content = $content -replace 'router\.push\(', 'navigate('
    $content = $content -replace 'router\.replace\(([^)]*)\)', 'navigate($1, { replace: true })'
    $content = $content -replace 'router\.back\(\)', 'navigate(-1)'

    # Replace useParams generic syntax
    $content = $content -replace 'useParams<\{[^}]*\}>', 'useParams'

    # Replace Link with button onClick navigation
    $content = $content -replace '<Link href="([^"]*)"', '<button onClick={() => navigate("$1")'
    $content = $content -replace '>\s*</Link>', '></button>'

    # Replace useSearchParams import
    $content = $content -replace 'import { useSearchParams } from "next/navigation"', 'import { useSearchParams } from "react-router-dom"'

    return $content
}

$createdCount = 0
$skippedCount = 0

foreach ($entry in $mapping.GetEnumerator()) {
    $webPath = $entry.Key
    $desktopPath = $entry.Value
    $desktopFullPath = "$desktopRoot\$desktopPath"
    $webFullPath = "$webRoot\$webPath"

    # Create directory if it doesn't exist
    $dir = Split-Path -Path $desktopFullPath
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    # Check if web file exists
    if (Test-Path $webFullPath) {
        $content = Get-Content -Path $webFullPath -Raw
        $transformed = Transform-Content -content $content

        # Only create if desktop file doesn't exist
        if (-not (Test-Path $desktopFullPath)) {
            Set-Content -Path $desktopFullPath -Value $transformed
            $createdCount++
            Write-Host "[OK] Created: $desktopPath"
        } else {
            $skippedCount++
            Write-Host "[SKIP] Skipped (exists): $desktopPath"
        }
    } else {
        Write-Host "[WARN] Source not found: $webPath"
    }
}

Write-Host "`n[SUMMARY] Created $createdCount files, Skipped $skippedCount files"
