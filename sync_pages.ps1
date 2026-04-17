$webPath = "c:\Lekhaly\apps\web\src\app"
$desktopPath = "c:\Lekhaly\apps\desktop\src\pages"

$pathMappings = @(
    @{ web = "(app)\dashboard\page.tsx"; desktop = "dashboard.tsx" },
    @{ web = "(app)\coming-soon\page.tsx"; desktop = "coming-soon.tsx" },
    @{ web = "(app)\configuration\page.tsx"; desktop = "configuration.tsx" },
    @{ web = "(app)\users\page.tsx"; desktop = "users.tsx" },
    @{ web = "(auth)\login\page.tsx"; desktop = "auth\login.tsx" },
    @{ web = "(auth)\register\page.tsx"; desktop = "auth\register.tsx" },
    @{ web = "(app)\customers\page.tsx"; desktop = "customers\index.tsx" },
    @{ web = "(app)\customers\new\page.tsx"; desktop = "customers\new.tsx" },
    @{ web = "(app)\vendors\page.tsx"; desktop = "vendors\index.tsx" },
    @{ web = "(app)\vendors\new\page.tsx"; desktop = "vendors\new.tsx" },
    @{ web = "(app)\items\page.tsx"; desktop = "items\index.tsx" },
    @{ web = "(app)\items\new\page.tsx"; desktop = "items\new.tsx" },
    @{ web = "(app)\coa\page.tsx"; desktop = "coa.tsx" },
    @{ web = "(app)\banks\page.tsx"; desktop = "banks.tsx" },
    @{ web = "(app)\sales\page.tsx"; desktop = "sales\index.tsx" },
    @{ web = "(app)\sales\create\page.tsx"; desktop = "sales\create.tsx" },
    @{ web = "(app)\sales\[id]\page.tsx"; desktop = "sales\view.tsx" },
    @{ web = "(app)\sales\view\page.tsx"; desktop = "sales\view.tsx" },
    @{ web = "(app)\sales-return\page.tsx"; desktop = "sales-return\index.tsx" },
    @{ web = "(app)\sales-return\create\page.tsx"; desktop = "sales-return\create.tsx" },
    @{ web = "(app)\sales\return\create\page.tsx"; desktop = "sales-return\create.tsx" },
    @{ web = "(app)\sales-orders\page.tsx"; desktop = "sales-orders\index.tsx" },
    @{ web = "(app)\sales-orders\create\page.tsx"; desktop = "sales-orders\create.tsx" },
    @{ web = "(app)\sales-orders\[id]\page.tsx"; desktop = "sales-orders\view.tsx" },
    @{ web = "(app)\quotations\page.tsx"; desktop = "quotations\index.tsx" },
    @{ web = "(app)\quotations\create\page.tsx"; desktop = "quotations\create.tsx" },
    @{ web = "(app)\quotations\[id]\page.tsx"; desktop = "quotations\view.tsx" },
    @{ web = "(app)\purchase\page.tsx"; desktop = "purchase\index.tsx" },
    @{ web = "(app)\purchase\create\page.tsx"; desktop = "purchase\create.tsx" },
    @{ web = "(app)\purchase\[id]\page.tsx"; desktop = "purchase\view.tsx" },
    @{ web = "(app)\purchase-orders\page.tsx"; desktop = "purchase-orders\index.tsx" },
    @{ web = "(app)\purchase-orders\create\page.tsx"; desktop = "purchase-orders\create.tsx" },
    @{ web = "(app)\purchase-orders\[id]\page.tsx"; desktop = "purchase-orders\view.tsx" },
    @{ web = "(app)\purchase-return\page.tsx"; desktop = "purchase-return\index.tsx" },
    @{ web = "(app)\purchase-return\create\page.tsx"; desktop = "purchase-return\create.tsx" },
    @{ web = "(app)\invoices\page.tsx"; desktop = "invoices\index.tsx" },
    @{ web = "(app)\receipts\page.tsx"; desktop = "receipts\index.tsx" },
    @{ web = "(app)\receipts\create\page.tsx"; desktop = "receipts\create.tsx" },
    @{ web = "(app)\payments\page.tsx"; desktop = "payments\index.tsx" },
    @{ web = "(app)\payments\create\page.tsx"; desktop = "payments\create.tsx" },
    @{ web = "(app)\journals\page.tsx"; desktop = "journals\index.tsx" },
    @{ web = "(app)\journals\create\page.tsx"; desktop = "journals\create.tsx" },
    @{ web = "(app)\vouchers\page.tsx"; desktop = "vouchers\index.tsx" },
    @{ web = "(app)\vouchers\[id]\page.tsx"; desktop = "vouchers\view.tsx" },
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
    param([string]$content)

    $content = $content -replace "'next/navigation'", "'react-router-dom'"
    $content = $content -replace '"next/navigation"', '"react-router-dom"'
    $content = $content -replace "'next/link'", "'react-router-dom'"
    $content = $content -replace '"next/link"', '"react-router-dom"'

    $content = $content -replace 'const router = useRouter\(\);', 'const navigate = useNavigate();'
    $content = $content -replace 'router\.push\((.*?)\)', 'navigate($1)'
    $content = $content -replace 'router\.back\(\)', 'navigate(-1)'

    $content = $content -replace 'const params = useParams<\{(.*?)\}>\(\);', 'const params = useParams();'
    $content = $content -replace 'const params = useParams<.*?>\(\);', 'const params = useParams();'

    $content = $content -replace '<Link\s+href=', '<a href='

    return $content
}

$success = 0
$failed = 0
$skipped = 0

Write-Host "=== Syncing Web to Desktop Pages ===" -ForegroundColor Cyan

foreach ($mapping in $pathMappings) {
    $webFile = Join-Path $webPath $mapping.web
    $desktopFile = Join-Path $desktopPath $mapping.desktop

    if (Test-Path $webFile) {
        try {
            $content = Get-Content $webFile -Raw
            $transformed = Transform-NextJsToReactRouter $content

            $dir = Split-Path -Parent $desktopFile
            if (-not (Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
            }

            Set-Content -Path $desktopFile -Value $transformed -Encoding UTF8
            Write-Host "OK: $($mapping.desktop)" -ForegroundColor Green
            $success++
        } catch {
            Write-Host "ERROR: $($mapping.desktop)" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "SKIP: $($mapping.web) not found" -ForegroundColor Yellow
        $skipped++
    }
}

Write-Host ""
Write-Host "Done: $success copied | $failed errors | $skipped skipped"
