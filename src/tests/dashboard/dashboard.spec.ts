import { test, expect } from "@playwright/test";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { credentials } from "@/helpers/credentials.helper";

const dashboardUsers = [
  { role: "Super Admin", ...credentials.superAdmin },
  { role: "OPD", ...credentials.opd },
];

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://frontend-bappeda.vercel.app/");
  });

  // TCD.1 Access Dashboard
  for (const user of dashboardUsers) {
    test(`TCD.1 ${user.role} access Dashboard page`, async ({ page }) => {
      await loginBAPPEDA({
        NIK: user.NIK,
        page,
        password: user.password,
      });

      await expect(page).toHaveURL(/dashboard/);

      // memastikan elemen dashboard muncul
      await expect(page.getByText(/dashboard/i)).toBeVisible();
    });
  }

  // TCD.2 Hover Bar Chart
  test("TCD.2 Super Admin/OPD hover on bar chart diagram", async ({ page }) => {
    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });

    await expect(page).toHaveURL(/dashboard/);

    const barChart = page.locator("canvas"); // biasanya chart.js pakai canvas

    await barChart.hover();

    await expect(barChart).toBeVisible();
  });

  // TCD.3 Hover Info Tambahan
  test("TCD.3 Super Admin/OPD hover info tambahan", async ({ page }) => {
    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });

    await expect(page).toHaveURL(/dashboard/);

    const infoTambahan = page.getByText(/info tambahan/i);

    await infoTambahan.hover();

    await expect(infoTambahan).toBeVisible();
  });
});
