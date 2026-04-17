# Comprehensive Web to Desktop UI/UX Sync Script
# This script copies all web pages to desktop with Next.js -> React Router transformations

$webPath = "c:\Lekhaly\apps\web\src\app"
$desktopPath = "c:\Lekhaly\apps\desktop\src\pages"

# Mapping of web paths to desktop paths
$pathMappings = @(
    # Root pages
    @{ web = "(app)\dashboard\page.tsx"; desktop = "dashboard.tsx" },
    @{ web = "(app)\coming-soon\page.tsx"; desktop = "coming-soon.tsx" },
    @{ web = "(app)\configuration\page.tsx"; desktop = "configuration.tsx" },
    @{ web = "(app)\users\page.tsx"; desktop = "users.tsx" },
    @{ web = "(auth)\login\page.tsx"; desktop = "auth\login.tsx" },
    @{ web = "(auth)\register\page.tsx"; desktop = "auth\register.tsx" },

    # Customers
    @{ web = "(app)\customers\page.tsx"; desktop = "customers\index.tsx" },
    @{ web = "(app)\customers\new\page.tsx"; desktop = "customers\new.tsx" },

    # Vendors
    @{ web = "(app)\vendors\page.tsx"; desktop = "vendors\index.tsx" },
    @{ web = "(app)\vendors\new\page.tsx"; desktop = "vendors\new.tsx" },

    # Items
    @{ web = "(app)\items\page.tsx"; desktop = "items\index.tsx" },
    @{ web = "(app)\items\new\page.tsx"; desktop = "items\new.tsx" },

    # COA & Banks
    @{ web = "(app)\coa\page.tsx"; desktop = "coa.tsx" },
    @{ web = "(app)\banks\page.tsx"; desktop = "banks.tsx" },

    # Sales
    @{ web = "(app)\sales\page.tsx"; desktop = "sales\index.tsx" },
    @{ web = "(app)\sales\create\page.tsx"; desktop = "sales\create.tsx" },
    @{ web = "(app)\sales\[id]\page.tsx"; desktop = "sales\view.tsx" },
    @{ web = "(app)\sales\view\page.tsx"; desktop = "sales\view.tsx" },

    # Sales Return
    @{ web = "(app)\sales-return\page.tsx"; desktop = "sales-return\index.tsx" },
    @{ web = "(app)\sales-return\create\page.tsx"; desktop = "sales-return\create.tsx" },
    @{ web = "(app)\sales\return\create\page.tsx"; desktop = "sales-return\create.tsx" },

    # Sales Orders
    @{ web = "(app)\sales-orders\page.tsx"; desktop = "sales-orders\index.tsx" },
    @{ web = "(app)\sales-orders\create\page.tsx"; desktop = "sales-orders\create.tsx" },
    @{ web = "(app)\sales-orders\[id]\page.tsx"; desktop = "sales-orders\view.tsx" },

    # Quotations
    @{ web = "(app)\quotations\page.tsx"; desktop = "quotations\index.tsx" },
    @{ web = "(app)\quotations\create\page.tsx"; desktop = "quotations\create.tsx" },
    @{ web = "(app)\quotations\[id]\page.tsx"; desktop = "quotations\view.tsx" },

    # Purchase
    @{ web = "(app)\purchase\page.tsx"; desktop = "purchase\index.tsx" },
    @{ web = "(app)\purchase\create\page.tsx"; desktop = "purchase\create.tsx" },
    @{ web = "(app)\purchase\[id]\page.tsx"; desktop = "purchase\view.tsx" },

    # Purchase Orders
    @{ web = "(app)\purchase-orders\page.tsx"; desktop = "purchase-orders\index.tsx" },
    @{ web = "(app)\purchase-orders\create\page.tsx"; desktop = "purchase-orders\create.tsx" },
    @{ web = "(app)\purchase-orders\[id]\page.tsx"; desktop = "purchase-orders\view.tsx" },

    # Purchase Return
    @{ web = "(app)\purchase-return\page.tsx"; desktop = "purchase-return\index.tsx" },
    @{ web = "(app)\purchase-return\create\page.tsx"; desktop = "purchase-return\create.tsx" },

    # Invoices, Receipts, Payments, Journals
    @{ web = "(app)\invoices\page.tsx"; desktop = "invoices\index.tsx" },
    @{ web = "(app)\receipts\page.tsx"; desktop = "receipts\index.tsx" },
    @{ web = "(app)\receipts\create\page.tsx"; desktop = "receipts\create.tsx" },
    @{ web = "(app)\payments\page.tsx"; desktop = "payments\index.tsx" },
    @{ web = "(app)\payments\create\page.tsx"; desktop = "payments\create.tsx" },
    @{ web = "(app)\journals\page.tsx"; desktop = "journals\index.tsx" },
    @{ web = "(app)\journals\create\page.tsx"; desktop = "journals\create.tsx" },

    # Vouchers
    @{ web = "(app)\vouchers\page.tsx"; desktop = "vouchers\index.tsx" },
    @{ web = "(app)\vouchers\[id]\page.tsx"; desktop = "vouchers\view.tsx" },

    # Reports
    @{ web = "(app)\reports\page.tsx"; desktop = "reports\index.tsx" },
    @{ web = "(app)\reports\balance-sheet\page.tsx"; desktop = "reports\balance-sheet.tsx" },
    @{ web = "(app)\reports\cash-flow\page.tsx"; desktop = "reports\cash-flow.tsx" },
    @{ web = "(app)\reports\day-book\page.tsx"; desktop = "reports\day-book.tsx" },
    @{ web = "(app)\reports\expenses-details\page.tsx"; desktop = "reports\expenses-details.tsx" },
    @{ web = "(app)\reports\ledger\page.tsx"; desktop = "reports\ledger.tsx" },
    @{ web = "(app)\reports\other\page.tsx"; desktop = "reports\other.tsx" },
    @{ web = "(app)\reports\party-aging\page.tsx"; desktop = "reports\party-aging.tsx" },
    @{ web = "(app)\reports\payable-summary\page.tsx"; desktop = "reports\payable-summary.tsx" },
    @{ web = "(app)\reports\pl\page.tsx"; desktop = "reports\pl.tsx" },
    @{ web = "(app)\reports\purchase-register\page.tsx"; desktop = "reports\purchase-register.tsx" },
    @{ web = "(app)\reports\purchase-return-register\page.tsx"; desktop = "reports\purchase-return-register.tsx" },
    @{ web = "(app)\reports\ratios\page.tsx"; desktop = "reports\ratios.tsx" },
    @{ web = "(app)\reports\receivable-summary\page.tsx"; desktop = "reports\receivable-summary.tsx" },
    @{ web = "(app)\reports\sales-register\page.tsx"; desktop = "reports\sales-register.tsx" },
    @{ web = "(app)\reports\sales-return-register\page.tsx"; desktop = "reports\sales-return-register.tsx" },
    @{ web = "(app)\reports\stock-ledger\page.tsx"; desktop = "reports\stock-ledger.tsx" },
    @{ web = "(app)\reports\tax-summary\page.tsx"; desktop = "reports\tax-summary.tsx" },
    @{ web = "(app)\reports\trial-balance\page.tsx"; desktop = "reports\trial-balance.tsx" },
    @{ web = "(app)\reports\vat\page.tsx"; desktop = "reports\vat.tsx" }
)

function Transform-NextJsToReactRouter {
    param([string]$content, [string]$desktopPath)

    # Replace imports
    $content = $content -replace "'next/navigation'", "'react-router-dom'"
    $content = $content -replace '"next/navigation"', '"react-router-dom"'
    $content = $content -replace "'next/link'", "'react-router-dom'"
    $content = $content -replace '"next/link"', '"react-router-dom"'

    # Replace useRouter with useNavigate
    $content = $content -replace 'const router = useRouter\(\);', 'const navigate = useNavigate();'
    $content = $content -replace 'router\.push\((.*?)\)', 'navigate($1)'
    $content = $content -replace 'router\.back\(\)', 'navigate(-1)'

    # Replace useParams pattern
    $content = $content -replace 'const params = useParams<\{(.*?)\}>\(\);', 'const params = useParams();'
    $content = $content -replace 'const params = useParams<.*?>\(\);', 'const params = useParams();'

    # Replace Link component with NavLink
    $content = $content -replace '<Link\s+href=', '<a href='

    # Handle dynamic routes - replace [id] references with route params
    if ($desktopPath -match 'view\.tsx$') {
        $content = $content -replace 'params\.id', 'params.id'
    }

    return $content
}

function Ensure-Directory {
    param([string]$path)
    $dir = Split-Path -Parent $path
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

Write-Host "=== Starting Web to Desktop UI/UX Sync ===" -ForegroundColor Cyan
Write-Host "Web Path: $webPath"
Write-Host "Desktop Path: $desktopPath"
Write-Host ""

$successCount = 0
$failCount = 0
$skipCount = 0

foreach ($mapping in $pathMappings) {
    $webFile = Join-Path $webPath $mapping.web
    $desktopFile = Join-Path $desktopPath $mapping.desktop

    if (Test-Path $webFile) {
        try {
            $content = Get-Content $webFile -Raw
            $transformed = Transform-NextJsToReactRouter $content $desktopFile

            Ensure-Directory $desktopFile
            Set-Content -Path $desktopFile -Value $transformed -Encoding UTF8

            Write-Host "✓ $(Split-Path -Leaf $mapping.desktop)" -ForegroundColor Green
            $successCount++
        } catch {
            Write-Host "✗ Failed: $($mapping.desktop) - $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "⊘ Skipped: $(Split-Path -Leaf $mapping.web) (not found)" -ForegroundColor Yellow
        $skipCount++
    }
}

Write-Host ""
Write-Host "=== Sync Complete ===" -ForegroundColor Cyan
Write-Host "Success: $successCount | Failed: $failCount | Skipped: $skipCount" -ForegroundColor Magenta
