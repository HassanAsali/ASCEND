$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host ""
Write-Host "============================================================"
Write-Host "      ASCEND // SYSTEM v0.6.0.4 // GEMINI AI SETUP"
Write-Host "============================================================"
Write-Host ""
Write-Host "This setup avoids console paste issues by reading the key directly from your Windows clipboard."
Write-Host "1) In Google AI Studio, press Copy on the API key."
Write-Host "2) Return here and press ENTER. Do not paste the key into this window."
Write-Host ""
[void](Read-Host "Press ENTER after the API key is copied")

try {
  $raw = Get-Clipboard -Raw
} catch {
  throw "Could not read the Windows clipboard. Copy the API key again, then rerun setup."
}
if ([string]::IsNullOrWhiteSpace($raw)) { throw "Clipboard is empty. Copy the API key from Google AI Studio and run setup again." }

# Normalize browser clipboard text without ever printing the secret.
$key = $raw.Normalize([Text.NormalizationForm]::FormKC)
# Remove every Unicode control/format character (directional marks, zero-width marks, BOM, CR/LF, etc.).
$key = [regex]::Replace($key, '[\p{Cc}\p{Cf}]', '')
$key = $key.Trim().Trim('"').Trim("'")
$key = [regex]::Replace($key, '\s+', '')

# If surrounding UI text was accidentally copied, extract the token-like printable ASCII run.
# Prefer the whole cleaned clipboard when already header-safe.
if ($key -notmatch '^[\x21-\x7E]+$') {
  $runs = [regex]::Matches($key, '[\x21-\x7E]{20,}') | ForEach-Object { $_.Value }
  if ($runs.Count -eq 1) { $key = $runs[0] }
}

if ([string]::IsNullOrWhiteSpace($key)) { throw "No usable API key was found in the clipboard." }
if ($key -notmatch '^[\x21-\x7E]+$') { throw "The clipboard still contains characters that cannot be used in an HTTP API-key header. Copy only the key using AI Studio's Copy button and rerun setup." }
if ($key.Length -lt 20) { throw "The copied value is too short to look like a Gemini API key. Copy the key again from Google AI Studio." }

$text = "GEMINI_API_KEY=$key`r`nGEMINI_FAST_MODEL=gemini-3.5-flash-lite`r`nGEMINI_DEEP_MODEL=gemini-3.6-flash`r`nPORT=3000`r`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), $text, $utf8NoBom)

Write-Host ""
Write-Host "API key captured securely from clipboard and saved to .env."
Write-Host ("Captured key length: " + $key.Length + " characters. The key itself was not displayed.")
Write-Host "Restart ASCEND with start-windows.bat, then open System and press Test AI Connection."
Write-Host ""
