$ErrorActionPreference = 'SilentlyContinue'
$killed = 0

# 1) Cerrar node.exe que ejecute server.js
$targets = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'node.exe' -and $_.CommandLine -match 'server\.js'
}

foreach ($p in $targets) {
  try {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
    $killed++
  } catch {}
}

# 2) Fallback: cerrar proceso que escuche en 3000
if ($killed -eq 0) {
  $pids = @()
  netstat -ano | Select-String ':3000' | Select-String 'LISTENING' | ForEach-Object {
    $parts = ($_ -split '\s+') | Where-Object { $_ }
    if ($parts.Count -gt 0) { $pids += $parts[-1] }
  }

  $pids = $pids | Select-Object -Unique
  foreach ($pid in $pids) {
    try {
      Stop-Process -Id ([int]$pid) -Force -ErrorAction Stop
      $killed++
    } catch {}
  }
}

if ($killed -eq 0) {
  Write-Host 'No se encontro un servidor activo para detener.'
} else {
  Write-Host ("Listo. Se detuvieron $killed proceso(s).")
}
