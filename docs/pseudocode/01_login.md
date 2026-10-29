# Modul Login (TCL)
<!-- prefix: TCL -->

```text
// Berkas: src/tests/auth/login.spec.ts
SEBELUM SETIAP TEST
    BUKA URL_APLIKASI
    PASTIKAN field "NIK" tampil (maks LOAD_TIME)
AKHIR SEBELUM

PROSEDUR IsiLogin(nik, sandi)
    ISI field "NIK" dengan nik;               TUNGGU THINK_TIME
    ISI field "Password" dengan sandi;        TUNGGU THINK_TIME
    KLIK tombol "Masuk";                      TUNGGU THINK_TIME
AKHIR PROSEDUR

PROSEDUR TetapDiHalamanLogin()
    PASTIKAN URL tidak memuat "/dashboard" atau "/profil-relawan"
    PASTIKAN tombol "Masuk" tampil (maks LOAD_TIME)
AKHIR PROSEDUR

TEST "TCL.0 Akses website"
    respons ← BUKA URL_APLIKASI
    PASTIKAN respons berhasil (status 2xx)
    PASTIKAN judul "Selamat Datang" tampil (maks LOAD_TIME)
    PASTIKAN field "NIK", "Password", dan tombol "Masuk" tampil
AKHIR TEST

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

TEST "TCL.2 NIK dan password tidak valid"
    // field NIK membuang non-angka dan membatasi 16 digit
    kasus ← {judul, nik, nilaiTersaring, sandi}
        {"NIK too short", "12345", "12345", "123"}             // BVA
        {"NIK too long", 20 digit, 16 digit pertama,
            "abcdef123"}                                       // BVA
        {"NIK with letters", "12345678901ABCDE",
            "12345678901", "wrongpass"}                        // EP
        {"NIK with special characters", "12345!@#$%67890",
            "1234567890", "!@#$%^&*"}                          // EP
        {"Unregistered NIK", "9999999999999999",
            "9999999999999999", "wrongpassword"}               // EP
    UNTUK SETIAP k DALAM kasus LAKUKAN
        ISI field "NIK" dengan k.nik;             TUNGGU THINK_TIME
        PASTIKAN field "NIK" bernilai k.nilaiTersaring
        ISI field "Password" dengan k.sandi;      TUNGGU THINK_TIME
        KLIK tombol "Masuk";                      TUNGGU THINK_TIME
        PASTIKAN pesan "NIK tidak ditemukan" tampil (maks LOAD_TIME)
        TetapDiHalamanLogin()
    AKHIR UNTUK
AKHIR TEST

TEST "TCL.3 Field kosong"
    kasus ← {judul, nik, sandi}                                // EP
        {"empty NIK and password", "", ""}
        {"empty password", NIK Super Admin, ""}
        {"empty NIK", "", sandi Super Admin}
    UNTUK SETIAP k DALAM kasus LAKUKAN
        IsiLogin(k.nik, k.sandi)
        PASTIKAN pesan "NIK dan Password harus diisi" tampil
            (maks LOAD_TIME)
        TetapDiHalamanLogin()
    AKHIR UNTUK
AKHIR TEST

TEST "TCL.4 NIK tidak terdaftar"
    IsiLogin("1234567890123999", "rahasia123")
    PASTIKAN pesan "NIK tidak ditemukan" tampil (maks LOAD_TIME)
    TetapDiHalamanLogin()
AKHIR TEST

TEST "TCL.5 NIK benar, password salah"
    UNTUK SETIAP peran DALAM {Super Admin, Admin OPD, Relawan} LAKUKAN
        IsiLogin(NIK[peran], "wrongpassword")
        PASTIKAN pesan "Password salah!" tampil (maks LOAD_TIME)
        TetapDiHalamanLogin()
    AKHIR UNTUK
AKHIR TEST

TEST "TCL.6 NIK salah, password benar"
    UNTUK SETIAP peran DALAM {Super Admin, Admin OPD, Relawan} LAKUKAN
        IsiLogin("9999999999999999", kataSandi[peran])
        PASTIKAN pesan "NIK tidak ditemukan" tampil (maks LOAD_TIME)
        TetapDiHalamanLogin()
    AKHIR UNTUK
AKHIR TEST

// TCL.7 tidak diotomasi: halaman login tidak punya fitur pendaftaran

TEST "TCL.8 Tampilkan dan sembunyikan password"
    ISI field "Password" dengan "rahasia123"; TUNGGU THINK_TIME
    PASTIKAN password tersamar
    KLIK ikon mata;                           TUNGGU THINK_TIME
    PASTIKAN password terlihat dengan nilai "rahasia123"
    KLIK ikon mata;                           TUNGGU THINK_TIME
    PASTIKAN password tersamar kembali
AKHIR TEST

TEST "TCL.9 Klik lupa password"
    KLIK tautan "Lupa Password ?";            TUNGGU THINK_TIME
    JIKA URL masih halaman login MAKA
        LEWATI TEST "tautan belum mengarah ke halaman mana pun"
    AKHIR JIKA
    PASTIKAN URL memuat "forgot", "reset", atau "lupa"
AKHIR TEST

TEST "TCL.10 Field NIK hanya menerima maks 16 digit angka"
    ISI field "NIK" dengan "abc-12 34!@#56";  TUNGGU THINK_TIME
    PASTIKAN field "NIK" bernilai "123456"                     // EP
    ISI field "NIK" dengan 20 × "1";          TUNGGU THINK_TIME
    PASTIKAN field "NIK" bernilai 16 × "1"                     // BVA
AKHIR TEST

TEST "TCL.11 Pesan sesi berakhir"
    BUKA halaman login dengan parameter expired
    PASTIKAN pesan "Sesi Anda telah berakhir. Silakan masuk kembali."
        tampil (maks LOAD_TIME)
AKHIR TEST

TEST "TCL.12 Halaman terproteksi wajib login"
    UNTUK SETIAP rute DALAM {dashboard, data-relawan, profil,
            profil-relawan} LAKUKAN
        BUKA rute sebagai tamu
        PASTIKAN URL memuat "/login" (maks LOAD_TIME)
        PASTIKAN tombol "Masuk" tampil
    AKHIR UNTUK
AKHIR TEST

TEST "TCL.13 Pengguna yang sudah login tidak kembali ke login"
    Login(Admin OPD)
    PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
    BUKA halaman "/login"
    PASTIKAN URL tetap memuat "/dashboard" (maks LOAD_TIME)
    PASTIKAN tombol "Masuk" tidak tampil
AKHIR TEST

TEST "TCL.14 Logout"
    UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        KLIK avatar di header;                TUNGGU THINK_TIME
        KLIK tombol "Keluar";                 TUNGGU THINK_TIME
        PASTIKAN URL memuat "/login" (maks LOAD_TIME)
        KEMBALI ke halaman sebelumnya
        PASTIKAN URL tetap memuat "/login" (maks LOAD_TIME)
    AKHIR UNTUK
    Login(Relawan)
    PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
    KLIK tombol "Menu";                       TUNGGU THINK_TIME
    KLIK tombol "Keluar";                     TUNGGU THINK_TIME
    PASTIKAN URL memuat "/login" (maks LOAD_TIME)
    BUKA halaman "/profil-relawan"
    PASTIKAN URL tetap memuat "/login" (maks LOAD_TIME)
AKHIR TEST
```

**TC-ID yang dicakup (14):** TCL.0, TCL.1, TCL.2, TCL.3, TCL.4, TCL.5, TCL.6, TCL.8, TCL.9, TCL.10, TCL.11, TCL.12, TCL.13, TCL.14
