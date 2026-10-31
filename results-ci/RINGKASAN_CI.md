# Ringkasan Regresi Playwright di GitHub Actions

Workflow `.github/workflows/playwright-regression.yml`, branch `ci/playwright-regression`
(dari `testing`), run [#40837484932](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/40837484932),
29 Okt 2026. Run A dan Run B berjalan **berurutan** (`max-parallel: 1`) di mesin terpisah
dengan spesifikasi sama.

Konfigurasi: proyek `chromium`, 527 test (cakupan baseline; tanpa `performance/*`,
`screenshot-ui`, `security/xss`, `security/accessControl`), THINK_TIME 1,2 s, LOAD_TIME 10 s,
`retries 0`, timeout per test 120 s (blok serial TCDR.32–35: 180 s). Playwright 1.64.1,
Node 20, pnpm 12.14.0. Mesin: GitHub-hosted runner `ubuntu-latest` → image `ubuntu-24.04`
(versi 20261025.353.1), repo privat.

## Hasil

Mulai/selesai = langkah "Jalankan pengujian" (UTC). Durasi = `stats.duration` di JSON.

| Run | Worker | Mesin | Mulai (UTC) | Selesai (UTC) | Durasi | Passed | Failed | Skipped |
|---|---:|---|---|---|---:|---:|---:|---:|
| A | 1 | ubuntu-latest (ubuntu-24.04) | 2026-10-29 07:46:15 | 2026-10-29 09:42:53 | 1h56m37s | 514 | 4 | 9 |
| B | 10 | ubuntu-latest (ubuntu-24.04) | 2026-10-29 09:44:05 | 2026-10-29 10:04:55 | 20m48s | 514 | 4 | 9 |

Flaky: 0 di kedua run.

**Percepatan Run B terhadap Run A:** 6997,2 s / 1248,2 s = **5,61×**
(efisiensi paralel 5,61 / 10 = 56 %).

## Kegagalan

| Spec | Test | Pesan error (ringkas) | 1 worker | 10 worker |
|---|---|---|---|---|
| `data relawan/dataRelawan.spec.ts` | TCDR.17 Super Admin upload Relawan data excel file | `expect(locator).toBeVisible() failed` — `getByText(/berhasil\|success\|data baru ditambahkan\|relawan baru ditambahkan/i)`, element(s) not found (10 s) | Gagal | Gagal |
| `data relawan/dataRelawan.spec.ts` | TCDR.17 OPD upload Relawan data excel file | sama seperti di atas | Gagal | Gagal |
| `riwayat relawan/riwayatRelawan.spec.ts` | TCHR.2 OPD filter by Nama Kader | `locator.click: Timeout 10000ms exceeded` — menunggu opsi `-` di popup filter Nama Kader | Gagal | Gagal |
| `riwayat relawan/riwayatRelawan.spec.ts` | TCHR.22 OPD views the detail modal contents | `expect(locator).not.toHaveText(expected) failed` pada nilai Kader di modal Detail Riwayat Relawan | Gagal | Gagal |

**Tidak ada kegagalan yang hanya muncul di 10 worker.** Keempat kegagalan identik di kedua
run, sehingga bukan akibat bentrok data antar-worker atau beban paralel.

### Dugaan penyebab

- **TCDR.17 (Super Admin & OPD):** sesuai temuan run 27 Okt — `src/pages/DataRelawan.tsx`
  memasang modal unggah relawan dengan `onConfirm={async () => {}}`, sehingga data tidak
  dikirim dan notifikasi berhasil tidak muncul. TCDR.17 juga gagal di baseline 30 Sep.
- **TCHR.2 & TCHR.22 (OPD):** keduanya memilih baris riwayat pertama yang kolom Kader-nya
  terisi. Di kedua run, nilai yang terpilih adalah `-`, artinya tabel Riwayat Relawan akun
  OPD tidak menampilkan baris dengan Kader terisi. Keduanya lulus pada run laptop 27 Okt,
  sehingga dugaan terkuat adalah **perubahan data di server dev bersama** (urutan atau isi
  relawan milik OPD uji), bukan beban server atau bentrok antar-worker. Perlu dicek
  manual di halaman Riwayat Relawan dengan akun OPD sebelum diklasifikasikan.

## Test yang di-skip (9, sama di kedua run)

8 skip disengaja yang sama dengan run 27 Okt (TCL.9, TCDK.29 OPD, TCDO.1 OPD, TCLA.18,
TCLA.19, TCP.1 & TCP.3 Super Admin, TCHR.1 OPD), ditambah TCDO.1 Super Admin yang di-skip
oleh kondisi yang sama dengan TCDO.1 OPD ("Buku Panduan Aplikasi" belum punya
`downloadUrl` di `Dokumen.tsx`). Tidak ada test berstatus *did not run*.

## Catatan

- Run sebelumnya pada branch yang sama (#40837012255) gagal di `pnpm install`
  (`ERR_PNPM_IGNORED_BUILDS`, karena `pnpm-workspace.yaml` masih berisi placeholder
  `allowBuilds`) sebelum test berjalan; tidak dipakai.
- Berkas: `report-1w/` dan `report-10w/` berisi laporan HTML (`playwright-report/`) dan
  `results-<n>w.json`.
