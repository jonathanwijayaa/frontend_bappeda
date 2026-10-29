import { credentials } from "@/helpers/credentials.helper";
import { buildSKData, fillSKForm } from "@/helpers/formSuratKeputusan.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink, LOAD_TIME, pressThink, uploadThink } from "@/helpers/timing.helper";
import { expect, Page, test } from "@playwright/test";
import path from "path";

// Tombol tutup (X) pada header modal tidak punya accessible name,
// jadi dicari lewat strukturnya: <h2>judul</h2> -> parent -> button
const modalCloseButton = (page: Page, judul: string) =>
  page
    .locator(`xpath=//h2[normalize-space(text())="${judul}"]/parent::div/following-sibling::button`)
    .first();

export const roles = [
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
      await clickThink(page.getByRole("link", { name: "Surat Keputusan" }));
      await expect(page).toHaveURL(/surat-keputusan/);
    });

    // TCSK.1 Upload SK PDF
    test(`TCSK.1 ${label} uploads a Surat Keputusan (SK) file`, async ({ page }) => {
      const skData = buildSKData();

      const form = await fillSKForm({
        data: skData,
        page,
        isSuperAdmin: label === "Super Admin",
      });

      await clickThink(page.getByRole("button", { name: /upload sk/i }));

      await form.fillAll();
      await form.expectFillALL();
      await form.submitButton();

      await expect(page.getByText(/berhasil|success/i)).toBeVisible();
    });

    // TCSK.2 Cancel Upload SK
    test(`TCSK.2 ${label} cancels the SK upload process`, async ({ page }) => {
      const filePath = path.resolve("src/assets/files/Sample_SK.pdf");

      await clickThink(page.getByRole("button", { name: /upload sk/i }));

      const fileInput = page.locator("input[type='file']");
      await uploadThink(fileInput, filePath);

      await clickThink(page.getByRole("button", { name: /batal/i }));

      await expect(
        page.getByRole("heading", { name: "Surat Keputusan", exact: true }),
      ).toBeVisible();
    });

    // TCSK.3-8 Search Bar
    test.describe(`TCSK.3-8 ${label} Search Bar`, () => {
      // Kata kunci untuk kasus "ada hasil" diambil dari baris pertama tabel
      // (kolom NOMOR SK / JUDUL SK / OPD), supaya test tidak bergantung pada
      // data seed tertentu yang bisa saja sudah tidak ada di database.
      const searchCases: {
        id: string;
        title: string;
        expectNoData: boolean;
        keyword?: string;
        source?: "NOMOR SK" | "JUDUL SK" | "OPD";
        transform?: (value: string) => string;
      }[] = [
        {
          id: "TCSK.3.0",
          title: "input keyword in search bar a OPD",
          expectNoData: false,
          source: "OPD",
        },
        {
          id: "TCSK.3.1",
          title: "input keyword search bar a Judul SK",
          expectNoData: false,
          source: "JUDUL SK",
        },
        {
          id: "TCSK.3.2",
          title: "input keyword search bar a NO SK",
          expectNoData: false,
          source: "NOMOR SK",
        },
        {
          id: "TCSK.4",
          title: "input with upper case",
          expectNoData: false,
          source: "OPD",
          transform: (value) => value.toUpperCase(),
        },
        {
          id: "TCSK.5",
          title: "input with lower case",
          expectNoData: false,
          source: "OPD",
          transform: (value) => value.toLowerCase(),
        },
        {
          id: "TCSK.6",
          title: "input with specific word",
          expectNoData: false,
          source: "NOMOR SK",
          // Sebagian nomor SK saja, mis. "271/161" dari "271/161/Dinas X/2026"
          transform: (value) => value.split("/").slice(0, 2).join("/"),
        },
        {
          id: "TCSK.7",
          title: "input with random keyword",
          keyword: "xqz99randomkeyword",
          expectNoData: true,
        },
        {
          id: "TCSK.8",
          title: "input with special characters",
          keyword: "@#$%^&*()",
          expectNoData: true,
        },
      ];

      const KOLOM_TABEL = ["NOMOR SK", "JUDUL SK", "OPD"] as const;

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${label} ${searchCase.title}`, async ({ page }) => {
          const table = page.getByRole("table");
          const searchInput = page.getByPlaceholder(/cari/i);

          let keyword = searchCase.keyword ?? "";

          if (searchCase.source) {
            await expect(table).toBeVisible();

            const cellText = await table
              .getByRole("row")
              .nth(1)
              .getByRole("cell")
              .nth(KOLOM_TABEL.indexOf(searchCase.source))
              .textContent();

            keyword = (cellText ?? "").trim();
            expect(keyword, `Kolom ${searchCase.source} baris pertama kosong`).not.toBe("");
            keyword = searchCase.transform ? searchCase.transform(keyword) : keyword;
          }

          await fillThink(searchInput, keyword);
          await pressThink(searchInput, "Enter");

          if (searchCase.expectNoData) {
            await expect(
              page.getByText(/tidak ada data|no data|Belum ada Surat Keputusan/i),
            ).toBeVisible();
            return;
          }

          await expect(table).toBeVisible();

          // hasText dengan string: pencocokan substring & tidak peka huruf besar/kecil
          const matchingRows = table.getByRole("row").filter({ hasText: keyword });

          await expect(matchingRows.first()).toBeVisible();
          expect(await matchingRows.count()).toBeGreaterThan(0);
        });
      }
    });

    // TCSK.9 Export Tabel
    test(`TCSK.9 ${label} exports the Daftar Surat Keputusan table`, async ({ page }) => {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: LOAD_TIME }),
        clickThink(page.getByRole("button", { name: /ekspor pdf/i })),
      ]);

      expect(download.suggestedFilename()).toMatch(/sk|surat-keputusan/i);
    });

    // TCSK.10-11 Detail SK
    test.describe(`TCSK.10-11 ${label} Detail Surat Keputusan`, () => {
      test.beforeEach(async ({ page }) => {
        await clickThink(page.getByRole("button", { name: /detail/i }).first());
        await expect(page.getByRole("heading", { name: /detail surat keputusan/i })).toBeVisible();
        await expect(page.getByText("Memuat detail...")).toBeHidden({ timeout: LOAD_TIME });
      });

      // TCSK.10
      test(`TCSK.10 ${label} accesses the details of a Surat Keputusan`, async ({ page }) => {
        await expect(page.getByRole("heading", { name: /detail surat keputusan/i })).toBeVisible();
      });

      // TCSK.11
      test(`TCSK.11 ${label} accesses the Surat Keputusan file`, async ({ page }) => {
        // Tutup modal detail, lalu buka pratinjau lewat tombol ikon mata di tabel.
        // Tombol itu hanya ada untuk SK yang punya file dan tidak punya teks, jadi
        // dicari sebagai tombol tanpa teks di dalam baris tabel — dulu memakai
        // class CSS dan indeks tombol ke-6 di seluruh halaman.
        await clickThink(modalCloseButton(page, "Detail Surat Keputusan"));

        const tombolPreview = page
          .locator("table tbody tr")
          .getByRole("button")
          .filter({ hasNotText: /\S/ })
          .first();
        test.skip((await tombolPreview.count()) === 0, "Tidak ada SK berfile di halaman ini");
        await clickThink(tombolPreview);

        await expect(page.getByRole("heading", { name: "Preview Surat Keputusan" })).toBeVisible();
        await expect(
          page.locator('iframe[title="PDF Preview"]').contentFrame().locator("html"),
        ).toBeVisible();
      });
    });

    // TCSK.12 Navigate to Daftar SK Table
    test(`TCSK.12 ${label} navigates to the Daftar Surat Keputusan table`, async ({ page }) => {
      await expect(page.getByRole("heading", { name: /daftar surat keputusan/i })).toBeVisible();
      await expect(page.getByRole("table")).toBeVisible();
    });
  });
}
