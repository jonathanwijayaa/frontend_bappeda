# Modul Log Aktivitas (TCLA)
<!-- prefix: TCLA -->

```text
// Berkas: src/tests/log/aktifitas/logAktifitas.spec.ts
PROSEDUR BacaOpsiFilter(filter)
    KLIK filter;                              TUNGGU THINK_TIME
    PASTIKAN popup opsi tampil (maks LOAD_TIME)
    opsi ← seluruh opsi selain "Pilih..." dan "Semua ..."
    KLIK judul halaman (tutup popup);         TUNGGU THINK_TIME
    KEMBALIKAN opsi
AKHIR PROSEDUR

PROSEDUR PilihFilter(filter, nilai)
    KLIK filter;                              TUNGGU THINK_TIME
    PASTIKAN popup opsi tampil (maks LOAD_TIME)
    KLIK opsi nilai;                          TUNGGU THINK_TIME
    PASTIKAN popup tertutup dan filter bertuliskan nilai
AKHIR PROSEDUR

SEBELUM SETIAP TEST                      // kecuali TCLA.21
    BUKA URL_APLIKASI
    Login(Super Admin)
    PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
    KLIK menu "Log Aktivitas";                TUNGGU THINK_TIME
    PASTIKAN URL memuat "/log-aktifitas" (maks LOAD_TIME)
    PASTIKAN teks "Memuat log aktivitas" hilang (maks LOAD_TIME)
    PASTIKAN baris data tabel tampil (maks LOAD_TIME)
AKHIR SEBELUM

TEST "TCLA.1 Log terurut dari aktivitas terbaru"
    LEWATI TEST "Deferred TC"
    waktu ← nilai kolom WAKTU seluruh baris
    PASTIKAN jumlah baris > 1
    PASTIKAN setiap waktu[i-1] >= waktu[i]
AKHIR TEST

TEST "TCLA.2 Filter berdasarkan jenis aksi"
    totalAwal ← jumlah hasil pada ringkasan
    UNTUK SETIAP aksi DALAM BacaOpsiFilter(filter aksi) LAKUKAN
        PilihFilter(filter aksi, aksi)
        PASTIKAN setiap baris berjenis aksi = aksi
        PASTIKAN jumlah hasil < totalAwal
    AKHIR UNTUK
AKHIR TEST

TEST "TCLA.3 Filter berdasarkan nama tabel"
    totalAwal ← jumlah hasil pada ringkasan
    tabel ← opsi pertama BacaOpsiFilter(filter tabel)
    PilihFilter(filter tabel, tabel)
    PASTIKAN setiap baris bertabel = tabel
    PASTIKAN jumlah hasil < totalAwal
AKHIR TEST

// Pencarian: kata kunci dari baris pertama tabel
kasusCari ← {id, kataKunci, adaHasil}
    {"TCLA.4", nama pengguna, ya}
    {"TCLA.5", nama pengguna huruf besar, ya}                  // EP
    {"TCLA.6", nama pengguna huruf kecil, ya}                  // EP
    {"TCLA.7", nama tabel, ya}                                 // EP
    {"TCLA.8", "xqz99randomkeyword", tidak}                    // EP
    {"TCLA.9", "@#$%^&*()", tidak}                             // EP
UNTUK SETIAP k DALAM kasusCari LAKUKAN
    TEST "<k.id> Pencarian log"
        ISI kolom pencarian dengan k.kataKunci; TUNGGU THINK_TIME
        JIKA k.adaHasil MAKA
            PASTIKAN setiap baris memuat k.kataKunci pada pengguna,
                NIK, atau tabel; jumlah hasil <= jumlah awal
        SELAIN ITU
            PASTIKAN teks "Tidak ada log yang sesuai filter" tampil
                (maks LOAD_TIME); tabel tidak tampil; jumlah = 0
        AKHIR JIKA
    AKHIR TEST
AKHIR UNTUK

// TCLA.10 Deferred TC: halaman Log Aktivitas belum memiliki
//     tombol ekspor

TEST "TCLA.11 Navigasi ke tabel Log Aktivitas"
    PASTIKAN judul "Log Aktivitas", tabel, ringkasan jumlah, dan
        info halaman tampil (maks LOAD_TIME)
AKHIR TEST

TEST "TCLA.12 Gabungan filter aksi dan tabel"
    aksi ← opsi pertama BacaOpsiFilter(filter aksi)
    PilihFilter(filter aksi, aksi)
    UNTUK SETIAP tabel DALAM BacaOpsiFilter(filter tabel) LAKUKAN
        PilihFilter(filter tabel, tabel)
        JIKA ada baris data MAKA terpakai ← tabel; BERHENTI AKHIR JIKA
    AKHIR UNTUK
    PASTIKAN terpakai ditemukan
    PASTIKAN setiap baris berjenis aksi dan bertabel terpakai
AKHIR TEST

TEST "TCLA.13 Hapus filter yang aktif"
    totalAwal ← jumlah hasil pada ringkasan
    PilihFilter(filter aksi, opsi pertama)
    ISI kolom pencarian dengan nama tabel baris pertama
                                              TUNGGU THINK_TIME
    PASTIKAN jumlah hasil < totalAwal
    PilihFilter(filter aksi, "Semua Aksi")
    ISI kolom pencarian dengan "";            TUNGGU THINK_TIME
    PASTIKAN filter bertuliskan "Semua Aksi" dan jumlah = totalAwal
AKHIR TEST

TEST "TCLA.14 Pindah halaman log"
    JIKA total <= 10 MAKA LEWATI TEST "data kurang" AKHIR JIKA
    PASTIKAN 5 baris dan info "Menampilkan 1-5 dari <total> log"
    KLIK tombol "Selanjutnya";                TUNGGU THINK_TIME
    PASTIKAN info "Menampilkan 6-10" dan 5 baris (maks LOAD_TIME)
    KLIK tombol "Sebelumnya";                 TUNGGU THINK_TIME
    PASTIKAN info "Menampilkan 1-5" dan "Sebelumnya" nonaktif
AKHIR TEST

TEST "TCLA.15 Kolom tabel log"
    PASTIKAN kolom = {WAKTU, PENGGUNA, NIK, AKSI, TABEL, AKSI}
AKHIR TEST

TEST "TCLA.16 Buka detail log"
    KLIK "Lihat Detail Perubahan" baris pertama; TUNGGU THINK_TIME
    PASTIKAN judul "Detail Log Aktivitas" tampil (maks LOAD_TIME)
    PASTIKAN pengguna, jenis aksi, dan tabel sesuai baris
    PASTIKAN "Target Data" memuat "(ID: ...)"
    PASTIKAN subjudul detail sesuai jenis aksi
    KLIK tombol "Tutup";                      TUNGGU THINK_TIME
    PASTIKAN modal detail tertutup (maks LOAD_TIME)
AKHIR TEST

TEST "TCLA.17 Tutup detail log dengan tombol X"
    KLIK "Lihat Detail Perubahan" baris pertama; TUNGGU THINK_TIME
    KLIK tombol tutup (X);                    TUNGGU THINK_TIME
    PASTIKAN modal tertutup dan tabel tampil (maks LOAD_TIME)
AKHIR TEST

TEST "TCLA.18 Isi detail perubahan nilai"
    PilihFilter(filter aksi, "Ubah Data")
    KLIK "Lihat Detail Perubahan" baris pertama; TUNGGU THINK_TIME
    // nilai lama & baru berasal dari old_value / new_value API
    PASTIKAN blok "Sebelum" dan "Sesudah" tampil (maks LOAD_TIME)
AKHIR TEST

TEST "TCLA.19 Pencarian log berdasarkan NIK"
    nik ← NIK pertama yang terisi pada tabel
    PASTIKAN nik ada (kolom NIK tidak seluruhnya "-")
    ISI kolom pencarian dengan nik;           TUNGGU THINK_TIME
    PASTIKAN setiap baris memuat nik (maks LOAD_TIME)
AKHIR TEST

TEST "TCLA.20 Penanganan request data yang gagal"
    GAGALKAN request ke endpoint "/admin/logs"
    MUAT ULANG halaman
    PASTIKAN teks "Memuat log aktivitas" hilang (maks LOAD_TIME)
    PASTIKAN teks "Tidak ada log yang sesuai filter" tampil,
        tabel tidak tampil, dan jumlah hasil = 0
AKHIR TEST

TEST "TCLA.21 Peran lain tidak dapat mengakses Log Aktivitas"
    UNTUK SETIAP peran DALAM {Admin OPD, Relawan} LAKUKAN
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL halaman awal peran (maks LOAD_TIME)
        PASTIKAN menu "Log Aktivitas" tidak tampil
        BUKA halaman "/log-aktifitas"
        PASTIKAN URL memuat "/unauthorized" (maks LOAD_TIME)
    AKHIR UNTUK
AKHIR TEST
```

**TC-ID yang dicakup (20):** TCLA.1, TCLA.2, TCLA.3, TCLA.4, TCLA.5, TCLA.6, TCLA.7, TCLA.8, TCLA.9, TCLA.11, TCLA.12, TCLA.13, TCLA.14, TCLA.15, TCLA.16, TCLA.17, TCLA.18, TCLA.19, TCLA.20, TCLA.21
