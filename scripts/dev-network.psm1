function Select-ColocSyncLanIPv4 {
  param(
    [Parameter(Mandatory)][object[]]$Adapters,
    [Parameter(Mandatory)][object[]]$Routes,
    [Parameter(Mandatory)][object[]]$Addresses
  )

  $up = @{}
  foreach ($adapter in $Adapters) {
    if ($adapter.Status -eq "Up") { $up[[int]$adapter.ifIndex] = $true }
  }

  $route = $Routes |
    Where-Object { $_.DestinationPrefix -eq "0.0.0.0/0" -and $up.ContainsKey([int]$_.InterfaceIndex) } |
    Sort-Object @{ Expression = { [int]$_.RouteMetric + [int]$_.InterfaceMetric } } |
    Select-Object -First 1
  if (-not $route) { throw "Aucune route IPv4 active. Connecte le PC au hotspot puis relance le script." }

  $address = $Addresses |
    Where-Object {
      $_.InterfaceIndex -eq $route.InterfaceIndex -and
      $_.AddressFamily -eq "IPv4" -and
      $_.AddressState -eq "Preferred" -and
      $_.IPAddress -notlike "169.254.*"
    } |
    Select-Object -First 1
  if (-not $address) { throw "Aucune adresse IPv4 utilisable sur la route réseau active." }
  $address.IPAddress
}

Export-ModuleMember -Function Select-ColocSyncLanIPv4
