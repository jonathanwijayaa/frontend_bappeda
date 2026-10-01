/// <reference types="node" />
import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, Page, request as playwrightRequest, test } from "@playwright/test";

/**
 * Security Testing — Cross-Site Scripting (XSS, OWASP A03: Injection)
 *
 * Menguji bahwa aplikasi TIDAK mengeksekusi markup/script yang disisipkan
 * pengguna. Pengujian DEFENSIF terhadap sistem sendiri: setiap test memastikan
 * payload diperlakukan sebagai TEKS (di-escape), bukan HTML/JS yang dijalankan.
 *
 * Deteksi utama: pendengar `dialog` global. Jika ada payload yang berhasil
 * mengeksekusi `alert()`, dialog akan muncul dan test langsung gagal. Selain
 * itu diperiksa bahwa elemen sisipan (mis. <img onerror>, <script>) TIDAK
 * pernah benar-benar terbentuk di DOM.
 */
test.describe.configure({ timeout: 90_000 });

const BASE_URL = "https://frontend-bappeda.vercel.app/";
const API_BASE =
  process.env.VITE_API_URL?.replace(/\/$/, "") ?? "https://backend-skripsi-relawan.vercel.app/api";

// Payload XSS umum: script, atribut event via <img>/<svg>, dan pemutus atribut.
const XSS_PAYLOADS = [
  "<script>alert('xss')</script>",
  "<img src=x onerror=alert('xss')>",
  "<svg onload=alert('xss')>",
  "\"><script>alert('xss')</script>",
  "javascript:alert('xss')",
  "<body onload=alert('xss')>",
  "'><img src=x onerror=alert(document.cookie)>",
];

// Memasang deteksi eksekusi JS. Bila payload benar-benar jalan, `alert()` akan
// memicu event dialog — kita catat dan test gagal.
const armXssDetector = (page: Page) => {
  const fired: string[] = [];
  page.on("dialog", async (dialog) => {
    fired.push(dialog.message());
    await dialog.dismiss().catch(() => undefined);
  });
  return fired;
};

// Cek tidak ada elemen berbahaya hasil sisipan yang terbentuk di DOM.
const expectNoInjectedNodes = async (page: Page) => {
  expect(await page.locator("img[src='x']").count(), "Elemen <img src=x> tersisip ke DOM").toBe(0);
  expect(
    await page.locator("script:has-text(\"alert('xss')\")").count(),
    "Elemen <script> tersisip ke DOM",
  ).toBe(0);
};

test.describe("Cross-Site Scripting (XSS)", () => {
  // ── TCXSS.1 Stored XSS — Saran/Hotline (end-to-end) ──────────────────────
  // Jalur nyata yang menyimpan teks bebas dari pengguna lalu menampilkannya ke
  // Super Admin. Relawan mengirim saran berisi payload; Super Admin membukanya.
  test("TCXSS.1 stored XSS in a Saran message is escaped, not executed", async ({ page }) => {
    const fired = armXssDetector(page);
    const marker = `XSSUJI${Date.now()}`;
    const pesan = `${marker} ${XSS_PAYLOADS.join(" ")}`;

    // Kirim saran berisi payload lewat API (sebagai relawan)
    const ctx = await playwrightRequest.newContext({ baseURL: API_BASE });
    const login = await ctx.post("/auth/login", {
      data: { nik: credentials.relawan.NIK, password: credentials.relawan.password },
    });
    const relToken = (await login.json()).token;
    const kirim = await ctx.post("/saran", {
      data: { pesan, subjek: `Uji Keamanan ${marker}` },
      headers: { Authorization: `Bearer ${relToken}` },
    });
    expect(kirim.status(), "Gagal mengirim saran uji").toBe(201);
    await ctx.dispose();

    // Super Admin membuka halaman Saran/Hotline dan mencari saran tadi
    await page.goto(BASE_URL);
    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });
    await expect(page).toHaveURL(/dashboard/);
    await page.getByRole("link", { name: /saran.*hotline/i }).click();
    await expect(page).toHaveURL(/saran-hotline/);

    await page.getByPlaceholder(/cari nama, telepon, atau pesan/i).fill(marker);

    // Payload muncul sebagai TEKS (ter-escape), bukan tereksekusi
    await expect(page.getByText(new RegExp(marker)).first()).toBeVisible();
    await expectNoInjectedNodes(page);

    // Buka detail bila tersedia, pastikan tetap tidak tereksekusi
    const detail = page.getByRole("button", { name: /detail|lihat|balas|respon/i }).first();
    if (await detail.count()) {
      await detail.click().catch(() => undefined);
      await page.waitForTimeout(500);
      await expectNoInjectedNodes(page);
    }

    expect(fired, `alert() tereksekusi: ${fired.join(" | ")}`).toHaveLength(0);
  });

  // ── TCXSS.2 Reflected / DOM XSS — form login ─────────────────────────────
  test("TCXSS.2 XSS payloads in the login form do not execute", async ({ page }) => {
    const fired = armXssDetector(page);
    await page.goto(BASE_URL);

    for (const payload of XSS_PAYLOADS) {
      await page.getByRole("textbox", { name: "NIK" }).fill(payload);
      await page.getByRole("textbox", { name: "Password" }).fill(payload);
      await page.getByRole("button", { name: "Masuk" }).click();
      await page.waitForTimeout(300);

      await expect(page).not.toHaveURL(/dashboard|profil-relawan/);
      await expectNoInjectedNodes(page);
    }

    expect(fired, `alert() tereksekusi: ${fired.join(" | ")}`).toHaveLength(0);
  });

  // ── TCXSS.3 Reflected / DOM XSS — kolom pencarian ────────────────────────
  const searchTargets = [
    { label: "Data Relawan", link: "Relawan", loading: /memuat data relawan/i },
    { label: "Daftar Kader", link: "Kader", loading: /memuat data kader/i },
  ];

  for (const target of searchTargets) {
    test(`TCXSS.3 ${target.label} search does not execute XSS`, async ({ page }) => {
      const fired = armXssDetector(page);

      await page.goto(BASE_URL);
      await loginBAPPEDA({
        NIK: credentials.superAdmin.NIK,
        page,
        password: credentials.superAdmin.password,
      });
      await expect(page).toHaveURL(/dashboard/);

      await page.getByRole("link", { name: target.link, exact: true }).click();
      await expect(page.getByText(target.loading)).toBeHidden({ timeout: 30_000 });

      const searchInput = page.getByPlaceholder(/cari/i).first();
      for (const payload of XSS_PAYLOADS) {
        await searchInput.fill(payload);
        await expect(page.getByRole("main")).toBeVisible();
        await expectNoInjectedNodes(page);
      }

      expect(fired, `alert() tereksekusi: ${fired.join(" | ")}`).toHaveLength(0);
    });
  }

  // ── TCXSS.4 Form input — payload ditolak / di-escape ─────────────────────
  test("TCXSS.4 XSS payload in the Kader name field is rejected safely", async ({ page }) => {
    const fired = armXssDetector(page);

    await page.goto(BASE_URL);
    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });
    await expect(page).toHaveURL(/dashboard/);

    await page.getByRole("link", { name: "Kader", exact: true }).click();
    await expect(page.getByText(/memuat data kader/i)).toBeHidden({ timeout: 30_000 });

    await page.getByRole("button", { name: "Tambah Kader Baru", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tambah Kader Baru" })).toBeVisible();

    // Isi Nama Kader dengan payload, lalu coba simpan
    await page
      .getByRole("textbox", { name: "Nama Kader atau komunitas" })
      .fill("<img src=x onerror=alert('xss')>");
    await page.getByRole("button", { name: "Simpan" }).click();

    // Payload tidak tereksekusi, tidak menjadi elemen di DOM, tidak tersimpan
    // (tidak ada notifikasi berhasil), dan modal tetap terbuka — ditolak.
    await expectNoInjectedNodes(page);
    await expect(page.getByText(/berhasil|success/i)).toBeHidden();
    await expect(page.getByRole("heading", { name: "Tambah Kader Baru" })).toBeVisible();
    // Nilai tetap tersimpan sebagai teks biasa di input, bukan diinterpretasi
    await expect(page.getByRole("textbox", { name: "Nama Kader atau komunitas" })).toHaveValue(
      "<img src=x onerror=alert('xss')>",
    );
    expect(fired, `alert() tereksekusi: ${fired.join(" | ")}`).toHaveLength(0);
  });
});
