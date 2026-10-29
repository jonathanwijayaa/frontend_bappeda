# Modul Dashboard (TCD)
<!-- prefix: TCD -->

```text
// Berkas: src/tests/dashboard/dashboard.spec.ts
UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        PASTIKAN teks "Memuat data dashboard" hilang (maks LOAD_TIME)
    AKHIR SEBELUM

    TEST "TCD.1 Akses halaman Dashboard"
        PASTIKAN judul "Dashboard" tampil (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCD.2 Hover grafik batang"
        PASTIKAN batang pertama grafik utama tampil (maks LOAD_TIME)
        ARAHKAN KURSOR ke batang pertama;     TUNGGU THINK_TIME
        PASTIKAN tooltip tampil memuat "jumlah" dan angka
    AKHIR TEST

    TEST "TCD.3 Hover donut demografi gender"
        // label persentase baru dirender setelah animasi selesai
        PASTIKAN label sektor donut tampil (maks LOAD_TIME)
        ARAHKAN KURSOR ke sektor pertama;     TUNGGU THINK_TIME
        PASTIKAN tooltip berisi teks (maks LOAD_TIME)
        PASTIKAN tooltip memuat "Laki-laki" atau "Perempuan"
    AKHIR TEST

    TEST "TCD.4 Kartu ringkasan (KPI)"
        UNTUK SETIAP kartu DALAM {Total Relawan Aktif, Total Kader,
                Pengajuan Pending} LAKUKAN
            PASTIKAN kartu tampil dengan angka format id-ID
        AKHIR UNTUK
        JIKA peran = Super Admin MAKA
            PASTIKAN kartu "Total OPD Terdaftar" tampil dengan angka
        SELAIN ITU
            PASTIKAN kartu "Total OPD Terdaftar" tidak tampil
        AKHIR JIKA
    AKHIR TEST

    TEST "TCD.5 Header status real-time"
        PASTIKAN teks "Data ditampilkan secara real-time" tampil
        PASTIKAN teks "Data per: <waktu> WIB" tampil
    AKHIR TEST

    TEST "TCD.6 Judul dan periode grafik utama"
        JIKA peran = Super Admin MAKA
            PASTIKAN judul memuat "Jumlah Relawan per OPD"
        SELAIN ITU
            PASTIKAN judul memuat "Jumlah Relawan per Kader"
        AKHIR JIKA
        PASTIKAN judul memuat "Semua Periode Data (awal – akhir)"
    AKHIR TEST

    TEST "TCD.7 Ubah filter tampilan grafik utama"
        JIKA tombol filter tidak tampil MAKA
            LEWATI TEST "data grafik kurang dari 10"
        AKHIR JIKA
        PASTIKAN grafik menampilkan 10 batang
        KLIK tombol filter "Top 10 Data";     TUNGGU THINK_TIME
        KLIK opsi "Semua Data (n)";           TUNGGU THINK_TIME
        PASTIKAN jumlah batang > 10 (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCD.8 Leaderboard relawan penugasan terbanyak"
        PASTIKAN kartu leaderboard tampil (maks LOAD_TIME)
        PASTIKAN teks "n Penugasan" atau
            "Belum ada data penugasan" tampil
    AKHIR TEST

    TEST "TCD.9 Sebaran relawan per kelurahan"
        PASTIKAN kartu "Sebaran Relawan per Kelurahan" tampil
        PASTIKAN grafik atau pesan "belum ada data" tampil
    AKHIR TEST

    TEST "TCD.10 Grafik jumlah relawan per kader"
        PASTIKAN judul kartu relawan per kader sesuai peran tampil
        PASTIKAN grafik atau pesan "belum ada data" tampil
    AKHIR TEST

    TEST "TCD.11 Grafik jumlah kader per OPD"
        PASTIKAN judul kartu jumlah kader sesuai peran tampil
        PASTIKAN grafik atau pesan "belum ada data" tampil
    AKHIR TEST
AKHIR UNTUK

TEST "TCD.12 Tampilan gagal memuat data"
    BUKA URL_APLIKASI
    GAGALKAN setiap request ke endpoint "/dashboard"
    Login(Super Admin)
    PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
    PASTIKAN pesan "Network Error" atau "gagal memuat" tampil
        (maks LOAD_TIME)
    PASTIKAN tombol "Coba Lagi" tampil
    PASTIKAN kartu "Total Relawan Aktif" tidak tampil
AKHIR TEST

TEST "TCD.13 Relawan tidak dapat mengakses Dashboard"
    BUKA URL_APLIKASI
    Login(Relawan)
    PASTIKAN URL memuat "/profil-relawan" (maks LOAD_TIME)
    BUKA halaman "/dashboard"
    PASTIKAN URL memuat "/unauthorized" atau "/profil-relawan"
    PASTIKAN judul "Dashboard" tidak tampil
AKHIR TEST
```

**TC-ID yang dicakup (13):** TCD.1, TCD.2, TCD.3, TCD.4, TCD.5, TCD.6, TCD.7, TCD.8, TCD.9, TCD.10, TCD.11, TCD.12, TCD.13
