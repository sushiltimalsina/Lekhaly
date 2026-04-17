$root = "c:\Lekhaly\apps\desktop\src"
Get-ChildItem -Path $root -Recurse -Filter *.tsx | ForEach-Object {
    $path = $_.FullName
    $text = Get-Content -Raw -Path $path
    $new = $text

    $new = $new -replace 'import \{ useParams, useRouter \} from "react-router-dom";','import { useParams, useNavigate } from "react-router-dom";'
    $new = $new -replace "import \{ useParams, useRouter \} from 'react-router-dom';","import { useParams, useNavigate } from 'react-router-dom';"
    $new = $new -replace 'import \{ useRouter, useParams \} from "react-router-dom";','import { useNavigate, useParams } from "react-router-dom";'
    $new = $new -replace "import \{ useRouter, useParams \} from 'react-router-dom';","import { useNavigate, useParams } from 'react-router-dom';"
    $new = $new -replace 'import \{ useRouter, useSearchParams \} from "react-router-dom";','import { useNavigate, useSearchParams } from "react-router-dom";'
    $new = $new -replace "import \{ useRouter, useSearchParams \} from 'react-router-dom';","import { useNavigate, useSearchParams } from 'react-router-dom';"
    $new = $new -replace 'import \{ useRouter \} from "react-router-dom";','import { useNavigate } from "react-router-dom";'
    $new = $new -replace "import \{ useRouter \} from 'react-router-dom';","import { useNavigate } from 'react-router-dom';"

    $new = $new -replace 'useRouter\(','useNavigate('
    $new = $new -replace 'const pathname = useLocation\(\);','const { pathname } = useLocation();'
    $new = $new -replace 'const searchParams = useSearchParams\(\);','const [searchParams] = useSearchParams();'
    $new = $new -replace 'router\.replace\(([^)]+)\);','navigate($1, { replace: true });'
    $new = $new -replace '<Link([^>]*?)href=','<Link$1to='

    if ($new -ne $text) {
        Set-Content -Path $path -Value $new
        Write-Host "Patched $path"
    }
}
"Done"
