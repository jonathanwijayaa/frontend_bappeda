# Load Testing

Beban dijaga **wajar** (bukan DoS) terhadap deployment Vercel milik sendiri, dan
hanya menembak endpoint **baca (GET)** dan **login** sehingga **tidak menulis/
mengubah data** (basis data tidak tercemar).

## Isi folder

| Berkas                  | Alat                             | Kegunaan                                                                  |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| `loadTesting.spec.ts`   | Playwright (`APIRequestContext`) | Load test ringan LT.1–LT.7 dalam ekosistem yang sama dengan suite E2E.    |
| `loadTestCases.spec.ts` | Playwright (`APIRequestContext`) | Satu test per test case TCLT.01–TCLT.23 di sheet "Load Testing Test Case". |
| `k6/loadTest.k6.js`     | k6                               | Test case TCLT.01–TCLT.23 yang sama, untuk beban tinggi yang akurat.      |

## Kenapa dua alat?

Playwright **bukan** alat load testing khusus — ia terikat satu proses Node
(event loop tunggal), sehingga konkurensi sangat tinggi justru mengukur
bottleneck klien, bukan server. Untuk uji beban yang valid pada beban tinggi,
**k6** (multi-thread di Go) lebih tepat. Versi Playwright disertakan agar bisa
dijalankan tanpa memasang alat tambahan.

## Metrik yang diukur

- **Latensi**: min, rata-rata, standar deviasi, p50, p90, p95, p99, maks
- **Throughput**: permintaan per detik
- **Error rate**: persentase permintaan gagal / non-2xx
- **Sebaran status code**: 200 / 401 / 429 / 5xx / ERR

## Skenario (versi Playwright)

| ID   | Skenario                                      | Jenis uji    |
| ---- | --------------------------------------------- | ------------ |
| LT.1 | Login konkuren                                | Load         |
| LT.2 | Read-heavy endpoint terproteksi (round-robin) | Load         |
| LT.3 | Ramp-up konkurensi (5→10→20)                  | Ramp-up      |
| LT.4 | Ketersediaan halaman frontend                 | Availability |
| LT.5 | Stress test — cari titik degradasi            | Stress       |
| LT.6 | Spike test — lonjakan mendadak + pemulihan    | Spike        |
| LT.7 | Soak / endurance — beban tetap selama durasi  | Soak         |

Sebelum pengukuran ada fase **warm-up** untuk membangunkan fungsi serverless
agar cold-start tidak mengotori hasil.

## Menjalankan (Playwright)

```bash
# semua skenario, beban default (wajar)
npx playwright test performance/loadTesting.spec.ts --project=chromium

# beban lebih besar
LOAD_TOTAL=300 LOAD_CONCURRENCY=30 npx playwright test performance/loadTesting.spec.ts --project=chromium
```

Hasil diekspor otomatis ke `test-results/load-testing/load-results-<timestamp>.json`
dan `.csv`, plus tabel ringkasan lintas-skenario di konsol.

Test case TCLT (skala `LT_VU_SCALE`/`LT_TIME_SCALE`, default 0.05; hasil di
`test-results/load-testing/tclt-results-<timestamp>.json`):

```bash
npx playwright test performance/loadTestCases.spec.ts --project=chromium -g "TCLT.03"
```

### Environment variable

| Variabel                 | Default                     | Keterangan                                  |
| ------------------------ | --------------------------- | ------------------------------------------- |
| `VITE_API_URL`           | deployment                  | Base URL backend                            |
| `LOAD_BASE_URL`          | deployment                  | Base URL frontend (LT.4)                    |
| `LOAD_TOTAL`             | 200                         | Total permintaan per skenario               |
| `LOAD_CONCURRENCY`       | 20                          | Permintaan konkuren                         |
| `LOAD_WARMUP`            | 5                           | Permintaan warm-up per endpoint             |
| `LOAD_PACING_MS`         | 0                           | Think time antar-permintaan per worker (ms) |
| `LOAD_MAX_ERROR_PCT`     | 25                          | Ambang lunak error rate (%)                 |
| `LOAD_MAX_P95_MS`        | 0                           | Ambang lunak p95 (ms); 0 = nonaktif         |
| `LOAD_STRESS_LEVELS`     | `10,20,40`                  | Tingkat konkurensi stress test              |
| `LOAD_SPIKE_CONCURRENCY` | 40                          | Konkurensi saat lonjakan spike              |
| `LOAD_SOAK_SECONDS`      | 15                          | Durasi soak (detik); 0 = lewati             |
| `LOAD_OUT_DIR`           | `test-results/load-testing` | Folder output                               |

## Menjalankan (k6)

Pasang k6 lebih dulu (`winget install k6.k6` atau `choco install k6`), lalu:

```bash
# satu test case
k6 run -e TC=TCLT.03 src/tests/performance/k6/loadTest.k6.js

# semua test case yang bisa dijalankan, berurutan (~18 menit pada skala default)
k6 run src/tests/performance/k6/loadTest.k6.js

# sesuai rancangan penuh (disarankan ke backend lokal)
k6 run -e VU_SCALE=1 -e TIME_SCALE=1 -e VITE_API_URL=http://localhost:3000/api \
       -e TC=TCLT.02 src/tests/performance/k6/loadTest.k6.js
```

Setiap TCLT menjadi satu skenario `ramping-vus` dengan VU, ramp-up, durasi,
step stress, dan fase spike sesuai sheet. Kriteria Expected Result dipasang
sebagai threshold per skenario (`p(90)`, `http_req_failed`, `checks`).
TCLT.06, TCLT.07 (Sign Up) dan TCLT.18 (unggah foto profil) tidak dibuatkan
skenario karena fiturnya tidak ada di aplikasi.

| Variabel                  | Default                                        | Keterangan                              |
| ------------------------- | ---------------------------------------------- | --------------------------------------- |
| `TC`                      | semua                                          | Daftar TC dipisah koma, mis. `TCLT.01,TCLT.03` |
| `VU_SCALE`                | 0.05                                           | Pengali jumlah VU                       |
| `TIME_SCALE`              | 0.05                                           | Pengali ramp-up dan durasi              |
| `THINK_S`                 | 1                                              | Think time per iterasi VU (detik)       |
| `VITE_API_URL`            | deployment                                     | Base URL backend                        |
| `LOAD_BASE_URL`           | deployment                                     | Base URL frontend (TCLT.01/02)          |
| `SA_NIK`/`SA_PASS`, `OPD_NIK`/`OPD_PASS`, `REL_NIK`/`REL_PASS` | akun uji | Kredensial per peran |
| `OUT`                     | `test-results/load-testing/k6-tclt-summary.json` | Berkas ringkasan JSON                 |

## Catatan hasil

Ambang batas sengaja **lunak/informasional** karena cold-start serverless tier
gratis wajar membuat sebagian permintaan lambat. Angka absolut **tidak mengikat**
sebagai bukti performa; gunakan sebagai gambaran tren (mis. bagaimana p95 naik
seiring konkurensi), bukan sertifikasi SLA.
