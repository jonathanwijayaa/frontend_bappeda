# Modul Data Relawan (TCDR)
<!-- prefix: TCDR -->

```text
// Berkas: src/tests/data relawan/dataRelawan.spec.ts
PROSEDUR PilihOpsi(field, nilai)       // autocomplete, satu kali ketik
    PASTIKAN field aktif (maks LOAD_TIME)
    KLIK field;                               TUNGGU THINK_TIME
    ISI field per karakter dengan nilai;      TUNGGU THINK_TIME
    PASTIKAN opsi nilai muncul (maks LOAD_TIME)
    KLIK opsi nilai;                          TUNGGU THINK_TIME
AKHIR PROSEDUR

PROSEDUR PilihOPD(data, peran)
    JIKA peran = Super Admin MAKA
        PilihOpsi("OPD", data.opd)
    SELAIN ITU                        // OPD terkunci ke instansi akun
        data.opd ← isi field "OPD" (maks LOAD_TIME)
        PASTIKAN field "Kader" aktif (maks LOAD_TIME)
        KLIK field "Kader";                   TUNGGU THINK_TIME
        PASTIKAN daftar opsi kader muncul (maks LOAD_TIME)
        data.kader ← salah satu opsi kader secara acak
    AKHIR JIKA
AKHIR PROSEDUR

PROSEDUR IsiFormRelawan(data, peran)
    ISI "Nama lengkap" dengan data.nama;      TUNGGU THINK_TIME
    ISI "NIK" dengan data.nik;                TUNGGU THINK_TIME
    ISI "Alamat sesuai KTP" dengan data.alamat; TUNGGU THINK_TIME
    ISI "Nomor HP" dengan data.noHp;          TUNGGU THINK_TIME
    PilihOpsi("Kemantren", data.kemantren)
    PilihOpsi("Kelurahan", data.kelurahan)
    KLIK pilihan jenis kelamin;               TUNGGU THINK_TIME
    KLIK opsi data.jenisKelamin;              TUNGGU THINK_TIME
    KLIK tombol "Tambah Data Penugasan";      TUNGGU THINK_TIME
    PilihOPD(data, peran)
    PilihOpsi("Kader", data.kader)
    KLIK pilihan jabatan;                     TUNGGU THINK_TIME
    PILIH jabatan data.jabatan;               TUNGGU THINK_TIME
    ISI "Detail Jabatan" dengan data.detail;  TUNGGU THINK_TIME
    ISI "Penugasan" dengan data.penugasan;    TUNGGU THINK_TIME
    KLIK radio status data.status;            TUNGGU THINK_TIME
AKHIR PROSEDUR

UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        KLIK menu "Relawan";                  TUNGGU THINK_TIME
    AKHIR SEBELUM

    TEST "TCDR.1 Akses halaman Data Relawan"
        PASTIKAN URL memuat "/relawan" (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDR.2 Klik tombol tambah relawan"
        KLIK tombol "Tambah Relawan";         TUNGGU THINK_TIME
        PASTIKAN judul "Tambah Relawan Baru" tampil (maks LOAD_TIME)
    AKHIR TEST

    // TCDR.3–13, 15–16: form tambah relawan sudah terbuka
    //   (KLIK tombol "Tambah Relawan"; TUNGGU THINK_TIME)
    TEST "TCDR.3 Isi form tambah relawan"
        data ← BangkitkanDataRelawan()
        IsiFormRelawan(data, peran)
        PASTIKAN nama, NIK, alamat, dan nomor HP sesuai data
    AKHIR TEST

    TEST "TCDR.4 Simpan relawan baru"
        IsiFormRelawan(BangkitkanDataRelawan(), peran)
        KLIK tombol "Simpan";                 TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" atau "baru ditambahkan"
            tampil (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDR.5 Batalkan form tambah relawan"
        IsiFormRelawan(BangkitkanDataRelawan(), peran)
        KLIK tombol tutup (X) modal;          TUNGGU THINK_TIME
        PASTIKAN modal "Tambah Relawan Baru" tertutup (maks LOAD_TIME)
    AKHIR TEST

    // TCDR.6–9: satu field tidak valid, field lain valid
    kasusNama ← {judul, nilai, pesan}                      // TCDR.6
        {"Empty name", "", ditolak browser}                    // EP
        {"Name too short", "A", "minimal 3 karakter"}          // BVA
        {"Name with numbers", "Relawan12345",
            "Format nama relawan tidak valid"}                 // EP
        {"Name with special characters", "@@@###", idem}       // EP
        {"Name too long", 300 × "A", "terlalu panjang"}        // BVA
    kasusNIK ← {judul, nilai, pesan}                       // TCDR.7
        {"Empty NIK", "", ditolak browser}                     // EP
        {"NIK too short", "1234567890",
            "NIK harus tepat 16 digit angka"}                  // BVA
        {"NIK with letters", "320100ABCD123456", idem}         // EP
        {"NIK with special characters", "3201@#$%^&123456",
            idem}                                              // EP
        {"NIK too long", "32010000000000001",
            dipotong input menjadi "3201000000000000"}         // BVA
    kasusAlamat ← {judul, nilai, pesan}                    // TCDR.8
        {"Empty address", "", ditolak browser}                 // EP
        {"Address too short", "A", "Alamat minimal 5 karakter"}
                                                               // BVA
        {"Address only numbers", "1234567890",
            "Alamat tidak boleh hanya berupa angka"}           // EP
        {"Address with special characters", "@@@###$$$",
            "Alamat mengandung karakter tidak valid"}          // EP
        {"Address too long", 300 × "A", "terlalu panjang"}     // BVA
    kasusHP ← {judul, nilai, pesan}                        // TCDR.9
        {"Empty phone number", "", ditolak browser}            // EP
        {"Phone number too short", "08123",
            "Format Nomor HP tidak valid"}                     // BVA
        {"Phone number with letters", "08ABCDE123",
            "Nomor HP tidak boleh mengandung huruf"}           // EP
        {"Phone number with special characters", "08!@#$%^&*",
            "Format Nomor HP tidak valid"}                     // EP
        {"Phone number too long", "081234567890123456789",
            "Format Nomor HP tidak valid"}                     // BVA

    UNTUK SETIAP (field, kasus) DALAM {(nama, kasusNama),
            (nik, kasusNIK), (alamat, kasusAlamat),
            (noHp, kasusHP)} LAKUKAN
        UNTUK SETIAP k DALAM kasus LAKUKAN
            TEST "TCDR.6/7/8/9 <k.judul>"
                data ← BangkitkanDataRelawan()
                data[field] ← k.nilai
                IsiFormRelawan(data, peran)
                JIKA k.pesan = dipotong input MAKA
                    PASTIKAN field "NIK" bernilai "3201000000000000"
                SELAIN ITU
                    KLIK tombol "Simpan";     TUNGGU THINK_TIME
                    JIKA k.pesan = ditolak browser MAKA
                        PASTIKAN field tidak valid menurut browser
                    SELAIN ITU
                        PASTIKAN pesan k.pesan tampil (maks LOAD_TIME)
                    AKHIR JIKA
                AKHIR JIKA
            AKHIR TEST
        AKHIR UNTUK
    AKHIR UNTUK

    TEST "TCDR.10 Isi form penugasan"
        data ← BangkitkanDataRelawan()
        IsiFormRelawan(data, peran)
        PASTIKAN field "Penugasan" bernilai data.penugasan
    AKHIR TEST

    TEST "TCDR.11 Pilih OPD pada form penugasan"
        data ← BangkitkanDataRelawan()
        IsiFormRelawan(data, peran)
        PilihOPD(data, peran)
        PASTIKAN field "OPD" bernilai data.opd
    AKHIR TEST

    TEST "TCDR.12 Pilih kader pada form penugasan"
        data ← BangkitkanDataRelawan()
        IsiFormRelawan(data, peran)
        PilihOPD(data, peran)
        PilihOpsi("Kader", data.kader)
        PASTIKAN field "Kader" bernilai data.kader
    AKHIR TEST

    TEST "TCDR.13 Isi peran (penugasan) pada form penugasan"
        data ← BangkitkanDataRelawan()
        IsiFormRelawan(data, peran)
        ISI "Penugasan" dengan data.penugasan; TUNGGU THINK_TIME
        PASTIKAN field "Penugasan" bernilai data.penugasan
    AKHIR TEST

    // TCDR.14 tidak diotomasi: skrip uji nomor SK tidak valid
    //     dinonaktifkan (dikomentari di spec)

    TEST "TCDR.15 Pilih status keaktifan"
        data ← BangkitkanDataRelawan()
        IsiFormRelawan(data, peran)
        KLIK radio status data.status;        TUNGGU THINK_TIME
        PASTIKAN radio "Aktif" atau "Tidak Aktif" sesuai data
            tercentang
    AKHIR TEST

    TEST "TCDR.16 Tambah data penugasan lagi"
        IsiFormRelawan(BangkitkanDataRelawan(), peran)
        KLIK tombol "Tambah Data Penugasan";  TUNGGU THINK_TIME
        PASTIKAN field "OPD" blok penugasan kedua tampil
            (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDR.17 Unggah Excel relawan valid"
        berkas ← BangkitkanExcelRelawan(valid, 5 baris)
        KLIK tombol "Unggah dari Excel";      TUNGGU THINK_TIME
        UNGGAH berkas;                        TUNGGU THINK_TIME
        KLIK tombol "Lanjutkan";              TUNGGU THINK_TIME
        PASTIKAN judul "Data Kotor (0)" tampil (maks LOAD_TIME)
        KLIK tombol "Simpan Data Bersih";     TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" tampil (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDR.18 Unggah Excel relawan tidak valid"
        berkas ← BangkitkanExcelRelawan(tidak valid, 3 baris)
        KLIK tombol "Unggah dari Excel";      TUNGGU THINK_TIME
        UNGGAH berkas;                        TUNGGU THINK_TIME
        KLIK tombol "Lanjutkan";              TUNGGU THINK_TIME
        PASTIKAN "Data Bersih (0)" dan "Data Kotor (3)" tampil
            (maks LOAD_TIME)
        PASTIKAN tombol simpan nonaktif
        PASTIKAN tabel data kotor berisi 3 baris dan keterangannya
    AKHIR TEST

    TEST "TCDR.19 Klik tautan templat Excel relawan"
        KLIK tombol "Unggah dari Excel";      TUNGGU THINK_TIME
        KLIK tautan "Unduh Templat Excel Data"; TUNGGU THINK_TIME
        PASTIKAN URL memuat "/dokumen" (maks LOAD_TIME)
        PASTIKAN judul "Format Excel Data Relawan" tampil
    AKHIR TEST

    TEST "TCDR.20 Batalkan unggah Excel relawan"
        KLIK tombol "Unggah dari Excel";      TUNGGU THINK_TIME
        UNGGAH BangkitkanExcelRelawan(valid, 1); TUNGGU THINK_TIME
        KLIK tombol tutup (X) modal;          TUNGGU THINK_TIME
        PASTIKAN modal "Unggah Data Relawan" tertutup
            (maks LOAD_TIME)
    AKHIR TEST

    // Pencarian Daftar Relawan: kata kunci dari baris pertama
    kasusCari ← {id, kataKunci, adaHasil}
        {"TCDR.21", nama relawan, ya}
        {"TCDR.22", nama relawan huruf besar, ya}              // EP
        {"TCDR.23", nama relawan huruf kecil, ya}              // EP
        {"TCDR.24", NIK relawan, ya}                           // EP
        {"TCDR.25", "xqz99randomkeyword", tidak}               // EP
        {"TCDR.26", "@#$%^&*()", tidak}                        // EP
    UNTUK SETIAP k DALAM kasusCari LAKUKAN
        TEST "<k.id> Pencarian relawan"
            PASTIKAN tabel Daftar Relawan tampil (maks LOAD_TIME)
            ISI pencarian "Cari relawan" dengan k.kataKunci
                                              TUNGGU THINK_TIME
            JIKA k.adaHasil MAKA
                PASTIKAN minimal satu baris memuat k.kataKunci
                    (maks LOAD_TIME)
            SELAIN ITU
                PASTIKAN teks "Belum ada relawan" tampil
                    (maks LOAD_TIME)
            AKHIR JIKA
        AKHIR TEST
    AKHIR UNTUK

    TEST "TCDR.27 Akses detail relawan"
        KLIK tombol "Detail" pertama;         TUNGGU THINK_TIME
        PASTIKAN judul "Detail Relawan" tampil (maks LOAD_TIME)
    AKHIR TEST

    // TCDR.28–29: detail relawan sudah terbuka
    TEST "TCDR.28 Ubah data detail relawan"
        KLIK tombol "Edit";                   TUNGGU THINK_TIME
        data ← BangkitkanDataRelawan()
        ISI "Nama lengkap" dengan data.nama;  TUNGGU THINK_TIME
        ISI "Alamat sesuai KTP" dengan data.alamat; TUNGGU THINK_TIME
        ISI "Nomor HP" dengan data.noHp;      TUNGGU THINK_TIME
        KLIK tombol "Simpan";                 TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" tampil (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDR.29 Ubah data penugasan relawan"
        KLIK tombol "Edit";                   TUNGGU THINK_TIME
        data ← BangkitkanDataRelawan()
        PilihOPD(data, peran)
        PilihOpsi("Kader", data.kader)
        ISI "Penugasan" dengan data.penugasan; TUNGGU THINK_TIME
        KLIK tombol "Simpan";                 TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" tampil (maks LOAD_TIME)
    AKHIR TEST

    // TCDR.30–31 tidak diotomasi: skrip dinonaktifkan sementara
    //     karena form penugasan berubah

    // -- TCDR.32–35 Pengajuan Perubahan Data (berurutan) ---------
    PROSEDUR AjukanPerubahanSebagaiRelawan()
        BUKA URL_APLIKASI pada sesi browser terpisah
        Login(Relawan)
        PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
        KLIK tombol "Ajukan Pembaruan Data";  TUNGGU THINK_TIME
        ISI alasan, alamat, dan nomor HP baru
            (TUNGGU THINK_TIME setelah setiap field)
        KLIK tombol "Ajukan";                 TUNGGU THINK_TIME
        KLIK tombol "Ya, Ajukan";             TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil dikirim" tampil (maks LOAD_TIME)
        TUTUP sesi browser relawan
    AKHIR PROSEDUR

    PROSEDUR BukaReview()
        KLIK menu "Relawan";                  TUNGGU THINK_TIME
        PASTIKAN URL memuat "/relawan" (maks LOAD_TIME)
        // penyiapan data: maks 3 kali bila pengajuan habis dipakai
        UNTUK SETIAP percobaan DALAM {1, 2, 3} LAKUKAN
            MUAT ULANG halaman; tunggu jaringan diam (maks LOAD_TIME)
            JIKA ada baris "Menunggu" MAKA BERHENTI AKHIR JIKA
            AjukanPerubahanSebagaiRelawan()
        AKHIR UNTUK
        PASTIKAN tabel "Pengajuan Perubahan Data" tampil
        KLIK tombol "Review" baris "Menunggu"; TUNGGU THINK_TIME
        KLIK checkbox "Saya telah memverifikasi"; TUNGGU THINK_TIME
    AKHIR PROSEDUR

    TEST "TCDR.32 Akses halaman review pengajuan"
        BukaReview()
        PASTIKAN judul "Review Pengajuan Perubahan Data" tampil
            (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDR.33 Setujui pengajuan perubahan data"
        BukaReview()
        KLIK tombol "Setuju";                 TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" tampil (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDR.34 Tolak pengajuan perubahan data"
        BukaReview()
        KLIK tombol "Tolak";                  TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" atau "ditolak" tampil
            (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDR.35 Tambah catatan verifikasi pada pengajuan"
        BukaReview()
        KLIK tombol "Tolak";                  TUNGGU THINK_TIME
        ISI field "Catatan" dengan catatan verifikasi
                                              TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" tampil (maks LOAD_TIME)
    AKHIR TEST
AKHIR UNTUK
```

**TC-ID yang dicakup (32):** TCDR.1, TCDR.2, TCDR.3, TCDR.4, TCDR.5, TCDR.6, TCDR.7, TCDR.8, TCDR.9, TCDR.10, TCDR.11, TCDR.12, TCDR.13, TCDR.15, TCDR.16, TCDR.17, TCDR.18, TCDR.19, TCDR.20, TCDR.21, TCDR.22, TCDR.23, TCDR.24, TCDR.25, TCDR.26, TCDR.27, TCDR.28, TCDR.29, TCDR.32, TCDR.33, TCDR.34, TCDR.35
