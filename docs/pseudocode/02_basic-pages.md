# Modul Halaman Dasar / Sidebar (TCBP)
<!-- prefix: TCBP -->

```text
// Berkas: src/tests/basic/sidebar.spec.ts
UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
    SEBELUM SETIAP TEST
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        PASTIKAN sidebar tampil (maks LOAD_TIME)
    AKHIR SEBELUM

    TEST "TCBP.1 Menu sidebar sesuai peran"
        UNTUK SETIAP menu DALAM {Dashboard, Kader, Relawan,
                Surat Keputusan, Dokumen, Riwayat Relawan} LAKUKAN
            PASTIKAN tautan menu tampil (maks LOAD_TIME)
        AKHIR UNTUK
        PASTIKAN tautan "Saran/Hotline" tampil
        JIKA peran = Super Admin MAKA
            PASTIKAN menu "Manajemen OPD" dan "Log Aktivitas" tampil
        SELAIN ITU
            PASTIKAN menu "Manajemen OPD" dan "Log Aktivitas" tidak ada
        AKHIR JIKA
    AKHIR TEST

    TEST "TCBP.2 Ciutkan dan bentangkan sidebar"
        PASTIKAN sidebar dalam keadaan bentang
        KLIK tombol ciut/bentang;             TUNGGU THINK_TIME
        PASTIKAN sidebar ciut (maks LOAD_TIME)
        KLIK tombol ciut/bentang;             TUNGGU THINK_TIME
        PASTIKAN sidebar kembali bentang (maks LOAD_TIME)
    AKHIR TEST

    TEST "TCBP.3 Status sidebar bertahan setelah muat ulang"
        PASTIKAN sidebar dalam keadaan bentang
        KLIK tombol ciut/bentang;             TUNGGU THINK_TIME
        PASTIKAN sidebar ciut (maks LOAD_TIME)
        MUAT ULANG halaman
        PASTIKAN sidebar tetap ciut (maks LOAD_TIME)
        KLIK tombol ciut/bentang;             TUNGGU THINK_TIME
        PASTIKAN sidebar kembali bentang     // pulihkan kondisi awal
    AKHIR TEST

    TEST "TCBP.4 Tautan sidebar menuju halaman yang benar"
        tujuan ← {Kader: "/daftar-kader", Relawan: "/data-relawan",
                  Surat Keputusan: "/surat-keputusan",
                  Dokumen: "/dokumen", Riwayat Relawan:
                  "/histori-relawan", Dashboard: "/dashboard"}
        UNTUK SETIAP (menu, url) DALAM tujuan LAKUKAN
            KLIK menu di sidebar;             TUNGGU THINK_TIME
            PASTIKAN URL memuat url (maks LOAD_TIME)
        AKHIR UNTUK
    AKHIR TEST
AKHIR UNTUK
```

**TC-ID yang dicakup (4):** TCBP.1, TCBP.2, TCBP.3, TCBP.4
