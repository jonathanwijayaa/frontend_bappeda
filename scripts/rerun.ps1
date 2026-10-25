# Eksekusi ulang pengujian E2E (think time & load time) untuk skripsi.
# Menjalankan 527 test chromium yang sebanding dengan baseline 30 Sep 2026
# (tanpa performance/*, screenshot-ui, accessControl, xss), berurutan:
# 1 worker lalu 10 worker, masing-masing ke folder results/<tanggal>-<n>-worker/.
#
# Pemakaian:  powershell -ExecutionPolicy Bypass -File scripts/rerun.ps1 [-Workers 1,10]

param(
  [int[]]$Workers = @(1, 10),
  [string]$Tanggal = (Get-Date -Format "yyyy-MM-dd")
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$spec = @(
  "auth/", "basic/", "daftar kader/", "dashboard/", "data relawan/", "dokumen/",
  "log/aktifitas/", "manajemen opd/", "profil/", "riwayat relawan/", "saran hotline/",
  "stastistik/", "surat keputusan/", "security/sqlInjection"
)

foreach ($w in $Workers) {
  $out = Join-Path $root "results/$Tanggal-$w-worker"
  if (Test-Path $out) { Remove-Item -Recurse -Force $out }
  New-Item -ItemType Directory -Force $out | Out-Null

  $env:PLAYWRIGHT_JSON_OUTPUT_NAME = Join-Path $out "results.json"
  $env:PLAYWRIGHT_HTML_OUTPUT_DIR = Join-Path $out "html-report"
  $env:PLAYWRIGHT_HTML_REPORT = Join-Path $out "html-report"
  $env:PLAYWRIGHT_HTML_OPEN = "never"
  $env:FORCE_COLOR = "0"

  $mulai = Get-Date
  "== Run $w worker mulai $($mulai.ToString('yyyy-MM-dd HH:mm:ss')) ==" | Tee-Object -FilePath "$out/log.txt"
  & npx playwright test --project=chromium "--workers=$w" --reporter=list,html,json `
    "--output=$out/test-results" @spec 2>&1 |
    ForEach-Object { "$_" } | Tee-Object -FilePath "$out/log.txt" -Append
  $selesai = Get-Date
  "== Run $w worker selesai $($selesai.ToString('yyyy-MM-dd HH:mm:ss')) (durasi $([int]($selesai - $mulai).TotalSeconds) s, exit $LASTEXITCODE) ==" |
    Tee-Object -FilePath "$out/log.txt" -Append
}
