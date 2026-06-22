import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

for (const { label, creds } of roles) {
  test.describe(`riwayat Relawan - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await page.getByRole("link", { name: /riwayat relawan/i }).click();
      await expect(page).toHaveURL(/histori-relawan/);
    });

    // TCHR.1-5 Filter & Sort by
    test(`TCHR.1 ${label} filter by Nama OPD`, async ({ page }) => {
      test.skip(label === "OPD", "Filter OPD tidak tersedia untuk role OPD");

      await page.getByRole("combobox").first().selectOption({ index: 1 });

      await expect(page.getByRole("table")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /tabel riwayat data relawan/i }),
      ).toBeVisible();
      await expect(page.getByRole("cell", { name: "OPD Demo" }).first()).toBeVisible();
    });

    // TCHR.2
    test(`TCHR.2 ${label} filter by Nama Kader`, async ({ page }) => {
      if (label === "OPD") {
        await page.getByRole("combobox").first().selectOption({ index: 1 });
      } else {
        await page.getByRole("combobox").first().selectOption({ index: 0 });
      }

      await expect(page.getByRole("table")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /tabel riwayat data relawan/i }),
      ).toBeVisible();
      await expect(page.getByRole("cell", { name: "Demo Kader" }).first()).toBeVisible();
    });

    // TCHR.3
    test(`TCHR.3 ${label} filter by Tahun Awal`, async ({ page }) => {
      await page.getByRole("button", { name: /tahun awal/i }).click();
      await page.getByRole("button", { name: "2024" }).click();

      await expect(page.getByRole("table")).toBeVisible();
    });

    // TCHR.4
    test(`TCHR.4 ${label} filter by Tahun Akhir`, async ({ page }) => {
      await page.getByRole("button", { name: /tahun akhir/i }).click();
      await page.getByRole("button", { name: "2036" }).click();

      await expect(page.getByRole("table")).toBeVisible();
    });

    // IMPOSIBLE TEST CASE: Filter combination sudah berhasil menghindari conflicting filter combination dari fitur combobox dan datepicker, sehingga tidak memungkinkan untuk membuat kombinasi filter yang konflik.
    //   // TCHR.5 — Negative: conflicting filter combination
    //   test(`TCHR.5 ${label} filters with conflicting filter combination`, async ({ page }) => {
    //     // Pilih OPD
    //     await page.getByRole("combobox").first().selectOption({ index: 1 });

    //     // Pilih Kader yang tidak sesuai OPD — pilih index terakhir
    //     const kaderCombobox = page.getByRole("combobox").nth(1);
    //     const kaderOptions = await kaderCombobox.locator("option").count();
    //     await kaderCombobox.selectOption({ index: kaderOptions - 1 });

    //     // Tahun Awal lebih besar dari Tahun Akhir
    //     await page.getByRole("button", { name: /tahun awal/i }).click();
    //     await page.getByRole("button", { name: "2026" }).click();
    //     await page.getByRole("button", { name: /tahun akhir/i }).click();
    //     await page.getByRole("button", { name: "2026" }).click();

    //     await expect(page.getByText(/tidak ada data|no data/i)).toBeVisible();
    //   });
    // });

    // TCHR.6-13 Search Bar
    test.describe(`TCHR.6-13 ${label} Search Bar`, () => {
      const searchCases = [
        {
          id: "TCHR.6",
          title: "input keyword in search bar",
          keyword: "Demo Udin",
          expectNoData: false,
        },
        {
          id: "TCHR.7",
          title: "input with upper case",
          keyword: "DEMO UDIN",
          expectNoData: false,
        },
        {
          id: "TCHR.8",
          title: "input with lower case",
          keyword: "demo udin",
          expectNoData: false,
        },
        {
          id: "TCHR.9",
          title: "input with specific word",
          keyword: "111111111111112",
          expectNoData: false,
        },
        {
          id: "TCHR.10",
          title: "input with random keyword",
          keyword: "xqz99randomkeyword",
          expectNoData: true,
        },
        {
          id: "TCHR.11",
          title: "input with special characters",
          keyword: "@#$%^&*()",
          expectNoData: true,
        },
        {
          id: "TCHR.12",
          title: "inputs empty keyword in search bar",
          keyword: "",
          expectNoData: false,
        },
        {
          id: "TCHR.13",
          title: "inputs whitespace only in search bar",
          keyword: "   ",
          expectNoData: true,
        },
      ];

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${label} ${searchCase.title}`, async ({ page }) => {
          await page.getByPlaceholder(/cari nama atau nik relawan/i).fill(searchCase.keyword);

          await page.getByPlaceholder(/cari nama atau nik relawan/i).press("Enter");

          if (searchCase.expectNoData) {
            await expect(page.getByText(/tidak ada data|no data/i)).toBeVisible();
          } else {
            await expect(page.getByRole("table")).toBeVisible();
          }
        });
      }
    });

    // TCHR.14 Tabel riwayat Relawan
    test(`TCHR.14 ${label} access Relawan history detail`, async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /tabel riwayat data relawan/i }),
      ).toBeVisible();
      await expect(page.getByRole("table")).toBeVisible();

      await page
        .getByRole("button", { name: /detail/i })
        .first()
        .click();

      await expect(
        page.getByRole("heading", { name: /detail.*relawan|riwayat.*relawan/i }),
      ).toBeVisible();
    });
  });
}
