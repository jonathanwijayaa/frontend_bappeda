# Modul Surat Keputusan (TCSK)
<!-- prefix: TCSK -->

```text
// Berkas: src/tests/surat keputusan/suratKeputusan.spec.ts
PROSEDUR IsiFormSK(data, peran)            // tanpa isi ulang/ulang
    UNGGAH berkas PDF data.berkas;            TUNGGU THINK_TIME
    PASTIKAN nama berkas tampil di modal (maks LOAD_TIME)
    ISI "Nomor SK" dengan data.noSK;          TUNGGU THINK_TIME
    ISI "Judul SK" dengan data.judul;         TUNGGU THINK_TIME
    ISI "Tanggal Terbit" dengan data.terbit;  TUNGGU THINK_TIME
    ISI "Batas Aktif" dengan data.batas;      TUNGGU THINK_TIME
    JIKA peran = Super Admin MAKA
        KLIK field "OPD";                     TUNGGU THINK_TIME
        ISI field "OPD" per karakter dengan data.opd
                                              TUNGGU THINK_TIME
        PASTIKAN opsi data.opd muncul (maks LOAD_TIME)
        KLIK opsi data.opd;                   TUNGGU THINK_TIME
        PASTIKAN teks "OPD valid dipilih" tampil (maks LOAD_TIME)
    AKHIR JIKA
    PASTIKAN field "OPD" terisi (maks LOAD_TIME)
    PASTIKAN checkbox kader milik OPD tampil (maks LOAD_TIME)
    data.kader ← salah satu kader pada daftar checkbox
    KLIK checkbox data.kader;                 TUNGGU THINK_TIME
AKHIR PROSEDUR

UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        KLIK menu "Surat Keputusan";          TUNGGU THINK_TIME
        PASTIKAN URL memuat "/surat-keputusan" (maks LOAD_TIME)
    AKHIR SEBELUM

    TEST "TCSK.1 Unggah berkas Surat Keputusan"
        data ← BangkitkanDataSK()
        KLIK tombol "Upload SK";              TUNGGU THINK_TIME
        IsiFormSK(data, peran)
        PASTIKAN seluruh isian form masih sesuai data
        KLIK tombol "Unggah SK";              TUNGGU THINK_TIME
        PASTIKAN form SK tertutup (maks LOAD_TIME)
        JIKA form tidak tertutup DAN muncul peringatan MAKA
            NYATAKAN GAGAL "Form SK ditolak aplikasi: <pesan>"
        AKHIR JIKA
        PASTIKAN notifikasi "berhasil" tampil (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCSK.2 Batalkan unggah SK"
        KLIK tombol "Upload SK";              TUNGGU THINK_TIME
        UNGGAH berkas "Sample_SK.pdf";        TUNGGU THINK_TIME
        KLIK tombol "Batal";                  TUNGGU THINK_TIME
        PASTIKAN judul "Surat Keputusan" tampil (maks LOAD_TIME)
    AKHIR TEST

    // Pencarian: kata kunci dari baris pertama tabel, lalu Enter
    kasusCari ← {id, kataKunci, adaHasil}
        {"TCSK.3.0", OPD baris pertama, ya}
        {"TCSK.3.1", judul SK baris pertama, ya}
        {"TCSK.3.2", nomor SK baris pertama, ya}
        {"TCSK.4", OPD baris pertama huruf besar, ya}          // EP
        {"TCSK.5", OPD baris pertama huruf kecil, ya}          // EP
        {"TCSK.6", dua segmen awal nomor SK, ya}               // EP
        {"TCSK.7", "xqz99randomkeyword", tidak}                // EP
        {"TCSK.8", "@#$%^&*()", tidak}                         // EP
    UNTUK SETIAP k DALAM kasusCari LAKUKAN
        TEST "<k.id> Pencarian SK"
            PASTIKAN tabel tampil (maks LOAD_TIME)
            ISI kolom pencarian dengan k.kataKunci; TUNGGU THINK_TIME
            TEKAN Enter;                      TUNGGU THINK_TIME
            JIKA k.adaHasil MAKA
                PASTIKAN minimal satu baris memuat k.kataKunci
                    (maks LOAD_TIME)
            SELAIN ITU
                PASTIKAN teks "Belum ada Surat Keputusan" atau
                    "tidak ada data" tampil (maks LOAD_TIME)
            AKHIR JIKA
        AKHIR TEST
    AKHIR UNTUK

    TEST "TCSK.9 Ekspor tabel Daftar Surat Keputusan"
        KLIK tombol "Ekspor PDF";             TUNGGU THINK_TIME
        PASTIKAN berkas terunduh (maks LOAD_TIME) dengan nama
            memuat "sk" atau "surat-keputusan"
    AKHIR TEST

    // TCSK.10–11: detail SK pertama sudah dibuka
    //   (KLIK "Detail"; TUNGGU THINK_TIME; teks "Memuat detail..."
    //    hilang maks LOAD_TIME)
    TEST "TCSK.10 Akses detail Surat Keputusan"
        PASTIKAN judul "Detail Surat Keputusan" tampil
    AKHIR TEST

    TEST "TCSK.11 Akses berkas Surat Keputusan"
        KLIK tombol tutup (X) detail;         TUNGGU THINK_TIME
        JIKA tidak ada tombol pratinjau di tabel MAKA
            LEWATI TEST "tidak ada SK berfile di halaman ini"
        AKHIR JIKA
        KLIK tombol pratinjau (ikon mata);    TUNGGU THINK_TIME
        PASTIKAN judul "Preview Surat Keputusan" tampil
            (maks LOAD_TIME)
        PASTIKAN pratinjau PDF termuat (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCSK.12 Navigasi ke tabel Daftar Surat Keputusan"
        PASTIKAN judul "Daftar Surat Keputusan" dan tabel tampil
            (maks LOAD_TIME)
    AKHIR TEST
AKHIR UNTUK
```

**TC-ID yang dicakup (12):** TCSK.1, TCSK.2, TCSK.3, TCSK.4, TCSK.5, TCSK.6, TCSK.7, TCSK.8, TCSK.9, TCSK.10, TCSK.11, TCSK.12
