$desktopSrcPath = "c:\Lekhaly\apps\desktop\src"

function Fix-LinkImports {
    param([string]$content)

    # Fix the Link import
    $content = $content -replace 'import Link from "react-router-dom";', 'import { Link, useNavigate } from "react-router-dom";'
    $content = $content -replace 'import Link from ''react-router-dom'';', 'import { Link, useNavigate } from "react-router-dom";'

    # Also fix useLocation usage to work with react-router-dom
    $content = $content -replace 'const pathname = useLocation\(\);', 'const { pathname } = useLocation();'
    $content = $content -replace 'const location = useLocation\(\);', 'const location = useLocation();'

    return $content
}

function Fix-LinkTags {
    param([string]$content)

    # Replace broken <a> tags back to <Link> tags (react-router uses 'to' instead of 'href')
    $content = $content -replace '<a href=', '<Link to='
    $content = $content -replace '</a>', '</Link>'

    return $content
}

Write-Host "=== Fixing React Router Link Issues ===" -ForegroundColor Cyan

# Fix sidebar
$sidebarPath = Join-Path $desktopSrcPath "components\app\sidebar.tsx"
if (Test-Path $sidebarPath) {
    $content = Get-Content $sidebarPath -Raw
    $content = Fix-LinkImports $content
    $content = Fix-LinkTags $content
    Set-Content -Path $sidebarPath -Value $content -Encoding UTF8
    Write-Host "✓ Fixed sidebar.tsx" -ForegroundColor Green
}

# Fix topbar
$topbarPath = Join-Path $desktopSrcPath "components\app\topbar.tsx"
if (Test-Path $topbarPath) {
    $content = Get-Content $topbarPath -Raw
    $content = Fix-LinkImports $content
    $content = Fix-LinkTags $content
    Set-Content -Path $topbarPath -Value $content -Encoding UTF8
    Write-Host "✓ Fixed topbar.tsx" -ForegroundColor Green
}

# Fix all page files
$pageFiles = Get-ChildItem -Path (Join-Path $desktopSrcPath "pages") -Recurse -Filter "*.tsx" | Where-Object { $_.Name -eq "*.tsx" }
$fixed = 0
foreach ($file in $pageFiles) {
    $content = Get-Content $file.FullName -Raw
    $newContent = Fix-LinkImports $content
    $newContent = Fix-LinkTags $newContent

    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        $fixed++
    }
}
Write-Host "✓ Fixed $fixed page files" -ForegroundColor Green

Write-Host ""
Write-Host "Done! Link issues should be resolved." -ForegroundColor Cyan
