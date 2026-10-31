# Modul Statistik (TCS)
<!-- prefix: TCS -->

```text
// Berkas: src/tests/stastistik/stastistik.spec.ts
// Halaman Statistik sudah dihapus; grafiknya pindah ke Dashboard.
// TCS.0–TCS.5 Deferred TC:
// TCS.1 tidak diotomasi di modul ini: diuji sebagai TCD.3
// TCS.2 tidak diotomasi di modul ini: diuji sebagai TCD.10
// TCS.3 tidak diotomasi di modul ini: diuji sebagai TCD.9
// TCS.4 tidak diotomasi di modul ini: diuji sebagai TCD.11
// TCS.5 tidak diotomasi: kartu Dashboard tidak dapat diciutkan

TEST "TCS.0 Halaman Statistik terpisah sudah tidak ada"
    LEWATI TEST "Deferred TC"
    UNTUK SETIAP peran DALAM {Super Admin, Admin OPD} LAKUKAN
        BUKA URL_APLIKASI
        Login(peran)
        PASTIKAN URL memuat "/dashboard" (maks LOAD_TIME)
        PASTIKAN menu "Statistik" tidak ada di sidebar
        PASTIKAN teks "Memuat data dashboard" hilang (maks LOAD_TIME)
        PASTIKAN judul "Demografi Gender Relawan" tampil
    AKHIR UNTUK
AKHIR TEST
```

**TC-ID yang dicakup (1):** TCS.0
