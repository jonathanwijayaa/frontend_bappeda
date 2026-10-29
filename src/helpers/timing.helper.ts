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
