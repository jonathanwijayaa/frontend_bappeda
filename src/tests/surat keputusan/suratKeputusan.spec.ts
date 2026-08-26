import { credentials } from "@/helpers/credentials.helper";
import { buildSKData, fillSKForm } from "@/helpers/formSuratKeputusan.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";
import path from "path";

const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

for (const { label, creds } of roles) {
  test.describe(`Surat Keputusan - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await page.getByRole("link", { name: "Surat Keputusan" }).click();
      await expect(page).toHaveURL(/surat-keputusan/);
    });

    // TCSK.1 Upload SK PDF
    test(`TCSK.1 ${label} uploads a Surat Keputusan (SK) file`, async ({ page }) => {
      const skData = buildSKData();

      const form = await fillSKForm({ data: skData, page });

      await form.fillAll();
      await form.expectFillALL();
      await form.submitButton();

      await expect(page.getByText(/berhasil|success/i)).toBeVisible();
    });

    // TCSK.2 Cancel Upload SK
    test(`TCSK.2 ${label} cancels the SK upload process`, async ({ page }) => {
      const filePath = path.resolve("src/assets/files/Sample_SK.pdf");

      await page.getByRole("button", { name: /upload sk/i }).click();

      const fileInput = page.locator("input[type='file']");
      await fileInput.setInputFiles(filePath);

      await page.getByRole("button", { name: /batal/i }).click();

      await expect(
        page.getByRole("heading", { name: "Surat Keputusan", exact: true }),
      ).toBeVisible();
    });

    // TCSK.3-8 Search Bar
    test.describe(`TCSK.3-8 ${label} Search Bar`, () => {
      const searchCases = [
        { id: "TCSK.3.0", title: "input keyword in search bar a OPD", keyword: "Opd Demo" },
        { id: "TCSK.3.1", title: "input keyword search bar a Judul SK", keyword: "Sk Demo" },
        { id: "TCSK.3.2", title: "input keyword search bar a NO SK", keyword: "000/000/Demo/2025" },
        { id: "TCSK.4", title: "input with upper case", keyword: "OPD DEMO" },
        { id: "TCSK.5", title: "input with lower case", keyword: "opd demo" },
        { id: "TCSK.6", title: "input with specific word", keyword: "000/000" },
        { id: "TCSK.7", title: "input with random keyword", keyword: "xqz99randomkeyword" },
        { id: "TCSK.8", title: "input with special characters", keyword: "@#$%^&*()" },
      ];

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${label} ${searchCase.title}`, async ({ page }) => {
          const searchInput = page.getByPlaceholder(/cari/i);
          await searchInput.fill(searchCase.keyword);
          await searchInput.press("Enter");

          if (["TCSK.7", "TCSK.8"].includes(searchCase.id)) {
            await expect(page.getByText(/tidak ada data|no data/i)).toBeVisible();
          } else {
            await expect(page.getByRole("table")).toBeVisible();
          }
        });
      }
    });

    // TCSK.9 Export Tabel
    test(`TCSK.9 ${label} exports the Daftar Surat Keputusan table`, async ({ page }) => {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: /ekspor pdf/i }).click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/sk|surat-keputusan/i);
    });

    // TCSK.10-11 Detail SK
    test.describe(`TCSK.10-11 ${label} Detail Surat Keputusan`, () => {
      test.beforeEach(async ({ page }) => {
        await page
          .getByRole("button", { name: /detail/i })
          .first()
          .click();
        await expect(page.getByRole("heading", { name: /detail surat keputusan/i })).toBeVisible();
      });

      // TCSK.10
      test(`TCSK.10 ${label} accesses the details of a Surat Keputusan`, async ({ page }) => {
        await expect(page.getByRole("heading", { name: /detail surat keputusan/i })).toBeVisible();
      });

      // TCSK.11
      test(`TCSK.11 ${label} accesses the Surat Keputusan file`, async ({ page }) => {
        await page.getByRole("link", { name: /lihat sk|buka sk/i }).click();

        await expect(page).toHaveURL(/sk|pdf|dokumen/);
      });
    });

    // TCSK.12 Navigate to Daftar SK Table
    test(`TCSK.12 ${label} navigates to the Daftar Surat Keputusan table`, async ({ page }) => {
      await expect(page.getByRole("heading", { name: /daftar surat keputusan/i })).toBeVisible();
      await expect(page.getByRole("table")).toBeVisible();
    });
  });
}
