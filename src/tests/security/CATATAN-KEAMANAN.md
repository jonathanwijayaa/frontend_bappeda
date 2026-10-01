# Catatan Pengujian Keamanan (Security Testing)

Dokumen ini merangkum pengujian keamanan otomatis untuk aplikasi **Manajemen
Relawan BAPPEDA Yogyakarta**. Seluruh pengujian bersifat **defensif** terhadap
sistem milik sendiri: setiap test membuktikan aplikasi **menolak / menetralkan**
serangan, bukan mengeksploitasinya.

- **Alat:** Playwright Test (TypeScript)
- **Target:** aplikasi ter-deploy (`https://frontend-bappeda.vercel.app`) dan
  backend-nya (`https://backend-skripsi-relawan.vercel.app/api`)
- **Total:** 65 test case dalam 4 file
- **Hasil terakhir:** 65/65 lulus

> ## ⚠️ Cakupan terhadap skripsi
>
> Batasan masalah skripsi menetapkan pengujian keamanan **hanya SQL Injection**
> (bersama smoke & regression testing). Karena itu:
>
> - **Masuk laporan skripsi:** hanya **SQL Injection** (`sqlInjection.spec.ts`
>   dan `sqlInjectionApi.spec.ts`).
> - **TIDAK dimasukkan ke laporan skripsi:** **Broken Access Control**
>   (`accessControl.spec.ts`) dan **Cross-Site Scripting**
>   (`xss.spec.ts`). Keduanya tetap disimpan di repositori sebagai **kerja
>   tambahan / pengujian pelengkap** di luar ruang lingkup skripsi, bukan
>   sebagai bagian dari hasil penelitian.

## Ringkasan jenis pengujian

| # | Jenis Pengujian | OWASP Top 10 | File | Jml TC | Masuk skripsi? |
|---|---|---|---|---|---|
| 1 | SQL Injection (tingkat UI) | A03 – Injection | `sqlInjection.spec.ts` | 15 | ✅ Ya |
| 2 | SQL Injection (tingkat API) | A03 – Injection | `sqlInjectionApi.spec.ts` | 17 | ✅ Ya |
| 3 | Broken Access Control | A01 – Broken Access Control | `accessControl.spec.ts` | 28 | ➖ Tambahan (di luar scope) |
| 4 | Cross-Site Scripting (XSS) | A03 – Injection | `xss.spec.ts` | 5 | ➖ Tambahan (di luar scope) |

---

## 1. SQL Injection — tingkat UI (`sqlInjection.spec.ts`)

**Tujuan:** memastikan form dan kolom pencarian di antarmuka tidak dapat
dimanipulasi dengan payload SQL.

**Cara kerja:** memasukkan payload SQLi lewat browser (form login, kolom
pencarian, form input, dan path URL), lalu memverifikasi aplikasi tetap aman.

**Yang dijamin:**

1. **Auth bypass gagal** — payload tidak pernah membuat pengguna berhasil masuk.
2. **Tidak ada kebocoran** — tidak ada pesan error database mentah yang tampil.
3. **Server tidak jebol** — tidak ada respons 5xx.
4. **Tautologi gagal** — `' OR '1'='1` tidak membuka baris data tambahan.

| Kode TC | Cakupan |
|---|---|
| TCSQL.1 | Auth bypass di form login (10 payload) + NIK valid dengan password payload |
| TCSQL.2 | Injeksi di kolom pencarian (Data Relawan & Daftar Kader) |
| TCSQL.3 | Injeksi di form input (Nama Kader) yang dikirim ke server |
| TCSQL.4 | Injeksi pada parameter path URL |

---

## 2. SQL Injection — tingkat API (`sqlInjectionApi.spec.ts`)

**Tujuan:** menguji ketahanan **query database** secara langsung, dengan menembak
endpoint backend TANPA melewati sanitasi di sisi klien. Ini pelengkap penting
dari pengujian UI: sebagian input disaring di browser (mis. field NIK yang
membuang karakter non-angka), sehingga payload tidak sampai ke query bila hanya
diuji lewat UI. File ini memastikan query-nya sendiri aman (parameterized).

**Yang dijamin:** (1) auth bypass gagal, (2) tidak ada 5xx, (3) tidak ada
kebocoran error DB, (4) **tidak rentan time-based blind**, (5) tautologi gagal.

| Kode TC | Cakupan |
|---|---|
| TCSQLA.1 | Auth bypass di endpoint `/auth/login` (payload mentah) + UNION di NIK |
| TCSQLA.2 | **Time-based blind SQLi** — payload `SLEEP(5)` / `pg_sleep(5)`, waktu respons diukur (harus < 3 detik) |
| TCSQLA.3 | Injeksi lewat query parameter (`/admin/logs?limit=`, `/opd?search=`) |
| TCSQLA.4 | Injeksi lewat body POST (`/opd`, field nama) |
| TCSQLA.5 | Endpoint terproteksi menolak payload tanpa token |

---

## 3. Broken Access Control (`accessControl.spec.ts`)

**Tujuan:** memastikan otorisasi ditegakkan di **sisi server**, bukan sekadar
disembunyikan di UI. Aplikasi punya tiga peran: `super_admin`, `opd`, `relawan`.

**Yang dijamin:**

1. **Kontrol vertikal** — peran rendah tidak bisa memakai endpoint peran tinggi
   (mencegah *privilege escalation*).
2. **Kontrol horizontal** — satu OPD tidak bisa menyentuh data OPD lain
   (mencegah *IDOR – Insecure Direct Object Reference*).
3. **Autentikasi** — token wajib, dan token tidak boleh dipalsukan.

| Kode TC | Cakupan |
|---|---|
| TCAC.1 | Matriks peran: tiap peran × tiap endpoint → hanya endpoint yang berhak = 200, selebihnya 403 |
| TCAC.2 | Relawan & OPD tidak bisa membuat data lewat endpoint khusus admin |
| TCAC.3 | Isolasi antar-OPD: OPD hanya melihat relawan instansinya; PUT relawan milik OPD lain ditolak (IDOR) |
| TCAC.4 | Tanpa token → 401; token rusak → 401; **JWT dengan role dipalsukan → 401** (tanda tangan diverifikasi) |

---

## 4. Cross-Site Scripting / XSS (`xss.spec.ts`)

**Tujuan:** memastikan aplikasi tidak mengeksekusi markup/script yang disisipkan
pengguna — payload harus diperlakukan sebagai **teks** (di-escape).

**Cara kerja:** memasang pendengar event `dialog` global. Bila ada payload yang
berhasil menjalankan `alert()`, dialog akan muncul dan test langsung gagal.
Selain itu diperiksa bahwa elemen sisipan (`<img onerror>`, `<script>`) tidak
pernah benar-benar terbentuk di DOM.

| Kode TC | Cakupan |
|---|---|
| TCXSS.1 | **Stored XSS** end-to-end: relawan mengirim saran berisi payload, Super Admin membukanya → tampil ter-escape, tidak tereksekusi |
| TCXSS.2 | Reflected XSS di form login |
| TCXSS.3 | Reflected XSS di kolom pencarian (Data Relawan & Daftar Kader) |
| TCXSS.4 | Payload XSS di field form Kader → ditolak, tidak tersimpan, tidak tereksekusi |

---

## Cara menjalankan

```bash
# Seluruh pengujian keamanan
npx playwright test src/tests/security --project=chromium

# Per kategori
npx playwright test "src/tests/security/sqlInjection.spec.ts" --project=chromium
npx playwright test "src/tests/security/sqlInjectionApi.spec.ts" --project=chromium
npx playwright test "src/tests/security/accessControl.spec.ts" --project=chromium
npx playwright test "src/tests/security/xss.spec.ts" --project=chromium
```

> Base URL API dapat ditimpa lewat variabel lingkungan `VITE_API_URL`; bila
> kosong, dipakai URL deployment default.

## Kesimpulan hasil pengujian

Seluruh 65 test case **lulus**, yang berarti aplikasi terbukti tahan terhadap
kategori serangan yang diuji:

- **SQL Injection** *(bagian dari skripsi)* — query backend parameterized;
  payload (termasuk time-based blind) diperlakukan sebagai data, tidak ada auth
  bypass maupun kebocoran.
- **Broken Access Control** *(kerja tambahan, di luar scope skripsi)* —
  otorisasi ditegakkan di server; isolasi antar-OPD bekerja; tanda tangan JWT
  diverifikasi sehingga token tidak bisa dipalsukan.
- **XSS** *(kerja tambahan, di luar scope skripsi)* — output di-escape otomatis
  oleh React; payload tersimpan pun ditampilkan sebagai teks biasa, tidak
  dieksekusi.

## Catatan teknis

- **TCXSS.1** menambah satu baris saran uji (ber-penanda `XSSUJI...`) setiap
  dijalankan, karena menguji alur penyimpanan yang sesungguhnya.
- **TCAC.2, TCAC.3, TCSQLA.4, TCXSS.4** dirancang **non-destruktif**: semua
  percobaan tulis memang diharapkan ditolak, sehingga tidak ada data yang
  benar-benar berubah.
- Pengujian berjalan melawan lingkungan ter-deploy; untuk hasil yang paling
  stabil, jalankan folder keamanan tersendiri (bukan bersamaan dengan seluruh
  suite fungsional yang memakai akun uji yang sama).
