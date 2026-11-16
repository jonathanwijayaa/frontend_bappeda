# Laporan Regresi Terbaru (GitHub Actions)

Gabungan run penuh [#41236813261](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41236813261) (2026-10-31) dengan retest [#41294715153](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41294715153) (2026-11-01). Hasil test yang di-retest menggantikan hasil lamanya; test lain memakai hasil run penuh. Durasi dan percepatan diambil dari run penuh, karena retest hanya menjalankan sebagian kecil test.

Konfigurasi: proyek `chromium`, GitHub-hosted runner `ubuntu-latest` (ubuntu-24.04), THINK_TIME 1,2 s, LOAD_TIME 10 s, `retries 0`. Run 1 worker dan 10 worker berjalan berurutan.

Dibangkitkan oleh `scripts/gabung-retest-ci.mjs`. JSON gabungan: `results-1w.json`, `results-10w.json` (test hasil retest ditandai anotasi `retest`). Laporan HTML tidak dapat digabung; lihat `playwright-report/` di folder masing-masing run:

- Run penuh: `results-ci/run-41236813261/report-<n>w/playwright-report/`
- Retest: `results-ci/run-41294715153/report-<n>w/playwright-report/`

## a. Ringkasan

| Run | Total | Passed | Failed | Skipped | Flaky | Durasi run penuh |
|---|---:|---:|---:|---:|---:|---:|
| 1 worker | 529 | 511 | 8 | 10 | 0 | 1h59m51s |
| 10 worker | 529 | 510 | 9 | 10 | 0 | 18m34s |

**Percepatan 10 worker terhadap 1 worker:** 7190,7 s / 1114,0 s = **6,46×** (efisiensi paralel 65 %).

## b. Ringkasan per modul

| Modul | Total | 1w Lulus | 1w Gagal | 1w Skip | 10w Lulus | 10w Gagal | 10w Skip |
|---|---:|---:|---:|---:|---:|---:|---:|
| TCL | 31 | 30 | 0 | 1 | 30 | 0 | 1 |
| TCBP | 8 | 8 | 0 | 0 | 8 | 0 | 0 |
| TCD | 24 | 24 | 0 | 0 | 24 | 0 | 0 |
| TCMO | 40 | 40 | 0 | 0 | 39 | 1 | 0 |
| TCDK | 101 | 100 | 0 | 1 | 100 | 0 | 1 |
| TCDR | 98 | 92 | 6 | 0 | 92 | 6 | 0 |
| TCSK | 28 | 28 | 0 | 0 | 28 | 0 | 0 |
| TCLA | 21 | 18 | 2 | 1 | 18 | 2 | 1 |
| TCS | 2 | 0 | 0 | 2 | 0 | 0 | 2 |
| TCDO | 21 | 19 | 0 | 2 | 19 | 0 | 2 |
| TCSH | 18 | 16 | 0 | 2 | 16 | 0 | 2 |
| TCP | 57 | 57 | 0 | 0 | 57 | 0 | 0 |
| TCHR | 48 | 47 | 0 | 1 | 47 | 0 | 1 |
| TCSQL | 15 | 15 | 0 | 0 | 15 | 0 | 0 |
| TCSQLA | 17 | 17 | 0 | 0 | 17 | 0 | 0 |

## c. Kegagalan

| Test | 1 worker | 10 worker | Pesan error (ringkas) |
|---|---|---|---|
| Data Relawan - Super Admin › TCDR.17 Super Admin upload Relawan data excel file | Gagal | Gagal | `Error: expect(locator).toBeVisible() failed Locator: getByText(/berhasil\|success\|data baru ditambahkan\|relawan baru ditambahkan/i) Expected: visible` |
| Data Relawan - Super Admin › TCDR.28-31 Super Admin Detail Relawan › TCDR.29 Super Admin edit Relawan penugasan detail form | Gagal | Gagal | `Error: Jumlah penugasan berubah setelah simpan (penugasan terduplikasi) expect(received).toBe(expected) // Object.is equality Expected: 2` |
| Data Relawan - Super Admin › TCDR.28-31 Super Admin Detail Relawan › TCDR.30 Super Admin delete penugasan on detail form | Gagal | Gagal | `Error: Penugasan yang dihapus masih tampil di form Detail expect(locator).toHaveCount(expected) failed Locator:  locator('//label[normalize-space(text())="Penugasan"]')` |
| Data Relawan - OPD › TCDR.17 OPD upload Relawan data excel file | Gagal | Gagal | `Error: expect(locator).toBeVisible() failed Locator: getByText(/berhasil\|success\|data baru ditambahkan\|relawan baru ditambahkan/i) Expected: visible` |
| Data Relawan - OPD › TCDR.28-31 OPD Detail Relawan › TCDR.29 OPD edit Relawan penugasan detail form | Gagal | Gagal | `Error: Jumlah penugasan berubah setelah simpan (penugasan terduplikasi) expect(received).toBe(expected) // Object.is equality Expected: 2` |
| Data Relawan - OPD › TCDR.28-31 OPD Detail Relawan › TCDR.30 OPD delete penugasan on detail form | Gagal | Gagal | `Error: Penugasan yang dihapus masih tampil di form Detail expect(locator).toHaveCount(expected) failed Locator:  locator('//label[normalize-space(text())="Penugasan"]')` |
| Log Aktifitas - Super Admin › TCLA.18 Super Admin views the recorded value changes | Gagal | Gagal | `Error: Detail perubahan (Sebelum/Sesudah) tidak tampil pada log Ubah Data expect(locator).toBeVisible() failed Locator: locator('//h2[normalize-space(.)="Detail Log Aktivitas"]/../../..').getByText(/^Sebelum$/).first()` |
| Log Aktifitas - Super Admin › TCLA.19 Super Admin searches a log by NIK | Gagal | Gagal | `Error: Kolom NIK di tabel log kosong (semua baris berisi "-") expect(received).toBeDefined() Received: undefined` |
| TCMO.11 Super Admin upload OPD excel file | Lulus | Gagal | `Error: expect(locator).toBeVisible() failed Locator: getByText(/berhasil\|success/i) Expected: visible` |

## d. Test yang di-retest

| Test | 1w sebelum → sesudah | 10w sebelum → sesudah |
|---|---|---|
| Daftar Kader - Super Admin › TCDK.10 Super Admin upload Kader data excel file | Lulus → Lulus | Lulus → Lulus |
| Daftar Kader - Super Admin › TCDK.23 Super Admin access Kader detail | Lulus → Lulus | Lulus → Lulus |
| Daftar Kader - Super Admin › TCDK.14-21 Super Admin Search Bar › TCDK.16 Super Admin input PIC name in search bar | Lulus → Lulus | Lulus → Lulus |
| Daftar Kader - OPD › TCDK.10 OPD upload Kader data excel file | Gagal → Lulus | Lulus → Lulus |
| Daftar Kader - OPD › TCDK.23 OPD access Kader detail | Gagal → Lulus | Gagal → Lulus |
| Daftar Kader - OPD › TCDK.14-21 OPD Search Bar › TCDK.16 OPD input PIC name in search bar | Gagal → Lulus | Gagal → Lulus |
| Riwayat Relawan - Super Admin › TCHR.2 Super Admin filter by Nama Kader | Lulus → Lulus | Lulus → Lulus |
| Riwayat Relawan - Super Admin › TCHR.22 Super Admin views the detail modal contents | Lulus → Lulus | Lulus → Lulus |
| Riwayat Relawan - OPD › TCHR.2 OPD filter by Nama Kader | Gagal → Lulus | Gagal → Lulus |
| Riwayat Relawan - OPD › TCHR.22 OPD views the detail modal contents | Gagal → Lulus | Gagal → Lulus |

## e. Test yang di-skip

10 test (sama di kedua run): TCL.9 Click forget password; TCDK.29 OPD must pick the OPD from the list; TCDO.1 Super Admin downloads the application user guide; TCDO.1 OPD downloads the application user guide; TCLA.1 Super Admin views the log sorted by newest activity; TCHR.1 OPD filter by Nama OPD; TCSH.1 OPD clicks the telephone number hyperlink; TCSH.1 Relawan clicks the telephone number hyperlink; TCS.0 Super Admin no longer has a separate Statistik page; TCS.0 OPD no longer has a separate Statistik page.

## Analisis

<!-- ANALISIS -->

Seluruh kegagalan yang tersisa **valid**, yaitu bug aplikasi atau backend, bukan kesalahan
test maupun gangguan lingkungan:

| TC | Bug | Lapisan |
|---|---|---|
| TCDR.17 (Super Admin & OPD) | Upload Excel relawan tidak mengirim data: `DataRelawan.tsx` memasang `onConfirm={async () => {}}`, sehingga notifikasi berhasil tidak muncul. | Frontend |
| TCDR.29 (Super Admin & OPD) | Edit penugasan menggandakan seluruh penugasan (mis. 2 → 4) karena `penugasan_id` tidak dikirim saat simpan; isi field Penugasan tidak disimpan (tetap `-`). | Frontend + backend |
| TCDR.30 (Super Admin & OPD) | Penugasan yang dihapus masih tampil di form, dan dibuat ulang setelah Simpan sehingga jumlahnya justru bertambah. | Frontend + backend |
| TCLA.18 (Super Admin) | Detail Sebelum/Sesudah tidak tampil karena `GET /admin/logs` tidak mengirim `old_value`/`new_value`. | Backend |
| TCLA.19 (Super Admin) | Kolom NIK di log selalu `-` karena `GET /admin/logs` tidak mengirim `nik`. | Backend |
| TCMO.11 (Super Admin, hanya 10 worker) | `POST /api/opd/bulk` membalas HTTP 500 `"Release called on client which has already been released to the pool."`: koneksi database dilepas dua kali, terpicu saat beban paralel. | Backend |

TCMO.11 satu-satunya kegagalan yang hanya muncul di 10 worker. Kegagalan lain identik di
kedua run, sehingga tidak dipengaruhi jumlah worker.

Lima TC yang gagal di run penuh karena kesalahan test (TCDK.10, TCDK.16, TCDK.23, TCHR.2,
TCHR.22) diperbaiki lalu di-retest dan lulus di kedua run; rinciannya di
`results-ci/RINGKASAN_CI.md`.
