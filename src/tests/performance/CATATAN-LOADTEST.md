# Hasil Load Testing

- **Alat:** Playwright `APIRequestContext` (`loadTesting.spec.ts`)
- **Target:** `backend-skripsi-relawan.vercel.app` & `frontend-bappeda.vercel.app` (Vercel, tier gratis)
- **Tanggal:** 23 September 2026
- **Konfigurasi:** konkurensi 5, pacing 100 ms, ~100 permintaan/skenario, soak 10 detik
- **Berkas mentah:** `test-results/load-testing/load-results-2026-09-23T12-16-17-458Z.json` (+ `.csv`)

---

## 1. Temuan utama

Deployment berada di balik **proteksi tepi (edge) Vercel** yang **memblokir
lalu lintas burst/berfrekuensi tinggi dengan HTTP 403**. Bukti:

1. Percobaan awal 150 permintaan serentak langsung memblokir IP mesin penguji
   selama beberapa menit (100% respons 403).
2. Pada run terkontrol, blokir muncul lagi ketika **volume kumulatif** menumpuk
   (skenario LT.5 dan seterusnya seluruhnya 403).
3. Login dengan kredensial benar yang mestinya `200` berubah jadi `403`, dan GET
   tanpa token yang mestinya `401` juga jadi `403` — ciri khas blokir di lapisan
   **edge/firewall**, bukan respons normal aplikasi.

➡️ **Ini sinyal positif dari sisi ketahanan**: platform otomatis memitigasi
trafik abusif / brute-force. Konsekuensinya, **kapasitas sebenarnya aplikasi
tidak dapat diukur penuh** dari satu IP terhadap deployment produksi ini.

---

## 2. Angka nyata (sebelum blokir aktif) — VALID

| Skenario | Sukses | Throughput | Latensi avg | p95 | Catatan |
|---|---|---|---|---|---|
| LT.1 Login (paced, konk 5) | 80/80 (0%) | 5 req/s* | 773 ms | **1222 ms** | Login berat (hash + DB), 0,3–1,4 dtk |
| LT.2 Read round-robin (konk 5) | 100/100 (0%) | 23 req/s | 104 ms | 151 ms | `/opd /kader /admin/relawan /admin/logs` |
| LT.3 `/opd` konk 5 | 30/30 (0%) | 26 req/s | 83 ms | 106 ms | — |
| LT.3 `/opd` konk 10 | 30/30 (0%) | 46 req/s | 94 ms | 167 ms | throughput puncak |
| LT.3 `/opd` konk 20 | 30/30 (0%) | 35 req/s | 136 ms | **477 ms** | mulai jenuh (p95 naik, throughput turun) |
| LT.4 Frontend `GET /` | 97/100 (3%) | 34 req/s | 42 ms | 54 ms | tercepat (CDN/statis) |

\*Throughput LT.1 rendah karena dibatasi pacing 200 ms, **bukan** batas server.

**Interpretasi:**

- **Endpoint baca sehat**: p95 ~100–170 ms pada konkurensi wajar.
- **Titik jenuh** mulai terlihat pada konkurensi 20 (p95 melonjak ke ~477 ms,
  throughput turun dari 46 → 35 req/s).
- **Login endpoint termahal** (ratusan ms s.d. ~1,2 dtk) — wajar karena verifikasi
  kata sandi (bcrypt) + query basis data.
- **Frontend statis paling ringan** (~40 ms), dilayani CDN Vercel.

---

## 3. Bagian yang terblokir (BUKAN kegagalan aplikasi)

| Skenario | Sukses | Status | Keterangan |
|---|---|---|---|
| LT.5 Stress konk 3 | 26/40 (65%) | 200:26 403:14 | transisi blokir mulai |
| LT.5 Stress konk 5 | 12/40 (30%) | 200:12 403:28 | blokir meluas |
| LT.5 Stress konk 8 | 0/40 (0%) | 403:40 | terblokir penuh |
| LT.6 Spike (semua fase) | 0 | 403 | IP sudah diblokir |
| LT.7 Soak 10s | 0/314 | 403:314 | IP sudah diblokir |

Latensi pada baris-baris ini adalah latensi **respons penolakan 403 dari edge**,
jadi tidak mencerminkan performa aplikasi.

---

## 4. Batasan metodologis

1. Uji dari **satu IP** terhadap **produksi ber-proteksi-edge** → yang sebagian
   besar teruji adalah **rate-limiter Vercel**, bukan kapasitas aplikasi/DB.
2. **Tier gratis serverless** → cold start & batas konkurensi rendah.
3. Playwright **satu event loop (Node)** → bukan pengukur beban tinggi yang
   akurat; untuk itu gunakan skrip k6 pendamping (`k6/loadTest.k6.js`).

### Cara memperoleh angka kapasitas yang valid

Jalankan terhadap instance **lokal/staging tanpa proteksi edge**:

```bash
# 1. Jalankan backend lokal (butuh DATABASE_URL / DB ter-seed)
#    lihat: website_relawan_bappeda_container_docker/Integrasi Frontend dan Backend
#    buat .env berisi DATABASE_URL, lalu:  pnpm dev:server   (server di :3000)

# 2. Arahkan load test ke localhost
VITE_API_URL=http://localhost:3000/api \
  npx playwright test performance/loadTesting.spec.ts --project=chromium
```

Alternatif: naikkan/loloskan rate limit untuk IP penguji, atau gunakan beban
terdistribusi (mis. k6 Cloud).

---

## 5. Kesimpulan

Pada beban wajar, **endpoint baca dan frontend responsif serta stabil** (p95
~40–170 ms), **login adalah endpoint termahal** (~0,3–1,2 dtk), dan **platform
aktif memblokir burst** sebagai mitigasi bawaan. Angka absolut di sini bersifat
**informasional**, bukan sertifikasi SLA, dan tidak masuk laporan skripsi.
