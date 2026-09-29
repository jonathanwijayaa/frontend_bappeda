# Catatan Pemetaan Test Fungsional ke Metode Skripsi

Dokumen ini memetakan test case E2E (Playwright) ke kerangka pengujian yang
dipakai dalam skripsi, sebagai bahan untuk BAB IV (Implementasi Smoke Testing,
Regression Testing, dan analisis hasilnya). Istilah mengikuti definisi skripsi.

## Dasar klasifikasi (sesuai skripsi)

**Jenis pengujian**

- **Smoke Testing** — "pengujian awal untuk memastikan fungsi utama sistem
  berjalan sebelum pengujian lebih lanjut". → Jalur inti (*happy path*) tiap
  modul: mengakses halaman dan menjalankan fungsi utamanya dengan input valid
  (login, memuat tabel, menyimpan data valid, mengunduh berkas).
- **Regression Testing** — "menguji kembali sistem setelah perubahan untuk
  memastikan tidak ada fitur lain yang terdampak". → Seluruh kasus lanjutan yang
  dijalankan ulang tiap perubahan: validasi input, kasus negatif, pencarian,
  filter, sortir, paginasi, detail/edit, batasan akses per peran, dan
  penanganan gagal.

**Teknik perancangan kasus uji (black-box)**

- **Equivalence Partitioning (EP)** — membagi input menjadi kelas valid & tidak
  valid, satu perwakilan per kelas (mis. nama kosong / mengandung angka /
  karakter spesial; jenis kelamin L/P; status).
- **Boundary Value Analysis (BVA)** — menguji nilai batas panjang/rentang: satu
  di bawah batas, tepat batas, satu di atas batas (mis. nama min 3 & maks 100;
  NIK tepat 16 digit; kontak 10–13 digit; alamat min 10 & maks 100; kata sandi
  min 6/8).

> Catatan cakupan: bagian **SQL Injection** (`security/sqlInjection*.spec.ts`)
> adalah komponen keamanan yang masuk skripsi, dibahas terpisah di
> [`security/CATATAN-KEAMANAN.md`](security/CATATAN-KEAMANAN.md). File `xss` dan
> `accessControl` **di luar scope** dan tidak masuk pemetaan ini.

---

## Pemetaan per modul

Kolom **Smoke** = TC jalur inti; **Regression** = TC lanjutan; **EP/BVA** =
field yang kelas ekuivalensi / nilai batasnya diuji.

### Login / Autentikasi (TCL)
| Aspek | Rincian |
|---|---|
| Smoke | TCL.1 login valid (Super Admin, OPD, Relawan); TCL.14 logout |
| Regression | TCL.2–6 kredensial salah; TCL.3 field kosong; TCL.8 lihat sandi; TCL.10 filter NIK; TCL.11 sesi berakhir; TCL.12–13 proteksi & redirect |
| EP | NIK (kelas: 16 digit terdaftar / bukan 16 digit / non-numerik / kosong) — **TCL.1–TCL.6** |
| BVA | Panjang NIK (16 digit; TCL.2 & TCL.10) |

### Dashboard (TCD)
| Aspek | Rincian |
|---|---|
| Smoke | TCD.1 akses Dashboard; TCD.4 kartu KPI tampil |
| Regression | TCD.2–3 hover grafik; TCD.5–11 header, filter, leaderboard, sebaran, grafik; TCD.12 gagal memuat; TCD.13 batasan akses relawan |
| EP/BVA | — (modul tampilan/visualisasi, bukan input tervalidasi) |

### Manajemen OPD (TCMO)
| Aspek | Rincian |
|---|---|
| Smoke | TCMO.1 akses; TCMO.3–4 tambah OPD valid & simpan; TCMO.11 unggah Excel valid |
| Regression | TCMO.5 batal; TCMO.6–10 validasi field; TCMO.12 Excel tidak valid; TCMO.13 unduh template; TCMO.14 batal unggah |
| EP | Nama OPD, alamat, PIC, NIK PIC, kontak (kelas valid/kosong/format salah) — TCMO.6–10 |
| BVA | **Kontak 10–13 digit — TCMO.3 (diterima) & TCMO.10 (ditolak)**; NIK PIC 16 digit |

### Daftar Kader (TCDK)
| Aspek | Rincian |
|---|---|
| Smoke | TCDK.1 akses; TCDK.2 buka form; TCDK.4 simpan kader valid; TCDK.10 unggah Excel valid |
| Regression | TCDK.3/5 isi & batal; TCDK.6–9 & TCDK.27 validasi; TCDK.11–13 Excel & template; TCDK.14–21 pencarian; TCDK.22 ekspor; TCDK.23/30 detail & ganti PIC; TCDK.24–25 nonaktif; TCDK.26 paginasi; TCDK.28 duplikat; TCDK.29 OPD wajib; TCDK.31 kolom; TCDK.32 akses |
| EP | Nama Kader, nama PIC (kosong/angka/karakter spesial); NIK PIC (non-numerik) — TCDK.6/8/7 |
| BVA | Nama min 3 & maks 100 (TCDK.6); NIK PIC tepat 16 (TCDK.7); kontak 9–13 digit (TCDK.9); alamat min 10 & maks 100 (TCDK.27) |

### Data Relawan (TCDR)
| Aspek | Rincian |
|---|---|
| Smoke | TCDR.1 akses; TCDR.3–4 tambah relawan valid & simpan; TCDR.16 unggah Excel valid |
| Regression | TCDR.5 batal; TCDR.6–9 validasi; TCDR.17–20 Excel & template; TCDR.21–26 pencarian; TCDR.27–31 detail & edit; TCDR.32–35 pengajuan/review; batasan akses |
| EP | Nama, jenis kelamin (L/P), NIK, alamat, no HP (kelas valid/tidak valid) — TCDR.6–9 |
| BVA | Nama min 3 & maks 100; NIK 16 digit; no HP 10–13 digit; alamat min 10 & maks 100 |

### Surat Keputusan (TCSK)
| Aspek | Rincian |
|---|---|
| Smoke | TCSK.1 unggah SK valid; TCSK.12 akses tabel Daftar SK |
| Regression | TCSK.2–7 validasi form SK; TCSK.8 pencarian; TCSK.9 ekspor; TCSK.10–11 detail & pratinjau PDF |
| EP | Field SK (no SK, judul, OPD, kader, berkas) — kelas valid/kosong |
| BVA | Tanggal terbit vs batas aktif (rentang tanggal) |

### Riwayat Relawan (TCHR)
| Aspek | Rincian |
|---|---|
| Smoke | TCHR.14 akses tabel & detail riwayat |
| Regression | TCHR.1–5 filter & rentang tahun; TCHR.6–13 pencarian; TCHR.15–17 filter wilayah & reset; TCHR.18–19 sortir; TCHR.20 paginasi; TCHR.21–22 kolom & detail; TCHR.23–24 lingkup OPD; TCHR.25 akses; TCHR.26 gagal memuat |
| EP | Kata kunci pencarian (ada hasil / tanpa hasil / kosong / spasi) — TCHR.6–13 |
| BVA | Rentang Tahun Awal–Akhir (batas & konflik) — TCHR.3–5 |

### Log Aktivitas (TCLA)
| Aspek | Rincian |
|---|---|
| Smoke | TCLA.11 akses tabel Log |
| Regression | TCLA.1 urutan waktu; TCLA.2–3, 12–13 filter & kombinasi; TCLA.4–9 pencarian; TCLA.14 paginasi; TCLA.15–18 kolom & detail; TCLA.19 cari NIK; TCLA.20 gagal memuat; TCLA.21 akses |
| EP | Kata kunci pencarian & filter aksi/tabel (kelas cocok / tidak cocok) |
| BVA | — |

### Dokumen (TCDO)
| Aspek | Rincian |
|---|---|
| Smoke | TCDO.2–4 unduh template Excel; TCDO.5 daftar dokumen tampil |
| Regression | TCDO.1 unduh panduan; TCDO.6–7 kartu info & header; TCDO.8 struktur kolom template; TCDO.9 batasan akses |
| EP/BVA | — (modul unduh berkas) |

### Saran / Hotline (TCSH)
| Aspek | Rincian |
|---|---|
| Smoke | TCSH.3 kirim saran valid; TCSH.1–2 tautan telepon & WhatsApp |
| Regression | TCSH.4 nomor telepon tidak valid; tampilan pengelolaan Super Admin |
| EP | Nomor telepon (valid / huruf / karakter spesial / kosong) — TCSH.4 |
| BVA | Panjang nomor telepon (terlalu pendek / terlalu panjang) — TCSH.4 |

### Profil (TCP)
| Aspek | Rincian |
|---|---|
| Smoke | TCP.2 tampil info pribadi; TCP.3 simpan profil valid; TCP.12 profil relawan; TCP.21 halaman ubah sandi |
| Regression | TCP.1/7/8 foto; TCP.4 nomor tidak valid; TCP.5–6 batal & tanpa perubahan; TCP.9 NIK terkunci; TCP.10–11 validasi & sandi salah; TCP.13–20 pengajuan relawan; TCP.22–25 syarat & toggle sandi; TCP.26–28 batasan akses & nama berangka |
| EP | Nomor telepon; nama (angka ditolak); syarat kata sandi (angka/karakter spesial) — TCP.4/22/28 |
| BVA | No HP 10–13 digit (TCP.4); kata sandi min 6 (admin) / min 8 (relawan) (TCP.10/22) |

### Statistik (TCS)
| Aspek | Rincian |
|---|---|
| — | Halaman dihapus; TCS.0 hanya memverifikasi halaman tidak dapat diakses. Grafiknya diuji di Dashboard (TCD). |

---

## Rekapitulasi

| Modul | Smoke (jalur inti) | Regression (uji ulang) | Teknik |
|---|---|---|---|
| Login | TCL.1, TCL.14 | TCL.2–6, 8, 10–13 | EP, BVA |
| Dashboard | TCD.1, TCD.4 | TCD.2–3, 5–13 | — |
| Manajemen OPD | TCMO.1, 3–4, 11 | TCMO.5–10, 12–14 | EP, BVA |
| Daftar Kader | TCDK.1–2, 4, 10 | selebihnya | EP, BVA |
| Data Relawan | TCDR.1, 3–4, 16 | selebihnya | EP, BVA |
| Surat Keputusan | TCSK.1, 12 | TCSK.2–11 | EP, BVA |
| Riwayat Relawan | TCHR.14 | selebihnya | EP, BVA |
| Log Aktivitas | TCLA.11 | selebihnya | EP |
| Dokumen | TCDO.2–5 | TCDO.1, 6–9 | — |
| Saran / Hotline | TCSH.1–3 | TCSH.4 + SA | EP, BVA |
| Profil | TCP.2–3, 12, 21 | selebihnya | EP, BVA |

**Kesimpulan pemetaan**

- **Smoke testing** — memverifikasi setiap modul dapat diakses dan fungsi
  utamanya berjalan (login, memuat tabel, menyimpan data valid, mengunduh
  berkas). Menjadi gerbang awal sebelum pengujian mendalam.
- **Regression testing** — seluruh kasus lanjutan (validasi, negatif,
  pencarian, filter, sortir, paginasi, detail/edit, batasan akses, penanganan
  gagal) yang dijalankan ulang setiap ada perubahan agar tidak ada fitur lain
  yang rusak.
- **EP** diterapkan pada hampir seluruh field masukan bervalidasi (membagi
  input ke kelas valid & tidak valid).
- **BVA** melengkapi EP pada field dengan batas panjang/rentang (nama, NIK,
  nomor telepon, alamat, kata sandi, rentang tanggal/tahun).

Karena EP & BVA memilih perwakilan per kelas & titik batas, jumlah kasus uji
tetap ringkas namun cakupannya luas — sesuai dasar pemilihan kedua teknik dalam
skripsi.
