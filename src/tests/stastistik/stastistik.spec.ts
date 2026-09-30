import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

/**
 * Halaman Statistik sudah DIHAPUS dari aplikasi: route /statistik dan menunya
 * di sidebar dikomentari (App.tsx & Sidebar.tsx), dan seluruh grafiknya
 * dipindah ke Dashboard. Pemetaan test case lama ke penggantinya:
 *
 *   TCS.1 Demografi gender          -> TCD.3  (dashboard.spec.ts)
 *   TCS.2 Jumlah relawan per kader  -> TCD.10 (dashboard.spec.ts)
 *   TCS.3 Demografi kelurahan       -> TCD.9  (dashboard.spec.ts)
 *   TCS.4 Jumlah kader per OPD      -> TCD.11 (dashboard.spec.ts)
 *   TCS.5 Tutup/collapse grafik     -> tidak ada padanannya; kartu Dashboard
 *                                      tidak bisa di-collapse.
 *
 * Yang tersisa di sini hanya memastikan halaman lamanya memang sudah tidak
 * bisa diakses, supaya kalau suatu saat dihidupkan lagi test ini yang pertama
 * memberi tahu dan TCS.1-5 perlu ditulis ulang.
 */
const roles = [
  { creds: credentials.superAdmin, label: "Super Admin" },
  { creds: credentials.opd, label: "OPD" },
] as const;

for (const { label, creds } of roles) {
  test(`TCS.0 ${label} no longer has a separate Statistik page`, async ({ page }) => {
    await page.goto("https://frontend-bappeda.vercel.app/");

    await loginBAPPEDA({ NIK: creds.NIK, page, password: creds.password });
    await expect(page).toHaveURL(/dashboard/);

    // Menu Statistik tidak lagi ada di sidebar
    await expect(page.getByRole("link", { name: /statistik/i })).toHaveCount(0);

    // Grafik yang dulu ada di Statistik sekarang tampil di Dashboard
    await expect(page.getByText(/memuat data dashboard/i)).toBeHidden({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /demografi gender relawan/i })).toBeVisible();
  });
}
