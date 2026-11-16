import { expect, type Locator, type Page } from "@playwright/test";

export const THINK_TIME = Number(process.env.THINK_TIME_MS ?? 1200);

export const LOAD_TIME = Number(process.env.LOAD_TIME_MS ?? 10000);

export const TEST_TIMEOUT = 120_000;

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
