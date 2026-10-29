# Uji ulang test yang gagal / tidak jalan pada satu run (mis. karena gangguan jaringan
# atau berkas uji yang hilang), tanpa menimpa hasil run asal. Hasil disimpan di
# <folder-run>/ulang/. Daftar test diambil dari test-results/.last-run.json run asal.
#
# Pemakaian:  powershell -ExecutionPolicy Bypass -File scripts/rerun-gagal.ps1 -Run results/2026-10-27-1-worker [-Workers 1]

param(
  [Parameter(Mandatory = $true)][string]$Run,
  [int]$Workers = 1
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$asal = Join-Path $root $Run
$out = Join-Path $asal "ulang"
if (Test-Path $out) { Remove-Item -Recurse -Force $out }
New-Item -ItemType Directory -Force "$out/test-results" | Out-Null
Copy-Item "$asal/test-results/.last-run.json" "$out/test-results/.last-run.json"

$env:PLAYWRIGHT_JSON_OUTPUT_NAME = Join-Path $out "results.json"
$env:PLAYWRIGHT_HTML_OUTPUT_DIR = Join-Path $out "html-report"
$env:PLAYWRIGHT_HTML_REPORT = Join-Path $out "html-report"
$env:PLAYWRIGHT_HTML_OPEN = "never"
$env:FORCE_COLOR = "0"

$mulai = Get-Date
"== Uji ulang $Run ($Workers worker) mulai $($mulai.ToString('yyyy-MM-dd HH:mm:ss')) ==" | Tee-Object -FilePath "$out/log.txt"
& npx playwright test --project=chromium "--workers=$Workers" --last-failed --reporter=list,html,json `
  "--output=$out/test-results" 2>&1 |
  ForEach-Object { "$_" } | Tee-Object -FilePath "$out/log.txt" -Append
$selesai = Get-Date
"== Uji ulang selesai $($selesai.ToString('yyyy-MM-dd HH:mm:ss')) (durasi $([int]($selesai - $mulai).TotalSeconds) s, exit $LASTEXITCODE) ==" |
  Tee-Object -FilePath "$out/log.txt" -Append
