$ErrorActionPreference = 'Stop'
$folder = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $folder '.env'

Write-Host '============================================================'
Write-Host '  ASCEND // SYSTEM v0.6.0.4 // DELETE ACCOUNT SETUP'
Write-Host '============================================================'
Write-Host ''
Write-Host 'This optional setup enables permanent self-service account deletion.'
Write-Host 'Use a Supabase Secret key (recommended: sb_secret_*).'
Write-Host 'The key is server-only. Do NOT send it in chat, screenshots, GitHub, or frontend code.'
Write-Host ''
Write-Host 'IMPORTANT:' -ForegroundColor Yellow
Write-Host '1. Copy the Supabase Secret key to your clipboard.'
Write-Host '2. Return to this window.'
Write-Host '3. Press Enter. Do NOT paste the key into this window.'
Write-Host ''
[void](Read-Host 'Press Enter after the Secret key is copied')

# Read directly from the clipboard instead of secure console input.
# Windows PowerShell can reject or mangle multi-character paste in hidden input.
try {
  $key = Get-Clipboard -Raw -ErrorAction Stop
} catch {
  Add-Type -AssemblyName System.Windows.Forms
  $key = [System.Windows.Forms.Clipboard]::GetText()
}

# Normalize clipboard input. Browser copies can include invisible Unicode
# format/control marks, BOMs, surrounding quotes, or accidental whitespace.
$key = [string]$key
$key = $key.Normalize([Text.NormalizationForm]::FormKC)
$key = [regex]::Replace($key, '[\p{Cf}\p{Cc}]', '')
$key = $key.Trim()
if (($key.StartsWith('"') -and $key.EndsWith('"')) -or ($key.StartsWith("'") -and $key.EndsWith("'"))) {
  $key = $key.Substring(1, $key.Length - 2)
}
$key = [regex]::Replace($key, '\s+', '')

if ([string]::IsNullOrWhiteSpace($key)) {
  throw 'No key was found in the clipboard. Copy the Supabase Secret key, run this setup again, and press Enter without pasting.'
}
if ($key -notmatch '^[\x21-\x7E]+$') {
  throw 'The copied key contains unsupported characters. Copy the raw key value again from Supabase.'
}

# New Supabase secret keys are opaque sb_secret_* values. Legacy service_role
# keys are JWTs. Accept either, but never accept publishable/anon-style values.
$isNewSecret = $key.StartsWith('sb_secret_', [System.StringComparison]::Ordinal)
$isLegacyJwt = ($key -match '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$')
if (-not $isNewSecret -and -not $isLegacyJwt) {
  if ($key.StartsWith('sb_publishable_', [System.StringComparison]::Ordinal)) {
    throw 'The clipboard contains a Publishable key, not a Secret key. In Supabase use Settings -> API Keys -> Secret keys.'
  }
  throw 'The clipboard value is not recognized as a Supabase Secret/service_role key. Copy the raw value that starts with sb_secret_ from Settings -> API Keys -> Secret keys.'
}

$lines = @()
if (Test-Path $envPath) { $lines = @(Get-Content $envPath) }
$name = 'SUPABASE_SECRET_KEY'
$pattern = '^' + [regex]::Escape($name) + '='
$found = $false
for ($i=0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match $pattern) { $lines[$i] = "$name=$key"; $found=$true }
}
if (-not $found) { $lines += "$name=$key" }
Set-Content -Path $envPath -Value $lines -Encoding ASCII

# Remove the secret from the process variable and clipboard after saving.
$key = $null
try { Set-Clipboard -Value '' -ErrorAction SilentlyContinue } catch {}

Write-Host ''
Write-Host 'Secret key format recognized and saved to .env.' -ForegroundColor Green
Write-Host 'The clipboard was cleared for safety.' -ForegroundColor Green
Write-Host 'Restart ASCEND before testing Delete My Account.' -ForegroundColor Green
Write-Host 'Never upload or share the .env file.' -ForegroundColor Yellow
