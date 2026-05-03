import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

for (const { label, creds } of roles) {
  test.describe(`Statistik - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await page.getByRole("link", { name: /statistik/i }).click();
      await expect(page).toHaveURL(/statistik/);
    });

    // TCS.1-4 Diagram — dikelompokkan karena semua hanya verifikasi chart visible
    test.describe(`TCS.1-4 ${label} Diagram Charts`, () => {
      const chartCases = [
        {
          id: "TCS.1",
          title: "views the gender demographic chart",
          heading: /demografi gender/i,
        },
        {
          id: "TCS.2",
          title: "views total volunteers per Kader chart",
          heading: /jumlah relawan per kader/i,
        },
        {
          id: "TCS.3",
          title: "views the Kelurahan Demografi chart",
          heading: /demografi kelurahan/i,
        },
        {
          id: "TCS.4",
          title: "views total Kader per OPD chart",
          heading: /jumlah kader/i,
        },
      ];

      for (const chartCase of chartCases) {
        test(`${chartCase.id} ${label} ${chartCase.title}`, async ({ page }) => {
          await expect(page.getByRole("heading", { name: chartCase.heading })).toBeVisible();

          // Pastikan chart container-nya render (canvas atau svg di dalam card)
          const card = page
            .locator("div")
            .filter({ has: page.getByRole("heading", { name: chartCase.heading }) });
          await expect(card.locator("canvas, svg").first()).toBeVisible();
        });
      }
    });

    // TCS.5 Close/Collapse Chart
    test(`TCS.5 ${label} closes the chart display`, async ({ page }) => {
      // Klik tombol collapse (^) pada card pertama — Demografi Gender
      const firstCard = page
        .locator("div")
        .filter({ has: page.getByRole("heading", { name: /demografi gender/i }) })
        .first();

      const collapseBtn = firstCard.getByRole("button");
      await collapseBtn.click();

      // Chart canvas/svg tidak lagi visible setelah di-collapse
      await expect(firstCard.locator("canvas, svg").first()).not.toBeVisible();
    });
  });
}
