$ErrorActionPreference = "Stop"
Import-Module (Join-Path $PSScriptRoot "../dev-network.psm1") -Force

$adapters = @(
  [pscustomobject]@{ ifIndex = 4; Status = "Up" },
  [pscustomobject]@{ ifIndex = 8; Status = "Up" }
)
$routes = @(
  [pscustomobject]@{ DestinationPrefix = "0.0.0.0/0"; InterfaceIndex = 4; RouteMetric = 20; InterfaceMetric = 10 },
  [pscustomobject]@{ DestinationPrefix = "0.0.0.0/0"; InterfaceIndex = 8; RouteMetric = 2; InterfaceMetric = 5 }
)
$addresses = @(
  [pscustomobject]@{ InterfaceIndex = 8; AddressFamily = "IPv4"; AddressState = "Preferred"; IPAddress = "169.254.1.2" },
  [pscustomobject]@{ InterfaceIndex = 8; AddressFamily = "IPv4"; AddressState = "Preferred"; IPAddress = "192.168.43.27" }
)

if ((Select-ColocSyncLanIPv4 $adapters $routes $addresses) -ne "192.168.43.27") {
  throw "La route active doit fournir l’IPv4 non-link-local."
}
try {
  Select-ColocSyncLanIPv4 @() @() @() | Out-Null
  throw "Une erreur est attendue sans route IPv4 active."
} catch {
  if ($_.Exception.Message -eq "Une erreur est attendue sans route IPv4 active.") { throw }
}

Write-Output "Sélection d’IPv4 et absence de route : OK."
