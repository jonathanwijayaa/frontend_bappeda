# Modul SQL Injection Lapis UI (TCSQL)
<!-- prefix: TCSQL -->

```text
// Berkas: src/tests/security/sqlInjection.spec.ts
// 10 payload: tautologi, komentar, union, stacked query, time-based
payload ← {"' OR '1'='1", "' OR '1'='1' --", "admin' --",
           "admin' #", "' OR 1=1--", "' OR SLEEP(5) --",
           "') OR ('1'='1", "'; DROP TABLE users; --",
           "1' UNION SELECT null, username, password",
           dan payload kutip ganda}
// tanda error SQL: "syntax error", "postgres", "mysql", "sqlite",
//   "relation ... does not exist", dan sejenisnya

TEST "TCSQL.1 Form login tahan SQL Injection"
    UNTUK SETIAP p DALAM payload LAKUKAN
        PANTAU respons server berstatus 5xx
        BUKA halaman login
        ISI field "NIK" dengan p;             TUNGGU THINK_TIME
        ISI field "Password" dengan p;        TUNGGU THINK_TIME
        KLIK tombol "Masuk";                  TUNGGU THINK_TIME
        PASTIKAN URL tidak memuat "/dashboard" atau "/profil-relawan"
        PASTIKAN tombol "Masuk" tetap tampil (maks LOAD_TIME)
        PASTIKAN pesan dan halaman tidak memuat tanda error SQL
        PASTIKAN tidak ada respons 5xx
    AKHIR UNTUK
    // NIK valid + password payload
    PANTAU respons server berstatus 5xx
    BUKA halaman login
    ISI field "NIK" dengan NIK Super Admin;   TUNGGU THINK_TIME
    ISI field "Password" dengan "' OR '1'='1' --"; TUNGGU THINK_TIME
    KLIK tombol "Masuk";                      TUNGGU THINK_TIME
    PASTIKAN URL tidak memuat "/dashboard"
    PASTIKAN pesan "Password salah" tampil (maks LOAD_TIME)
    PASTIKAN tidak ada tanda error SQL dan tidak ada respons 5xx
AKHIR TEST

TEST "TCSQL.2 Kolom pencarian tahan SQL Injection"
    UNTUK SETIAP halaman DALAM {Data Relawan, Daftar Kader} LAKUKAN
        PANTAU respons server berstatus 5xx
        Login(Super Admin)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        KLIK menu halaman;                    TUNGGU THINK_TIME
        PASTIKAN teks memuat data hilang (maks LOAD_TIME)
        barisAwal ← jumlah baris data
        UNTUK SETIAP p DALAM payload LAKUKAN
            ISI kolom pencarian dengan p;     TUNGGU THINK_TIME
            PASTIKAN konten utama tetap tampil (maks LOAD_TIME)
            PASTIKAN kolom pencarian bernilai p
            PASTIKAN jumlah baris <= barisAwal
            PASTIKAN halaman tidak memuat tanda error SQL
        AKHIR UNTUK
        PASTIKAN tidak ada respons 5xx selama pengujian
    AKHIR UNTUK
AKHIR TEST

TEST "TCSQL.3 Form Tambah Kader tahan SQL Injection"
    PANTAU respons server berstatus 5xx
    Login(Super Admin)
    PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
    KLIK menu "Kader";                        TUNGGU THINK_TIME
    PASTIKAN teks "Memuat data kader" hilang (maks LOAD_TIME)
    KLIK tombol "Tambah Kader Baru";          TUNGGU THINK_TIME
    PASTIKAN judul "Tambah Kader Baru" tampil (maks LOAD_TIME)
    data ← data kader valid
    data.namaKader ← "'; DROP TABLE kader; --"
    IsiFormKader(data, Super Admin)
    KLIK tombol "Simpan";                     TUNGGU THINK_TIME
    PASTIKAN pesan "nama kader tidak boleh mengandung angka atau
        karakter spesial" tampil (maks LOAD_TIME)
    PASTIKAN tidak ada tanda error SQL dan tidak ada respons 5xx
    PASTIKAN notifikasi "berhasil" tidak tampil
AKHIR TEST

TEST "TCSQL.4 SQL Injection pada path URL"
    PANTAU respons server berstatus 5xx
    BUKA halaman "/data-relawan/1 OR 1=1"
    PASTIKAN halaman tampil (maks LOAD_TIME)
    PASTIKAN tidak ada tanda error SQL dan tidak ada respons 5xx
AKHIR TEST
```

**TC-ID yang dicakup (4):** TCSQL.1, TCSQL.2, TCSQL.3, TCSQL.4
