# Modul Dokumen (TCDO)
<!-- prefix: TCDO -->

```text
// Berkas: src/tests/dokumen/dokumen.spec.ts
dokumen ← {id, judul, berkas, sheet}
    {"TCDO.1", "Buku Panduan Aplikasi", tidak ada, -}
    {"TCDO.2", "Format Excel Data Relawan",
        "Template_Data_Relawan*.xlsx", "Data Relawan"}
    {"TCDO.3", "Format Excel Data OPD",
        "Template_Data_OPD*.xlsx", "Data OPD"}
    {"TCDO.4", "Format Excel Data Kader",
        "Template_Data_Kader*.xlsx", "Data Kader"}

PROSEDUR Unduh(judul)
    KLIK tombol "Unduh" pada kartu judul;     TUNGGU THINK_TIME
    KEMBALIKAN berkas terunduh (maks LOAD_TIME) atau kosong
AKHIR PROSEDUR

UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        KLIK menu "Dokumen";                  TUNGGU THINK_TIME
        PASTIKAN URL memuat "/dokumen" (maks LOAD_TIME)
        PASTIKAN judul "Buku Panduan Aplikasi" tampil
    AKHIR SEBELUM

    UNTUK SETIAP d DALAM dokumen LAKUKAN
        TEST "<d.id> Unduh <d.judul>"
            unduhan ← Unduh(d.judul)
            JIKA d.berkas tidak ada DAN unduhan kosong MAKA
                LEWATI TEST "dokumen belum punya tautan unduhan"
            AKHIR JIKA
            PASTIKAN unduhan ada dan namanya sesuai d.berkas
            PASTIKAN berkas adalah xlsx valid dan memuat d.sheet
        AKHIR TEST
    AKHIR UNTUK

    TEST "TCDO.5 Tampilan daftar dokumen"
        PASTIKAN jumlah tombol "Unduh" = 4
        UNTUK SETIAP d DALAM dokumen LAKUKAN
            PASTIKAN judul, deskripsi, dan satu tombol "Unduh"
                aktif tampil pada kartu d
        AKHIR UNTUK
    AKHIR TEST

    TEST "TCDO.6 Kartu Informasi Penting"
        PASTIKAN judul "Informasi Penting" tampil
        PASTIKAN empat poin informasi masing-masing tampil satu kali
    AKHIR TEST

    TEST "TCDO.7 Header halaman"
        PASTIKAN judul "Dokumen" dan teks "Akses guidebook dan
            format Excel untuk mengelola data" tampil
    AKHIR TEST

    UNTUK SETIAP d DALAM dokumen yang punya berkas LAKUKAN
        TEST "TCDO.8 Kolom templat <d.judul>"
            unduhan ← Unduh(d.judul)
            PASTIKAN unduhan ada
            PASTIKAN baris pertama sheet d.sheet = kolom resmi templat
        AKHIR TEST
    AKHIR UNTUK
AKHIR UNTUK

TEST "TCDO.9 Relawan tidak dapat mengakses Dokumen"
    BUKA URL_APLIKASI
    Login(Relawan)
    PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
    PASTIKAN menu "Dokumen" tidak tampil
    BUKA halaman "/dokumen"
    PASTIKAN URL memuat "/unauthorized" (maks LOAD_TIME)
    PASTIKAN judul "Buku Panduan Aplikasi" tidak tampil
AKHIR TEST
```

**TC-ID yang dicakup (9):** TCDO.1, TCDO.2, TCDO.3, TCDO.4, TCDO.5, TCDO.6, TCDO.7, TCDO.8, TCDO.9
