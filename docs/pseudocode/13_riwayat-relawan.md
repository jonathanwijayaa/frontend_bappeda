# Modul Riwayat Relawan (TCHR)
<!-- prefix: TCHR -->

```text
// Berkas: src/tests/riwayat relawan/riwayatRelawan.spec.ts
PROSEDUR BacaOpsi(filter, minimal)        // popup dibuka satu kali
    KLIK filter;                              TUNGGU THINK_TIME
    PASTIKAN popup opsi tampil (maks LOAD_TIME)
    PASTIKAN jumlah opsi >= minimal (maks LOAD_TIME)
    opsi ← seluruh opsi kecuali placeholder
    KLIK judul halaman (tutup popup);         TUNGGU THINK_TIME
    KEMBALIKAN opsi
AKHIR PROSEDUR

PROSEDUR PilihFilter(filter, nilai)
    KLIK filter;                              TUNGGU THINK_TIME
    PASTIKAN popup opsi tampil (maks LOAD_TIME)
    KLIK opsi nilai;                          TUNGGU THINK_TIME
    PASTIKAN popup tertutup dan filter bertuliskan nilai
AKHIR PROSEDUR

PROSEDUR PilihTahun(filter, tahun)
    KLIK filter;                              TUNGGU THINK_TIME
    PASTIKAN popup tahun tampil (maks LOAD_TIME)
    KLIK tahun;                               TUNGGU THINK_TIME
    PASTIKAN popup tertutup dan filter memuat tahun
AKHIR PROSEDUR

PROSEDUR PilihKemantrenBerisi()
    UNTUK SETIAP k DALAM BacaOpsi("Kemantren", 1) LAKUKAN
        PilihFilter("Kemantren", k)
        JIKA tabel berisi baris data MAKA KEMBALIKAN k AKHIR JIKA
    AKHIR UNTUK
    NYATAKAN GAGAL "Tidak ada Kemantren yang memiliki data relawan"
AKHIR PROSEDUR

PROSEDUR UjiUrutKolom(kolom)
    urutanAwal ← nilai kolom pada halaman 1
    KLIK judul kolom;                         TUNGGU THINK_TIME
    PASTIKAN kolom terurut menaik (maks LOAD_TIME)
    KLIK judul kolom;                         TUNGGU THINK_TIME
    PASTIKAN kolom terurut menurun (maks LOAD_TIME)
    PASTIKAN baris pertama menaik ≠ baris pertama menurun
    KLIK judul kolom;                         TUNGGU THINK_TIME
    PASTIKAN urutan kembali = urutanAwal (maks LOAD_TIME)
AKHIR PROSEDUR

UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        KLIK menu "Riwayat Relawan";          TUNGGU THINK_TIME
        PASTIKAN URL memuat "/histori-relawan" (maks LOAD_TIME)
        PASTIKAN teks "Memuat riwayat data relawan" hilang
            (maks LOAD_TIME)
        PASTIKAN baris data tabel tampil (maks LOAD_TIME)
    AKHIR SEBELUM

    TEST "TCHR.1 Filter berdasarkan Nama OPD"
        JIKA peran = Admin OPD MAKA
            LEWATI TEST "filter OPD terkunci, diuji di TCHR.24"
        AKHIR JIKA
        opd ← OPD pertama yang terisi pada tabel
        PilihFilter("Nama OPD", opd)
        PASTIKAN setiap baris memuat opd; jumlah < jumlah awal
        PASTIKAN tombol "Reset Filter" tampil
    AKHIR TEST

    TEST "TCHR.2 Filter berdasarkan Nama Kader"
        // sel kader bisa berisi "-, Kader A"; nilai "-" dilewati
        kader ← kader pertama yang terisi pada tabel
        JIKA kader kosong MAKA
            kader ← opsi pertama BacaOpsi("Nama Kader", 1)
        AKHIR JIKA
        PilihFilter("Nama Kader", kader)
        PASTIKAN baris data atau teks "Tidak ada data riwayat" tampil
        JIKA tabel berisi baris data MAKA
            PASTIKAN setiap baris memuat kader; jumlah < jumlah awal
        AKHIR JIKA
        PASTIKAN tombol "Reset Filter" tampil
    AKHIR TEST

    TEST "TCHR.3 Filter berdasarkan Tahun Awal"
        PilihTahun("Tahun Awal", "2024")
        PASTIKAN tombol "Reset Filter" tampil; jumlah < jumlah awal
    AKHIR TEST

    TEST "TCHR.4 Filter berdasarkan Tahun Akhir"
        PilihTahun("Tahun Akhir", "2036")
        PASTIKAN tombol "Reset Filter" tampil; jumlah < jumlah awal
    AKHIR TEST

    TEST "TCHR.5 Rentang tahun yang konflik tidak dapat dipilih"
        PilihTahun("Tahun Awal", "2024")
        KLIK filter "Tahun Akhir";            TUNGGU THINK_TIME
        PASTIKAN popup tahun tampil (maks LOAD_TIME)
        PASTIKAN tahun paling kecil yang ditawarkan >= 2024     // BVA
        KLIK tahun "2026";                    TUNGGU THINK_TIME
        PASTIKAN filter memuat "2026"; tabel atau pesan kosong
            tampil
    AKHIR TEST

    // Pencarian: kata kunci dari baris pertama tabel
    kasusCari ← {id, kataKunci, adaHasil}
        {"TCHR.6", nama relawan, ya}
        {"TCHR.7", nama relawan huruf besar, ya}               // EP
        {"TCHR.8", nama relawan huruf kecil, ya}               // EP
        {"TCHR.9", NIK relawan, ya (tepat 1 hasil)}            // EP
        {"TCHR.10", "xqz99randomkeyword", tidak}               // EP
        {"TCHR.11", "@#$%^&*()", tidak}                        // EP
        {"TCHR.12", "", ya (jumlah = jumlah awal)}             // BVA
        {"TCHR.13", "   ", tidak}                              // EP
    UNTUK SETIAP k DALAM kasusCari LAKUKAN
        TEST "<k.id> Pencarian riwayat relawan"
            ISI kolom pencarian dengan k.kataKunci; TUNGGU THINK_TIME
            JIKA k.adaHasil MAKA
                PASTIKAN baris data tampil (maks LOAD_TIME)
                PASTIKAN setiap baris memuat k.kataKunci pada NIK
                    atau nama, dan jumlah hasil sesuai kasus
            SELAIN ITU
                PASTIKAN teks "Tidak ada data riwayat" tampil
                    (maks LOAD_TIME); tabel tidak tampil
            AKHIR JIKA
        AKHIR TEST
    AKHIR UNTUK

    TEST "TCHR.14 Akses detail riwayat relawan"
        PASTIKAN judul "Tabel Riwayat Data Relawan" tampil
        KLIK tombol "Detail" baris pertama;   TUNGGU THINK_TIME
        PASTIKAN judul "Detail Riwayat Relawan" tampil
            (maks LOAD_TIME)
        PASTIKAN NIK dan nama pada modal sesuai baris pertama
    AKHIR TEST

    TEST "TCHR.15 Filter berdasarkan Kemantren"
        kemantren ← PilihKemantrenBerisi()
        kelurahan ← BacaOpsi("Kelurahan", 1)
        PASTIKAN setiap kelurahan pada tabel termasuk kelurahan
        PASTIKAN jumlah < jumlah awal
    AKHIR TEST

    TEST "TCHR.16 Filter Kelurahan setelah memilih Kemantren"
        PASTIKAN filter Kelurahan nonaktif dengan teks
            "Pilih Kemantren dulu"
        PilihKemantrenBerisi()
        PASTIKAN filter Kelurahan aktif
        kelurahan ← kelurahan baris pertama
        PilihFilter("Kelurahan", kelurahan)
        PASTIKAN setiap baris berkelurahan = kelurahan
        PilihFilter("Kemantren", "Semua Kemantren")
        PASTIKAN filter Kelurahan kembali nonaktif
    AKHIR TEST

    TEST "TCHR.17 Reset seluruh filter"
        PASTIKAN tombol "Reset Filter" tidak tampil
        PilihKemantrenBerisi()
        PilihTahun("Tahun Awal", "2024")
        ISI kolom pencarian dengan "demo";    TUNGGU THINK_TIME
        KLIK tombol "Reset Filter";           TUNGGU THINK_TIME
        PASTIKAN seluruh filter dan pencarian kembali ke nilai
            awal (filter OPD role OPD tetap terkunci)
        PASTIKAN jumlah = jumlah awal
    AKHIR TEST

    TEST "TCHR.18 Urutkan tabel berdasarkan NIK"
        JIKA total <= 5 MAKA LEWATI TEST "data kurang" AKHIR JIKA
        UjiUrutKolom("NIK")
    AKHIR TEST

    TEST "TCHR.19 Urutkan tabel berdasarkan Nama"
        JIKA total <= 5 MAKA LEWATI TEST "data kurang" AKHIR JIKA
        UjiUrutKolom("NAMA")
    AKHIR TEST

    TEST "TCHR.20 Pindah halaman tabel"
        JIKA total <= 5 MAKA LEWATI TEST "data kurang" AKHIR JIKA
        PASTIKAN 5 baris dan info "Menampilkan 1–5 dari ..."
        KLIK tombol "Selanjutnya";            TUNGGU THINK_TIME
        PASTIKAN info "Menampilkan 6–..." dan isi baris berbeda
        KLIK tombol "Sebelumnya";             TUNGGU THINK_TIME
        PASTIKAN info "Menampilkan 1–5" dan isi baris sama
    AKHIR TEST

    TEST "TCHR.21 Kolom tabel riwayat"
        PASTIKAN kolom = {NIK, NAMA, ALAMAT, KELURAHAN, OPD,
            KADER, AKSI}
    AKHIR TEST

    TEST "TCHR.22 Isi modal detail"
        // diutamakan baris dengan kader terisi, lalu baris dengan OPD
        // terisi; penugasan boleh tanpa kader
        KLIK "Detail" pada baris terpilih;    TUNGGU THINK_TIME
        PASTIKAN bagian "Informasi Pribadi" dan "Daftar Penugasan"
            tampil (maks LOAD_TIME)
        PASTIKAN nama, NIK, jenis kelamin, alamat, nomor HP,
            kemantren, dan kelurahan tampil
        JIKA baris punya OPD MAKA
            PASTIKAN kartu "Penugasan #n", OPD, dan status tampil
            JIKA baris punya kader MAKA
                PASTIKAN salah satu kartu memuat kader terisi
            AKHIR JIKA
        SELAIN ITU
            PASTIKAN teks "belum ada data penugasan terdaftar"
        AKHIR JIKA
        KLIK tombol tutup (X);                TUNGGU THINK_TIME
        PASTIKAN modal tertutup (maks LOAD_TIME)
    AKHIR TEST
AKHIR UNTUK

TEST "TCHR.23 Opsi kader mengikuti OPD terpilih"
    BUKA URL_APLIKASI
    Login(Super Admin)
    KLIK menu "Riwayat Relawan";              TUNGGU THINK_TIME
    PASTIKAN baris data tabel tampil (maks LOAD_TIME)
    semuaKader ← BacaOpsi("Nama Kader", 1)
    opd ← OPD pertama yang terisi pada tabel
    PilihFilter("Nama OPD", opd)
    kaderOPD ← BacaOpsi("Nama Kader", 1)
    PASTIKAN kaderOPD lebih sedikit dan bagian dari semuaKader
    PilihFilter("Nama Kader", kaderOPD[1])
    opdLain ← OPD lain dari BacaOpsi("Nama OPD", 2)
    PilihFilter("Nama OPD", opdLain)
    PASTIKAN filter kader kembali ke placeholder
AKHIR TEST

TEST "TCHR.24 Admin OPD hanya melihat OPD-nya sendiri"
    BUKA URL_APLIKASI
    Login(Admin OPD)
    KLIK menu "Riwayat Relawan";              TUNGGU THINK_TIME
    PASTIKAN baris data tabel tampil (maks LOAD_TIME)
    PASTIKAN filter "Nama OPD" nonaktif dan berisi nama OPD akun
    PASTIKAN setiap baris memuat nama OPD akun
AKHIR TEST

TEST "TCHR.25 Relawan tidak dapat mengakses Riwayat Relawan"
    BUKA URL_APLIKASI
    Login(Relawan)
    PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
    BUKA halaman "/histori-relawan"
    PASTIKAN URL memuat "/unauthorized" atau "/profil-relawan"
    PASTIKAN judul "Tabel Riwayat Data Relawan" tidak tampil
AKHIR TEST

TEST "TCHR.26 Penanganan request data yang gagal"
    BUKA URL_APLIKASI
    Login(Super Admin)
    PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
    GAGALKAN request ke endpoint "/admin/relawan"
    KLIK menu "Riwayat Relawan";              TUNGGU THINK_TIME
    PASTIKAN teks "Memuat riwayat data relawan" hilang
        (maks LOAD_TIME)
    PASTIKAN teks "Tidak ada data riwayat" dan "Belum ada riwayat
        data relawan yang tercatat" tampil; tabel tidak tampil
AKHIR TEST
```

**TC-ID yang dicakup (26):** TCHR.1, TCHR.2, TCHR.3, TCHR.4, TCHR.5, TCHR.6, TCHR.7, TCHR.8, TCHR.9, TCHR.10, TCHR.11, TCHR.12, TCHR.13, TCHR.14, TCHR.15, TCHR.16, TCHR.17, TCHR.18, TCHR.19, TCHR.20, TCHR.21, TCHR.22, TCHR.23, TCHR.24, TCHR.25, TCHR.26
