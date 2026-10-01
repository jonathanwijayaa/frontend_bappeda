import { test, expect, Page } from "@playwright/test";
import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";

/**
 * Utilitas penangkap screenshot SEMUA halaman yang diuji, untuk figur skripsi.
 * Menghasilkan berkas PNG di folder `screenshots/` pada root proyek.
 *
 * Jalankan: npx playwright test screenshot-ui.spec.ts --project=chromium
 *
 * Catatan: login dilakukan seminimal mungkin (1x per peran) lalu berpindah
 * halaman via URL, supaya tidak memicu proteksi burst pada deployment.
 */

const BASE = "https://frontend-bappeda.vercel.app";
const OUT = "screenshots";

// Resolusi tinggi & rasio piksel 2x agar gambar tajam saat dicetak di skripsi.
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

async function login(page: Page, creds: { NIK: string; password: string }, landing: RegExp) {
  await page.goto(BASE + "/");
  await loginBAPPEDA({ NIK: creds.NIK, page, password: creds.password });
  await page.waitForURL(landing, { timeout: 30000 });
}

interface ShotOpts {
  table?: boolean;
  heading?: string;
  wait?: number;
}

/** Buka `path`, tunggu penanda halaman (resilient), lalu tangkap layar penuh. */
async function shot(page: Page, path: string, file: string, opts: ShotOpts = {}) {
  await page.goto(BASE + path);
  await expect(page).toHaveURL(new RegExp(path.replace(/^\//, "") + "$")).catch(() => {});

  // Tunggu penanda konten, tetapi jangan menggagalkan batch bila tidak muncul.
  try {
    if (opts.table) {
      await page.getByRole("table").first().waitFor({ state: "visible", timeout: 15000 });
    } else if (opts.heading) {
      await page
        .getByRole("heading", { name: opts.heading })
        .first()
        .waitFor({ state: "visible", timeout: 15000 });
    }
  } catch {
    /* tetap lanjut menangkap layar */
  }

  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(opts.wait ?? 1200);
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true });
}

// ── Halaman Login (tanpa autentikasi) ──────────────────────────────────────
test("Gambar 3.4 - Halaman Login", async ({ page }) => {
  await page.goto(BASE + "/");
  await expect(page.getByRole("button", { name: /masuk|login/i })).toBeVisible();
  await page.screenshot({ path: `${OUT}/gambar-3-4-login.png`, fullPage: true });
});

// ── Semua halaman peran Super Admin (mencakup Manajemen OPD & Log Aktivitas) ─
test("Halaman admin (Super Admin)", async ({ page }) => {
  test.setTimeout(240_000); // menangkap banyak halaman berurutan
  await login(page, credentials.superAdmin, /dashboard/);

  // Dashboard — tunggu grafik & donut gender selesai digambar
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.locator(".recharts-pie").first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/gambar-3-5-dashboard.png`, fullPage: true });

  await shot(page, "/manajemen-opd", "halaman-manajemen-opd.png", { table: true });
  await shot(page, "/daftar-kader", "halaman-daftar-kader.png", { table: true });
  await shot(page, "/data-relawan", "gambar-3-6-data-relawan.png", { table: true });
  await shot(page, "/surat-keputusan", "halaman-surat-keputusan.png", { table: true });
  await shot(page, "/log-aktifitas", "halaman-log-aktifitas.png", { table: true });
  await shot(page, "/dokumen", "halaman-dokumen.png", { wait: 1500 });
  await shot(page, "/histori-relawan", "halaman-riwayat-relawan.png", { table: true });
  await shot(page, "/saran-hotline", "halaman-saran-hotline.png", { heading: "Saran dan Hotline" });
  await shot(page, "/profil", "halaman-profil.png", { wait: 1500 });
});

// ── Halaman peran Relawan ──────────────────────────────────────────────────
test("Halaman Relawan", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page, credentials.relawan, /profil-relawan/);

  await shot(page, "/profil-relawan", "halaman-relawan-profil.png", { heading: "Informasi Pribadi" });
  await shot(page, "/komunitas-saya", "halaman-relawan-komunitas.png", { heading: "Penugasan Saya" });
  await shot(page, "/ubah-password", "halaman-relawan-ubah-password.png", { heading: "Ubah Kata Sandi" });
});
