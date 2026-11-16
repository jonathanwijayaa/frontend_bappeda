# Modul Daftar Kader (TCDK)
<!-- prefix: TCDK -->

```text
// Berkas: src/tests/daftar kader/daftarKader.spec.ts
PROSEDUR IsiFormKader(data, peran)
    JIKA peran = Super Admin MAKA
        KLIK field "OPD";                     TUNGGU THINK_TIME
        ISI field "OPD" per karakter dengan data.opd
                                              TUNGGU THINK_TIME
        PASTIKAN opsi data.opd muncul (maks LOAD_TIME)
        KLIK opsi data.opd;                   TUNGGU THINK_TIME
        PASTIKAN teks "OPD ditemukan dan siap disimpan" tampil
            (maks LOAD_TIME)
    AKHIR JIKA
    ISI "Nama Kader" dengan data.namaKader;   TUNGGU THINK_TIME
    ISI "Nama PIC" dengan data.pic;           TUNGGU THINK_TIME
    ISI "NIK PIC" dengan data.nikPic;         TUNGGU THINK_TIME
    ISI "Nomor HP PIC" dengan data.noHp;      TUNGGU THINK_TIME
    ISI "Alamat sesuai KTP" dengan data.alamat; TUNGGU THINK_TIME
    ISI "Deskripsi" dengan data.deskripsi;    TUNGGU THINK_TIME
    ISI "Kemantren" dengan data.kemantren;    TUNGGU THINK_TIME
    ISI "Kelurahan" dengan data.kelurahan;    TUNGGU THINK_TIME
AKHIR PROSEDUR

PROSEDUR SimpanKader(harusTertutup)
    KLIK tombol "Simpan";                     TUNGGU THINK_TIME
    JIKA harusTertutup MAKA
        PASTIKAN modal "Tambah Kader Baru" tertutup (maks LOAD_TIME)
    AKHIR JIKA
AKHIR PROSEDUR

PROSEDUR BukaFormTambah()
    KLIK tombol "Tambah Kader Baru";          TUNGGU THINK_TIME
    PASTIKAN judul "Tambah Kader Baru" tampil (maks LOAD_TIME)
AKHIR PROSEDUR

UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        KLIK menu "Kader";                    TUNGGU THINK_TIME
        PASTIKAN URL memuat "/daftar-kader" (maks LOAD_TIME)
        PASTIKAN teks "Memuat data kader" hilang (maks LOAD_TIME)
        PASTIKAN baris data tabel tampil (maks LOAD_TIME)
    AKHIR SEBELUM

    TEST "TCDK.1 Akses halaman Daftar Kader"
        PASTIKAN judul "Daftar Kader", tabel, dan info jumlah tampil
        PASTIKAN tombol "Tambah Kader Baru" dan "Unggah dari Excel"
            aktif
    AKHIR TEST

    TEST "TCDK.2 Buka form Tambah Kader Baru"
        BukaFormTambah()
        PASTIKAN field nama kader, PIC, NIK PIC, nomor HP, alamat,
            deskripsi, dan Kemantren tampil
        PASTIKAN field Kelurahan nonaktif sebelum Kemantren dipilih
        JIKA peran = Super Admin MAKA
            PASTIKAN field "OPD" tampil
        SELAIN ITU
            PASTIKAN field "OPD" tidak ada
        AKHIR JIKA
    AKHIR TEST

    TEST "TCDK.3 Isi form tambah kader"
        BukaFormTambah()
        data ← BangkitkanDataKader()
        IsiFormKader(data, peran)
        PASTIKAN seluruh field bernilai sesuai data
    AKHIR TEST

    TEST "TCDK.4 Simpan kader baru"
        BukaFormTambah()
        data ← BangkitkanDataKader()
        IsiFormKader(data, peran)
        SimpanKader(ya)
        ISI kolom pencarian dengan data.namaKader; TUNGGU THINK_TIME
        PASTIKAN baris hasil tampil (maks LOAD_TIME)
        PASTIKAN nama tersimpan = data.namaKader (abaikan kapital)
    AKHIR TEST

    TEST "TCDK.5 Batalkan form tambah kader"
        BukaFormTambah()
        data ← BangkitkanDataKader()
        IsiFormKader(data, peran)
        KLIK tombol "Batal";                  TUNGGU THINK_TIME
        PASTIKAN modal tertutup (maks LOAD_TIME)
        ISI kolom pencarian dengan data.namaKader; TUNGGU THINK_TIME
        PASTIKAN teks "Belum ada kader" tampil (maks LOAD_TIME)
    AKHIR TEST

    // TCDK.6–9, 27: satu field tidak valid, field lain valid
    kasusNama ← {judul, nilai, pesan}                      // TCDK.6
        {"Empty Kader name", "", ditolak browser}              // EP
        {"Kader name too short", "A",
            "nama kader minimal 3 karakter"}                   // BVA
        {"Kader name with numbers", "Kader12345", "nama kader
            tidak boleh mengandung angka atau karakter spesial"}
                                                               // EP
        {"Kader name with special characters", "@@@###", idem} // EP
        {"Kader name too long", 300 × "A",
            "nama kader terlalu panjang"}                      // BVA
    kasusNIK ← {judul, nilai, pesan}                       // TCDK.7
        {"Empty NIK PIC", "", ditolak browser}                 // EP
        {"NIK PIC too short", "3201",
            "NIK PIC harus tepat 16 digit angka"}              // BVA
        {"NIK PIC with letters", "32010ABCDE12345", idem}      // EP
        {"NIK PIC with special characters", "3201-0000-0000",
            idem}                                              // EP
    kasusPIC ← {judul, nilai, pesan}                       // TCDK.8
        {"Empty PIC name", "", ditolak browser}                // EP
        {"PIC name too short", "A", "nama PIC minimal 3 karakter"}
                                                               // BVA
        {"PIC name with numbers", "PIC12345", "nama PIC tidak
            boleh mengandung angka atau karakter spesial"}     // EP
        {"PIC name with special characters", "@@@###", idem}   // EP
        {"PIC name too long", 200 × "A",
            "nama PIC terlalu panjang"}                        // BVA
    kasusKontak ← {judul, nilai, pesan}                    // TCDK.9
        {"Empty kontak", "", ditolak browser}                  // EP
        {"Kontak too short", "08123",
            "nomor telepon PIC terlalu pendek"}                // BVA
        {"Kontak with letters", "08ABCDE123",
            "nomor telepon PIC tidak boleh mengandung huruf"}  // EP
        {"Kontak with special characters", "08!@#$%^&*",
            "nomor telepon PIC tidak boleh mengandung karakter
            spesial"}                                          // EP
        {"Kontak too long", "081234567890123456789",
            "nomor telepon PIC terlalu panjang"}               // BVA
    kasusAlamat ← {judul, nilai, pesan}                   // TCDK.27
        {"Alamat too short", "Jl. A",
            "alamat PIC terlalu pendek"}                       // BVA
        {"Alamat too long", "Jl. " + 120 × "A",
            "alamat PIC terlalu panjang"}                      // BVA
        {"Alamat with digits only", "1234567890",
            "alamat PIC tidak boleh hanya berisi angka"}       // EP
        {"Alamat with illegal characters",
            "Jl. Mawar @@@ *** !!!", "alamat PIC hanya boleh
            berisi huruf, angka, spasi"}                       // EP

    UNTUK SETIAP (field, kasus) DALAM {(namaKader, kasusNama),
            (nikPic, kasusNIK), (pic, kasusPIC), (noHp, kasusKontak),
            (alamat, kasusAlamat)} LAKUKAN
        UNTUK SETIAP k DALAM kasus LAKUKAN
            TEST "TCDK.6/7/8/9/27 <k.judul>"
                BukaFormTambah()
                data ← BangkitkanDataKader()
                data[field] ← k.nilai
                IsiFormKader(data, peran)
                SimpanKader(tidak)
                JIKA k.pesan = ditolak browser MAKA
                    PASTIKAN field tidak valid menurut browser
                    PASTIKAN notifikasi "berhasil" tidak tampil
                SELAIN ITU
                    PASTIKAN pesan k.pesan tampil (maks LOAD_TIME)
                AKHIR JIKA
            AKHIR TEST
        AKHIR UNTUK
    AKHIR UNTUK

    TEST "TCDK.7 NIK PIC lebih dari 16 digit dipotong"     // BVA
        BukaFormTambah()
        ISI "NIK PIC" dengan "3201000000000000999"; TUNGGU THINK_TIME
        PASTIKAN field bernilai "3201000000000000"
    AKHIR TEST

    TEST "TCDK.28 Nama kader duplikat ditolak"
        BukaFormTambah()
        data ← BangkitkanDataKader()
        IsiFormKader(data, peran)
        KLIK tombol "Batal";                  TUNGGU THINK_TIME
        PASTIKAN modal tertutup (maks LOAD_TIME)
        data.namaKader ← nama kader baris pertama tabel
        BukaFormTambah()
        IsiFormKader(data, peran)
        SimpanKader(tidak)
        PASTIKAN pesan "nama kader sudah terdaftar" tampil
            (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDK.29 OPD wajib dipilih dari daftar"
        JIKA peran = Admin OPD MAKA
            LEWATI TEST "OPD otomatis instansi sendiri"
        AKHIR JIKA
        BukaFormTambah()
        IsiFormKader(BangkitkanDataKader(), Admin OPD) // tanpa OPD
        ISI "OPD" dengan "OPD Yang Tidak Terdaftar"; TUNGGU THINK_TIME
        SimpanKader(tidak)
        PASTIKAN pesan "pilih OPD yang valid dari daftar" tampil
            (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDK.10 Unggah Excel kader valid"
        berkas ← BangkitkanExcelKader(valid, 5 baris)
        KLIK tombol "Unggah dari Excel";      TUNGGU THINK_TIME
        UNGGAH berkas;                        TUNGGU THINK_TIME
        KLIK tombol "Lanjutkan";              TUNGGU THINK_TIME
        PASTIKAN judul "Data Kotor (0)" tampil (maks LOAD_TIME)
        KLIK tombol "Simpan Data Bersih";     TUNGGU THINK_TIME
        PASTIKAN notifikasi "berhasil" tampil (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDK.11 Unggah Excel kader tidak valid"
        berkas ← BangkitkanExcelKader(tidak valid, 3 baris)
        KLIK tombol "Unggah dari Excel";      TUNGGU THINK_TIME
        UNGGAH berkas;                        TUNGGU THINK_TIME
        KLIK tombol "Lanjutkan";              TUNGGU THINK_TIME
        PASTIKAN "Data Bersih (0)" dan "Data Kotor (3)" tampil
            (maks LOAD_TIME)
        PASTIKAN tombol simpan nonaktif
        PASTIKAN tabel data kotor berisi 3 baris dan keterangannya
    AKHIR TEST

    TEST "TCDK.12 Klik tautan templat Excel kader"
        KLIK tombol "Unggah dari Excel";      TUNGGU THINK_TIME
        KLIK tautan "Templat Excel Data Kader"; TUNGGU THINK_TIME
        PASTIKAN URL memuat "/dokumen" (maks LOAD_TIME)
        PASTIKAN judul "Format Excel Data Kader" tampil
    AKHIR TEST

    TEST "TCDK.13 Batalkan unggah Excel kader"
        KLIK tombol "Unggah dari Excel";      TUNGGU THINK_TIME
        UNGGAH BangkitkanExcelKader(valid, 1); TUNGGU THINK_TIME
        KLIK tombol tutup (X) modal;          TUNGGU THINK_TIME
        PASTIKAN modal "Unggah Data Kader" tertutup (maks LOAD_TIME)
        PASTIKAN tabel tampil
    AKHIR TEST

    // Pencarian: kata kunci diambil dari baris pertama tabel; nama PIC
    // dari baris pertama yang PIC-nya terisi (bukan "-")
    kasusCari ← {id, kataKunci, adaHasil}
        {"TCDK.14", nama kader, ya}
        {"TCDK.15", 8 huruf pertama nama kader, ya}            // EP
        {"TCDK.16", nama PIC terisi pertama, ya}               // EP
        {"TCDK.17", nama kader huruf besar, ya}                // EP
        {"TCDK.18", nama kader huruf kecil, ya}                // EP
        {"TCDK.19", "Kader", ya}                               // EP
        {"TCDK.20", "xqz99randomkeyword", tidak}               // EP
        {"TCDK.21", "@#$%^&*()", tidak}                        // EP
    UNTUK SETIAP k DALAM kasusCari LAKUKAN
        TEST "<k.id> Pencarian kader"
            PASTIKAN k.kataKunci ≠ "-" (ada kader dengan PIC terisi)
            ISI kolom pencarian dengan k.kataKunci; TUNGGU THINK_TIME
            JIKA k.adaHasil MAKA
                PASTIKAN setiap baris memuat k.kataKunci pada nama
                    kader atau PIC; jumlah hasil <= jumlah awal
            SELAIN ITU
                PASTIKAN teks "Belum ada kader" dan "Tidak ada kader
                    yang cocok dengan pencarian" tampil
                PASTIKAN tabel tidak tampil
            AKHIR JIKA
        AKHIR TEST
    AKHIR UNTUK

    TEST "TCDK.22 Ekspor tabel Daftar Kader"
        KLIK tombol "Ekspor PDF";             TUNGGU THINK_TIME
        PASTIKAN berkas terunduh (maks LOAD_TIME) dengan nama
            "daftar-kader-<tanggal>.pdf"
        PASTIKAN notifikasi "berhasil diekspor" tampil
    AKHIR TEST

    TEST "TCDK.23 Akses detail kader"
        KLIK tombol "Detail" baris pertama;   TUNGGU THINK_TIME
        PASTIKAN judul "Detail Kader" tampil (maks LOAD_TIME)
        PASTIKAN nama kader dan nama PIC sesuai baris pertama
            (PIC "-" di tabel tampil "Belum ada PIC" di Detail)
        PASTIKAN field OPD nonaktif; "Ganti PIC" aktif
        PASTIKAN tombol "Simpan Perubahan" nonaktif
        ISI "Deskripsi" dengan "Deskripsi uji perubahan"
                                              TUNGGU THINK_TIME
        PASTIKAN tombol "Simpan Perubahan" aktif
    AKHIR TEST

    TEST "TCDK.30 Buka form Ganti PIC"
        KLIK tombol "Detail" baris pertama;   TUNGGU THINK_TIME
        PASTIKAN judul "Detail Kader" tampil (maks LOAD_TIME)
        KLIK tombol "Ganti PIC";              TUNGGU THINK_TIME
        PASTIKAN judul "Ganti PIC Kader" serta field NIK, nama,
            nomor HP, dan alamat tampil
        KLIK tombol "Simpan PIC Baru";        TUNGGU THINK_TIME
        PASTIKAN pesan "semua data pribadi PIC wajib diisi" tampil
        KLIK tombol "Batal";                  TUNGGU THINK_TIME
        PASTIKAN modal "Ganti PIC Kader" tertutup (maks LOAD_TIME)
    AKHIR TEST

    // TCDK.24–25 dijalankan berurutan (mengubah data yang sama)
    TEST "TCDK.24 Ubah status kader lalu kembalikan"
        statusAwal ← status baris pertama
        KLIK tombol ubah status baris pertama; TUNGGU THINK_TIME
        PASTIKAN dialog "Konfirmasi" tampil (maks LOAD_TIME)
        KLIK tombol "Lanjutkan";              TUNGGU THINK_TIME
        PASTIKAN status baris ≠ statusAwal (maks LOAD_TIME)
        KLIK tombol ubah status baris pertama; TUNGGU THINK_TIME
        KLIK tombol "Lanjutkan";              TUNGGU THINK_TIME
        PASTIKAN status baris = statusAwal (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCDK.25 Batalkan perubahan status kader"
        statusAwal ← status baris pertama
        KLIK tombol ubah status baris pertama; TUNGGU THINK_TIME
        PASTIKAN dialog "Konfirmasi" tampil (maks LOAD_TIME)
        KLIK tombol "Batal";                  TUNGGU THINK_TIME
        PASTIKAN dialog tertutup dan status = statusAwal
    AKHIR TEST

    TEST "TCDK.26 Pindah halaman tabel kader"
        JIKA total kader <= 10 MAKA
            LEWATI TEST "data kurang dari dua halaman"
        AKHIR JIKA
        PASTIKAN 5 baris dan info "Menampilkan 1-5 dari <total>"
        KLIK tombol "Selanjutnya";            TUNGGU THINK_TIME
        PASTIKAN info "Menampilkan 6-10" dan isi baris berbeda
        KLIK tombol "Sebelumnya";             TUNGGU THINK_TIME
        PASTIKAN info "Menampilkan 1-5" dan isi baris sama
    AKHIR TEST

    TEST "TCDK.31 Kolom tabel kader"
        JIKA peran = Super Admin MAKA
            PASTIKAN kolom = {NAMA KADER, STATUS, OPD, PIC,
                DESKRIPSI, AKSI}
        SELAIN ITU
            PASTIKAN kolom = {NAMA KADER, STATUS, PIC,
                JUMLAH ANGGOTA, AKSI}
        AKHIR JIKA
    AKHIR TEST
AKHIR UNTUK

TEST "TCDK.32 Relawan tidak dapat mengakses Daftar Kader"
    BUKA URL_APLIKASI
    Login(Relawan)
    PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
    PASTIKAN menu "Kader" tidak tampil
    BUKA halaman "/daftar-kader"
    PASTIKAN URL memuat "/unauthorized" (maks LOAD_TIME)
    PASTIKAN judul "Daftar Kader" tidak tampil
AKHIR TEST
```

**TC-ID yang dicakup (32):** TCDK.1, TCDK.2, TCDK.3, TCDK.4, TCDK.5, TCDK.6, TCDK.7, TCDK.8, TCDK.9, TCDK.10, TCDK.11, TCDK.12, TCDK.13, TCDK.14, TCDK.15, TCDK.16, TCDK.17, TCDK.18, TCDK.19, TCDK.20, TCDK.21, TCDK.22, TCDK.23, TCDK.24, TCDK.25, TCDK.26, TCDK.27, TCDK.28, TCDK.29, TCDK.30, TCDK.31, TCDK.32
