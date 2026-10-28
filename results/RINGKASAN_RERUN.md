# Ringkasan Eksekusi Ulang (Think Time & Load Time)

Tanggal eksekusi: 2026-10-27. Proyek: chromium, 1 worker. THINK_TIME 1,2 s, LOAD_TIME 10 s, retries 0, timeout per test 120 s (blok serial TCDR.32–35: 180 s).

Cakupan: 527 test, sama dengan baseline (tanpa `performance/*`, `screenshot-ui`, `accessControl`, `xss`). Hasil mentah di `results/2026-10-27-1-worker/`: `results.json`, laporan HTML (`html-report/`), log terminal (`log.txt`), dan `summary.png`.

Test yang gagal karena gangguan lingkungan (jaringan putus, berkas uji tidak ada) dijalankan ulang **sekali**, terpisah, dengan konfigurasi yang sama (1 worker, retries 0). Hasilnya di `ulang/`. Angka di tabel a adalah hasil run asli; hasil uji ulang hanya dipakai untuk status akhir di tabel b.

## a. Ringkasan per run

| Run | Total test | Passed | Failed | Skipped | Flaky | Durasi |
|---|---:|---:|---:|---:|---:|---:|
| 1 worker | 527 | 491 | 25 | 11 (8 skip + 3 tidak jalan) | 0 | 2h14m50s |
| Uji ulang (1 worker) | 28 | 25 | 2 | 1 | 0 | 8m15s |
| Baseline 30 Sep 2026 (1 worker) | 527 | – | – | – | – | 28m57s |

## b. Status per TC-ID

Satu TC-ID bisa dieksekusi beberapa kali (multi-peran dan variasi data). Kolom eksekusi, lulus, gagal, dan skip dihitung dari run asli; skip termasuk test yang tidak dijalankan karena test sebelumnya di blok serial gagal. Status akhir = Gagal bila masih ada eksekusi gagal setelah uji ulang; Skip bila seluruh eksekusi dilewati.


**TCL**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCL.0 | 1 | 1 | 0 | 0 | Lulus |
| TCL.1 | 3 | 3 | 0 | 0 | Lulus |
| TCL.2 | 5 | 5 | 0 | 0 | Lulus |
| TCL.3 | 3 | 3 | 0 | 0 | Lulus |
| TCL.4 | 1 | 1 | 0 | 0 | Lulus |
| TCL.5 | 3 | 3 | 0 | 0 | Lulus |
| TCL.6 | 3 | 3 | 0 | 0 | Lulus |
| TCL.8 | 1 | 1 | 0 | 0 | Lulus |
| TCL.9 | 1 | 0 | 0 | 1 | Skip |
| TCL.10 | 1 | 1 | 0 | 0 | Lulus |
| TCL.11 | 1 | 1 | 0 | 0 | Lulus |
| TCL.12 | 4 | 4 | 0 | 0 | Lulus |
| TCL.13 | 1 | 1 | 0 | 0 | Lulus |
| TCL.14 | 3 | 3 | 0 | 0 | Lulus |

**TCBP**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCBP.1 | 2 | 2 | 0 | 0 | Lulus |
| TCBP.2 | 2 | 2 | 0 | 0 | Lulus |
| TCBP.3 | 2 | 2 | 0 | 0 | Lulus |
| TCBP.4 | 2 | 2 | 0 | 0 | Lulus |

**TCD**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCD.1 | 2 | 1 | 1 | 0 | Lulus (setelah uji ulang) |
| TCD.2 | 2 | 1 | 1 | 0 | Lulus (setelah uji ulang) |
| TCD.3 | 2 | 2 | 0 | 0 | Lulus |
| TCD.4 | 2 | 2 | 0 | 0 | Lulus |
| TCD.5 | 2 | 2 | 0 | 0 | Lulus |
| TCD.6 | 2 | 2 | 0 | 0 | Lulus |
| TCD.7 | 2 | 1 | 1 | 0 | Lulus (setelah uji ulang) |
| TCD.8 | 2 | 2 | 0 | 0 | Lulus |
| TCD.9 | 2 | 2 | 0 | 0 | Lulus |
| TCD.10 | 2 | 2 | 0 | 0 | Lulus |
| TCD.11 | 2 | 2 | 0 | 0 | Lulus |
| TCD.12 | 1 | 1 | 0 | 0 | Lulus |
| TCD.13 | 1 | 1 | 0 | 0 | Lulus |

**TCMO**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCMO.1 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.2 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.3 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.4 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.5 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.6 | 5 | 5 | 0 | 0 | Lulus |
| TCMO.8 | 5 | 5 | 0 | 0 | Lulus |
| TCMO.9 | 5 | 5 | 0 | 0 | Lulus |
| TCMO.10 | 5 | 5 | 0 | 0 | Lulus |
| TCMO.11 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.12 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.13 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.14 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.15 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.24 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.25 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.26 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.27 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.28 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.29 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.30 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.31 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.32 | 1 | 1 | 0 | 0 | Lulus |
| TCMO.33 | 1 | 1 | 0 | 0 | Lulus |

**TCDK**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCDK.1 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.2 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.3 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.4 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.5 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.6 | 10 | 10 | 0 | 0 | Lulus |
| TCDK.7 | 10 | 10 | 0 | 0 | Lulus |
| TCDK.8 | 10 | 10 | 0 | 0 | Lulus |
| TCDK.9 | 10 | 10 | 0 | 0 | Lulus |
| TCDK.10 | 2 | 0 | 2 | 0 | Lulus (setelah uji ulang) |
| TCDK.11 | 2 | 0 | 2 | 0 | Lulus (setelah uji ulang) |
| TCDK.12 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.13 | 2 | 0 | 2 | 0 | Lulus (setelah uji ulang) |
| TCDK.14 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.15 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.16 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.17 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.18 | 2 | 1 | 1 | 0 | Lulus (setelah uji ulang) |
| TCDK.19 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.20 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.21 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.22 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.23 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.24 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.25 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.26 | 2 | 1 | 1 | 0 | Lulus (setelah uji ulang) |
| TCDK.27 | 8 | 6 | 2 | 0 | Lulus (setelah uji ulang) |
| TCDK.28 | 2 | 1 | 1 | 0 | Lulus (setelah uji ulang) |
| TCDK.29 | 2 | 1 | 0 | 1 | Lulus |
| TCDK.30 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.31 | 2 | 2 | 0 | 0 | Lulus |
| TCDK.32 | 1 | 1 | 0 | 0 | Lulus |

**TCDR**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCDR.1 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.2 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.3 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.4 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.5 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.6 | 10 | 10 | 0 | 0 | Lulus |
| TCDR.7 | 10 | 9 | 1 | 0 | Lulus (setelah uji ulang) |
| TCDR.8 | 10 | 10 | 0 | 0 | Lulus |
| TCDR.9 | 10 | 9 | 1 | 0 | Lulus (setelah uji ulang) |
| TCDR.10 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.11 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.12 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.13 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.15 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.16 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.17 | 2 | 0 | 2 | 0 | Gagal (setelah uji ulang) |
| TCDR.18 | 2 | 0 | 2 | 0 | Lulus (setelah uji ulang) |
| TCDR.19 | 2 | 1 | 1 | 0 | Lulus (setelah uji ulang) |
| TCDR.20 | 2 | 0 | 2 | 0 | Lulus (setelah uji ulang) |
| TCDR.21 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.22 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.23 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.24 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.25 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.26 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.27 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.28 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.29 | 2 | 2 | 0 | 0 | Lulus |
| TCDR.32 | 2 | 1 | 1 | 0 | Lulus (setelah uji ulang) |
| TCDR.33 | 2 | 1 | 0 | 1 | Lulus (setelah uji ulang) |
| TCDR.34 | 2 | 1 | 0 | 1 | Lulus (setelah uji ulang) |
| TCDR.35 | 2 | 1 | 0 | 1 | Lulus (setelah uji ulang) |

**TCSK**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCSK.1 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.2 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.3 | 6 | 6 | 0 | 0 | Lulus |
| TCSK.4 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.5 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.6 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.7 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.8 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.9 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.10 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.11 | 2 | 2 | 0 | 0 | Lulus |
| TCSK.12 | 2 | 2 | 0 | 0 | Lulus |

**TCLA**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCLA.1 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.2 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.3 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.4 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.5 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.6 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.7 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.8 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.9 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.11 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.12 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.13 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.14 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.15 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.16 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.17 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.18 | 1 | 0 | 0 | 1 | Skip |
| TCLA.19 | 1 | 0 | 0 | 1 | Skip |
| TCLA.20 | 1 | 1 | 0 | 0 | Lulus |
| TCLA.21 | 2 | 2 | 0 | 0 | Lulus |

**TCS**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCS.0 | 2 | 2 | 0 | 0 | Lulus |

**TCDO**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCDO.1 | 2 | 0 | 1 | 1 | Skip (setelah uji ulang) |
| TCDO.2 | 2 | 2 | 0 | 0 | Lulus |
| TCDO.3 | 2 | 2 | 0 | 0 | Lulus |
| TCDO.4 | 2 | 2 | 0 | 0 | Lulus |
| TCDO.5 | 2 | 2 | 0 | 0 | Lulus |
| TCDO.6 | 2 | 2 | 0 | 0 | Lulus |
| TCDO.7 | 2 | 2 | 0 | 0 | Lulus |
| TCDO.8 | 6 | 6 | 0 | 0 | Lulus |
| TCDO.9 | 1 | 1 | 0 | 0 | Lulus |

**TCSH**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCSH.1 | 3 | 3 | 0 | 0 | Lulus |
| TCSH.2 | 3 | 3 | 0 | 0 | Lulus |
| TCSH.3 | 3 | 3 | 0 | 0 | Lulus |
| TCSH.4 | 11 | 11 | 0 | 0 | Lulus |

**TCP**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCP.1 | 2 | 1 | 0 | 1 | Lulus |
| TCP.2 | 2 | 2 | 0 | 0 | Lulus |
| TCP.3 | 2 | 1 | 0 | 1 | Lulus |
| TCP.4 | 8 | 8 | 0 | 0 | Lulus |
| TCP.5 | 2 | 2 | 0 | 0 | Lulus |
| TCP.6 | 2 | 2 | 0 | 0 | Lulus |
| TCP.7 | 2 | 2 | 0 | 0 | Lulus |
| TCP.8 | 2 | 2 | 0 | 0 | Lulus |
| TCP.9 | 2 | 2 | 0 | 0 | Lulus |
| TCP.10 | 10 | 10 | 0 | 0 | Lulus |
| TCP.11 | 2 | 2 | 0 | 0 | Lulus |
| TCP.12 | 1 | 1 | 0 | 0 | Lulus |
| TCP.13 | 1 | 1 | 0 | 0 | Lulus |
| TCP.14 | 1 | 1 | 0 | 0 | Lulus |
| TCP.15 | 4 | 4 | 0 | 0 | Lulus |
| TCP.16 | 1 | 1 | 0 | 0 | Lulus |
| TCP.17 | 1 | 1 | 0 | 0 | Lulus |
| TCP.18 | 1 | 1 | 0 | 0 | Lulus |
| TCP.19 | 1 | 1 | 0 | 0 | Lulus |
| TCP.20 | 1 | 1 | 0 | 0 | Lulus |
| TCP.21 | 1 | 1 | 0 | 0 | Lulus |
| TCP.22 | 1 | 1 | 0 | 0 | Lulus |
| TCP.23 | 1 | 1 | 0 | 0 | Lulus |
| TCP.24 | 1 | 1 | 0 | 0 | Lulus |
| TCP.25 | 1 | 1 | 0 | 0 | Lulus |
| TCP.26 | 1 | 1 | 0 | 0 | Lulus |
| TCP.27 | 1 | 1 | 0 | 0 | Lulus |
| TCP.28 | 2 | 2 | 0 | 0 | Lulus |

**TCHR**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCHR.1 | 2 | 1 | 0 | 1 | Lulus |
| TCHR.2 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.3 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.4 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.5 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.6 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.7 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.8 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.9 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.10 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.11 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.12 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.13 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.14 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.15 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.16 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.17 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.18 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.19 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.20 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.21 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.22 | 2 | 2 | 0 | 0 | Lulus |
| TCHR.23 | 1 | 1 | 0 | 0 | Lulus |
| TCHR.24 | 1 | 1 | 0 | 0 | Lulus |
| TCHR.25 | 1 | 1 | 0 | 0 | Lulus |
| TCHR.26 | 1 | 1 | 0 | 0 | Lulus |

**TCSQL**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCSQL.1 | 11 | 11 | 0 | 0 | Lulus |
| TCSQL.2 | 2 | 2 | 0 | 0 | Lulus |
| TCSQL.3 | 1 | 1 | 0 | 0 | Lulus |
| TCSQL.4 | 1 | 1 | 0 | 0 | Lulus |

**TCSQLA**

| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |
|---|---:|---:|---:|---:|---|
| TCSQLA.1 | 12 | 12 | 0 | 0 | Lulus |
| TCSQLA.2 | 1 | 1 | 0 | 0 | Lulus |
| TCSQLA.3 | 2 | 2 | 0 | 0 | Lulus |
| TCSQLA.4 | 1 | 1 | 0 | 0 | Lulus |
| TCSQLA.5 | 1 | 1 | 0 | 0 | Lulus |

## c. Perbandingan dengan baseline 30 Sep 2026

Baseline: 527 eksekusi, 28m57s (1 worker). TC gagal di baseline: TCDR.6, TCDR.8, TCDR.11, TCDR.17, TCDR.32, TCDR.35, TCSH.1.

| TC-ID | Baseline | Run asli | Status akhir | Perubahan terhadap baseline |
|---|---|---|---|---|
| TCD.1 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCD.2 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCD.7 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDK.10 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDK.11 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDK.13 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDK.18 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDK.26 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDK.27 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDK.28 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDR.6 | Gagal | Lulus | Lulus | berubah: kini lulus |
| TCDR.7 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDR.8 | Gagal | Lulus | Lulus | berubah: kini lulus |
| TCDR.9 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDR.11 | Gagal | Lulus | Lulus | berubah: kini lulus |
| TCDR.17 | Gagal | Gagal | Gagal (setelah uji ulang) | tetap |
| TCDR.18 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDR.19 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDR.20 | Tidak gagal | Gagal | Lulus (setelah uji ulang) | tetap |
| TCDR.32 | Gagal | Gagal | Lulus (setelah uji ulang) | berubah: kini lulus |
| TCDR.35 | Gagal | Lulus | Lulus (setelah uji ulang) | berubah: kini lulus |
| TCDO.1 | Tidak gagal | Gagal | Skip (setelah uji ulang) | tetap |
| TCSH.1 | Gagal | Lulus | Lulus | berubah: kini lulus |

### Rincian kegagalan run asli

| Test | Klasifikasi otomatis | Pesan error (ringkas) | Uji ulang |
|---|---|---|---|
| TCDK.10 Super Admin upload Kader data excel file | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` | Lulus |
| TCDK.11 Super Admin upload invalid template excel Kader data | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` | Lulus |
| TCDK.13 Super Admin cancel upload Kader data excel | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` | Lulus |
| TCDK.10 OPD upload Kader data excel file | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` | Lulus |
| TCDK.11 OPD upload invalid template excel Kader data | Login tidak sampai ke backend (lingkungan) | `Error: expect(page).toHaveURL(expected) failed Expected pattern: /dashboard/ Received string:  "https://frontend-bappeda.vercel.app/login" Timeout: 10000ms` | Lulus |
| TCDK.13 OPD cancel upload Kader data excel | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` | Lulus |
| TCDK.26 OPD navigates between Kader table pages | Login tidak sampai ke backend (lingkungan) | `Error: expect(page).toHaveURL(expected) failed Expected pattern: /dashboard/ Received string:  "https://frontend-bappeda.vercel.app/login" Timeout: 10000ms` | Lulus |
| TCDK.6-9 OPD Fill Form Invalid › TCDK.28 OPD cannot reuse an existing Kader name | Login tidak sampai ke backend (lingkungan) | `Error: expect(page).toHaveURL(expected) failed Expected pattern: /dashboard/ Received string:  "https://frontend-bappeda.vercel.app/login" Timeout: 10000ms` | Lulus |
| TCDK.6-9 OPD Fill Form Invalid › TCDK.27 OPD invalid Alamat PIC › TCDK.27 OPD Alamat too long | Gangguan jaringan (lingkungan) | `TimeoutError: page.goto: Timeout 10000ms exceeded. TimeoutError: locator.click: Timeout 10000ms exceeded.` | Lulus |
| TCDK.6-9 OPD Fill Form Invalid › TCDK.27 OPD invalid Alamat PIC › TCDK.27 OPD Alamat with digits only | Gangguan jaringan (lingkungan) | `Error: page.goto: net::ERR_NETWORK_CHANGED at https://frontend-bappeda.vercel.app/ TimeoutError: locator.click: Timeout 10000ms exceeded.` | Lulus |
| TCDK.14-21 OPD Search Bar › TCDK.18 OPD input with lower case | Login tidak sampai ke backend (lingkungan) | `Error: expect(page).toHaveURL(expected) failed Expected pattern: /dashboard/ Received string:  "https://frontend-bappeda.vercel.app/login" Timeout: 10000ms` | Lulus |
| TCD.1 OPD access Dashboard page | Login tidak sampai ke backend (lingkungan) | `Error: expect(page).toHaveURL(expected) failed Expected pattern: /dashboard/ Received string:  "https://frontend-bappeda.vercel.app/login" Timeout: 10000ms` | Lulus |
| TCD.2 OPD hover on bar chart diagram | Gangguan jaringan (lingkungan) | `Error: page.goto: net::ERR_NETWORK_CHANGED at https://frontend-bappeda.vercel.app/` | Lulus |
| TCD.7 OPD switches the main chart data filter | Gangguan jaringan (lingkungan) | `TimeoutError: page.goto: Timeout 10000ms exceeded.` | Lulus |
| TCDR.17 Super Admin upload Relawan data excel file | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` | Gagal |
| TCDR.18 Super Admin upload invalid template excel Relawan data | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` | Lulus |
| TCDR.20 Super Admin cancel upload Relawan data excel | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` | Lulus |
| TCDR.6-9 Super Admin Fill Form Invalid › TCDR.7 Super Admin invalid NIK › TCDR.7 Empty NIK | Gangguan jaringan (lingkungan) | `Error: page.goto: net::ERR_INTERNET_DISCONNECTED at https://frontend-bappeda.vercel.app/ TimeoutError: locator.click: Timeout 10000ms exceeded.` | Lulus |
| TCDR.17 OPD upload Relawan data excel file | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` | Gagal |
| TCDR.18 OPD upload invalid template excel Relawan data | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` | Lulus |
| TCDR.19 OPD click Templat Excel Relawan Kader hyperlink | Gangguan jaringan (lingkungan) | `TimeoutError: page.goto: Timeout 10000ms exceeded.` | Lulus |
| TCDR.20 OPD cancel upload Relawan data excel | Berkas uji tidak ada (lingkungan) | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` | Lulus |
| TCDR.6-9 OPD Fill Form Invalid › TCDR.9 OPD invalid phone number › TCDR.9 Phone number too short | Login tidak sampai ke backend (lingkungan) | `Error: expect(page).toHaveURL(expected) failed Expected pattern: /dashboard/ Received string:  "https://frontend-bappeda.vercel.app/login" Timeout: 10000ms` | Lulus |
| TCDR.32-35 OPD Pengajuan Perubahan Data › TCDR.32 OPD access Relawan Review | Gangguan jaringan (lingkungan) | `Error: page.goto: net::ERR_NETWORK_CHANGED at https://frontend-bappeda.vercel.app/` | Lulus |
| TCDR.32-35 OPD Pengajuan Perubahan Data › TCDR.33 OPD accept Pengajuan perubahan data | Tidak jalan (blok serial) | `-` | Lulus |
| TCDR.32-35 OPD Pengajuan Perubahan Data › TCDR.34 OPD decline Pengajuan perubahan data | Tidak jalan (blok serial) | `-` | Lulus |
| TCDR.32-35 OPD Pengajuan Perubahan Data › TCDR.35 OPD add verification notes to Pengajuan perubahan | Tidak jalan (blok serial) | `-` | Lulus |
| TCDO.1-4 Super Admin Download › TCDO.1 Super Admin downloads the application user guide | Login tidak sampai ke backend (lingkungan) | `Error: expect(page).toHaveURL(expected) failed Expected pattern: /dashboard/ Received string:  "https://frontend-bappeda.vercel.app/login" Timeout: 10000ms` | Skip |

### Kegagalan yang tersisa setelah uji ulang

| Test | Klasifikasi otomatis | Pesan error (ringkas) |
|---|---|---|
| TCDR.17 Super Admin upload Relawan data excel file | Kondisi tidak terpenuhi dalam LOAD_TIME | `Error: expect(locator).toBeVisible() failed Locator: getByText(/berhasil\|success\|data baru ditambahkan\|relawan baru ditambahkan/i) Expected: visible Timeout: 10000ms` |
| TCDR.17 OPD upload Relawan data excel file | Kondisi tidak terpenuhi dalam LOAD_TIME | `Error: expect(locator).toBeVisible() failed Locator: getByText(/berhasil\|success\|data baru ditambahkan\|relawan baru ditambahkan/i) Expected: visible Timeout: 10000ms` |

## Analisis

<!-- ANALISIS -->

### 1. Klasifikasi 25 kegagalan run asli

| Kelompok | Eksekusi | Test | Pesan error (contoh) | Klasifikasi | Uji ulang |
|---|---:|---|---|---|---|
| A. Jaringan laptop putus/berganti (dua periode selama run) | 14 | TCDK.11, 18, 26, 27 (×2), 28 OPD; TCD.1, 2, 7 OPD; TCDR.7 Super Admin; TCDR.9, 19, 32 OPD; TCDO.1 Super Admin (+ TCDR.33–35 OPD tidak jalan) | `page.goto: net::ERR_NETWORK_CHANGED`, `net::ERR_INTERNET_DISCONNECTED`, `page.goto: Timeout 10000ms exceeded`, atau `toHaveURL /dashboard/` dengan URL tetap `/login` (permintaan login tidak sampai ke backend) | **Bukan kegagalan valid** (gangguan lingkungan) | 13 lulus; TCDO.1 Super Admin skip (skip bersyarat yang disengaja, sama dengan TCDO.1 OPD); TCDR.33–35 OPD lulus |
| B. Berkas uji tidak ada | 11 | TCDK.10, 13 (Super Admin & OPD), TCDK.11 Super Admin; TCDR.17, 18, 20 (Super Admin & OPD) | `ENOENT: no such file or directory, open '...\src\assets\files\Template_Data_Relawan.xlsx'` | **Bukan kegagalan valid** (penyiapan perangkat) | 9 lulus; TCDR.17 (×2) gagal, lihat bagian 2 |

Kelompok B: `baseExcel.helper.ts` membaca templat dari `src/assets/files/`, folder yang
di-*ignore* git (`src/assets/files/*.xlsx`), sehingga berkas tidak ikut ter-*clone*.
Templat resmi yang sama (yang diunduh pengguna dari halaman Dokumen) ada di
`src/excel/`; berkas itu disalin ke `src/assets/files/` sebelum uji ulang. Kode test
tidak diubah. Setelah uji ulang, path di `baseExcel.helper.ts` diarahkan ke `src/excel/`,
sehingga salinan lokal tidak diperlukan lagi.

### 2. Kegagalan yang tersisa: TCDR.17 — gagal valid, cacat aplikasi

TCDR.17 Super Admin dan TCDR.17 OPD (upload Excel relawan yang valid):

```
Error: expect(locator).toBeVisible() failed
Locator: getByText(/berhasil|success|data baru ditambahkan|relawan baru ditambahkan/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found
```

Penyebab: di `src/pages/DataRelawan.tsx:372` modal unggah relawan dipasang dengan
`onConfirm={async () => {}}`. Tombol "Simpan Data Bersih" hanya menutup modal; data
tidak dikirim ke backend dan tidak ada notifikasi. Hook `useBulkRelawan` sudah ada
di `src/hooks/relawan/useRelawanMutations.ts` tetapi tidak dipakai. Pembanding: halaman
Kader (`DaftarKader.tsx`) dan OPD (`ManajemenOPD.tsx`) memasang
`onConfirm={handleExcelUploadConfirm}`, dan TCDK.10 lulus.

Klasifikasi: **gagal valid – cacat aplikasi** (hasil aktual ≠ harapan). TCDR.17 juga
gagal di baseline.

Tidak ada kegagalan berkategori **gagal valid – melebihi LOAD_TIME** pada run ini.

### 3. Kesalahan skrip yang diperbaiki sebelum run ini

Ditemukan pada eksekusi ulang sementara (21 Okt 2026), diperbaiki, lalu dijalankan ulang
di run ini:

| TC | Kesalahan skrip | Perbaikan | Hasil di run ini |
|---|---|---|---|
| TCDK.6, TCDR.5, TCDR.9, TCDR.10 (Super Admin) | Durasi mengetik nama OPD per karakter (80 ms × hingga 90 karakter) ikut menghabiskan LOAD_TIME | `typeThink`: batas waktu = LOAD_TIME + durasi mengetik (commit `7667b49`) | Lulus |
| TCDR.32 (Super Admin & OPD) | Locator field modal pengajuan tidak cocok (label tanpa `htmlFor`, placeholder berisi data profil) | Field dicari lewat label (commit `6e9fc9e`) | Lulus (OPD: setelah uji ulang kelompok A) |
| TCDR.35 | Catatan verifikator diisi **setelah** klik Tolak, padahal field ada di halaman Review sebelum tombol Tolak | Urutan langkah ditukar; locator & assertion tetap (commit `ad109ce`) | Lulus |
| TCDR.32–35 OPD | Data uji: relawan uji (NIK 2222222222222222) tidak punya penugasan di OPD akun uji, sehingga admin OPD tidak melihat pengajuannya | Penugasan relawan uji ke "Kader Demo" ditambahkan lewat aplikasi (perbaikan data, bukan kode) | Lulus |

### 4. Perubahan status terhadap baseline 30 Sep 2026

- **TCDR.32, TCDR.35**: gagal → lulus karena perbaikan skrip dan data uji di bagian 3.
- **TCDR.6, TCDR.8, TCDR.11, TCSH.1**: gagal → lulus di setiap eksekusi. Pesan error
  baseline tidak tersedia, jadi penyebab kegagalan di baseline tidak dapat dipastikan.
- **TCDR.17**: tetap gagal (cacat aplikasi, bagian 2).
- Tidak ada TC yang baru gagal dibanding baseline setelah uji ulang kelompok A dan B.
- Durasi naik dari 28m57s menjadi 2h14m50s karena think time 1,2 s setelah setiap aksi
  (ditambah gangguan jaringan pada sebagian run). Kenaikan ini memang diharapkan dan
  bukan penurunan kinerja aplikasi.

### 5. Test yang di-skip (8, disengaja)

| Test | Alasan (anotasi `test.skip`) |
|---|---|
| TCL.9 | Tautan "Lupa Password ?" belum mengarah ke halaman apa pun (`href="#"` di `Login.tsx`) |
| TCDK.29 OPD | Role OPD tidak memilih OPD; otomatis instansinya sendiri |
| TCDO.1 OPD | Tombol Unduh "Buku Panduan Aplikasi" belum punya `downloadUrl` di `Dokumen.tsx` |
| TCLA.18 | API `/admin/logs` tidak mengirim `old_value` & `new_value` |
| TCLA.19 | API `/admin/logs` tidak mengirim field `nik` |
| TCP.1, TCP.3 Super Admin | Nama akun "Demo Super Admin 1" mengandung angka sehingga ditolak backend (lihat TCP.28) |
| TCHR.1 OPD | Filter OPD terkunci untuk role OPD; diuji di TCHR.24 |

Tiga test lain (TCDR.33–35 OPD) berstatus *did not run* karena TCDR.32 OPD gagal di
blok serial (kelompok A); ketiganya lulus pada uji ulang.

## d. 1 worker vs 10 worker

Run 10 worker **tidak dijalankan** untuk laporan ini, atas keputusan peneliti: perangkat
uji tidak sanggup menjalankan 10 browser paralel dengan think time. Dua percobaan
dihentikan sebelum selesai (berhenti di test 338/527, lalu macet di 50/527), dan hasil
parsialnya tidak dipakai. Baseline 10 worker (10m17s) karenanya tidak dibandingkan.
Skrip `scripts/rerun.ps1 -Workers 10` tetap tersedia untuk dijalankan di perangkat lain.
