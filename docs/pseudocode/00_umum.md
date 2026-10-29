# Pola Umum Pengujian (Bab IV)
<!-- prefix: -->

Pseudocode umum yang dipakai seluruh modul: konstanta waktu, prosedur
`AksiPengguna` dan `Login`, pola uji positif, pola uji negatif berbasis data
(EP/BVA), serta pola SQL Injection lapis UI dan lapis API.

```text
// Berkas: src/helpers/timing.helper.ts
//         src/helpers/loginBAPPEDA.helper.ts
KONSTANTA THINK_TIME ← 1,2 detik   // jeda antaraksi pengguna
KONSTANTA LOAD_TIME  ← 10 detik    // batas penantian eksplisit
KONSTANTA URL_APLIKASI ← "https://frontend-bappeda.vercel.app/"
// Pengulangan test (retry) = 0: kegagalan tidak boleh tersamarkan

PROSEDUR AksiPengguna(aksi, kondisiHasil)
    JALANKAN aksi                   // isi, pilih, unggah, atau klik
    TUNGGU THINK_TIME
    TUNGGU HINGGA kondisiHasil terpenuhi (maks LOAD_TIME)
    JIKA LOAD_TIME terlampaui MAKA
        NYATAKAN GAGAL "hasil tidak tersedia dalam LOAD_TIME"
    AKHIR JIKA
AKHIR PROSEDUR

PROSEDUR Login(peran)
    (NIK, kataSandi) ← kredensial[peran]
    BUKA halaman login
    PASTIKAN form login tampil (maks LOAD_TIME)
    ISI field "NIK" dengan NIK;               TUNGGU THINK_TIME
    ISI field "Password" dengan kataSandi;    TUNGGU THINK_TIME
    PASTIKAN tombol "Masuk" aktif (maks LOAD_TIME)
    KLIK tombol "Masuk";                      TUNGGU THINK_TIME
AKHIR PROSEDUR

// -- Pola uji positif (contoh TCL.1) ---------------------------------
TEST "TCL.1 Login dengan kredensial valid"
    UNTUK SETIAP peran DALAM {Super Admin, Admin OPD, Relawan} LAKUKAN
        Login(peran)
        JIKA peran = Relawan MAKA
            PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
        SELAIN ITU
            PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        AKHIR JIKA
    AKHIR UNTUK
AKHIR TEST

// -- Pola uji negatif berbasis data EP/BVA (contoh TCDR.6) -----------
TEST "TCDR.6 Nama relawan tidak valid"
    kasus ← {judul, nilai, pesan}
        {"Empty name", "", ditolak validasi browser}            // EP
        {"Name too short", "A", "minimal 3 karakter"}           // BVA
        {"Name with numbers", "Relawan12345",
            "Format nama relawan tidak valid"}                  // EP
        {"Name with special characters", "@@@###",
            "Format nama relawan tidak valid"}                  // EP
        {"Name too long", 300 × "A", "terlalu panjang"}         // BVA
    UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
        UNTUK SETIAP k DALAM kasus LAKUKAN
            Login(peran)
            KLIK menu "Relawan";                  TUNGGU THINK_TIME
            KLIK tombol "Tambah Relawan";         TUNGGU THINK_TIME
            data ← BangkitkanDataRelawan()
            data.nama ← k.nilai
            IsiFormRelawan(data, peran)
            KLIK tombol "Simpan";                 TUNGGU THINK_TIME
            JIKA k.pesan = ditolak validasi browser MAKA
                PASTIKAN field "Nama lengkap" tidak valid (required)
            SELAIN ITU
                PASTIKAN pesan k.pesan tampil (maks LOAD_TIME)
            AKHIR JIKA
        AKHIR UNTUK
    AKHIR UNTUK
AKHIR TEST

// -- Pola SQL Injection lapis UI (contoh TCSQL.1) --------------------
TEST "TCSQL.1 Form login tahan SQL Injection"
    // 10 payload: tautologi, komentar, union, stacked, time-based
    payload ← {"' OR '1'='1", "admin' --", "' OR 1=1--",
               "'; DROP TABLE users; --",
               "1' UNION SELECT null, username, password",
               "' OR SLEEP(5) --", dst.}
    UNTUK SETIAP p DALAM payload LAKUKAN
        PANTAU respons server berstatus 5xx
        BUKA halaman login
        ISI field "NIK" dengan p;                 TUNGGU THINK_TIME
        ISI field "Password" dengan p;            TUNGGU THINK_TIME
        KLIK tombol "Masuk";                      TUNGGU THINK_TIME
        PASTIKAN URL tidak memuat "/dashboard" atau "/profil-relawan"
        PASTIKAN tombol "Masuk" tetap tampil (maks LOAD_TIME)
        PASTIKAN pesan dan halaman tidak memuat tanda error SQL
        PASTIKAN tidak ada respons 5xx
    AKHIR UNTUK
AKHIR TEST

// -- Pola SQL Injection lapis API (contoh TCSQLA.1) ------------------
// Tanpa THINK_TIME (bukan interaksi pengguna);
// LOAD_TIME menjadi batas waktu setiap request
TEST "TCSQLA.1 Endpoint login menolak auth bypass"
    UNTUK SETIAP p DALAM payload LAKUKAN
        respons ← KIRIM POST "/auth/login" {nik: p, password: p}
                  (maks LOAD_TIME)
        PASTIKAN status respons ≠ 200
        PASTIKAN badan respons tidak memuat "token"
        PASTIKAN status respons < 500
        PASTIKAN badan respons tidak memuat tanda error SQL
    AKHIR UNTUK
AKHIR TEST
```

**TC-ID yang dicakup (contoh):** TCL.1, TCDR.6, TCSQL.1, TCSQLA.1
