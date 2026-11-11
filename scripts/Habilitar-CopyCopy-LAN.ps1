# Ejecutar en PowerShell como administrador.
$ErrorActionPreference = 'Stop'
if (-not (Get-NetFirewallRule -DisplayName 'Copy Copy LAN HTTP' -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName 'Copy Copy LAN HTTP' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 -RemoteAddress 192.168.1.0/24 -Program 'C:\wamp64\bin\apache\apache2.4.62.1\bin\httpd.exe' -Profile Any | Out-Null
}
Restart-Service wampapache64
Write-Host 'Listo. Abre http://192.168.1.83/Sistema-Copy-Copy-main/'
