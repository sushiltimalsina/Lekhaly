$files = @(
    @{ src = 'c:\Lekhaly\apps\web\src\app\(app)\sales\[id]\page.tsx'; dest = 'c:\Lekhaly\apps\desktop\src\pages\sales\view.tsx' },
    @{ src = 'c:\Lekhaly\apps\web\src\app\(app)\sales-orders\[id]\page.tsx'; dest = 'c:\Lekhaly\apps\desktop\src\pages\sales-orders\view.tsx' },
    @{ src = 'c:\Lekhaly\apps\web\src\app\(app)\quotations\[id]\page.tsx'; dest = 'c:\Lekhaly\apps\desktop\src\pages\quotations\view.tsx' },
    @{ src = 'c:\Lekhaly\apps\web\src\app\(app)\purchase\[id]\page.tsx'; dest = 'c:\Lekhaly\apps\desktop\src\pages\purchase\view.tsx' },
    @{ src = 'c:\Lekhaly\apps\web\src\app\(app)\purchase-orders\[id]\page.tsx'; dest = 'c:\Lekhaly\apps\desktop\src\pages\purchase-orders\view.tsx' },
    @{ src = 'c:\Lekhaly\apps\web\src\app\(app)\vouchers\[id]\page.tsx'; dest = 'c:\Lekhaly\apps\desktop\src\pages\vouchers\view.tsx' }
)
foreach ($f in $files) {
    if (-not (Test-Path -LiteralPath $f.src)) {
        Write-Host "MISSING:$($f.src)"
        continue
    }
    $text = Get-Content -LiteralPath $f.src -Raw
    $text = $text -replace 'from "next/navigation"', 'from "react-router-dom"'
    $text = $text -replace 'from "next/link"', 'from "react-router-dom"'
    $text = $text -replace 'useParams<\{ id: string \}>\(\)', 'useParams()'
    $text = $text -replace 'const router = useRouter\(\);', 'const navigate = useNavigate();'
    $text = $text -replace 'router\.push\(', 'navigate('
    $destDir = Split-Path -Path $f.dest -Parent
    if (-not (Test-Path -Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Set-Content -Path $f.dest -Value $text -Force
    Write-Host "WROTE:$($f.dest)"
}
Write-Host "DONE"
