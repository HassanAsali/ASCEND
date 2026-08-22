$ErrorActionPreference = 'Stop'
$folder = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $folder '.env'
Write-Host '============================================================'
Write-Host '  ASCEND // SYSTEM v0.6.0.4 // SUPABASE CLOUD SETUP'
Write-Host '============================================================'
Write-Host ''
Write-Host 'Paste the Supabase API URL and Publishable key.'
Write-Host 'Do NOT use a secret key, service_role key, or database password.'
Write-Host ''
$url = (Read-Host 'Supabase API URL').Trim()
$key = (Read-Host 'Supabase Publishable key').Trim()
if ($url -notmatch '^https://[A-Za-z0-9.-]+\.supabase\.co/?$') { throw 'The Supabase API URL does not look valid.' }
if ([string]::IsNullOrWhiteSpace($key)) { throw 'Publishable key is required.' }
$lines = @()
if (Test-Path $envPath) { $lines = Get-Content $envPath }
$map = [ordered]@{ 'SUPABASE_URL'=$url.TrimEnd('/'); 'SUPABASE_PUBLISHABLE_KEY'=$key }
foreach ($name in $map.Keys) {
  $pattern = '^' + [regex]::Escape($name) + '='
  $found = $false
  for ($i=0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $pattern) { $lines[$i] = "$name=$($map[$name])"; $found=$true }
  }
  if (-not $found) { $lines += "$name=$($map[$name])" }
}
Set-Content -Path $envPath -Value $lines -Encoding ASCII
Write-Host ''
Write-Host 'Cloud configuration saved to .env.' -ForegroundColor Green
Write-Host 'Restart ASCEND, then open System -> Cloud Link.'
