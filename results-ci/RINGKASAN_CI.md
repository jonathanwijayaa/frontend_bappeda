# Ringkasan Regresi Playwright di GitHub Actions

Workflow `.github/workflows/playwright-regression.yml`, branch `ci/playwright-regression`.
Setiap run punya folder sendiri di `results-ci/run-<id>/`, berisi `report-1w/` dan
`report-10w/` (laporan HTML `playwright-report/` dan `results-<n>w.json`).

| Run | Tanggal | Folder | Test | 1 worker (P/F/S) | 10 worker (P/F/S) |
|---|---|---|---:|---|---|
| [#40837484932](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/40837484932) | 29 Okt 2026 | `run-40837484932/` | 527 | 514 / 4 / 9 | 514 / 4 / 9 |
| [#41236813261](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41236813261) (percobaan 3) | 31 Okt 2026 | `run-41236813261/` | 529 | 506 / 13 / 10 | 506 / 13 / 10 |
| [#41294715153](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41294715153) (retest) | 1 Nov 2026 | `run-41294715153/` | 10 | 10 / 0 / 0 | 10 / 0 / 0 |
| **Hasil akhir** (#41236813261 + retest) | | `laporan-terbaru/` | 529 | **511 / 8 / 10** | **510 / 9 / 10** |
| [#41417908998](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41417908998) (run penuh 2) | 2 Nov 2026 | `run-41417908998/` | 529 | 510 / 9 / 10 | 511 / 8 / 10 |
| [#41566900310](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41566900310) (run penuh 3) | 3 Nov 2026 | `run-41566900310/` | 529 | 511 / 8 / 10 | 511 / 8 / 10 |

Rata-rata durasi ketiga run penuh (#41236813261, #41417908998, #41566900310) ada di
`rata-rata-durasi.md`.

**Laporan terbaru:** `laporan-terbaru/LAPORAN.md`, beserta JSON gabungan `results-1w.json` dan
`results-10w.json`. Dibangkitkan ulang dengan
`node scripts/gabung-retest-ci.mjs results-ci/run-41236813261 results-ci/run-41294715153 results-ci/laporan-terbaru`.

---

## Run penuh 2 (#41417908998, 2 Nov 2026) dan run penuh 3 (#41566900310, 3 Nov 2026)

Dua run penuh tambahan untuk merata-ratakan durasi. Konfigurasi sama dengan run 31 Okt:
proyek `chromium`, 529 test, THINK_TIME 1,2 s, LOAD_TIME 10 s, `retries 0`, matrix worker
[1, 10] berurutan (`max-parallel: 1`), `ubuntu-latest` → `ubuntu-24.04` versi 20261025.353.1,
Playwright 1.64.1. Tidak ada perubahan skrip test atau konfigurasi sejak `0ee2cac`; run 2
dipicu oleh commit `4f646bc` (menambah `scripts/pulihkan-penugasan.mjs`) dan run 3 oleh commit
kosong `1f3ab68`.

| Run | Worker | Mulai (UTC) | Selesai (UTC) | Durasi | Passed | Failed | Skipped | Flaky |
|---|---:|---|---|---:|---:|---:|---:|---:|
| #41417908998 | 1 | 2026-11-02 09:06:50 | 2026-11-02 11:04:53 | 1h58m03s | 510 | 9 | 10 | 0 |
| #41417908998 | 10 | 2026-11-02 11:05:52 | 2026-11-02 11:23:41 | 17m49s | 511 | 8 | 10 | 0 |
| #41566900310 | 1 | 2026-11-03 02:34:45 | 2026-11-03 04:34:09 | 1h59m24s | 511 | 8 | 10 | 0 |
| #41566900310 | 10 | 2026-11-03 04:35:08 | 2026-11-03 04:56:02 | 20m55s | 511 | 8 | 10 | 0 |

### Kegagalan

Delapan kegagalan valid yang diharapkan muncul di keempat eksekusi: TCDR.17, TCDR.29 dan
TCDR.30 (Super Admin & OPD), serta TCLA.18 dan TCLA.19 (Super Admin). Penyimpangan dari
harapan:

- **TCSK.1 Super Admin (run 2, 1 worker) gagal.** `POST /api/admin/sk` dibalas HTTP 400
  `"value too long for type character varying(100)"` (PG Error 22001), sehingga form SK tidak
  tertutup dalam LOAD_TIME. Nomor SK acak dari `formSuratKeputusan.helper.ts` berformat
  `angka/angka/<nama OPD lengkap>/tahun`; kali ini OPD terpilih "Dinas Pemberdayaan Perempuan
  Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana" sehingga nomornya 104
  karakter, melebihi batas kolom 100. Klasifikasi: **kesalahan data uji** (kegagalan tidak
  valid, muncul acak tergantung OPD terpilih); sekaligus menunjukkan form SK tidak membatasi
  panjang nomor SK dan pesan galat basis data (`dev_log`) ikut terkirim ke klien. Skrip belum
  diubah.
- **TCMO.11 lulus di 10 worker pada run 2 dan run 3.** Pada run 31 Okt TCMO.11 gagal dengan
  HTTP 500 "Release called on client which has already been released to the pool."; bug
  koneksi basis data itu intermiten (gagal 1 dari 3 run).

### Data uji

Penugasan relawan dicatat sebelum setiap run dan dipulihkan sesudahnya dengan
`node scripts/pulihkan-penugasan.mjs catat|pulihkan <snapshot>`:

| Setelah | Relawan uji OPD (NIK 3201299598696155) | Relawan lain | Dihapus |
|---|---|---|---:|
| Run 2 | 2 → 45 → 2 penugasan | – | 43 |
| Run 3 | 2 → 44 → 2 penugasan | Clayton Fisher (OPD) 1 → 2 → 1 | 43 |

Setelah pemulihan run 3, seluruh relawan yang sudah ada sebelum run 2 kembali ke kumpulan
penugasan semula (dicek terhadap kedua snapshot). Setiap run juga membuat 4 relawan baru
lewat test tambah relawan; relawan baru tidak disentuh skrip pemulihan. TCDR.28 mengganti
biodata relawan uji setiap run, sehingga namanya berubah (mis. "Carol Orn", "Cesar Volkman
Jr"); hal ini tidak dipulihkan.

---

## Retest #41294715153 — 1 Nov 2026

Hanya TC yang diperbaiki setelah run #41236813261 yang dijalankan ulang, lewat pola
`--grep` di `.github/retest-grep.txt`:
`TCDK\.10 |TCDK\.16 |TCDK\.23 |TCHR\.2 |TCHR\.22` (10 test, Super Admin & OPD). Commit
`0ee2cac`, konfigurasi dan mesin sama dengan run penuh (`ubuntu-latest`, THINK_TIME 1,2 s,
LOAD_TIME 10 s, `retries 0`), Run A lalu Run B berurutan.

| Run | Worker | Mulai (UTC) | Durasi | Passed | Failed | Skipped |
|---|---:|---|---:|---:|---:|---:|
| A | 1 | 2026-11-01 09:49:19 | 1m35s | 10 | 0 | 0 |
| B | 10 | 2026-11-01 09:51:57 | 36s | 10 | 0 | 0 |

Kelima TC tidak valid dari run #41236813261 (TCDK.10, TCDK.16, TCDK.23, TCHR.2, TCHR.22)
lulus di kedua run, untuk kedua peran.

Run penuh #41291462290 (commit `939f7b1`) sempat dipicu lalu dibatalkan di tengah jalan
(sampai TCDR.8) agar diganti retest ini; hasilnya tidak dipakai.

### Hasil akhir gabungan

Hasil run penuh #41236813261, dengan hasil 10 test di atas menggantikan hasil lamanya.
Angka percepatan tetap dari run penuh (6,46×), karena retest terlalu kecil untuk
mengukur paralelisme.

| | 1 worker | 10 worker |
|---|---:|---:|
| Passed | 511 | 510 |
| Failed | 8 | 9 |
| Skipped | 10 | 10 |
| Total | 529 | 529 |

Seluruh kegagalan yang tersisa **valid** (bug aplikasi/backend):

| Test | 1w | 10w | Bug |
|---|---|---|---|
| TCDR.17 Super Admin & OPD | Gagal | Gagal | Upload Excel relawan tidak mengirim data (`onConfirm={async () => {}}`) |
| TCDR.29 Super Admin & OPD | Gagal | Gagal | Edit penugasan menggandakan penugasan; field Penugasan tidak tersimpan |
| TCDR.30 Super Admin & OPD | Gagal | Gagal | Penugasan yang dihapus muncul kembali setelah Simpan |
| TCLA.18 Super Admin | Gagal | Gagal | API log tidak mengirim `old_value`/`new_value` |
| TCLA.19 Super Admin | Gagal | Gagal | API log tidak mengirim `nik` |
| TCMO.11 Super Admin | Lulus | Gagal | `POST /api/opd/bulk` HTTP 500 saat beban paralel (koneksi database dilepas dua kali) |

---

## Run #41236813261 — 31 Okt 2026

Commit `f46d5c9` (gabungan `test/tcdr-edit-penugasan`: TCDR.29–30 mendeteksi bug edit/hapus
penugasan, TCLA.18–19 diubah dari skip menjadi assertion, TCLA.11 aktif kembali, dan
TC Deferred). Percobaan 1 dan 2 dibatalkan sebelum selesai; yang dipakai percobaan 3.
Data penugasan relawan OPD uji dibersihkan sebelum run.

Konfigurasi sama dengan run 29 Okt kecuali jumlah test: proyek `chromium`, **529 test**
(TCDR.30 menambah 2), THINK_TIME 1,2 s, LOAD_TIME 10 s, `retries 0`, timeout per test
120 s. Mesin: GitHub-hosted runner `ubuntu-latest` → image `ubuntu-24.04`
(versi 20261025.353.1; sebelumnya tertulis 20261021.618, yang merupakan versi provisioner
runner, bukan versi image), repo privat. Run A dan Run B berurutan (`max-parallel: 1`).

### Hasil

| Run | Worker | Mulai (UTC) | Selesai (UTC) | Durasi | Passed | Failed | Skipped |
|---|---:|---|---|---:|---:|---:|---:|
| A | 1 | 2026-10-31 20:36:26 | 2026-10-31 22:36:17 | 1h59m51s | 506 | 13 | 10 |
| B | 10 | 2026-10-31 22:37:33 | 2026-10-31 22:56:07 | 18m34s | 506 | 13 | 10 |

Flaky: 0 di kedua run.

**Percepatan Run B terhadap Run A:** 7190,7 s / 1114,0 s = **6,46×**
(efisiensi paralel 6,46 / 10 = 65 %).

### Kegagalan dan validitasnya

11 kegagalan sama di kedua run; TCDK.10 OPD hanya gagal di 1 worker dan TCMO.11 hanya di
10 worker.

| Test | 1w | 10w | Valid? | Penyebab |
|---|---|---|---|---|
| TCDR.17 Super Admin & OPD | Gagal | Gagal | **Valid (bug)** | Upload Excel relawan tidak mengirim data: `DataRelawan.tsx` memasang `onConfirm={async () => {}}`. |
| TCDR.29 Super Admin & OPD | Gagal | Gagal | **Valid (bug)** | Edit penugasan menggandakan seluruh penugasan (mis. 2 → 4, 7 → 20) karena `penugasan_id` tidak dikirim; isi field Penugasan tidak disimpan backend (tetap `-`). Nilai OPD/Kader hasil edit masuk ke baris duplikat baru, bukan ke blok pertama. |
| TCDR.30 Super Admin & OPD | Gagal | Gagal | **Valid (bug)** | Penugasan yang dihapus masih tampil di form (4, seharusnya 3); setelah Simpan dibuat ulang dan jumlahnya naik (3 → 7, 6 → 27). |
| TCLA.18 Super Admin | Gagal | Gagal | **Valid (bug)** | Detail Sebelum/Sesudah tidak tampil: `GET /admin/logs` tidak mengirim `old_value`/`new_value`. |
| TCLA.19 Super Admin | Gagal | Gagal | **Valid (bug)** | Kolom NIK log selalu `-`: `GET /admin/logs` tidak mengirim `nik`. |
| TCMO.11 Super Admin | Lulus | Gagal | **Valid (bug backend, muncul di beban paralel)** | `POST /api/opd/bulk` → HTTP 500 `"Release called on client which has already been released to the pool."` (koneksi database dilepas dua kali). Hanya muncul di 10 worker. |
| TCDK.10 OPD | Gagal | Lulus | Tidak valid (data uji) | Alamat acak faker berisi apostrof (`O'Conner …`) yang ditolak `ALAMAT_VALID`, sehingga 1 baris masuk Data Kotor. |
| TCDK.16 OPD | Gagal | Gagal | Tidak valid (test) | Kader pertama OPD tidak punya PIC; kata kunci pencarian menjadi `-`. |
| TCDK.23 OPD | Gagal | Gagal | Tidak valid (test) | PIC kosong tampil "Belum ada PIC" di Detail (rancangan `DaftarKader.tsx`), test mengharapkan `-`. |
| TCHR.2 OPD | Gagal | Gagal | Tidak valid (test) | Sel Kader berisi `"-, Kader X"` (penugasan tanpa kader); test mengambil `-` sebagai nama kader. |
| TCHR.22 OPD | Gagal | Gagal | Tidak valid (test) | Test menganggap Kader `-` berarti tidak ada penugasan, padahal penugasan boleh tanpa kader. |

**Ringkasan:** 8 kegagalan valid di kedua run (bug aplikasi/backend), ditambah TCMO.11 yang
valid tetapi hanya terpicu di 10 worker. 5 kegagalan tidak valid sudah diperbaiki setelah
run ini (lihat di bawah). Selain TCMO.11, tidak ada kegagalan yang muncul karena bentrok
data antar-worker.

### Perbaikan setelah run ini

| Commit | Perubahan | TC |
|---|---|---|
| `8146f5e` | PIC diambil dari baris yang PIC-nya terisi; Detail mengharapkan "Belum ada PIC" bila kosong | TCDK.16, TCDK.23 |
| `3aac3f2` | Nilai `-` pada sel gabungan Kader/OPD dilewati; ada tidaknya penugasan dari kolom OPD | TCHR.2, TCHR.22 |
| `59b0c92` | Apostrof dibuang dari alamat acak di semua helper | TCDK.10 (dan generator OPD/Relawan/Pengajuan) |
| `e1118f0` | Pseudocode disesuaikan | — |

Ketujuh test tersebut (kedua peran) lulus saat dijalankan ulang lokal dengan 1 worker.
Perbaikan ini belum termasuk dalam run #41236813261.

### Test yang di-skip (10, sama di kedua run)

- Disengaja: TCL.9, TCDK.29 OPD, TCDO.1 Super Admin & OPD (belum ada `downloadUrl`),
  TCHR.1 OPD.
- Deferred TC: TCLA.1 Super Admin, TCSH.1 OPD & Relawan, TCS.0 Super Admin & OPD.

Dibanding run 29 Okt, TCLA.18 dan TCLA.19 tidak lagi di-skip (kini gagal karena bug), dan
TCP.1 & TCP.3 Super Admin lulus.

### Catatan data

TCDR.29–30 menggandakan penugasan setiap kali dijalankan. Setelah run ini, penugasan tiga
relawan uji dipulihkan ke kondisi sebelum run: Clara Terry Va (27 → 2),
Wallace Damore (7 → 2), dan Alfonso Nader (3 → 1).

---

## Run #40837484932 — 29 Okt 2026

Workflow `.github/workflows/playwright-regression.yml`, branch `ci/playwright-regression`
(dari `testing`), run [#40837484932](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/40837484932),
29 Okt 2026. Run A dan Run B berjalan **berurutan** (`max-parallel: 1`) di mesin terpisah
dengan spesifikasi sama.

Konfigurasi: proyek `chromium`, 527 test (cakupan baseline; tanpa `performance/*`,
`screenshot-ui`, `security/xss`, `security/accessControl`), THINK_TIME 1,2 s, LOAD_TIME 10 s,
`retries 0`, timeout per test 120 s (blok serial TCDR.32–35: 180 s). Playwright 1.64.1,
Node 20, pnpm 12.14.0. Mesin: GitHub-hosted runner `ubuntu-latest` → image `ubuntu-24.04`
(versi 20261025.353.1), repo privat.

### Hasil

Mulai/selesai = langkah "Jalankan pengujian" (UTC). Durasi = `stats.duration` di JSON.

| Run | Worker | Mesin | Mulai (UTC) | Selesai (UTC) | Durasi | Passed | Failed | Skipped |
|---|---:|---|---|---|---:|---:|---:|---:|
| A | 1 | ubuntu-latest (ubuntu-24.04) | 2026-10-29 07:46:15 | 2026-10-29 09:42:53 | 1h56m37s | 514 | 4 | 9 |
| B | 10 | ubuntu-latest (ubuntu-24.04) | 2026-10-29 09:44:05 | 2026-10-29 10:04:55 | 20m48s | 514 | 4 | 9 |

Flaky: 0 di kedua run.

**Percepatan Run B terhadap Run A:** 6997,2 s / 1248,2 s = **5,61×**
(efisiensi paralel 5,61 / 10 = 56 %).

### Kegagalan

| Spec | Test | Pesan error (ringkas) | 1 worker | 10 worker |
|---|---|---|---|---|
| `data relawan/dataRelawan.spec.ts` | TCDR.17 Super Admin upload Relawan data excel file | `expect(locator).toBeVisible() failed` — `getByText(/berhasil\|success\|data baru ditambahkan\|relawan baru ditambahkan/i)`, element(s) not found (10 s) | Gagal | Gagal |
| `data relawan/dataRelawan.spec.ts` | TCDR.17 OPD upload Relawan data excel file | sama seperti di atas | Gagal | Gagal |
| `riwayat relawan/riwayatRelawan.spec.ts` | TCHR.2 OPD filter by Nama Kader | `locator.click: Timeout 10000ms exceeded` — menunggu opsi `-` di popup filter Nama Kader | Gagal | Gagal |
| `riwayat relawan/riwayatRelawan.spec.ts` | TCHR.22 OPD views the detail modal contents | `expect(locator).not.toHaveText(expected) failed` pada nilai Kader di modal Detail Riwayat Relawan | Gagal | Gagal |

**Tidak ada kegagalan yang hanya muncul di 10 worker.** Keempat kegagalan identik di kedua
run, sehingga bukan akibat bentrok data antar-worker atau beban paralel.

#### Dugaan penyebab

- **TCDR.17 (Super Admin & OPD):** sesuai temuan run 27 Okt — `src/pages/DataRelawan.tsx`
  memasang modal unggah relawan dengan `onConfirm={async () => {}}`, sehingga data tidak
  dikirim dan notifikasi berhasil tidak muncul. TCDR.17 juga gagal di baseline 30 Sep.
- **TCHR.2 & TCHR.22 (OPD):** keduanya memilih baris riwayat pertama yang kolom Kader-nya
  terisi. Di kedua run, nilai yang terpilih adalah `-`, artinya tabel Riwayat Relawan akun
  OPD tidak menampilkan baris dengan Kader terisi. Keduanya lulus pada run laptop 27 Okt,
  sehingga dugaan terkuat adalah **perubahan data di server dev bersama** (urutan atau isi
  relawan milik OPD uji), bukan beban server atau bentrok antar-worker. Perlu dicek
  manual di halaman Riwayat Relawan dengan akun OPD sebelum diklasifikasikan.
  *(Pembaruan 1 Nov: penyebabnya ternyata sel Kader berisi `"-, Kader X"`; lihat run
  #41236813261.)*

### Test yang di-skip (9, sama di kedua run)

8 skip disengaja yang sama dengan run 27 Okt (TCL.9, TCDK.29 OPD, TCDO.1 OPD, TCLA.18,
TCLA.19, TCP.1 & TCP.3 Super Admin, TCHR.1 OPD), ditambah TCDO.1 Super Admin yang di-skip
oleh kondisi yang sama dengan TCDO.1 OPD ("Buku Panduan Aplikasi" belum punya
`downloadUrl` di `Dokumen.tsx`). Tidak ada test berstatus *did not run*.

### Catatan

- Run sebelumnya pada branch yang sama (#40837012255) gagal di `pnpm install`
  (`ERR_PNPM_IGNORED_BUILDS`, karena `pnpm-workspace.yaml` masih berisi placeholder
  `allowBuilds`) sebelum test berjalan; tidak dipakai.
- Berkas: `run-40837484932/report-1w/` dan `run-40837484932/report-10w/` berisi laporan
  HTML (`playwright-report/`) dan `results-<n>w.json`.
