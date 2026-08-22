$ErrorActionPreference = 'Stop'
$folder = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $folder '.env'

Write-Host '============================================================'
Write-Host '  ASCEND // SYSTEM v0.6.0.4 // EXTERNAL REQUEST SECURITY'
Write-Host '============================================================'
Write-Host ''
Write-Host 'This one-time owner setup enables server-side Cloudflare verification.'
Write-Host 'Your testers and link recipients configure nothing.'
Write-Host 'Copy the Cloudflare Turnstile Secret key to the Windows clipboard.'
Write-Host 'Never send the secret in chat, screenshots, source code, or the browser.'
Write-Host ''
[void](Read-Host 'Press Enter after the Turnstile Secret key is copied')

try { $key = Get-Clipboard -Raw -ErrorAction Stop } catch {
  Add-Type -AssemblyName System.Windows.Forms
  $key = [System.Windows.Forms.Clipboard]::GetText()
}
$key = [string]$key
$key = $key.Normalize([Text.NormalizationForm]::FormKC)
$key = [regex]::Replace($key, '[\p{Cf}\p{Cc}]', '')
$key = [regex]::Replace($key.Trim().Trim('"').Trim("'"), '\s+', '')
if ([string]::IsNullOrWhiteSpace($key) -or $key -notmatch '^[\x21-\x7E]{10,200}$') {
  throw 'No valid Turnstile Secret key was found in the clipboard.'
}

$lines = @()
if (Test-Path $envPath) { $lines = @(Get-Content $envPath) }
$name = 'TURNSTILE_SECRET_KEY'; $found = $false
for ($i=0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match ('^' + [regex]::Escape($name) + '=')) { $lines[$i] = "$name=$key"; $found = $true }
}
if (-not $found) { $lines += "$name=$key" }
Set-Content -Path $envPath -Value $lines -Encoding ASCII
$key = $null
try { Set-Clipboard -Value '' -ErrorAction SilentlyContinue } catch {}

Write-Host ''
Write-Host 'Turnstile Secret saved to .env and clipboard cleared.' -ForegroundColor Green
Write-Host 'For Vercel Production, add the same variable through Vercel env and redeploy.' -ForegroundColor Yellow
Write-Host 'Never upload or share the .env file.' -ForegroundColor Yellow
