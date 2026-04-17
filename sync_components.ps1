$webComponentsPath = "c:\Lekhaly\apps\web\src\components\app"
$desktopComponentsPath = "c:\Lekhaly\apps\desktop\src\components\app"

$componentFiles = @(
    "add-account-group-dialog.tsx",
    "add-bill-sundry-dialog.tsx",
    "add-customer-dialog.tsx",
    "add-group-dialog.tsx",
    "add-item-dialog.tsx",
    "add-unit-dialog.tsx",
    "add-vendor-dialog.tsx",
    "advanced-filter-bar.tsx",
    "bs-date-input.tsx",
    "calendar.tsx",
    "command-palette.tsx",
    "confirm-dialog.tsx",
    "dashboard-charts.tsx",
    "data-table.tsx",
    "date-display.tsx",
    "dual-date-input.tsx",
    "filters-bar.tsx",
    "money.tsx",
    "offline-sync-banner.tsx",
    "page-header.tsx",
    "quick-actions.tsx",
    "searchable-select.tsx",
    "sidebar.tsx",
    "status-badge.tsx",
    "topbar.tsx"
)

function Transform-Content {
    param([string]$content)

    # Replace Next.js imports with React Router
    $content = $content -replace "'next/navigation'", "'react-router-dom'"
    $content = $content -replace '"next/navigation"', '"react-router-dom"'
    $content = $content -replace "'next/link'", "'react-router-dom'"
    $content = $content -replace '"next/link"', '"react-router-dom"'
    $content = $content -replace "'next/image'", "'react'"
    $content = $content -replace '"next/image"', '"react"'

    # Replace hooks
    $content = $content -replace 'const router = useRouter\(\);', 'const navigate = useNavigate();'
    $content = $content -replace 'router\.push\((.*?)\)', 'navigate($1)'
    $content = $content -replace 'router\.back\(\)', 'navigate(-1)'
    $content = $content -replace 'usePathname', 'useLocation'

    # Replace Link component
    $content = $content -replace '<Link\s+href=', '<a href='

    return $content
}

$success = 0
$failed = 0

Write-Host "=== Syncing App Components ===" -ForegroundColor Cyan

foreach ($file in $componentFiles) {
    $webFile = Join-Path $webComponentsPath $file
    $desktopFile = Join-Path $desktopComponentsPath $file

    if (Test-Path $webFile) {
        try {
            $content = Get-Content $webFile -Raw
            $transformed = Transform-Content $content
            Set-Content -Path $desktopFile -Value $transformed -Encoding UTF8
            Write-Host "OK: $file" -ForegroundColor Green
            $success++
        } catch {
            Write-Host "ERROR: $file - $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "SKIP: $file not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Done: $success updated | $failed errors"
