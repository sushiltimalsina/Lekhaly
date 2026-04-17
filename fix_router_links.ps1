$desktopSrc = "c:\Lekhaly\apps\desktop\src"
$files = Get-ChildItem -Path $desktopSrc -Recurse -Filter *.tsx | Where-Object { -not $_.PSIsContainer }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $newContent = $content

    $newContent = $newContent -replace 'import Link from "react-router-dom";', 'import { Link } from "react-router-dom";'
    $newContent = $newContent -replace "import Link from 'react-router-dom';", "import { Link } from 'react-router-dom';"
    $newContent = $newContent -replace '<Link\s+href=', '<Link to='
    $newContent = $newContent -replace '<a\s+href=', '<Link to='
    $newContent = $newContent -replace 'href=\{"/','to={"/'
    $newContent = $newContent -replace 'href=\{"','to={"'
    $newContent = $newContent -replace 'href=\{','to={'

    if ($newContent -ne $content) {
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Done fixing Link imports and href->to conversions."
