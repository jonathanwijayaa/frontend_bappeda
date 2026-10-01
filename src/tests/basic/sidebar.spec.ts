import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, Locator, Page, test } from "@playwright/test";

const roles = [
  { label: "Super Admin", creds: credentials.superAdmin, hasAdminMenu: true },
  { label: "OPD", creds: credentials.opd, hasAdminMenu: false },
] as const;

// Menu inti yang dimiliki kedua peran
const commonMenu = [
  "Dashboard",
  "Kader",
  "Relawan",
  "Surat Keputusan",
  "Dokumen",
  "Riwayat Relawan",
];
// Menu yang hanya dimiliki Super Admin
const adminOnlyMenu = ["Manajemen OPD", "Log Aktivitas"];

// Kontainer sidebar dikenali dari warna latar & tinggi layar penuh (struktural,
// bukan bergantung pada test-id yang tidak tersedia di aplikasi).
const sidebar = (page: Page): Locator => page.locator("div.bg-primary-green.h-screen").first();

// Tombol chevron ciut/bentang — dikenali dari atribut title-nya.
const toggleButton = (page: Page): Locator =>
  page.locator('button[title="Collapse Sidebar"], button[title="Expand Sidebar"]').first();

for (const role of roles) {
  test.describe(`Sidebar - ${role.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");
      await loginBAPPEDA({ NIK: role.creds.NIK, page, password: role.creds.password });
      await expect(page).toHaveURL(/dashboard/);
      await expect(sidebar(page)).toBeVisible();
    });

    // TCBP.1 Sidebar tampil dengan menu sesuai peran
    test(`TCBP.1 ${role.label} views the sidebar navigation menu`, async ({ page }) => {
      // Menu inti tampil untuk semua peran
      for (const label of commonMenu) {
        await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
      }
      // Tautan Saran/Hotline di footer sidebar
      await expect(page.getByRole("link", { name: "Saran/Hotline" })).toBeVisible();

      // Menu khusus Super Admin: tampil untuk Super Admin, tidak ada untuk OPD
      for (const label of adminOnlyMenu) {
        const link = page.getByRole("link", { name: label, exact: true });
        if (role.hasAdminMenu) {
          await expect(link).toBeVisible();
        } else {
          await expect(link).toHaveCount(0);
        }
      }
    });

    // TCBP.2 Ciutkan & bentangkan sidebar lewat tombol chevron
    test(`TCBP.2 ${role.label} collapses and expands the sidebar`, async ({ page }) => {
      const bar = sidebar(page);
      const toggle = toggleButton(page);

      // Kondisi awal: bentang (w-64)
      await expect(bar).toHaveClass(/w-64/);

      // Ciutkan → lebar berubah ke w-28
      await toggle.click();
      await expect(bar).toHaveClass(/w-28/);

      // Bentangkan kembali → lebar kembali ke w-64
      await toggle.click();
      await expect(bar).toHaveClass(/w-64/);
    });

    // TCBP.3 Status sidebar bertahan setelah reload (disimpan di localStorage)
    test(`TCBP.3 ${role.label} sidebar state persists after reload`, async ({ page }) => {
      const bar = sidebar(page);

      await expect(bar).toHaveClass(/w-64/);
      await toggleButton(page).click();
      await expect(bar).toHaveClass(/w-28/);

      // Reload — status ciut harus tetap dipertahankan
      await page.reload();
      await expect(sidebar(page)).toHaveClass(/w-28/);

      // Kembalikan ke bentang agar tidak memengaruhi kondisi berikutnya
      await toggleButton(page).click();
      await expect(sidebar(page)).toHaveClass(/w-64/);
    });

    // TCBP.4 Item menu sidebar mengarahkan ke halaman yang benar
    test(`TCBP.4 ${role.label} sidebar links navigate to the correct page`, async ({ page }) => {
      const targets = [
        { label: "Kader", url: /daftar-kader/ },
        { label: "Relawan", url: /data-relawan/ },
        { label: "Surat Keputusan", url: /surat-keputusan/ },
        { label: "Dokumen", url: /dokumen/ },
        { label: "Riwayat Relawan", url: /histori-relawan/ },
        { label: "Dashboard", url: /dashboard/ },
      ];

      for (const target of targets) {
        await page.getByRole("link", { name: target.label, exact: true }).click();
        await expect(page).toHaveURL(target.url);
      }
    });
  });
}
