# Modul Manajemen OPD (TCMO)
<!-- prefix: TCMO -->

```text
// Berkas: src/tests/manajemen opd/manajemenOPD.spec.ts
PROSEDUR IsiFormOPD(data)
    ISI "Nama Dinas / OPD" dengan data.nama;  TUNGGU THINK_TIME
    ISI "Alamat OPD" dengan data.alamat;      TUNGGU THINK_TIME
    ISI "Penanggung jawab" dengan data.pic;   TUNGGU THINK_TIME
    ISI "Nomor telepon / email" dengan data.kontak
                                              TUNGGU THINK_TIME
    ISI "NIK PIC" dengan data.nikPic;         TUNGGU THINK_TIME
AKHIR PROSEDUR

SEBELUM SETIAP TEST
    BUKA URL_APLIKASI
    Login(Super Admin)
    PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
    KLIK menu "Manajemen OPD";                TUNGGU THINK_TIME
AKHIR SEBELUM

TEST "TCMO.1 Akses halaman Manajemen OPD"
    PASTIKAN URL memuat "/manajemen-opd" (maks LOAD_TIME)
AKHIR TEST

TEST "TCMO.2 Klik tombol Tambah OPD"
    KLIK tombol "Tambah OPD";                 TUNGGU THINK_TIME
    PASTIKAN judul "Tambah OPD Baru" tampil (maks LOAD_TIME)
AKHIR TEST

TEST "TCMO.3 Isi form tambah OPD"
    KLIK tombol "Tambah OPD";                 TUNGGU THINK_TIME
    data ← BangkitkanDataOPD()
    IsiFormOPD(data)
    PASTIKAN nama, alamat, PIC, dan kontak di form sesuai data
AKHIR TEST

TEST "TCMO.4 Simpan OPD baru"
    KLIK tombol "Tambah OPD";                 TUNGGU THINK_TIME
    data ← BangkitkanDataOPD()
    IsiFormOPD(data)
    KLIK tombol "Simpan";                     TUNGGU THINK_TIME
    PASTIKAN modal "Tambah OPD Baru" tertutup (maks LOAD_TIME)
    ISI kolom pencarian dengan data.nama;     TUNGGU THINK_TIME
    PASTIKAN baris data.nama tampil di tabel (maks LOAD_TIME)
AKHIR TEST

TEST "TCMO.5 Batalkan form tambah OPD"
    KLIK tombol "Tambah OPD";                 TUNGGU THINK_TIME
    IsiFormOPD(BangkitkanDataOPD())
    KLIK tombol "Batal";                      TUNGGU THINK_TIME
    PASTIKAN modal "Tambah OPD Baru" tertutup (maks LOAD_TIME)
    PASTIKAN URL tetap memuat "/manajemen-opd"
AKHIR TEST

// TCMO.6, TCMO.8–TCMO.10: satu field diberi nilai tidak valid,
// field lain diisi data valid. "ditolak browser" = atribut required.
kasusNama ← {judul, nilai, pesan}                          // TCMO.6
    {"Empty OPD name", "", ditolak browser}                    // EP
    {"OPD name too short", "A", "Nama OPD minimal 3 karakter"} // BVA
    {"OPD name with numbers", "OPD12345", "Nama OPD tidak
        boleh mengandung angka atau karakter spesial"}         // EP
    {"OPD name with special characters", "@@@###", idem}       // EP
    {"OPD name too long", 300 × "A",
        "Nama OPD terlalu panjang (maks 100 karakter)"}        // BVA
kasusAlamat ← {judul, nilai, pesan}                        // TCMO.8
    {"Empty address", "", ditolak browser}                     // EP
    {"Address too short", "A", "Alamat OPD minimal 5 karakter"}
                                                               // BVA
    {"Address only numbers", "1234567890",
        "Alamat OPD tidak boleh hanya berisi angka"}           // EP
    {"Address with special characters", "@@@###$$$", "Alamat
        OPD tidak boleh mengandung karakter spesial yang tidak
        valid"}                                                // EP
    {"Address too long", 300 × "A",
        "Alamat OPD terlalu panjang (maks 255 karakter)"}      // BVA
kasusPIC ← {judul, nilai, pesan}                           // TCMO.9
    {"Empty PIC name", "", ditolak browser}                    // EP
    {"PIC name too short", "A", "Nama PIC minimal 3 karakter"} // BVA
    {"PIC name with numbers", "PIC12345", "Nama PIC tidak
        boleh mengandung angka atau karakter spesial"}         // EP
    {"PIC name with special characters", "@@@###", idem}       // EP
    {"PIC name too long", 200 × "A",
        "Nama PIC terlalu panjang (maks 100 karakter)"}        // BVA
kasusKontak ← {judul, nilai, pesan}                       // TCMO.10
    {"Empty kontak", "", ditolak browser}                      // EP
    {"Kontak too short", "08123", "Format nomor kontak tidak
        valid (harus diawali 08 atau +628, minimal 9-13 digit
        angka)"}                                               // BVA
    {"Kontak with letters", "08ABCDE123",
        "Nomor kontak tidak boleh mengandung huruf"}           // EP
    {"Kontak with special characters", "08!@#$%^&*",
        "Format nomor kontak tidak valid (...)"}               // EP
    {"Kontak too long", "081234567890123456789",
        "Format nomor kontak tidak valid (...)"}               // BVA

UNTUK SETIAP (field, kasus) DALAM {(nama, kasusNama),
        (alamat, kasusAlamat), (pic, kasusPIC),
        (kontak, kasusKontak)} LAKUKAN
    UNTUK SETIAP k DALAM kasus LAKUKAN
        TEST "TCMO.6/8/9/10 <k.judul>"
            KLIK tombol "Tambah OPD";         TUNGGU THINK_TIME
            data ← BangkitkanDataOPD()
            data[field] ← k.nilai
            IsiFormOPD(data)
            KLIK tombol "Simpan";             TUNGGU THINK_TIME
            JIKA k.pesan = ditolak browser MAKA
                PASTIKAN field tidak valid menurut browser
                PASTIKAN notifikasi "berhasil" tidak tampil
            SELAIN ITU
                PASTIKAN pesan k.pesan tampil (maks LOAD_TIME)
            AKHIR JIKA
        AKHIR TEST
    AKHIR UNTUK
AKHIR UNTUK

// TCMO.7 tidak diotomasi: skrip status OPD dinonaktifkan (fungsi
//     pengisian Status tidak dipakai pada form Tambah OPD)

TEST "TCMO.11 Unggah Excel OPD valid"
    berkas ← BangkitkanExcelOPD(valid, 5 baris)
    KLIK tombol "Unggah dari Excel";          TUNGGU THINK_TIME
    UNGGAH berkas;                            TUNGGU THINK_TIME
    KLIK tombol "Lanjutkan";                  TUNGGU THINK_TIME
    PASTIKAN judul "Data Kotor (0)" tampil (maks LOAD_TIME)
    KLIK tombol "Simpan Data Bersih";         TUNGGU THINK_TIME
    PASTIKAN notifikasi "berhasil" tampil (maks LOAD_TIME)
AKHIR TEST

TEST "TCMO.12 Unggah Excel OPD tidak valid"
    berkas ← BangkitkanExcelOPD(tidak valid, 3 baris)
    KLIK tombol "Unggah dari Excel";          TUNGGU THINK_TIME
    UNGGAH berkas;                            TUNGGU THINK_TIME
    KLIK tombol "Lanjutkan";                  TUNGGU THINK_TIME
    PASTIKAN "Data Bersih (0)" dan "Data Kotor (3)" tampil
        (maks LOAD_TIME)
    PASTIKAN tombol simpan nonaktif
    PASTIKAN tabel data kotor berisi 3 baris beserta keterangannya
AKHIR TEST

TEST "TCMO.13 Klik tautan templat Excel OPD"
    KLIK tombol "Unggah dari Excel";          TUNGGU THINK_TIME
    KLIK tautan "Templat Excel Data OPD";     TUNGGU THINK_TIME
    PASTIKAN URL memuat "excel", "template", "dokumen", atau
        "download" (maks LOAD_TIME)
AKHIR TEST

TEST "TCMO.14 Batalkan unggah Excel OPD"
    KLIK tombol "Unggah dari Excel";          TUNGGU THINK_TIME
    UNGGAH BangkitkanExcelOPD(valid, 1 baris); TUNGGU THINK_TIME
    KLIK tombol tutup (X) modal;              TUNGGU THINK_TIME
    PASTIKAN modal "Unggah Data OPD" tertutup (maks LOAD_TIME)
    PASTIKAN judul "Manajemen OPD" tampil
AKHIR TEST

// Pencarian: kata kunci diambil dari baris pertama tabel
kasusCari ← {id, kataKunci, adaHasil}
    {"TCMO.15", nama OPD baris pertama, ya}
    {"TCMO.24", nama baris pertama huruf besar, ya}         // EP
    {"TCMO.25", nama baris pertama huruf kecil, ya}         // EP
    {"TCMO.26", "Dinas", ya}                                // EP
    {"TCMO.27", "abcdxyz", tidak}                           // EP
    {"TCMO.28", "@#$%^&", tidak}                            // EP
UNTUK SETIAP k DALAM kasusCari LAKUKAN
    TEST "<k.id> Pencarian OPD"
        PASTIKAN tabel OPD terisi (maks LOAD_TIME)
        ISI kolom pencarian dengan k.kataKunci; TUNGGU THINK_TIME
        JIKA k.adaHasil MAKA
            PASTIKAN setiap baris hasil memuat k.kataKunci
                (tidak peka huruf besar/kecil)
            PASTIKAN jumlah hasil <= jumlah awal
        SELAIN ITU
            PASTIKAN teks "Belum ada OPD" dan "Tidak ada OPD yang
                cocok dengan pencarian" tampil (maks LOAD_TIME)
            PASTIKAN tabel tidak tampil
        AKHIR JIKA
    AKHIR TEST
AKHIR UNTUK

// TCMO.16–TCMO.23 tidak diotomasi: tidak ada di skrip pengujian

TEST "TCMO.29 Ekspor tabel Daftar OPD"
    PASTIKAN tabel OPD terisi (maks LOAD_TIME)
    KLIK tombol "Ekspor PDF";                 TUNGGU THINK_TIME
    PASTIKAN berkas terunduh (maks LOAD_TIME) dengan nama
        "manajemen-opd-<tanggal>.pdf"
    PASTIKAN notifikasi "berhasil diekspor" tampil
AKHIR TEST

TEST "TCMO.30 Akses detail OPD"
    PASTIKAN tabel OPD terisi (maks LOAD_TIME)
    KLIK tombol "Detail" baris pertama;       TUNGGU THINK_TIME
    PASTIKAN judul "Detail OPD" tampil (maks LOAD_TIME)
    PASTIKAN nama dan kontak sesuai baris pertama
    PASTIKAN teks "Tanggal Dibuat" tampil
    PASTIKAN tombol "Simpan" nonaktif
    ISI field alamat dengan alamat uji;       TUNGGU THINK_TIME
    PASTIKAN tombol "Simpan" aktif
AKHIR TEST

TEST "TCMO.31 Nonaktifkan OPD"
    // memakai OPD uji baru agar OPD akun lain tidak terpengaruh
    KLIK tombol "Tambah OPD";                 TUNGGU THINK_TIME
    data ← BangkitkanDataOPD()
    IsiFormOPD(data)
    KLIK tombol "Simpan";                     TUNGGU THINK_TIME
    PASTIKAN modal tertutup (maks LOAD_TIME)
    ISI kolom pencarian dengan data.nama;     TUNGGU THINK_TIME
    PASTIKAN status baris = "Aktif" (maks LOAD_TIME)
    KLIK tombol "Nonaktif";                   TUNGGU THINK_TIME
    PASTIKAN dialog "Konfirmasi" dengan teks "yakin ingin
        menonaktifkan OPD ini" tampil
    KLIK tombol "Lanjutkan";                  TUNGGU THINK_TIME
    PASTIKAN status baris = "Tidak Aktif" (maks LOAD_TIME)
    KLIK tombol "Aktifkan";                   TUNGGU THINK_TIME
    KLIK tombol "Lanjutkan";                  TUNGGU THINK_TIME
    PASTIKAN status baris = "Aktif" (maks LOAD_TIME)
AKHIR TEST

TEST "TCMO.32 Batalkan nonaktifkan OPD"
    PASTIKAN tabel OPD terisi (maks LOAD_TIME)
    ISI kolom pencarian dengan nama baris pertama; TUNGGU THINK_TIME
    statusAwal ← status baris pertama
    KLIK tombol ubah status;                  TUNGGU THINK_TIME
    PASTIKAN dialog "Konfirmasi" tampil (maks LOAD_TIME)
    KLIK tombol "Batal";                      TUNGGU THINK_TIME
    PASTIKAN dialog tertutup dan status baris = statusAwal
AKHIR TEST

TEST "TCMO.33 Pindah halaman tabel OPD"
    PASTIKAN tabel OPD terisi (maks LOAD_TIME)
    JIKA total OPD <= 5 MAKA
        LEWATI TEST "data kurang dari dua halaman"
    AKHIR JIKA
    PASTIKAN 5 baris, info "Menampilkan 1-5 dari <total> OPD",
        dan tombol "Sebelumnya" nonaktif
    KLIK tombol "Selanjutnya";                TUNGGU THINK_TIME
    PASTIKAN info "Menampilkan 6-..." tampil dan isi baris berbeda
    KLIK tombol "Sebelumnya";                 TUNGGU THINK_TIME
    PASTIKAN info "Menampilkan 1-5" dan isi baris sama seperti awal
AKHIR TEST
```

**TC-ID yang dicakup (24):** TCMO.1, TCMO.2, TCMO.3, TCMO.4, TCMO.5, TCMO.6, TCMO.8, TCMO.9, TCMO.10, TCMO.11, TCMO.12, TCMO.13, TCMO.14, TCMO.15, TCMO.24, TCMO.25, TCMO.26, TCMO.27, TCMO.28, TCMO.29, TCMO.30, TCMO.31, TCMO.32, TCMO.33
