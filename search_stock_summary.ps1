Get-ChildItem -Path apps -Recurse -Filter '*.ts*' | Select-String -Pattern 'stock-summary' | ForEach-Object { Write-Output "$($_.Path):$($_.LineNumber):$($_.Line)" }
