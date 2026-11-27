$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Import-Module (Join-Path $PSScriptRoot "dev-network.psm1") -Force

Push-Location $root
try {
  if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }

  $env:LAN_IP = Select-ColocSyncLanIPv4 `
    -Adapters @(Get-NetAdapter) `
    -Routes @(Get-NetRoute -AddressFamily IPv4) `
    -Addresses @(Get-NetIPAddress -AddressFamily IPv4)
  $env:BETTER_AUTH_URL = "http://${env:LAN_IP}:3001"
  $env:EXPO_PUBLIC_API_URL = "http://localhost:3000"
  Write-Host "Expo et l’API seront annoncés sur l’adresse $env:LAN_IP."
  Write-Host "Ctrl+C arrête les services Docker."

  docker compose --profile docker-mobile up --build
  if ($LASTEXITCODE -ne 0) { throw "Docker Compose s’est terminé avec une erreur." }
}
finally {
  Pop-Location
}
