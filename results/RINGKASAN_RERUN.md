# Ringkasan Eksekusi Ulang (Think Time & Load Time)

Tanggal eksekusi: 2026-10-21. Proyek: chromium. THINK_TIME 1,2 s, LOAD_TIME 10 s, retries 0, timeout per test 120 s (blok serial TCDR.32–35: 180 s).

Cakupan: 527 test, sama dengan baseline (tanpa `performance/*`, `screenshot-ui`, `accessControl`, `xss`). Hasil mentah: `results.json`, laporan HTML (`html-report/`), dan log terminal (`log.txt`) pada folder masing-masing.

## 1. Statistik

| Metrik | 1 worker | 10 worker | Baseline 1 worker | Baseline 10 worker |
|---|---:|---:|---:|---:|
| Total test | 527 | belum dijalankan | 527 | 527 |
| Passed | 490 | belum dijalankan | – | – |
| Failed | 22 | belum dijalankan | – | – |
| Skipped (termasuk "did not run") | 15 | belum dijalankan | – | – |
| Flaky | 0 | belum dijalankan | – | – |
| Durasi | 148m12s | belum dijalankan | 28m57s | 10m17s |

## 2. Status per TC-ID

Kolom eksekusi: jumlah eksekusi (L = lulus, G = gagal, S = skip, TJ = tidak dijalankan karena test sebelumnya di blok serial gagal). Satu TC-ID bisa dieksekusi beberapa kali karena multi-peran dan variasi data. Status TC = Gagal bila ada satu eksekusi gagal; Skip bila seluruhnya dilewati.

| TC-ID | Status 1 worker | Eksekusi 1 worker | Status 10 worker | Eksekusi 10 worker |
|---|---|---|---|---|
| TCBP.1 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCBP.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCBP.3 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCBP.4 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.1 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.3 | Gagal | 2 (L 1 / G 1 / S 0) | - | - |
| TCD.4 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.5 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.6 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.7 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.8 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.9 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.10 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.11 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCD.12 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCD.13 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCDK.1 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.3 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.4 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.5 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.6 | Gagal | 10 (L 8 / G 2 / S 0) | - | - |
| TCDK.7 | Lulus | 10 (L 10 / G 0 / S 0) | - | - |
| TCDK.8 | Lulus | 10 (L 10 / G 0 / S 0) | - | - |
| TCDK.9 | Lulus | 10 (L 10 / G 0 / S 0) | - | - |
| TCDK.10 | Gagal | 2 (L 0 / G 2 / S 0) | - | - |
| TCDK.11 | Gagal | 2 (L 0 / G 2 / S 0) | - | - |
| TCDK.12 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.13 | Gagal | 2 (L 0 / G 2 / S 0) | - | - |
| TCDK.14 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.15 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.16 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.17 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.18 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.19 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.20 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.21 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.22 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.23 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.24 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.25 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.26 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.27 | Lulus | 8 (L 8 / G 0 / S 0) | - | - |
| TCDK.28 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.29 | Lulus | 2 (L 1 / G 0 / S 1) | - | - |
| TCDK.30 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.31 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDK.32 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCDO.1 | Skip | 2 (L 0 / G 0 / S 2) | - | - |
| TCDO.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDO.3 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDO.4 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDO.5 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDO.6 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDO.7 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDO.8 | Lulus | 6 (L 6 / G 0 / S 0) | - | - |
| TCDO.9 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCDR.1 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.3 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.4 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.5 | Gagal | 2 (L 1 / G 1 / S 0) | - | - |
| TCDR.6 | Lulus | 10 (L 10 / G 0 / S 0) | - | - |
| TCDR.7 | Lulus | 10 (L 10 / G 0 / S 0) | - | - |
| TCDR.8 | Lulus | 10 (L 10 / G 0 / S 0) | - | - |
| TCDR.9 | Gagal | 10 (L 8 / G 2 / S 0) | - | - |
| TCDR.10 | Gagal | 2 (L 1 / G 1 / S 0) | - | - |
| TCDR.11 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.12 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.13 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.15 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.16 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.17 | Gagal | 2 (L 0 / G 2 / S 0) | - | - |
| TCDR.18 | Gagal | 2 (L 0 / G 2 / S 0) | - | - |
| TCDR.19 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.20 | Gagal | 2 (L 0 / G 2 / S 0) | - | - |
| TCDR.21 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.22 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.23 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.24 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.25 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.26 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.27 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.28 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCDR.29 | Gagal | 2 (L 1 / G 1 / S 0) | - | - |
| TCDR.32 | Gagal | 2 (L 0 / G 2 / S 0) | - | - |
| TCDR.33 | Tidak jalan | 2 (L 0 / G 0 / S 0 / TJ 2) | - | - |
| TCDR.34 | Tidak jalan | 2 (L 0 / G 0 / S 0 / TJ 2) | - | - |
| TCDR.35 | Tidak jalan | 2 (L 0 / G 0 / S 0 / TJ 2) | - | - |
| TCHR.1 | Lulus | 2 (L 1 / G 0 / S 1) | - | - |
| TCHR.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.3 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.4 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.5 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.6 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.7 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.8 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.9 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.10 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.11 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.12 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.13 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.14 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.15 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.16 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.17 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.18 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.19 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.20 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.21 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.22 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCHR.23 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCHR.24 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCHR.25 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCHR.26 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCL.0 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCL.1 | Lulus | 3 (L 3 / G 0 / S 0) | - | - |
| TCL.2 | Lulus | 5 (L 5 / G 0 / S 0) | - | - |
| TCL.3 | Lulus | 3 (L 3 / G 0 / S 0) | - | - |
| TCL.4 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCL.5 | Lulus | 3 (L 3 / G 0 / S 0) | - | - |
| TCL.6 | Lulus | 3 (L 3 / G 0 / S 0) | - | - |
| TCL.8 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCL.9 | Skip | 1 (L 0 / G 0 / S 1) | - | - |
| TCL.10 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCL.11 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCL.12 | Lulus | 4 (L 4 / G 0 / S 0) | - | - |
| TCL.13 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCL.14 | Lulus | 3 (L 3 / G 0 / S 0) | - | - |
| TCLA.1 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.2 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.3 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.4 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.5 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.6 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.7 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.8 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.9 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.11 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.12 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.13 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.14 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.15 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.16 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.17 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.18 | Skip | 1 (L 0 / G 0 / S 1) | - | - |
| TCLA.19 | Skip | 1 (L 0 / G 0 / S 1) | - | - |
| TCLA.20 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCLA.21 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCMO.1 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.2 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.3 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.4 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.5 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.6 | Lulus | 5 (L 5 / G 0 / S 0) | - | - |
| TCMO.8 | Lulus | 5 (L 5 / G 0 / S 0) | - | - |
| TCMO.9 | Lulus | 5 (L 5 / G 0 / S 0) | - | - |
| TCMO.10 | Lulus | 5 (L 5 / G 0 / S 0) | - | - |
| TCMO.11 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.12 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.13 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.14 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.15 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.24 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.25 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.26 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.27 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.28 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.29 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.30 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.31 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.32 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCMO.33 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.1 | Lulus | 2 (L 1 / G 0 / S 1) | - | - |
| TCP.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCP.3 | Lulus | 2 (L 1 / G 0 / S 1) | - | - |
| TCP.4 | Lulus | 8 (L 8 / G 0 / S 0) | - | - |
| TCP.5 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCP.6 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCP.7 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCP.8 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCP.9 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCP.10 | Lulus | 10 (L 10 / G 0 / S 0) | - | - |
| TCP.11 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCP.12 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.13 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.14 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.15 | Lulus | 4 (L 4 / G 0 / S 0) | - | - |
| TCP.16 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.17 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.18 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.19 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.20 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.21 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.22 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.23 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.24 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.25 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.26 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.27 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCP.28 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCS.0 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSH.1 | Lulus | 3 (L 3 / G 0 / S 0) | - | - |
| TCSH.2 | Lulus | 3 (L 3 / G 0 / S 0) | - | - |
| TCSH.3 | Lulus | 3 (L 3 / G 0 / S 0) | - | - |
| TCSH.4 | Lulus | 11 (L 11 / G 0 / S 0) | - | - |
| TCSK.1 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.3 | Lulus | 6 (L 6 / G 0 / S 0) | - | - |
| TCSK.4 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.5 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.6 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.7 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.8 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.9 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.10 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.11 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSK.12 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSQL.1 | Lulus | 11 (L 11 / G 0 / S 0) | - | - |
| TCSQL.2 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSQL.3 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCSQL.4 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCSQLA.1 | Lulus | 12 (L 12 / G 0 / S 0) | - | - |
| TCSQLA.2 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCSQLA.3 | Lulus | 2 (L 2 / G 0 / S 0) | - | - |
| TCSQLA.4 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |
| TCSQLA.5 | Lulus | 1 (L 1 / G 0 / S 0) | - | - |

## 3. Perbandingan dengan baseline 30 Sep 2026

TC gagal di baseline: TCDR.6, TCDR.8, TCDR.11, TCDR.17, TCDR.32, TCDR.35, TCSH.1.

| TC-ID | Baseline | 1 worker | 10 worker | Perubahan |
|---|---|---|---|---|
| TCD.3 | Lulus | Gagal | - | berubah: kini gagal |
| TCDK.6 | Lulus | Gagal | - | berubah: kini gagal |
| TCDK.10 | Lulus | Gagal | - | berubah: kini gagal |
| TCDK.11 | Lulus | Gagal | - | berubah: kini gagal |
| TCDK.13 | Lulus | Gagal | - | berubah: kini gagal |
| TCDR.5 | Lulus | Gagal | - | berubah: kini gagal |
| TCDR.6 | Gagal | Lulus | - | berubah: kini Lulus |
| TCDR.8 | Gagal | Lulus | - | berubah: kini Lulus |
| TCDR.9 | Lulus | Gagal | - | berubah: kini gagal |
| TCDR.10 | Lulus | Gagal | - | berubah: kini gagal |
| TCDR.11 | Gagal | Lulus | - | berubah: kini Lulus |
| TCDR.17 | Gagal | Gagal | - | tetap |
| TCDR.18 | Lulus | Gagal | - | berubah: kini gagal |
| TCDR.20 | Lulus | Gagal | - | berubah: kini gagal |
| TCDR.29 | Lulus | Gagal | - | berubah: kini gagal |
| TCDR.32 | Gagal | Gagal | - | tetap |
| TCDR.35 | Gagal | Tidak jalan | - | berubah: kini Tidak jalan |
| TCSH.1 | Gagal | Lulus | - | berubah: kini Lulus |

## 4. Rincian kegagalan

Klasifikasi otomatis dari pesan error: *Hasil aktual ≠ hasil yang diharapkan* (assertion nilai/teks), *Kondisi tidak terpenuhi dalam LOAD_TIME* (penantian eksplisit 10 s habis), *Melebihi LOAD_TIME* (pesan dari timing.helper), atau *Melebihi batas waktu test*. Analisis per TC ada di bagian 5.

### 1 worker (22 eksekusi gagal)

| Test | Klasifikasi | Pesan error (ringkas) |
|---|---|---|
| TCDK.10 Super Admin upload Kader data excel file | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` |
| TCDK.11 Super Admin upload invalid template excel Kader data | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` |
| TCDK.13 Super Admin cancel upload Kader data excel | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` |
| TCDK.6-9 Super Admin Fill Form Invalid › TCDK.6 Super Admin invalid Kader name › TCDK.6 Super Admin Kader name too short | Kondisi tidak terpenuhi dalam LOAD_TIME | `TimeoutError: locator.pressSequentially: Timeout 10000ms exceeded.` |
| TCDK.6-9 Super Admin Fill Form Invalid › TCDK.6 Super Admin invalid Kader name › TCDK.6 Super Admin Kader name with numbers | Kondisi tidak terpenuhi dalam LOAD_TIME | `TimeoutError: locator.pressSequentially: Timeout 10000ms exceeded.` |
| TCDK.10 OPD upload Kader data excel file | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` |
| TCDK.11 OPD upload invalid template excel Kader data | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` |
| TCDK.13 OPD cancel upload Kader data excel | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'` |
| TCD.3 Super Admin hover on gender donut chart | Kondisi tidak terpenuhi dalam LOAD_TIME | `Error: expect(locator).toBeHidden() failed Locator:  getByText(/memuat data dashboard/i) Expected: hidden Received: visible` |
| TCDR.17 Super Admin upload Relawan data excel file | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` |
| TCDR.18 Super Admin upload invalid template excel Relawan data | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` |
| TCDR.20 Super Admin cancel upload Relawan data excel | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` |
| TCDR.3-5 Super Admin Fill Form Add Relawan › TCDR.5 Super Admin cancel new Relawan form | Kondisi tidak terpenuhi dalam LOAD_TIME | `TimeoutError: locator.pressSequentially: Timeout 10000ms exceeded.` |
| TCDR.6-9 Super Admin Fill Form Invalid › TCDR.9 Super Admin invalid phone number › TCDR.9 Phone number with special characters | Kondisi tidak terpenuhi dalam LOAD_TIME | `TimeoutError: locator.pressSequentially: Timeout 10000ms exceeded.` |
| TCDR.6-9 Super Admin Fill Form Invalid › TCDR.9 Super Admin invalid phone number › TCDR.9 Phone number too long | Kondisi tidak terpenuhi dalam LOAD_TIME | `TimeoutError: locator.pressSequentially: Timeout 10000ms exceeded.` |
| TCDR.10-16 Super Admin Penugasan Form › TCDR.10 Super Admin fill Penugasan form | Kondisi tidak terpenuhi dalam LOAD_TIME | `TimeoutError: locator.pressSequentially: Timeout 10000ms exceeded.` |
| TCDR.32-35 Super Admin Pengajuan Perubahan Data › TCDR.32 Super Admin access Relawan Review | Melebihi LOAD_TIME | `Error: Melebihi LOAD_TIME (10 s): notifikasi pengajuan berhasil dikirim tampil expect(locator).toBeVisible() failed Locator: getByText(/berhasil.*dikirim\|success/i).or(getByRole('alert').filter({ hasText: /berhasil.*dikirim\|success/i })).or(getByText('Pengajuan perubahan data berhasil dikirim dan sedang menunggu review Admin.')).first() Expected: visible` |
| TCDR.17 OPD upload Relawan data excel file | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` |
| TCDR.18 OPD upload invalid template excel Relawan data | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` |
| TCDR.20 OPD cancel upload Relawan data excel | Lainnya | `Error: ENOENT: no such file or directory, open 'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Relawan.xlsx'` |
| TCDR.28-31 OPD Detail Relawan › TCDR.29 OPD edit Relawan penugasan detail form | Melebihi batas waktu test | `Test timeout of 120000ms exceeded. Error: expect(locator).toBeVisible() failed Locator: getByText(/berhasil\|success/i) Expected: visible` |
| TCDR.32-35 OPD Pengajuan Perubahan Data › TCDR.32 OPD access Relawan Review | Melebihi LOAD_TIME | `Error: Melebihi LOAD_TIME (10 s): notifikasi pengajuan berhasil dikirim tampil expect(locator).toBeVisible() failed Locator: getByText(/berhasil.*dikirim\|success/i).or(getByRole('alert').filter({ hasText: /berhasil.*dikirim\|success/i })).or(getByText('Pengajuan perubahan data berhasil dikirim dan sedang menunggu review Admin.')).first() Expected: visible` |

### 10 worker

Belum dijalankan.

## 5. Analisis TC yang gagal

<!-- ANALISIS -->

> **Status: hasil sementara.** Hanya run 1 worker yang lengkap. Run 10 worker
> terhenti di awal karena sesi eksekusi tertutup dan belum diulang.
>
> **Perangkat berbeda dari baseline.** Baseline 30 Sep dijalankan di laptop
> penguji sebelumnya (sedang diperbaiki). Run 21 Okt dijalankan di laptop
> pengganti: Intel Core i7-5600U (2 core / 4 thread), RAM 16 GB, Windows 10.
> Karena itu **durasi tidak dapat dibandingkan langsung** dengan baseline,
> dan kegagalan yang berkaitan dengan LOAD_TIME bisa dipengaruhi perangkat.
> Kenaikan durasi (28m57s → 148m12s) terutama berasal dari think time
> 1,2 s per aksi.

### 5.1 Pengelompokan 22 eksekusi gagal (1 worker)

| Kelompok | Eksekusi | TC-ID | Termasuk kegagalan valid? |
|---|---:|---|---|
| A. Lingkungan: berkas templat Excel tidak ada | 12 | TCDK.10, TCDK.11, TCDK.13, TCDR.17, TCDR.18, TCDR.20 (masing-masing Super Admin & OPD) | **Tidak.** Masalah penyiapan perangkat |
| B. Artefak skrip: durasi mengetik menghabiskan LOAD_TIME | 6 | TCDK.6 (×2), TCDR.5, TCDR.9 (×2), TCDR.10. Semuanya Super Admin | **Tidak.** Sudah diperbaiki (commit `7667b49`) |
| C. Cacat skrip yang sudah ada sejak baseline | 2 (+6 tidak jalan) | TCDR.32 (×2); akibatnya TCDR.33–35 tidak dijalankan | **Tidak.** Perlu perbaikan helper (lihat 5.3) |
| D. Kondisi tidak terpenuhi dalam LOAD_TIME | 2 | TCD.3 (Super Admin), TCDR.29 (OPD) | **Ya**, sesuai kriteria (2) |

**A. Berkas templat tidak ada (12 eksekusi).** Generator Excel membaca
`src/assets/files/Template_Data_Kader.xlsx` dan `Template_Data_Relawan.xlsx`.
Kedua berkas itu diabaikan `.gitignore` (`src/assets/files/*.xlsx`), sehingga
tidak ikut ter-clone ke laptop pengganti. Hanya `Template_Data_OPD.xlsx` yang
tercatat di git, dan TCMO.11/12/14 yang memakainya lulus. Pesan error:

```
Error: ENOENT: no such file or directory, open
'D:\Lavy\frontend_bappeda\src\assets\files\Template_Data_Kader.xlsx'
  at ..\helpers\baseExcel.helper.ts:67
```

Tindak lanjut: salin kedua templat dari laptop sebelumnya, atau unduh dari
halaman Dokumen aplikasi (TCDO.2 & TCDO.4), lalu simpan dengan nama di atas.
Sebaiknya kedua berkas juga dikecualikan dari `.gitignore` supaya ikut tersimpan
di repo. Kegagalan ini **tidak mencerminkan aplikasi** dan tidak dapat dipakai
untuk menilai TCDK.10/11/13 maupun TCDR.17/18/20.

**B. Artefak pengetikan (6 eksekusi).** Field autocomplete OPD diketik per
karakter (80 ms/karakter). Nama OPD terpanjang, "Dinas Pemberdayaan Perempuan
Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana" (90 karakter),
butuh ± 7,2 s hanya untuk diketik. Di laptop pengganti, waktu itu ditambah
render per huruf melampaui `actionTimeout` (LOAD_TIME 10 s). Snapshot halaman
menunjukkan nama baru terketik sebagian ("Dinas Pemberdayaan Perempuan
Perlindungan Anak Pengen"). Pesan error:

```
TimeoutError: locator.pressSequentially: Timeout 10000ms exceeded.
  - waiting for getByRole('textbox', { name: 'Ketik nama OPD...' })
```

Durasi mengetik adalah perilaku pengguna, bukan waktu tunggu aplikasi. Karena
itu batasnya kini LOAD_TIME + (jumlah karakter × 80 ms). Kedua test yang
terdampak lulus setelah perbaikan. Kegagalan ini **tidak valid** dan diharapkan
hilang pada run berikutnya.

**C. TCDR.32 (2 eksekusi), sehingga TCDR.33–35 tidak dijalankan (6 eksekusi).**
Helper `submitPengajuan` (penyiapan data lewat akun relawan) mencari field
dengan `getByRole("textbox", { name: /alamat/i })` dan `/nomor hp/i`. Pada
modal versi sekarang, nama aksesibel field tersebut adalah placeholder-nya
(mis. "729 South Avenue, Yogyakarta" dan "08987540006"). Akibatnya hanya field
Catatan yang terisi, pengajuan tidak memuat perubahan data apa pun, dan
notifikasi berhasil tidak pernah muncul. Snapshot saat gagal: modal "Ajukan
Pembaruan Data" masih terbuka dengan Alamat Baru dan No. HP Baru kosong.
Pesan error:

```
Error: Melebihi LOAD_TIME (10 s): notifikasi pengajuan berhasil dikirim tampil
  Locator: getByText(/berhasil.*dikirim|success/i) ...
  Error: element(s) not found
```

Ini cacat **skrip uji**, bukan cacat aplikasi. Baseline 30 Sep juga mencatat
TCDR.32 dan TCDR.35 gagal. Karena TCDR.32–35 berada dalam blok serial,
TCDR.33–35 tidak dijalankan.

**D. Kegagalan valid (2 eksekusi):**

- **TCD.3 Super Admin (melebihi LOAD_TIME).** Setelah login, teks "Memuat data
  dashboard & statistik..." masih tampil setelah 10 s. Dashboard Super Admin
  menunggu beberapa request statistik sekaligus. Sebelumnya batas penantian ini
  30 s, jadi keterlambatan yang sama tidak terdeteksi. Pada run ini, 23 dari 24
  test di `dashboard.spec.ts` lulus dengan penantian yang sama, sehingga
  keterlambatannya bersifat sesekali.
  Pesan error:
  ```
  Error: expect(locator).toBeHidden() failed
    Locator: getByText(/memuat data dashboard/i)
    Expected: hidden  Received: visible  Timeout: 10000ms
  ```
- **TCDR.29 OPD (kondisi tidak terpenuhi dalam LOAD_TIME, lalu batas test
  120 s terlampaui).** Setelah mengubah penugasan dan menekan Simpan,
  notifikasi "berhasil" tidak muncul dalam 10 s, dan modal "Detail Relawan"
  masih terbuka. Varian Super Admin lulus. Dari data otomatis belum dapat
  dipastikan apakah aplikasi menolak penyimpanan tanpa pesan atau hanya
  lambat. **Perlu diverifikasi manual** (buka trace di `html-report`).
  Pesan error:
  ```
  Test timeout of 120000ms exceeded.
  Error: expect(locator).toBeVisible() failed
    Locator: getByText(/berhasil|success/i)
    Error: element(s) not found
  ```

### 5.2 Perbandingan dengan baseline 30 Sep 2026

| TC-ID | Baseline | Run 21 Okt (1 worker) | Keterangan |
|---|---|---|---|
| TCDR.6 | Gagal | **Lulus** (10/10 eksekusi) | Berubah status |
| TCDR.8 | Gagal | **Lulus** (10/10) | Berubah status |
| TCDR.11 | Gagal | **Lulus** (2/2) | Berubah status |
| TCSH.1 | Gagal | **Lulus** (3/3) | Berubah status |
| TCDR.17 | Gagal | Gagal | Status sama, tetapi penyebab sekarang lingkungan (kelompok A), jadi **tidak sebanding** |
| TCDR.32 | Gagal | Gagal | Tetap. Cacat skrip helper pengajuan (kelompok C) |
| TCDR.35 | Gagal | Tidak dijalankan | Akibat TCDR.32 gagal dalam blok serial |

Pesan error baseline tidak tersedia di data yang saya pegang, sehingga
penyebab kegagalan TCDR.6/8/11 dan TCSH.1 di baseline tidak dapat dipastikan.
Yang dapat dinyatakan: pada run ini keempatnya lulus di setiap eksekusi.

TC yang **baru** gagal dibanding baseline: TCD.3, TCDK.6, TCDK.10, TCDK.11,
TCDK.13, TCDR.5, TCDR.9, TCDR.10, TCDR.18, TCDR.20, TCDR.29. Dari daftar itu,
hanya **TCD.3** (melebihi LOAD_TIME) dan **TCDR.29** (perlu verifikasi) yang
merupakan kegagalan valid. Sisanya berasal dari kelompok A dan B.

### 5.3 Tindak lanjut sebelum run final

1. Pulihkan `Template_Data_Kader.xlsx` dan `Template_Data_Relawan.xlsx` di
   `src/assets/files/` (kelompok A).
2. Perbaikan pengetikan sudah di-commit (kelompok B).
3. Perbaiki locator di `src/helpers/submitPengajuan.helper.ts` supaya field
   Alamat Baru dan No. HP Baru ditemukan lewat label-nya, seperti pada
   `profil.spec.ts` (kelompok C). Ini mengubah logika helper, jadi menunggu
   persetujuan penguji.
4. Jalankan ulang 1 worker dan 10 worker di perangkat yang sama, idealnya
   laptop baseline, dengan `scripts/rerun.ps1`, lalu buat ulang ringkasan ini
   dengan `node scripts/summarize-rerun.mjs <dir-1-worker> <dir-10-worker>`.
