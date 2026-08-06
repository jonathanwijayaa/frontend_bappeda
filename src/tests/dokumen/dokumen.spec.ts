import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

for (const { label, creds } of roles) {
  test.describe(`Dokumen - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await page.getByRole("link", { name: /dokumen/i }).click();
      await expect(page).toHaveURL(/dokumen/);
    });

    // TCDO.1-4 Download — dikelompokkan karena semua pola identik
    test.describe(`TCDO.1-4 ${label} Download`, () => {
      const downloadCases = [
        {
          id: "TCDO.1",
          title: "downloads the application user guide",
          cardHeading: /buku panduan aplikasi/i,
          expectedFile: /panduan|guidebook|guide/i,
          buttonIndex: 0,
        },
        {
          id: "TCDO.2",
          title: "downloads the volunteer data Excel template",
          cardHeading: /templat excel data relawan/i,
          expectedFile: /relawan|template/i,
          buttonIndex: 1,
        },
        {
          id: "TCDO.3",
          title: "downloads the OPD data Excel template",
          cardHeading: /templat excel data opd/i,
          expectedFile: /opd|template/i,
          buttonIndex: 2,
        },
        {
          id: "TCDO.4",
          title: "downloads the Kader data Excel template",
          cardHeading: /templat excel data kader/i,
          expectedFile: /kader|template/i,
          buttonIndex: 3,
        },
      ];

      for (const dlCase of downloadCases) {
        test(`${dlCase.id} ${label} ${dlCase.title}`, async ({ page }) => {
          const card = page
            .locator("div")
            .filter({
              has: page.getByRole("heading", {
                name: dlCase.cardHeading,
              }),
            })
            .first();

          const downloadButton =
            dlCase.buttonIndex === 0
              ? card.getByRole("button", { name: /unduh/i }).first()
              : card.getByRole("button", { name: /unduh/i }).nth(dlCase.buttonIndex);

          const [download] = await Promise.all([
            page.waitForEvent("download"),
            downloadButton.click(),
          ]);

          expect(download.suggestedFilename()).toMatch(dlCase.expectedFile);
        });
      }
    });
  });
}
