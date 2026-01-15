$body = @{
  companyId = "1d387d26-0078-4ba3-83a9-a9e27d71e16e"
  email = "admin@lekhaly.local"
  password = "Admin@12345"
  deviceLabel = "Windows Dev Machine"
  rememberDevice = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
      -Method Post `
      -Uri http://localhost:4000/v1/auth/login `
      -ContentType "application/json" `
      -Body $body
    
    $response | ConvertTo-Json
} catch {
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Body: $responseBody"
        }
    } else {
        Write-Host "Exception: $_"
    }
}
