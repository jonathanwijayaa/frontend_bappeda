# Modul Saran / Hotline (TCSH)
<!-- prefix: TCSH -->

```text
// Berkas: src/tests/saran hotline/saranHotline.spec.ts
PROSEDUR BukaSaranHotline(peran)
    JIKA peran = Relawan MAKA
        KLIK tombol "Menu";                   TUNGGU THINK_TIME
        KLIK menu "Saran/Hotline";            TUNGGU THINK_TIME
    SELAIN ITU
        KLIK tautan "Saran/Hotline" di sidebar; TUNGGU THINK_TIME
    AKHIR JIKA
    PASTIKAN URL memuat "/saran-hotline" (maks LOAD_TIME)
AKHIR PROSEDUR

UNTUK SETIAP peran DALAM {Admin OPD, Relawan} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL halaman awal peran (maks LOAD_TIME)
        BukaSaranHotline(peran)
        // nama & nomor telepon terisi otomatis dari profil
        PASTIKAN field "No. Telepon" terisi (maks LOAD_TIME)
    AKHIR SEBELUM

    TEST "TCSH.1 Tautan nomor telepon"
        LEWATI TEST "Deferred TC"
        PASTIKAN nomor telepon hotline tampil dan tidak kosong
        PASTIKAN tautannya diawali "tel:"
    AKHIR TEST

    TEST "TCSH.2 Tautan nomor WhatsApp"
        PASTIKAN nomor WhatsApp tampil dan tidak kosong
        PASTIKAN tautannya diawali "https://wa.me",
            "https://api.whatsapp.com", atau "whatsapp:"
    AKHIR TEST

    TEST "TCSH.3 Isi dan kirim form saran"
        ISI "Nama Lengkap" dengan nama acak;  TUNGGU THINK_TIME
        ISI "No. Telepon" dengan nomor valid; TUNGGU THINK_TIME
        ISI "Saran" dengan kalimat acak;      TUNGGU THINK_TIME
        KLIK tombol "Kirim Saran";            TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" atau "terima kasih" tampil
            (maks LOAD_TIME)
    AKHIR TEST

    kasus ← {judul, nilai, pesan}                          // TCSH.4
        {"Empty phone number", "", "nomor telepon wajib diisi"}
                                                               // EP
        {"Phone number too short", "08123",
            "nomor telepon tidak valid"}                       // BVA
        {"Phone number with letters", "08ABCDE123", idem}      // EP
        {"Phone number with special characters", "08!@#$%^&*",
            idem}                                              // EP
        {"Phone number too long", "081234567890123456789",
            idem}                                              // BVA
    UNTUK SETIAP k DALAM kasus LAKUKAN
        TEST "TCSH.4 <k.judul>"
            ISI "Nama Lengkap" dengan nama acak; TUNGGU THINK_TIME
            ISI "No. Telepon" dengan k.nilai; TUNGGU THINK_TIME
            ISI "Saran" dengan kalimat acak;  TUNGGU THINK_TIME
            KLIK tombol "Kirim Saran";        TUNGGU THINK_TIME
            PASTIKAN pesan k.pesan tampil (maks LOAD_TIME)
            PASTIKAN notifikasi "berhasil" tidak tampil
        AKHIR TEST
    AKHIR UNTUK
AKHIR UNTUK

// Super Admin mengelola hotline dan menerima saran
SEBELUM SETIAP TEST (Super Admin)
    BUKA URL_APLIKASI
    Login(Super Admin)
    PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
    BukaSaranHotline(Super Admin)
AKHIR SEBELUM

TEST "TCSH.1-2 Super Admin melihat informasi hotline"
    PASTIKAN judul "Informasi Hotline" tampil (maks LOAD_TIME)
    PASTIKAN tombol "Ubah"/"Edit" tampil
AKHIR TEST

TEST "TCSH.3-4 Super Admin mengelola saran masuk"
    PASTIKAN kolom "Cari nama, telepon, atau pesan" tampil
    PASTIKAN tombol "Kirim Saran" tidak tampil
AKHIR TEST
```

**TC-ID yang dicakup (4):** TCSH.1, TCSH.2, TCSH.3, TCSH.4
