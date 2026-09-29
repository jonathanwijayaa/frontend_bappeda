# Catatan Pengujian (E2E Test Suite)

Dokumen ini merangkum seluruh pengujian otomatis (end-to-end) untuk aplikasi
**Manajemen Relawan BAPPEDA Yogyakarta**.

- **Alat:** Playwright Test (TypeScript)
- **Target:** aplikasi ter-deploy `https://frontend-bappeda.vercel.app`
  (backend `https://backend-skripsi-relawan.vercel.app/api`)
- **Total:** 540 test case dalam 13 modul
- **Peran yang diuji:** `super_admin`, `opd`, `relawan`

## Ringkasan modul

| Modul | Folder | Prefix TC | Jml TC | Peran |
|---|---|---|---|---|
| Login / Autentikasi | `auth/` | TCL | 30 | Semua |
| Dashboard | `dashboard/` | TCD | 24 | Super Admin, OPD |
| Manajemen OPD | `manajemen opd/` | TCMO | 29 | Super Admin |
| Daftar Kader | `daftar kader/` | TCDK | 101 | Super Admin, OPD |
| Data Relawan | `data relawan/` | TCDR | 96 | Super Admin, OPD |
| Surat Keputusan | `surat keputusan/` | TCSK | 28 | Super Admin, OPD |
| Riwayat Relawan | `riwayat relawan/` | TCHR | 48 | Super Admin, OPD |
| Log Aktivitas | `log/aktifitas/` | TCLA | 21 | Super Admin |
| Dokumen | `dokumen/` | TCDO | 21 | Super Admin, OPD |
| Saran / Hotline | `saran hotline/` | TCSH | 18 | Semua |
| Profil | `profil/` | TCP | 57 | Semua |
| Statistik | `stastistik/` | TCS | 2 | Super Admin, OPD |
| **Keamanan (Security)** | `security/` | TCSQL, TCSQLA, TCAC, TCXSS | 65 | Semua |

> **Cakupan skripsi:** sesuai batasan masalah, pengujian keamanan yang masuk
> laporan **hanya SQL Injection** (`sqlInjection` + `sqlInjectionApi`, 32 TC).
> Broken Access Control dan XSS (`accessControl` + `xss`, 33 TC) tetap ada di
> repositori sebagai **kerja tambahan di luar scope**, tidak dimasukkan ke
> laporan. Detail: [`security/CATATAN-KEAMANAN.md`](security/CATATAN-KEAMANAN.md).

---

## Cakupan per modul (fungsional)

### Login / Autentikasi — `auth/login.spec.ts` (TCL)
Login valid ketiga peran; kredensial tidak valid (NIK/password salah, kosong,
tidak terdaftar); tampilkan/sembunyikan password; penyaringan field NIK (hanya
angka, maks 16 digit); pesan sesi berakhir; halaman terproteksi mengalihkan ke
login; pengguna yang sudah login tidak kembali ke halaman login; logout.

### Dashboard — `dashboard/dashboard.spec.ts` (TCD)
Akses per peran; grafik batang & donut (hover tooltip); kartu ringkasan (KPI);
status data real-time; judul & periode grafik; filter Top 10 / Semua Data;
leaderboard; sebaran per kelurahan; grafik relawan per kader & kader per OPD;
tampilan gagal memuat data; pembatasan akses relawan.

### Manajemen OPD — `manajemen opd/manajemenOPD.spec.ts` (TCMO)
Akses halaman; tambah OPD (form valid & batal); validasi field (nama, alamat,
PIC, NIK, kontak); unggah Excel (valid & tidak valid); unduh template; batal
unggah.

### Daftar Kader — `daftar kader/daftarKader.spec.ts` (TCDK)
Akses; tambah kader (isi, simpan, batal); validasi (nama, NIK PIC, nama PIC,
kontak, alamat, duplikat, OPD wajib dipilih); unggah Excel valid/tidak valid;
unduh template; batal unggah; pencarian; ekspor PDF; detail kader; ganti PIC;
aktif/nonaktif kader; pagination; kolom tabel; pembatasan akses relawan.

### Data Relawan — `data relawan/dataRelawan.spec.ts` (TCDR)
Akses; tambah relawan (isi, simpan, batal); validasi field; unggah Excel; unduh
template; pencarian; detail relawan; edit data & penugasan; pengajuan perubahan
data (review); pembatasan akses.

### Surat Keputusan — `surat keputusan/suratKeputusan.spec.ts` (TCSK)
Unggah berkas SK (PDF); validasi form SK; daftar SK; pencarian; ekspor tabel;
detail SK; pratinjau berkas PDF; pembatasan akses.

### Riwayat Relawan — `riwayat relawan/riwayatRelawan.spec.ts` (TCHR)
Filter (OPD, kader, tahun, kemantren, kelurahan); pencarian; reset filter;
urut kolom; pagination; detail riwayat & penugasan; pembatasan lingkup OPD;
pembatasan akses relawan; penanganan gagal memuat.

### Log Aktivitas — `log/aktifitas/logAktifitas.spec.ts` (TCLA)
Urutan waktu; filter jenis aksi & nama tabel; kombinasi filter; pencarian;
pagination; kolom tabel; detail log; penanganan gagal memuat; pembatasan akses
(hanya Super Admin).

### Dokumen — `dokumen/dokumen.spec.ts` (TCDO)
Unduh berkas (panduan & template Excel Relawan/OPD/Kader); verifikasi isi berkas
(nama sheet & struktur kolom); daftar dokumen; kartu informasi; pembatasan akses.

### Saran / Hotline — `saran hotline/saranHotline.spec.ts` (TCSH)
Tautan telepon & WhatsApp; kirim saran (valid & nomor tidak valid); tampilan
pengelolaan Super Admin (info hotline & daftar saran masuk).

### Profil — `profil/profil.spec.ts` (TCP)
Ganti foto profil; edit informasi pribadi & validasi nomor; ubah password &
validasinya; pengajuan pembaruan data relawan; ubah kata sandi relawan
(syarat & toggle); pembatasan akses antar-peran.

### Statistik — `stastistik/stastistik.spec.ts` (TCS)
Halaman Statistik lama sudah **dihapus** (grafiknya dipindah ke Dashboard). TC
tersisa hanya memastikan halaman tersebut tidak lagi dapat diakses.

### Keamanan — `security/` (TCSQL, TCSQLA, TCAC, TCXSS)
SQL Injection (UI & API), Broken Access Control, dan Cross-Site Scripting.
Lihat [`security/CATATAN-KEAMANAN.md`](security/CATATAN-KEAMANAN.md).

---

## Pendekatan & konvensi

- **Data uji tanpa hardcode.** Kata kunci pencarian, target sortir, dan nilai
  filter diambil dari isi tabel saat itu — tidak bergantung pada data seed
  tertentu yang bisa berubah di database.
- **Locator tahan perubahan.** Field yang tidak punya nama aksesibilitas
  (label tak terhubung ke input) diraih lewat struktur (posisi terhadap label,
  placeholder, atau kolom tabel), bukan lewat indeks tombol atau class CSS.
- **Assertion yang benar-benar menguji.** Menghindari pemeriksaan yang selalu
  benar (URL yang tidak berubah, judul yang tetap tampak di belakang modal).
- **Uji negatif = perilaku aman.** Kasus tidak valid memverifikasi aplikasi
  menolak input (pesan/validasi), bukan sekadar tidak error.
- **Komentar berbahasa Indonesia** menjelaskan alasan tiap keputusan locator
  atau assertion yang tidak jelas.

## Cara menjalankan

```bash
# Seluruh suite
npx playwright test --project=chromium

# Per modul
npx playwright test "src/tests/daftar kader" --project=chromium
npx playwright test src/tests/auth --project=chromium

# Cek kestabilan (ulang tiap test)
npx playwright test src/tests/dokumen --project=chromium --repeat-each=2

# Laporan HTML
npx playwright show-report
```

## Catatan penting

- **Target ter-deploy.** Suite berjalan melawan aplikasi produksi. Sebagian
  test (tambah kader/relawan, kirim saran, pengajuan) **menulis data
  sungguhan**. Idealnya disediakan lingkungan uji terpisah dengan reset DB.
- **Akun uji dipakai bersama.** Ketiga peran memakai akun yang sama di semua
  modul, dan beberapa test mengubah datanya. Saat dijalankan **paralel penuh**,
  modul-modul ini bisa saling mengganggu. Untuk hasil yang paling dapat
  dipercaya, jalankan per folder atau dengan `--workers=2`.
- **Batasi ke chromium.** Konfigurasi mengaktifkan chromium, firefox, dan
  webkit. Tanpa `--project=chromium`, test yang menulis data berjalan 3×
  bersamaan.
- **URL API** dapat ditimpa lewat variabel lingkungan `VITE_API_URL`.
