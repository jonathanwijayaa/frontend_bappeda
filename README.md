# Sistem Informasi Manajemen Relawan BAPPEDA Kota Yogyakarta

Aplikasi web untuk mengelola data **OPD**, **kader**, dan **relawan** di
lingkungan BAPPEDA Kota Yogyakarta, beserta surat keputusan, pengajuan
perubahan data, dan saran/hotline. Repositori ini berisi **frontend**
(React + Vite) dan **suite pengujian end-to-end** (Playwright) yang dipakai
untuk penelitian skripsi.

- Frontend (deploy): <https://frontend-bappeda.vercel.app>
- Backend API (repositori terpisah): <https://backend-skripsi-relawan.vercel.app/api>

---

## Daftar Isi

1. [Fitur per Peran](#fitur-per-peran)
2. [Teknologi](#teknologi)
3. [Struktur Proyek](#struktur-proyek)
4. [Menjalankan Aplikasi](#menjalankan-aplikasi)
5. [Pengujian E2E](#pengujian-e2e)
6. [Dokumentasi Tambahan](#dokumentasi-tambahan)
7. [Konvensi Kode](#konvensi-kode)

---

## Fitur per Peran

Aplikasi punya tiga peran. Akses halaman dibatasi di `src/App.tsx`
(`ProtectedRoute`); peran yang tidak berhak dialihkan ke `/unauthorized`.

| Halaman           | Rute               | Super Admin | OPD | Relawan |
| ----------------- | ------------------ | :---------: | :-: | :-----: |
| Dashboard         | `/dashboard`       |      ✓      |  ✓  |         |
| Manajemen OPD     | `/manajemen-opd`   |      ✓      |     |         |
| Daftar Kader      | `/daftar-kader`    |      ✓      |  ✓  |         |
| Data Relawan      | `/data-relawan`    |      ✓      |  ✓  |         |
| Surat Keputusan   | `/surat-keputusan` |      ✓      |  ✓  |         |
| Log Aktivitas     | `/log-aktifitas`   |      ✓      |     |         |
| Dokumen           | `/dokumen`         |      ✓      |  ✓  |         |
| Riwayat Relawan   | `/histori-relawan` |      ✓      |  ✓  |         |
| Profil            | `/profil`          |      ✓      |  ✓  |         |
| Saran / Hotline   | `/saran-hotline`   |      ✓      |  ✓  |    ✓    |
| Profil Saya       | `/profil-relawan`  |             |     |    ✓    |
| Penugasan Saya    | `/komunitas-saya`  |             |     |    ✓    |
| Riwayat Pengajuan | `/riwayat`         |             |     |    ✓    |
| Ubah Kata Sandi   | `/ubah-password`   |             |     |    ✓    |

**Super Admin** mengelola seluruh data: OPD, kader (termasuk ganti PIC dan
status aktif), relawan beserta penugasannya, surat keputusan, serta meninjau
log aktivitas.

**Admin OPD** mengelola kader dan relawan **di instansinya sendiri**. Relawan
hanya terlihat oleh OPD bila punya penugasan ke kader milik OPD tersebut.

**Relawan** melihat profil dan penugasannya, lalu dapat **mengajukan
pembaruan data** (alamat, kemantren, kelurahan, No. HP). Pengajuan berstatus
_Menunggu Review_ sampai disetujui atau ditolak oleh Super Admin / Admin OPD
di halaman Data Relawan.

Fitur umum lain: impor data dari Excel (dengan template yang bisa diunduh),
ekspor PDF tabel, unggah PDF surat keputusan, dan grafik ringkasan di
dashboard. Halaman Statistik ada di kode (`src/pages/Statistik.tsx`) tetapi
rutenya sedang dinonaktifkan.

---

## Teknologi

| Bagian        | Pustaka                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| UI            | React 18, React Router 7, Tailwind CSS 4, lucide-react                    |
| Data & API    | TanStack Query 5, Axios (token Bearer + penanganan 401 global)            |
| Grafik        | Recharts                                                                  |
| Berkas        | xlsx (impor/ekspor Excel), jsPDF + autotable (ekspor PDF), react-dropzone |
| Build         | Vite 7, TypeScript 5.4                                                    |
| Pengujian     | Playwright Test, @faker-js/faker, k6 (load test)                          |
| Kualitas kode | ESLint, Prettier, lefthook (pre-commit)                                   |
| Deploy        | Vercel (SPA rewrite di `vercel.json`)                                     |

Skema basis data PostgreSQL yang dipakai backend tersedia di `db_schema.sql`
(tabel `users`, `opd`, `pengelola_opd`, `kader`, `pic_kader`, `relawan`,
`penugasan_relawan`, `pengajuan_perubahan_data`, `surat_keputusan`,
`saran_masukan`, `audit_logs`).

---

## Struktur Proyek

```
.
├── src/
│   ├── pages/             # Satu file per halaman (lihat tabel rute)
│   ├── components/        # Layout, Sidebar, Header, grafik, komponen UI
│   ├── hooks/             # Query & mutation TanStack Query per domain
│   ├── context/           # AuthContext (sesi login), ToastContext
│   ├── lib/               # axios.ts (API client), queryClient.ts
│   ├── types/, utils/     # Tipe data dan fungsi bantu
│   ├── excel/             # Template Excel yang bisa diunduh pengguna
│   ├── assets/            # Gambar dan berkas sampel untuk pengujian unggah
│   ├── helpers/           # Helper pengujian (login, form, timing, dsb.)
│   └── tests/             # Spec Playwright per modul (lihat Pengujian E2E)
├── docs/pseudocode/       # Pseudocode pengujian (Bab IV & Lampiran A skripsi)
├── scripts/               # Skrip eksekusi ulang & pemeriksa pseudocode
├── results/               # Hasil eksekusi ulang (log, results.json, ringkasan)
├── db_schema.sql          # Skema basis data
├── playwright.config.ts   # Konfigurasi pengujian utama
├── vite.config.ts         # Konfigurasi Vite (proxy /api ke localhost:3000)
└── vercel.json            # Rewrite SPA untuk Vercel
```

> `server.ts` adalah titik masuk backend Express yang meng-import
> `src/routes/*`. Folder itu **tidak ada di repositori ini**; backend
> dikembangkan dan di-deploy terpisah.

---

## Menjalankan Aplikasi

### Prasyarat

- **Node.js** 20.19 atau lebih baru (dibutuhkan Vite 7)
- **pnpm** 10

### Instalasi

```bash
pnpm install
```

### Variabel lingkungan

Buat file `.env` di root:

```bash
# URL dasar API backend (dipakai src/lib/axios.ts)
VITE_API_URL=https://backend-skripsi-relawan.vercel.app/api
```

Untuk backend lokal di `http://localhost:3000`, isi `VITE_API_URL=/api`;
Vite akan mem-proxy `/api` ke port 3000.

### Perintah

| Perintah          | Keterangan                                      |
| ----------------- | ----------------------------------------------- |
| `pnpm dev`        | Server pengembangan Vite                        |
| `pnpm build`      | Cek tipe (`tsc`) lalu build produksi ke `dist/` |
| `pnpm preview`    | Menyajikan hasil build secara lokal             |
| `pnpm type-check` | Cek tipe TypeScript saja                        |

---

## Pengujian E2E

Pengujian dijalankan terhadap aplikasi yang **sudah ter-deploy**
(`frontend-bappeda.vercel.app`), bukan server lokal, di tiga browser:
chromium, firefox, dan webkit.

### Modul yang diuji

| Modul                   | Folder di `src/tests/` | Prefix TC                  |
| ----------------------- | ---------------------- | -------------------------- |
| Login / Autentikasi     | `auth/`                | TCL                        |
| Halaman dasar (sidebar) | `basic/`               | TCBP                       |
| Dashboard               | `dashboard/`           | TCD                        |
| Manajemen OPD           | `manajemen opd/`       | TCMO                       |
| Daftar Kader            | `daftar kader/`        | TCDK                       |
| Data Relawan            | `data relawan/`        | TCDR                       |
| Surat Keputusan         | `surat keputusan/`     | TCSK                       |
| Riwayat Relawan         | `riwayat relawan/`     | TCHR                       |
| Log Aktivitas           | `log/aktifitas/`       | TCLA                       |
| Dokumen                 | `dokumen/`             | TCDO                       |
| Saran / Hotline         | `saran hotline/`       | TCSH                       |
| Profil                  | `profil/`              | TCP                        |
| Statistik               | `stastistik/`          | TCS                        |
| Keamanan                | `security/`            | TCSQL, TCSQLA, TCAC, TCXSS |
| Performa (load test)    | `performance/`         | LT, TCLT                   |

Rincian cakupan tiap modul ada di
[`src/tests/CATATAN-TESTS.md`](src/tests/CATATAN-TESTS.md). Untuk skripsi,
pengujian keamanan yang dilaporkan hanya SQL Injection; `accessControl` dan
`xss` adalah kerja tambahan di luar cakupan.

### Akun uji

Kredensial akun demo untuk ketiga peran ada di
`src/helpers/credentials.helper.ts`. Beberapa test bergantung pada data di
aplikasi, misalnya relawan uji harus punya penugasan ke kader milik OPD
uji agar test pengajuan perubahan data (TCDR.32–35) untuk OPD bisa berjalan.

### Menjalankan test

Pasang browser Playwright sekali:

```bash
pnpm exec playwright install --with-deps
```

| Perintah           | Keterangan                                     |
| ------------------ | ---------------------------------------------- |
| `pnpm test:e2e`    | Jalankan semua test (headless)                 |
| `pnpm test:e2e:ui` | Playwright UI mode (interaktif)                |
| `pnpm report`      | Buka laporan HTML terakhir                     |
| `pnpm clean`       | Hapus `test-results/` dan `playwright-report/` |

Contoh lain:

```bash
# Satu modul, satu browser
pnpm exec playwright test "src/tests/data relawan" --project=chromium

# Berdasarkan TC-ID di judul test
pnpm exec playwright test -g "TCDR\.3[2-5]"

# Atur jumlah worker (bawaan: 50% core CPU; di CI: 10)
pnpm exec playwright test --workers=1
```

### Think time dan load time

Semua test meniru jeda pengguna nyata dan memakai batas tunggu yang sama.
Nilainya didefinisikan di `src/helpers/timing.helper.ts`:

| Konstanta    | Nilai     | Arti                                                           |
| ------------ | --------- | -------------------------------------------------------------- |
| `THINK_TIME` | 1.200 ms  | Jeda tetap setelah tiap aksi pengguna (klik, isi, pilih, dsb.) |
| `LOAD_TIME`  | 10.000 ms | Batas maksimal menunggu halaman, elemen, atau respons API      |

Keduanya bisa diubah lewat variabel lingkungan `THINK_TIME_MS` dan
`LOAD_TIME_MS`. Test tidak diulang otomatis (`retries: 0`) supaya kegagalan
tidak tersamarkan. Latar belakang dan rincian perubahannya ada di
[`CHANGES_THINK_LOAD_TIME.md`](CHANGES_THINK_LOAD_TIME.md).

### Eksekusi ulang untuk skripsi

`scripts/rerun.ps1` menjalankan 527 test chromium yang sebanding dengan
baseline (tanpa `performance/`, `screenshot-ui`, `accessControl`, `xss`)
dengan 1 lalu 10 worker, dan menyimpan hasilnya di `results/<tanggal>-<n>-worker/`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/rerun.ps1 -Workers 1,10
node scripts/summarize-rerun.mjs   # memperbarui results/RINGKASAN_RERUN.md
```

### Load test

Lihat [`src/tests/performance/README.md`](src/tests/performance/README.md).
Tersedia versi Playwright (beban ringan) dan k6 (beban tinggi). Beban dibatasi
pada endpoint baca dan login agar data tidak berubah.

---

## Dokumentasi Tambahan

| Berkas                                   | Isi                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `src/tests/CATATAN-TESTS.md`             | Cakupan pengujian per modul                                         |
| `src/tests/CATATAN-PEMETAAN.md`          | Pemetaan test ke smoke & regression testing (Bab IV)                |
| `src/tests/security/CATATAN-KEAMANAN.md` | Cakupan dan hasil pengujian keamanan                                |
| `CHANGES_THINK_LOAD_TIME.md`             | Penerapan think time & load time                                    |
| `results/RINGKASAN_RERUN.md`             | Ringkasan hasil eksekusi ulang                                      |
| `docs/pseudocode/`                       | Pseudocode pengujian per modul (`00_umum.md` s.d. `15_sqli-api.md`) |

Pseudocode dibangun dan diperiksa dengan:

```bash
node scripts/build-pseudocode.mjs   # membuat ulang pseudocode.json
node scripts/check-pseudocode.mjs   # cek panjang baris, karakter, dan TC-ID
```

---

## Konvensi Kode

- Pre-commit (lefthook) menjalankan ESLint `--fix` dan Prettier pada berkas
  `src/tests/**` dan `src/helpers/**` yang di-stage.
- Judul test diawali TC-ID (mis. `TCDR.32 Super Admin access Relawan Review`)
  agar bisa dicocokkan dengan dokumen kasus uji dan pseudocode.
- Aksi pengguna di test memakai pembungkus dari `timing.helper.ts`
  (`clickThink`, `fillThink`, `waitLoaded`, dsb.), bukan `waitForTimeout`.
- Pesan commit memakai format Conventional Commits
  (`feat(test): ...`, `fix(helper): ...`, `docs(...): ...`).
