# Rata-rata Durasi Regresi Penuh di GitHub Actions

Tiga run penuh dengan konfigurasi yang sama: proyek `chromium`, 529 test, THINK_TIME 1,2 s,
LOAD_TIME 10 s, `retries 0`, matrix worker [1, 10] dijalankan berurutan (`max-parallel: 1`),
GitHub-hosted runner `ubuntu-latest` → `ubuntu-24.04` versi 20261025.353.1, Playwright 1.64.1,
Node 20. Durasi = `stats.duration` pada `results-<n>w.json` (sejak Playwright mulai sampai
test terakhir selesai, tanpa waktu instalasi).

## Durasi per run

| Run | Tanggal | 1 worker (detik) | 1 worker | 10 worker (detik) | 10 worker | Percepatan | Efisiensi paralel |
|---|---|---:|---|---:|---|---:|---:|
| [#41236813261](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41236813261) | 31 Okt 2026 | 7190,7 | 1 jam 59 menit 51 detik | 1114,0 | 18 menit 34 detik | 6,46× | 64,6 % |
| [#41417908998](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41417908998) | 2 Nov 2026 | 7083,1 | 1 jam 58 menit 3 detik | 1068,6 | 17 menit 49 detik | 6,63× | 66,3 % |
| [#41566900310](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/41566900310) | 3 Nov 2026 | 7163,7 | 1 jam 59 menit 24 detik | 1254,5 | 20 menit 55 detik | 5,71× | 57,1 % |

Percepatan = durasi 1 worker / durasi 10 worker pada run yang sama; efisiensi paralel =
percepatan / 10.

## Statistik (n = 3)

| | 1 worker | 10 worker |
|---|---|---|
| Rata-rata | 7145,8 s (1 jam 59 menit 6 detik) | 1145,7 s (19 menit 6 detik) |
| Simpangan baku (sampel, n − 1) | 56,0 s (koefisien variasi 0,8 %) | 96,9 s (koefisien variasi 8,5 %) |
| Rentang (min–maks) | 7083,1–7190,7 s (1 jam 58 menit 3 detik – 1 jam 59 menit 51 detik) | 1068,6–1254,5 s (17 menit 49 detik – 20 menit 55 detik) |

| | Nilai |
|---|---|
| Rata-rata percepatan per run | 6,26× (simpangan baku 0,49; rentang 5,71–6,63×) |
| Rata-rata efisiensi paralel | 62,6 % |
| Rasio rata-rata durasi (7145,8 / 1145,7) | 6,24× |

## TCMO.11 di 10 worker

Gagal 1 dari 3 run. Pada 31 Okt `POST /api/opd/bulk` dibalas HTTP 500 "Release called on
client which has already been released to the pool."; pada 2 dan 3 Nov TCMO.11 lulus. Di
1 worker TCMO.11 lulus pada ketiga run. Bug koneksi basis data ini bersifat intermiten.

## Hasil per run

| Run | 1 worker (P/F/S/Flaky) | 10 worker (P/F/S/Flaky) |
|---|---|---|
| #41236813261 | 506 / 13 / 10 / 0 | 506 / 13 / 10 / 0 |
| #41417908998 | 510 / 9 / 10 / 0 | 511 / 8 / 10 / 0 |
| #41566900310 | 511 / 8 / 10 / 0 | 511 / 8 / 10 / 0 |

Delapan kegagalan valid (TCDR.17, TCDR.29, TCDR.30 untuk Super Admin dan OPD; TCLA.18 dan
TCLA.19 untuk Super Admin) muncul di semua eksekusi.

## Catatan keterbandingan

- **Versi skrip.** Run 31 Okt memakai skrip sebelum perbaikan TCDK.10/16/23 dan TCHR.2/22
  (commit `f46d5c9`); kelima test itu gagal di sana. Run 2 dan 3 memakai skrip setelah
  perbaikan (`0ee2cac`, tanpa perubahan skrip sesudahnya). Test yang gagal umumnya menunggu
  sampai LOAD_TIME 10 s habis, sehingga perbedaan jumlah kegagalan ikut memengaruhi durasi,
  walau kecil dibanding total.
- **Kegagalan data uji di run 2.** TCSK.1 gagal di 1 worker karena nomor SK acak 104 karakter
  melebihi batas kolom 100 (lihat `RINGKASAN_CI.md`). Gagalnya terjadi setelah ±31 detik,
  dibanding ±23 detik saat lulus, jadi dampaknya pada durasi total kecil.
- **Server bersama.** Ketiga run menguji server development yang dipakai bersama
  (frontend dan backend di Vercel) pada jam berbeda. Variasi durasi 10 worker (koefisien
  variasi 8,5 %) jauh lebih besar daripada 1 worker (0,8 %); run 3 yang paling lambat di
  10 worker menurunkan percepatannya menjadi 5,71×. Penyebab pastinya tidak dapat dipastikan
  dari laporan; dugaan terkuat adalah beban atau latensi server saat 10 worker berjalan
  bersamaan.
- **Mesin.** Ketiga run memakai image runner dan versi Playwright yang sama.
- **Data uji.** Penugasan relawan uji dipulihkan sebelum run 2 dan run 3 dengan
  `scripts/pulihkan-penugasan.mjs`, sehingga ketiga run dimulai dari data penugasan yang sama
  untuk relawan uji. Daftar relawan sendiri bertambah ±4–20 relawan per run karena test tambah
  relawan, sehingga relawan teratas yang dipakai TCDR.28–31 Super Admin bisa berbeda antarrun.
