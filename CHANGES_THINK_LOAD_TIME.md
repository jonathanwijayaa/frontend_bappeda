# Perubahan: Think Time & Load Time + Pseudocode Pengujian

Branch: `feat/think-load-time` (dari `testing` @ `5bdf9c8`). Belum di-push atau di-merge.

| Commit | Isi |
|---|---|
| `93f9f24` | Bagian 1: think time & load time di config, helper, dan spec |
| `d02a1be` | Bagian 2: pseudocode (`docs/pseudocode/`) dan skrip pengecek |
| `a25377a` | Perbaikan: `playwright.config.ts` tidak lagi meng-import dari `src/` (error IDE tsconfig) |
| `7667b49` | Perbaikan: durasi mengetik di autocomplete tidak dihitung ke LOAD_TIME |
| (commit Bagian 3) | Laporan ini, `results/`, `scripts/rerun.ps1`, `scripts/summarize-rerun.mjs` |

Nilai yang dipakai (final, sesuai skripsi): **THINK_TIME = 1200 ms**, **LOAD_TIME = 10000 ms**, **retries = 0**.

---

## 1. File yang diubah

### Baru

| File | Isi |
|---|---|
| `src/helpers/timing.helper.ts` | Konstanta `THINK_TIME`, `LOAD_TIME`, `TEST_TIMEOUT`, `SERIAL_TEST_TIMEOUT`; `think()`; wrapper aksi + think (`clickThink`, `fillThink`, `typeThink`, `selectThink`, `uploadThink`, `checkThink`, `pressThink`, `hoverThink`); penantian `waitLoaded()` / `waitUrl()` dengan pesan `Melebihi LOAD_TIME (10 s): <kondisi>`; JSDoc berisi referensi |
| `docs/pseudocode/00_umum.md` … `15_sqli-api.md`, `pseudocode.json` | Pseudocode Bab IV dan Lampiran A |
| `scripts/pseudocode-lib.mjs`, `build-pseudocode.mjs`, `check-pseudocode.mjs` | Pembangkit `pseudocode.json` dan pengecek (baris ≤ 72, karakter, cakupan TC-ID) |
| `scripts/rerun.ps1` | Eksekusi ulang 527 test (1 lalu 10 worker) ke `results/<tanggal>-<n>-worker/` |
| `scripts/summarize-rerun.mjs` | Membangkitkan `results/RINGKASAN_RERUN.md` dari `results.json` |

### Diubah

| File | Ringkasan |
|---|---|
| `playwright.config.ts` | `expect.timeout`, `use.actionTimeout`, `use.navigationTimeout` = LOAD_TIME; `retries: 0`; `timeout: 120 s` |
| `loginBAPPEDA.helper.ts` | Tunggu form login tampil, think setelah isi NIK, isi password, dan klik Masuk; tunggu tombol Masuk aktif (maks LOAD_TIME) |
| `formOPD.helper.ts` | Think setelah setiap field |
| `formKader.helper.ts` | Think setelah setiap field dan aksi autocomplete OPD; timeout 10 s / 20 s → LOAD_TIME |
| `formRelawan.helper.ts` | Think setelah setiap field, klik, dan pilihan; **loop retry autocomplete dan simpan dihapus**; timeout → LOAD_TIME |
| `formSuratKeputusan.helper.ts` | Think setelah setiap aksi; **4 loop retry dan pengisian ulang dihapus**; timeout → LOAD_TIME |
| `submitPengajuan.helper.ts` | Think pada aksi di context Relawan; timeout → LOAD_TIME |
| 12 spec fungsional + `security/sqlInjection.spec.ts` | Aksi langsung → wrapper think; timeout hardcode → LOAD_TIME; `test.describe.configure({ timeout })` per file dihapus (memakai config) |
| `security/sqlInjectionApi.spec.ts` | **Hanya** `timeout: LOAD_TIME` pada request context (tanpa think time) |

Tidak disentuh: `security/xss.spec.ts`, `security/accessControl.spec.ts`, `performance/*`, `screenshot-ui.spec.ts`. Catatan: `xss` dan `screenshot-ui` memanggil `loginBAPPEDA`, jadi think time saat login ikut berlaku di sana.

**Yang tidak diubah:** judul test (format `TCXX.n …`), jumlah variasi data, dan assertion. Satu-satunya perubahan pada baris `expect` di spec adalah nilai timeout-nya. Daftar test tetap 593 (527 pada cakupan baseline).

**Aturan penerapan:**
- Think time diberikan **setelah** aksi pengguna: fill, click, check, selectOption, setInputFiles, press, hover, ketik per karakter, dan pilih opsi autocomplete.
- Navigasi langsung (`goto`, `goBack`, `reload`) adalah langkah penyiapan atau akses URL, sehingga tidak diberi think time.
- Pengosongan field sebelum mengetik ulang di autocomplete (`fill("")`) dianggap bagian dari aksi ketik yang sama.

---

## 2. Isi akhir `timing.helper.ts` dan diff `playwright.config.ts`

### `src/helpers/timing.helper.ts`

```ts
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Think time: jeda tetap SETELAH setiap aksi pengguna (isi, klik, pilih,
 * unggah, centang, tekan tombol, pilih opsi autocomplete).
 *
 * Fungsinya meniru jeda berpikir pengguna nyata, BUKAN alat sinkronisasi.
 * Sinkronisasi hanya lewat penantian berbasis kondisi (lihat LOAD_TIME).
 *
 * Dasar nilai 1,2 s:
 * - Operator mental Keystroke-Level Model = 1,35 s
 *   (Card, Moran & Newell, 1980, "The Keystroke-Level Model for User
 *   Performance Time with Interactive Systems").
 * - Nilai praktis 1,2 s untuk operator mental pada model KLM/GOMS
 *   (Kieras, 2001, "Using the Keystroke-Level Model to Estimate Execution
 *   Times").
 *
 * Bisa ditimpa lewat env THINK_TIME_MS (mis. 0 untuk debugging lokal).
 */
export const THINK_TIME = Number(process.env.THINK_TIME_MS ?? 1200);

/**
 * Load time: batas MAKSIMUM penantian eksplisit sebuah kondisi (URL tujuan,
 * elemen tampil, tabel terisi, notifikasi muncul, respons API).
 *
 * Dasar nilai 10 s:
 * - Batas perhatian pengguna 10 s (Nielsen, 1993, "Usability Engineering",
 *   bab 5 "Response Times: The 3 Important Limits").
 * - Jauh di atas toleransi tunggu 2 s (Nah, 2004, "A study on tolerable
 *   waiting time: how long are Web users willing to wait?") dan ambang LCP
 *   "buruk" 4 s (Google web.dev, Core Web Vitals), sehingga kegagalan karena
 *   LOAD_TIME benar-benar menandakan aplikasi terlalu lambat.
 *
 * Kegagalan valid terjadi bila (1) hasil aktual ≠ hasil yang diharapkan, atau
 * (2) kondisi yang diharapkan tidak terpenuhi dalam LOAD_TIME setelah
 * aksi + think time.
 *
 * Bisa ditimpa lewat env LOAD_TIME_MS.
 * Nilai yang sama ditulis ulang di playwright.config.ts (lihat catatan di sana).
 */
export const LOAD_TIME = Number(process.env.LOAD_TIME_MS ?? 10000);

/**
 * Batas waktu satu test. Dihitung dari test terpanjang, TCDR.12 Super Admin:
 * ±36 aksi × THINK_TIME 1,2 s ≈ 43 s, ditambah pengetikan per karakter
 * (pressSequentially 80 ms) ±8 s dan penantian kondisi yang normalnya
 * 1–3 s per langkah (±25 s) → ±76 s. Dibulatkan ke 120 s supaya satu-dua
 * penantian yang mendekati LOAD_TIME tidak menggagalkan test karena batas
 * test, melainkan karena LOAD_TIME-nya sendiri.
 */
export const TEST_TIMEOUT = 120_000;

/**
 * Batas waktu blok serial TCDR.32–35. Tiap test login di dua context
 * (admin + relawan) dan bisa membuat pengajuan baru lewat akun relawan:
 * ±22 aksi × 1,2 s ≈ 26 s per siklus, hingga dua siklus pengajuan ditambah
 * reload halaman → ±110 s. Dibulatkan ke 180 s.
 */
export const SERIAL_TEST_TIMEOUT = 180_000;

const detik = (ms: number) => `${ms / 1000} s`;

/** Pesan error standar bila kondisi tidak terpenuhi dalam LOAD_TIME. */
export const pesanLoadTime = (kondisi: string) =>
  `Melebihi LOAD_TIME (${detik(LOAD_TIME)}): ${kondisi}`;

/** Jeda berpikir pengguna setelah sebuah aksi. */
export const think = (page: Page) => page.waitForTimeout(THINK_TIME);

// ── Aksi pengguna + think time ───────────────────────────────────────────

export const clickThink = async (locator: Locator, options?: Parameters<Locator["click"]>[0]) => {
  await locator.click(options);
  await think(locator.page());
};

export const fillThink = async (locator: Locator, value: string) => {
  await locator.fill(value);
  await think(locator.page());
};

/**
 * Mengetik per karakter (dipakai field autocomplete yang memfilter saat diketik).
 *
 * Durasi mengetik itu sendiri (jumlah karakter × delay) adalah perilaku pengguna,
 * bukan waktu tunggu aplikasi, sehingga tidak boleh menghabiskan LOAD_TIME.
 * Contoh: nama OPD 90 karakter × 80 ms = 7,2 s hanya untuk mengetik.
 */
export const typeThink = async (locator: Locator, value: string, delay = 80) => {
  await locator.pressSequentially(value, { delay, timeout: LOAD_TIME + value.length * delay });
  await think(locator.page());
};

export const selectThink = async (
  locator: Locator,
  value: Parameters<Locator["selectOption"]>[0],
) => {
  await locator.selectOption(value);
  await think(locator.page());
};

export const uploadThink = async (
  locator: Locator,
  files: Parameters<Locator["setInputFiles"]>[0],
) => {
  await locator.setInputFiles(files);
  await think(locator.page());
};

export const checkThink = async (locator: Locator) => {
  await locator.check();
  await think(locator.page());
};

export const pressThink = async (locator: Locator, key: string) => {
  await locator.press(key);
  await think(locator.page());
};

export const hoverThink = async (locator: Locator) => {
  await locator.hover();
  await think(locator.page());
};

// ── Penantian eksplisit (maks LOAD_TIME) ─────────────────────────────────

type KondisiElemen = "visible" | "hidden" | "enabled";

/**
 * Menunggu elemen mencapai kondisi tertentu, paling lama LOAD_TIME.
 * Bila terlampaui, test gagal dengan pesan "Melebihi LOAD_TIME (10 s): …".
 */
export const waitLoaded = async (
  locator: Locator,
  kondisi: string,
  state: KondisiElemen = "visible",
) => {
  const pesan = pesanLoadTime(kondisi);

  if (state === "hidden") {
    await expect(locator, pesan).toBeHidden({ timeout: LOAD_TIME });
  } else if (state === "enabled") {
    await expect(locator, pesan).toBeEnabled({ timeout: LOAD_TIME });
  } else {
    await expect(locator, pesan).toBeVisible({ timeout: LOAD_TIME });
  }
};

/** Menunggu URL halaman cocok dengan pola tujuan, paling lama LOAD_TIME. */
export const waitUrl = async (page: Page, url: RegExp, kondisi: string) => {
  await expect(page, pesanLoadTime(kondisi)).toHaveURL(url, { timeout: LOAD_TIME });
};
```

### Diff `playwright.config.ts` (terhadap `5bdf9c8`)

```diff
diff --git a/playwright.config.ts b/playwright.config.ts
index c12432d..2ebcef1 100644
--- a/playwright.config.ts
+++ b/playwright.config.ts
@@ -2,6 +2,16 @@
 
 import { defineConfig, devices } from "@playwright/test";
 
+/*
+ * Nilai waktu pengujian. HARUS sama dengan src/helpers/timing.helper.ts
+ * (LOAD_TIME & TEST_TIMEOUT, beserta dasar acuannya). Tidak di-import dari
+ * sana karena config ini milik tsconfig.node.json (project composite):
+ * meng-import file dari src/ membuat file itu wajib terdaftar di project
+ * node dan bentrok dengan project utama (error TS6305).
+ */
+const LOAD_TIME = Number(process.env.LOAD_TIME_MS ?? 10000);
+const TEST_TIMEOUT = 120_000;
+
 /**
  * Read environment variables from file.
  * https://github.com/motdotla/dotenv
@@ -14,6 +24,10 @@ import { defineConfig, devices } from "@playwright/test";
  * See https://playwright.dev/docs/test-configuration.
  */
 export default defineConfig({
+  /* Penantian assertion (expect) dibatasi LOAD_TIME, lihat timing.helper.ts */
+  expect: {
+    timeout: LOAD_TIME,
+  },
   /* Fail the build on CI if you accidentally left test.only in the source code. */
   forbidOnly: !!process.env.CI,
   /* Run tests in files in parallel */
@@ -58,11 +72,17 @@ export default defineConfig({
   ],
   /* Reporter to use. See https://playwright.dev/docs/test-reporters */
   reporter: "html",
-  /* Retry on CI only */
-  retries: process.env.CI ? 2 : 0,
+  /* Tanpa pengulangan: kegagalan tidak boleh tersamarkan oleh retry */
+  retries: 0,
   testDir: "./src/tests",
+  /* Batas waktu satu test, sudah memperhitungkan think time (lihat TEST_TIMEOUT) */
+  timeout: TEST_TIMEOUT,
   /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
   use: {
+    /* Aksi & navigasi dibatasi LOAD_TIME */
+    actionTimeout: LOAD_TIME,
+    navigationTimeout: LOAD_TIME,
+
     /* Base URL to use in actions like `await page.goto('')`. */
     // baseURL: 'http://localhost:3000',
```

`LOAD_TIME` dan `TEST_TIMEOUT` ditulis ulang di config, tidak di-import. `playwright.config.ts` milik project composite `tsconfig.node.json`, sehingga meng-import file dari `src/` memicu error IDE ("File … is not listed within the file list of project tsconfig.node.json"). Kalau file itu didaftarkan ke project node, project utama bentrok (TS6305). Nilai di kedua tempat harus dijaga tetap sama.

Catatan: baris `workers: process.env.CI ? 10 : undefined` di working tree adalah perubahan Anda sendiri dan belum ikut di-commit.

---

## 3. Contoh kode sebelum / sesudah

### a. `loginBAPPEDA` (helper; otomatis berlaku di semua spec)

Sebelum:

```ts
export const loginBAPPEDA = async ({ NIK, page, password }: ILoginBAPPEDA) => {
  await page.getByRole("textbox", { name: "NIK" }).fill(NIK);
  await page.getByRole("textbox", { name: "Password" }).fill(password);

  const loginButton = page.getByRole("button", { name: "Masuk" });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
};
```

Sesudah:

```ts
export const loginBAPPEDA = async ({ NIK, page, password }: ILoginBAPPEDA) => {
  const nikField = page.getByRole("textbox", { name: "NIK" });
  await waitLoaded(nikField, "form login tampil");

  await fillThink(nikField, NIK);
  await fillThink(page.getByRole("textbox", { name: "Password" }), password);

  const loginButton = page.getByRole("button", { name: "Masuk" });
  await waitLoaded(loginButton, 'tombol "Masuk" aktif', "enabled");
  await clickThink(loginButton);
};
```

### b. Test smoke TCL.1 (`auth/login.spec.ts`)

Badan test **tidak berubah**:

```ts
test(`TCL.1 ${kasus.label} Login`, async ({ page }) => {
  await loginBAPPEDA({ NIK: kasus.creds.NIK, page, password: kasus.creds.password });

  await expect(page).toHaveURL(kasus.tujuan);
});
```

Perilakunya berubah lewat dua jalur. Pertama, `loginBAPPEDA` (poin a) kini memberi 3 × think time dan menunggu form serta tombol dengan batas LOAD_TIME. Kedua, `toHaveURL` sebelumnya memakai batas bawaan Playwright 5 s, sekarang memakai `expect.timeout = LOAD_TIME` (10 s) dari config. Jadi TCL.1 gagal bila halaman tujuan tidak tercapai dalam 10 s setelah klik Masuk + think time.

### c. Test EP/BVA TCDR.6 (`data relawan/dataRelawan.spec.ts`)

Sebelum:

```ts
await form.fillAll();
await page.getByRole("button", { name: /simpan/i }).click();
// ...
await expect(page.getByText(nameCase.expectedMessage)).toBeVisible({
  timeout: 12000,
});
```

Sesudah:

```ts
await form.fillAll(); // kini: think setelah tiap field, autocomplete tanpa retry
await clickThink(page.getByRole("button", { name: /simpan/i }));
// ...
await expect(page.getByText(nameCase.expectedMessage)).toBeVisible({
  timeout: LOAD_TIME,
});
```

Daftar kasus (5 variasi EP/BVA) dan assertion-nya tetap sama.

Di dalam `fillAll()`, pemilihan Kelurahan, OPD, dan Kader sebelumnya diulang hingga 3 kali bila opsi belum muncul. Untuk Kader, OPD juga dipilih ulang. Sekarang pemilihan dilakukan satu kali: field ditunggu aktif, diklik, diketik, lalu opsi ditunggu maksimal LOAD_TIME dan dipilih. Setiap langkah diikuti think time.

---

## 4. Yang diganti

### 4.1 `waitForTimeout` sebagai sinkronisasi

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| `dashboard.spec.ts` › `hoverDonutRing` | `waitForTimeout(300)` × 2 di dalam loop 8 percobaan dan 4 arah kursor | Tunggu label persentase donut tampil (Recharts merendernya setelah animasi selesai; maks LOAD_TIME) → kursor ke sektor pertama → think → `expect.poll` sampai tooltip berisi teks (maks LOAD_TIME) |

Di spec yang dikecualikan (`xss.spec.ts` 2×, `screenshot-ui.spec.ts` 2×), `waitForTimeout` dibiarkan sesuai instruksi.

### 4.2 Timeout hardcode → LOAD_TIME

| File | Nilai lama |
|---|---|
| `dashboard.spec.ts` | 30000 (beforeEach), 30000 (TCD.12), 10000 (TCD.7) |
| `dataRelawan.spec.ts` | 10000 (beforeEach `toHaveURL`), 12000 (TCDR.6); `describe.configure` 90_000 dihapus; blok serial 120_000 → `SERIAL_TEST_TIMEOUT` 180 s |
| `daftarKader.spec.ts` | 30_000 (beforeEach), 30_000 (TCDK.10), 20_000 × 2 (TCDK.24); `describe.configure` 120_000 dihapus |
| `manajemenOPD.spec.ts` | 20_000 (`tungguTabel`), 20_000 × 2 (TCMO.31); `test.setTimeout(90_000)` dihapus |
| `logAktifitas.spec.ts` | 30_000 × 2; `describe.configure` 90_000 dihapus |
| `profil.spec.ts` | 30_000 × 2, 15_000 × 2, 20_000 × 5; `describe.configure` 90_000 dihapus |
| `riwayatRelawan.spec.ts` | 30_000 × 4, 15_000, 10_000 × 2; `describe.configure` 90_000 dihapus |
| `saranHotline.spec.ts` | 15_000 |
| `stastistik.spec.ts` | 30_000 |
| `suratKeputusan.spec.ts` | 20_000 |
| `dokumen.spec.ts` | 15_000 (tunggu unduhan); `describe.configure` 90_000 dihapus |
| `sqlInjection.spec.ts` | 30_000 × 2; `describe.configure` 90_000 dihapus |
| `formKader.helper.ts` | 10_000 × 2, 20_000 |
| `formRelawan.helper.ts` | 10000 × 4, 15000, 5000, 3000 |
| `formSuratKeputusan.helper.ts` | 5000 × 3, 10000, 15000 × 2 |
| `submitPengajuan.helper.ts` | 15_000, 10_000 |
| `waitForEvent("download")` (OPD, Kader, SK) | sebelumnya tanpa batas eksplisit → LOAD_TIME |

### 4.3 Loop percobaan ulang (dihapus atas persetujuan Anda)

| Lokasi | Perilaku lama | Sekarang |
|---|---|---|
| `formRelawan` › `selectAutocompleteOption` (Kelurahan, OPD, Kader) | Ketik ulang hingga 3×; untuk Kader juga memilih ulang OPD | Satu kali ketik, opsi ditunggu maks LOAD_TIME |
| `formRelawan` › `submitButton` | Klik Simpan hingga 3× (tidak dipakai spec mana pun) | Satu klik, tunggu tertutup maks LOAD_TIME |
| `formSuratKeputusan` › `ensureTextboxValue` | Isi ulang field hingga 3× bila nilainya hilang | Dihapus; `expectFillALL` memeriksa nilai dengan `toHaveValue` saja |
| `formSuratKeputusan` › `ensureFileAttached` | Lampirkan ulang file PDF hingga 3× | `attachFile`: satu kali unggah, tunggu nama file tampil maks LOAD_TIME |
| `formSuratKeputusan` › `selectOPDOption` | Ketik ulang OPD hingga 3× | Satu kali ketik |
| `formSuratKeputusan` › `submitButton` | Hingga 3× klik; bila form ter-reset, isi ulang seluruh form lalu coba lagi | Satu klik; bila muncul `alert` penolakan, test gagal dengan pesan `Form SK ditolak aplikasi: …` |
| `formSuratKeputusan` › `expectFillALL` | Mencentang kader bila ternyata belum tercentang | Hanya memeriksa `toBeChecked` |
| `riwayatRelawan.spec.ts` › `bacaOpsiSelect` | Buka-tutup popup berulang (poll 15 s) sampai opsi termuat | Buka satu kali, tunggu jumlah opsi terpenuhi maks LOAD_TIME (opsi dirender langsung dari props, `Select.tsx`) |
| `dashboard.spec.ts` › `hoverDonutRing` | 8 percobaan arah kursor | Lihat 4.1 |

**Dipertahankan:** loop di `submitPengajuan.helper.ts` › `ensurePengajuanExists`, maksimal 3×. Loop ini menyiapkan data, yaitu membuat pengajuan baru bila pengajuan "Menunggu" sudah dipakai test atau worker lain. Ini bukan pengulangan verifikasi.

---

## 5. Timeout per test

| Lingkup | Nilai | Alasan |
|---|---|---|
| Semua test (`config.timeout`) | **120 s** | Test terpanjang: TCDR.12 Super Admin, ± 36 aksi × 1,2 s ≈ 43 s, ditambah pengetikan per karakter ± 8 s dan penantian kondisi normal 1–3 s per langkah ± 25 s, sehingga ± 76 s. Dibulatkan ke 120 s supaya kegagalan muncul karena LOAD_TIME, bukan karena batas test. |
| Blok serial TCDR.32–35 | **180 s** | Login di dua context (admin + relawan), ± 22 aksi × 1,2 s ≈ 26 s per siklus pengajuan, hingga 2 siklus ditambah reload halaman ± 110 s. Dibulatkan ke 180 s. |

Pada run 21 Okt hanya satu test yang mencapai batas 120 s: TCDR.29 OPD (132 s), yang juga gagal karena notifikasi tidak muncul dalam LOAD_TIME (lihat `results/RINGKASAN_RERUN.md` 5.1 D).

---

## 6. Ringkasan hasil eksekusi ulang

Rincian lengkap ada di [`results/RINGKASAN_RERUN.md`](results/RINGKASAN_RERUN.md). Status: **sementara**.

- **1 worker (21 Okt 2026, laptop pengganti i7-5600U, 2 core / 4 thread, RAM 16 GB):** 527 test → 490 lulus, 22 gagal, 9 skip, 6 tidak dijalankan (TCDR.33–35 × 2). Durasi 148m12s, sedangkan baseline 28m57s; kenaikannya terutama dari think time. Durasi **tidak sebanding langsung** karena perangkatnya berbeda.
- **10 worker:** belum ada hasil. Run terhenti di awal karena sesi tertutup.
- Dari 22 kegagalan:
  - 12 karena templat Excel Kader/Relawan tidak ada di laptop pengganti (diabaikan `.gitignore`).
  - 6 artefak pengetikan, sudah diperbaiki di `7667b49`.
  - 2 TCDR.32 karena cacat skrip helper pengajuan yang sudah ada sejak baseline.
  - **2 kegagalan valid:** TCD.3 Super Admin (melebihi LOAD_TIME) dan TCDR.29 OPD (perlu verifikasi manual).
- Dibanding baseline: TCDR.6, TCDR.8, TCDR.11, dan TCSH.1 **kini lulus**. TCDR.32 tetap gagal. TCDR.35 tidak dijalankan. TCDR.17 gagal karena sebab lingkungan, sehingga tidak sebanding.

**Sebelum run final:** pulihkan kedua templat Excel, putuskan perbaikan helper pengajuan (lihat 7.2), lalu jalankan `scripts/rerun.ps1` di laptop baseline.

---

## 7. Catatan

### 7.1 TC yang judul atau isinya tidak sesuai dokumen kasus uji

| TC | Catatan |
|---|---|
| **TCDK.7** | Di sheet kasus uji berjudul "invalid Status", tetapi skrip menguji **NIK PIC** tidak valid (kosong, terlalu pendek, berhuruf, karakter spesial, > 16 digit). Form Tambah Kader tidak punya field Status yang bisa diisi. |
| **TCS.2 / TCS.3 ↔ TCD.9 / TCD.10** | Halaman Statistik sudah dihapus dan grafiknya pindah ke Dashboard. Pemetaannya **bersilang**: TCS.2 (jumlah relawan per kader) → **TCD.10**, TCS.3 (demografi kelurahan) → **TCD.9**. TCS.1 → TCD.3, TCS.4 → TCD.11. TCS.5 (collapse grafik) tidak punya padanan. Modul Statistik kini hanya berisi TCS.0. |
| TCSH.1-2, TCSH.3-4 | Varian Super Admin memakai rentang ID di judulnya ("TCSH.1-2 Super Admin views the Hotline information"). Isinya memeriksa panel pengelolaan, bukan tautan telepon/WA atau form kirim saran. |
| TCSK.3.0 / 3.1 / 3.2 | TCSK.3 dipecah menjadi tiga sub-ID (kata kunci OPD, judul SK, nomor SK). |
| TCDR.2 | Judul "click Ajukan Relawan Baru button", tetapi tombol yang diklik "Tambah Relawan". |
| TCDR.13 | Judul "select Peran", tetapi yang diisi field "Penugasan" (teks bebas). |
| TCMO.15 | Dikelompokkan bersama TCMO.24–28 (pencarian). Nomor TCMO.16–23 tidak ada di skrip. |
| Tidak diotomasi | TCL.7 (tidak ada fitur pendaftaran), TCMO.7 (skrip status dinonaktifkan), TCMO.16–23 (tidak ada di skrip), TCDR.14 / TCDR.30 / TCDR.31 (skrip dikomentari), TCLA.10 (belum ada tombol ekspor). Di pseudocode ditulis `// … tidak diotomasi: <alasan>`. Bila TC tersebut memang dieksekusi manual, ganti menjadi `dieksekusi manual`. |

### 7.2 Temuan yang perlu keputusan

1. **Helper `submitPengajuan` tidak mengisi Alamat Baru dan No. HP Baru.** Locator `getByRole("textbox", { name: /alamat/i })` dan `/nomor hp/i` tidak cocok lagi, karena nama aksesibel field di modal sekarang adalah placeholder. Akibatnya pengajuan hanya berisi catatan dan tidak pernah terkirim. Inilah penyebab TCDR.32 gagal dan TCDR.33–35 tidak berjalan, baik di baseline maupun di run ini. Usulan: cari field lewat label-nya, seperti `modalField()` di `profil.spec.ts`. Belum saya ubah karena ini mengubah logika helper.
2. **Templat Excel.** `Template_Data_Kader.xlsx` dan `Template_Data_Relawan.xlsx` diabaikan `.gitignore` (`src/assets/files/*.xlsx`), sehingga tidak ada di clone baru. Usulan: tambahkan pengecualian `!src/assets/files/Template_Data_*.xlsx` dan commit kedua berkas.

### 7.3 Pseudocode

- `node scripts/check-pseudocode.mjs` → **BERSIH**: semua baris ≤ 72 karakter, karakter non-ASCII hanya `← ≠ × –`, `pseudocode.json` sinkron, dan TC-ID di 15 modul cocok dengan judul test.
- `.md` adalah sumber. Setelah mengedit, jalankan `node scripts/build-pseudocode.mjs` lalu `check-pseudocode.mjs`.
- Kata kerja tambahan yang dipakai di luar daftar wajib: `TEKAN`, `ARAHKAN KURSOR`, `MUAT ULANG`, `LEWATI TEST`, `PANTAU`, `GAGALKAN`, `KEMBALI`, `TUTUP`, `KEMBALIKAN`, `BERHENTI`.
- `≥` / `≤` tidak termasuk karakter yang diizinkan, jadi ditulis `>=` / `<=`.

### 7.4 Verifikasi

- `npx tsc --noEmit`: 29 error, **semuanya sudah ada sebelumnya** di kode aplikasi React (`src/components`, `src/hooks`, `src/context`). Tidak ada error di `src/tests`, `src/helpers`, atau config. `tsc -p tsconfig.node.json`: bersih.
- ESLint dan Prettier (lefthook pre-commit): lulus.
- `npx playwright test --list`: 593 test, judul tidak berubah.
