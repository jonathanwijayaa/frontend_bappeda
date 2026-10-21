# Modul Profil (TCP)
<!-- prefix: TCP -->

```text
// Berkas: src/tests/profil/profil.spec.ts
// -- Profil Super Admin & Admin OPD (/profil) ------------------------
PROSEDUR BukaProfil()
    KLIK avatar di header;                    TUNGGU THINK_TIME
    KLIK tombol "Edit Profil";                TUNGGU THINK_TIME
    PASTIKAN URL memuat "/profil" (maks LOAD_TIME)
    PASTIKAN teks "Memuat profil" hilang (maks LOAD_TIME)
    PASTIKAN judul "Informasi Pribadi" tampil
AKHIR PROSEDUR

PROSEDUR SimpanProfil()
    KLIK tombol "Simpan Informasi Pribadi";   TUNGGU THINK_TIME
AKHIR PROSEDUR

UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        BukaProfil()
    AKHIR SEBELUM

    // TCP.1 dan TCP.3 dijalankan berurutan (mengubah akun sama)
    TEST "TCP.1 Ganti foto profil"
        JIKA nama akun mengandung angka MAKA
            LEWATI TEST "nama ditolak backend (lihat TCP.28)"
        AKHIR JIKA
        UNGGAH foto "a.jpg";                  TUNGGU THINK_TIME
        PASTIKAN pratinjau avatar berupa gambar baru (maks LOAD_TIME)
        SimpanProfil()
        PASTIKAN notifikasi "Informasi pribadi berhasil diperbarui!"
            tampil (maks LOAD_TIME)
        PASTIKAN notifikasi hilang (maks LOAD_TIME)
        KLIK tombol "Hapus";                  TUNGGU THINK_TIME
        SimpanProfil()                        // pulihkan avatar bawaan
        PASTIKAN notifikasi berhasil tampil dan avatar bawaan aktif
    AKHIR TEST

    TEST "TCP.3 Isi dan simpan informasi pribadi"
        (namaAwal, hpAwal) ← isi form saat ini
        ISI "Nama Lengkap" dengan namaAwal + " Uji"; TUNGGU THINK_TIME
        ISI "No. HP" dengan nomor uji;        TUNGGU THINK_TIME
        SimpanProfil()
        PASTIKAN notifikasi berhasil tampil (maks LOAD_TIME)
        PASTIKAN form berisi nama dan nomor uji
        PASTIKAN notifikasi hilang (maks LOAD_TIME)
        ISI "Nama Lengkap" dengan namaAwal;   TUNGGU THINK_TIME
        ISI "No. HP" dengan hpAwal;           TUNGGU THINK_TIME
        SimpanProfil()                        // pulihkan data awal
        PASTIKAN notifikasi berhasil tampil dan nama = namaAwal
    AKHIR TEST

    TEST "TCP.2 Tampilan form informasi pribadi"
        PASTIKAN nama terisi; nomor HP, avatar, dan tombol simpan
            tampil; judul "Ubah Password" tampil
    AKHIR TEST

    kasusHP ← {judul, nilai}                               // TCP.4
        {"Phone with letters", "08ABCDE123"}                   // EP
        {"Phone too short", "08123"}                           // BVA
        {"Phone with special characters", "08!@#$%^&*"}        // EP
        {"Phone too long", "081234567890123456789"}            // BVA
    UNTUK SETIAP k DALAM kasusHP LAKUKAN
        TEST "TCP.4 <k.judul>"
            ISI "No. HP" dengan k.nilai;      TUNGGU THINK_TIME
            SimpanProfil()
            PASTIKAN pesan "nomor HP tidak valid" tampil
                (maks LOAD_TIME)
            PASTIKAN notifikasi berhasil tidak tampil
        AKHIR TEST
    AKHIR UNTUK

    TEST "TCP.5 Perubahan yang tidak disimpan dibuang"
        namaAwal ← isi field "Nama Lengkap"
        ISI "Nama Lengkap" dengan "Nama Yang Tidak Disimpan"
                                              TUNGGU THINK_TIME
        KLIK menu "Dashboard";                TUNGGU THINK_TIME
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        BukaProfil()
        PASTIKAN field "Nama Lengkap" = namaAwal
    AKHIR TEST

    TEST "TCP.6 Simpan tanpa perubahan"
        SimpanProfil()
        PASTIKAN pesan "tidak ada data yang disimpan" tampil
            (maks LOAD_TIME)
        PASTIKAN notifikasi berhasil tidak tampil
    AKHIR TEST

    TEST "TCP.7 Foto profil lebih dari 1 MB"                // BVA
        UNGGAH gambar berukuran 1 MB + 1 bita; TUNGGU THINK_TIME
        PASTIKAN pesan "ukuran gambar maksimal 1MB" tampil
            (maks LOAD_TIME)
        PASTIKAN pratinjau avatar tidak berubah
    AKHIR TEST

    TEST "TCP.8 Hapus foto profil yang dipilih"
        UNGGAH foto "a.jpg";                  TUNGGU THINK_TIME
        PASTIKAN pratinjau berupa gambar baru (maks LOAD_TIME)
        KLIK tombol "Hapus";                  TUNGGU THINK_TIME
        PASTIKAN avatar kembali ke avatar bawaan (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCP.9 NIK tidak dapat diubah"
        PASTIKAN field NIK nonaktif dan bernilai NIK akun
        PASTIKAN teks "tidak dapat diubah" tampil
    AKHIR TEST

    kasusSandi ← {judul, lama, baru, konfirmasi, pesan}   // TCP.10
        {"Empty current password", "", "Rahasia123!",
            "Rahasia123!", "password saat ini wajib diisi"}    // EP
        {"Empty new password", sandi salah, "", "Rahasia123!",
            "password baru wajib diisi"}                       // EP
        {"Empty password confirmation", sandi salah,
            "Rahasia123!", "", "konfirmasi password wajib
            diisi"}                                            // EP
        {"New password shorter than 6 characters", sandi salah,
            "abc", "abc", "terlalu pendek"}                    // BVA
        {"Confirmation does not match", sandi salah,
            "Rahasia123!", "Rahasia999!",
            "tidak cocok dengan password baru"}                // EP
    UNTUK SETIAP k DALAM kasusSandi LAKUKAN
        TEST "TCP.10 <k.judul>"
            ISI "Password Lama" dengan k.lama; TUNGGU THINK_TIME
            ISI "Password Baru" dengan k.baru; TUNGGU THINK_TIME
            ISI "Konfirmasi Password" dengan k.konfirmasi
                                              TUNGGU THINK_TIME
            KLIK tombol "Simpan Password";    TUNGGU THINK_TIME
            PASTIKAN pesan k.pesan tampil (maks LOAD_TIME)
            PASTIKAN pesan "password berhasil diperbarui" tidak
                tampil
        AKHIR TEST
    AKHIR UNTUK

    TEST "TCP.28 Simpan nama yang mengandung angka"
        ISI "Nama Lengkap" dengan "Nama Uji 123"; TUNGGU THINK_TIME
        SimpanProfil()
        PASTIKAN pesan "nama lengkap tidak boleh mengandung angka"
            tampil (maks LOAD_TIME)
        PASTIKAN notifikasi berhasil tidak tampil
    AKHIR TEST

    TEST "TCP.11 Password lama salah"
        ISI "Password Lama" dengan "PasswordLamaSalah123"
                                              TUNGGU THINK_TIME
        ISI "Password Baru" dengan "Rahasia123!"; TUNGGU THINK_TIME
        ISI "Konfirmasi Password" dengan "Rahasia123!"
                                              TUNGGU THINK_TIME
        KLIK tombol "Simpan Password";        TUNGGU THINK_TIME
        PASTIKAN pesan "password lama tidak sesuai" tampil
            (maks LOAD_TIME)
        PASTIKAN pesan "password berhasil diperbarui" tidak tampil
    AKHIR TEST
AKHIR UNTUK

// -- Profil Relawan (/profil-relawan) --------------------------------
PROSEDUR BukaModalPengajuan()
    KLIK tombol "Ajukan Pembaruan Data";      TUNGGU THINK_TIME
    PASTIKAN judul "Ajukan Pembaruan Data" tampil (maks LOAD_TIME)
AKHIR PROSEDUR

PROSEDUR KirimPengajuan()
    KLIK tombol "Ajukan";                     TUNGGU THINK_TIME
    PASTIKAN dialog "Konfirmasi Pengajuan" tampil (maks LOAD_TIME)
    KLIK tombol "Ya, Ajukan";                 TUNGGU THINK_TIME
AKHIR PROSEDUR

SEBELUM SETIAP TEST (Relawan)
    BUKA URL_APLIKASI
    Login(Relawan)
    PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
    PASTIKAN data NIK tampil (maks LOAD_TIME)
AKHIR SEBELUM

TEST "TCP.12 Relawan melihat informasi pribadi"
    PASTIKAN NIK = NIK akun; nama terisi; jenis kelamin
        "Laki-laki" atau "Perempuan"
    PASTIKAN alamat, kemantren, kelurahan, dan nomor HP tampil
    PASTIKAN nama tampil di kartu sambutan
    PASTIKAN tidak ada kontrol unggah foto
AKHIR TEST

TEST "TCP.13 Buka modal Ajukan Pembaruan Data"
    BukaModalPengajuan()
    PASTIKAN field alamat, kemantren, kelurahan, nomor HP baru,
        dan catatan tampil
    PASTIKAN field nama, NIK, dan jenis kelamin baru tidak ada
    PASTIKAN tombol "Ajukan" tampil
AKHIR TEST

TEST "TCP.14 Kirim pengajuan pembaruan data"
    // alamat diajukan sama seperti sekarang: data tetap bila disetujui
    alamat ← alamat KTP saat ini
    BukaModalPengajuan()
    ISI "Alamat Baru" dengan alamat;          TUNGGU THINK_TIME
    ISI "Catatan" dengan "Pengujian otomatis E2E"; TUNGGU THINK_TIME
    KirimPengajuan()
    PASTIKAN pesan "berhasil dikirim dan sedang menunggu review"
        tampil (maks LOAD_TIME)
    PASTIKAN modal tertutup
AKHIR TEST

kasusHP ← {judul, nilai}                                  // TCP.15
    {"Phone with letters", "08ABCDE123"}                       // EP
    {"Phone too short", "08123"}                               // BVA
    {"Phone with special characters", "08!@#$%^&*"}            // EP
    {"Phone too long", "081234567890123456789"}                // BVA
UNTUK SETIAP k DALAM kasusHP LAKUKAN
    TEST "TCP.15 Relawan <k.judul>"
        BukaModalPengajuan()
        ISI "No. HP Baru" dengan k.nilai;     TUNGGU THINK_TIME
        ISI "Catatan" dengan "Uji nomor HP tidak valid"
                                              TUNGGU THINK_TIME
        KirimPengajuan()
        PASTIKAN pesan "format nomor HP tidak valid" tampil
            (maks LOAD_TIME)
        PASTIKAN pesan "berhasil dikirim" tidak tampil
    AKHIR TEST
AKHIR UNTUK

TEST "TCP.16 Batalkan Ajukan Pembaruan Data"
    BukaModalPengajuan()
    ISI "Alamat Baru" dengan "Alamat Yang Tidak Diajukan"
                                              TUNGGU THINK_TIME
    KLIK tombol "Batal";                      TUNGGU THINK_TIME
    PASTIKAN modal tertutup (maks LOAD_TIME)
    BukaModalPengajuan()
    PASTIKAN field "Alamat Baru" kosong
    KLIK tombol tutup (X);                    TUNGGU THINK_TIME
    PASTIKAN modal tertutup dan tidak ada pesan "berhasil dikirim"
AKHIR TEST

TEST "TCP.17 Kirim tanpa mengubah data"
    BukaModalPengajuan()
    ISI "Catatan" dengan "Tanpa perubahan data"; TUNGGU THINK_TIME
    KirimPengajuan()
    PASTIKAN pesan "minimal satu data harus diubah" tampil
        (maks LOAD_TIME)
    PASTIKAN pesan "berhasil dikirim" tidak tampil
AKHIR TEST

TEST "TCP.18 Kirim tanpa catatan"
    BukaModalPengajuan()
    ISI "Alamat Baru" dengan alamat uji;      TUNGGU THINK_TIME
    KirimPengajuan()
    PASTIKAN pesan "Catatan / Alasan Perubahan wajib diisi" tampil
        (maks LOAD_TIME)
    PASTIKAN pesan "berhasil dikirim" tidak tampil
AKHIR TEST

TEST "TCP.19 Pilih saran Kemantren"
    BukaModalPengajuan()
    KLIK field "Kemantren Baru";              TUNGGU THINK_TIME
    PASTIKAN daftar saran tampil (maks LOAD_TIME)
    pilihan ← saran pertama
    KLIK saran pertama;                       TUNGGU THINK_TIME
    PASTIKAN "Kemantren Baru" = pilihan dan "Kelurahan Baru" kosong
    KLIK field "Kelurahan Baru";              TUNGGU THINK_TIME
    PASTIKAN saran kelurahan tampil (maks LOAD_TIME)
AKHIR TEST

TEST "TCP.20 Batalkan dialog konfirmasi"
    BukaModalPengajuan()
    ISI "Alamat Baru" dengan alamat uji;      TUNGGU THINK_TIME
    ISI "Catatan" dengan "Uji batal konfirmasi"; TUNGGU THINK_TIME
    KLIK tombol "Ajukan";                     TUNGGU THINK_TIME
    PASTIKAN dialog "Konfirmasi Pengajuan" tampil (maks LOAD_TIME)
    KLIK tombol "Batal" pada dialog;          TUNGGU THINK_TIME
    PASTIKAN dialog tertutup; modal dan isian alamat tetap ada
    PASTIKAN pesan "berhasil dikirim" tidak tampil
AKHIR TEST

// -- Ubah Kata Sandi Relawan (/ubah-password) ------------------------
SEBELUM SETIAP TEST (Ubah Kata Sandi)
    BUKA URL_APLIKASI
    Login(Relawan)
    PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
    KLIK tombol "Menu";                       TUNGGU THINK_TIME
    KLIK menu "Ubah Kata Sandi";              TUNGGU THINK_TIME
    PASTIKAN URL memuat "/ubah-password" (maks LOAD_TIME)
AKHIR SEBELUM

TEST "TCP.21 Buka halaman ubah kata sandi"
    PASTIKAN field sandi lama, sandi baru, dan konfirmasi tampil
    PASTIKAN tombol "Ubah Kata Sandi" nonaktif
AKHIR TEST

TEST "TCP.22 Syarat kata sandi baru"
    PASTIKAN syarat "minimal 8 karakter", "mengandung angka", dan
        "karakter spesial" tampil
    UNTUK SETIAP s DALAM {"abc", "abcdefgh", "abcdefg1",
            "abcdefgh!"} LAKUKAN                      // EP + BVA
        ISI "Kata sandi baru" dengan s;       TUNGGU THINK_TIME
        PASTIKAN peringatan "harap penuhi semua syarat kata sandi"
            tampil (maks LOAD_TIME)
    AKHIR UNTUK
    ISI "Kata sandi baru" dengan "Rahasia123!"; TUNGGU THINK_TIME
    PASTIKAN peringatan tidak tampil
AKHIR TEST

TEST "TCP.23 Konfirmasi kata sandi"
    ISI "Kata sandi baru" dengan "Rahasia123!"; TUNGGU THINK_TIME
    ISI "Konfirmasi" dengan "Rahasia999!";    TUNGGU THINK_TIME
    PASTIKAN pesan "Kata Sandi tidak cocok." tampil dan tombol
        simpan nonaktif
    ISI "Konfirmasi" dengan "Rahasia123!";    TUNGGU THINK_TIME
    PASTIKAN pesan "Kata sandi cocok" tampil (maks LOAD_TIME)
AKHIR TEST

TEST "TCP.24 Kata sandi lama salah"
    ISI "Kata sandi lama" dengan "KataSandiLamaSalah123"
                                              TUNGGU THINK_TIME
    PASTIKAN pesan "kata sandi lama tidak sesuai" tampil
        (maks LOAD_TIME)
    ISI "Kata sandi baru" dengan "Rahasia123!"; TUNGGU THINK_TIME
    ISI "Konfirmasi" dengan "Rahasia123!";    TUNGGU THINK_TIME
    PASTIKAN tombol "Ubah Kata Sandi" nonaktif
AKHIR TEST

TEST "TCP.25 Tampilkan dan sembunyikan kata sandi"
    UNTUK SETIAP f DALAM {sandi lama, sandi baru, konfirmasi}
            LAKUKAN
        ISI f dengan "Rahasia123!";           TUNGGU THINK_TIME
        PASTIKAN f tersamar
        KLIK ikon mata f;                     TUNGGU THINK_TIME
        PASTIKAN f terlihat
        KLIK ikon mata f;                     TUNGGU THINK_TIME
        PASTIKAN f tersamar kembali
    AKHIR UNTUK
AKHIR TEST

// -- Pembatasan akses -----------------------------------------------
TEST "TCP.26 Super Admin tidak dapat membuka halaman Relawan"
    BUKA URL_APLIKASI
    Login(Super Admin)
    PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
    UNTUK SETIAP rute DALAM {profil-relawan, ubah-password} LAKUKAN
        BUKA rute
        PASTIKAN URL memuat "/unauthorized" (maks LOAD_TIME)
    AKHIR UNTUK
AKHIR TEST

TEST "TCP.27 Relawan tidak dapat membuka profil admin"
    BUKA URL_APLIKASI
    Login(Relawan)
    PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
    BUKA halaman "/profil"
    PASTIKAN URL memuat "/unauthorized" (maks LOAD_TIME)
    PASTIKAN judul "Informasi Pribadi" tidak tampil
AKHIR TEST
```

**TC-ID yang dicakup (28):** TCP.1, TCP.2, TCP.3, TCP.4, TCP.5, TCP.6, TCP.7, TCP.8, TCP.9, TCP.10, TCP.11, TCP.12, TCP.13, TCP.14, TCP.15, TCP.16, TCP.17, TCP.18, TCP.19, TCP.20, TCP.21, TCP.22, TCP.23, TCP.24, TCP.25, TCP.26, TCP.27, TCP.28
