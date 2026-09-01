import { generateKaderExcel } from "@/helpers/baseExcel.helper";
import { credentials } from "@/helpers/credentials.helper";
import { buildKaderData, fillKaderForm } from "@/helpers/formKader.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

export const roles = [
  { label: "Super Admin", creds: credentials.superAdmin, isSuperAdmin: true },
  { label: "OPD", creds: credentials.opd, isSuperAdmin: false },
] as const;

for (const { label, creds, isSuperAdmin } of roles) {
  test.describe(`Daftar Kader - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await page.getByRole("link", { name: /kader/i }).click();
    });

    // TCDK.1
    test(`TCDK.1 ${label} access Daftar Kader page`, async ({ page }) => {
      await expect(page).toHaveURL(/kader/);
    });

    // TCDK.2
    test(`TCDK.2 ${label} click Ajukan Kader Baru button`, async ({ page }) => {
      await page.getByRole("button", { name: "Tambah Kader Baru" }).click();

      await expect(page.getByRole("button", { name: "Tambah Kader Baru" })).toBeVisible();
    });

    test.describe(`TCDK.3-5 ${label} Fill Form Add Kader`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Tambah Kader Baru" }).click();
      });

      // TCDK.3
      test(`TCDK.3 ${label} fill tambah data form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = await fillKaderForm({
          data: kaderData,
          page,
          isSuperAdmin: label === "Super Admin",
          TCDK: "TCDK.3",
        });

        await form.fillAll();
        // await form.expectFillALL();
        // await form.submitButton();

        await expect(page.getByRole("textbox", { name: /Nama Kader/i })).toHaveValue(
          kaderData["NAMA KADER"],
        );
        await expect(page.getByRole("textbox", { name: /Nama Person in Charge/i })).toHaveValue(
          kaderData.PIC,
        );
        await expect(page.getByRole("textbox", { name: /Nomor HP/i })).toHaveValue(
          kaderData["NO HP"],
        );
        await expect(page.getByRole("textbox", { name: "16 digit NIK PIC" })).toHaveValue(
          kaderData["NIK PIC"],
        );
        await expect(page.getByRole("textbox", { name: /Alamat/i })).toHaveValue(
          kaderData["ALAMAT PIC"],
        );
        await expect(page.getByRole("textbox", { name: /Kelurahan/i })).toHaveValue(
          kaderData["KELURAHAN PIC"],
        );
      });

      // TCDK.4
      test(`TCDK.4 ${label} save new Kader form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = await fillKaderForm({
          data: kaderData,
          page,
          isSuperAdmin: label === "Super Admin",
          TCDK: "TCDK.4",
        });

        await form.fillAll();
        await form.submitButton();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // TCDK.5
      test(`TCDK.5 ${label} cancel new Kader form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = await fillKaderForm({
          data: kaderData,
          page,
          isSuperAdmin: label === "Super Admin",
          TCDK: "TCDK.5",
        });

        await form.fillAll();
        await form.cancelButton();

        await expect(page).toHaveURL(/daftar-kader/);
      });
    });

    // TCDK.6-9 Invalid Form
    test.describe(`TCDK.6-9 ${label} Fill Form Invalid`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Tambah Kader Baru" }).click();
      });

      // TCDK.6 Invalid Kader Name
      test.describe(`TCDK.6 ${label} invalid Kader name`, () => {
        const invalidKaderNameCases = [
          { title: "Empty Kader name", value: "", expectedMessage: null },
          { title: "Kader name too short", value: "A", expectedMessage: /minimal 3 karakter/i },
          {
            title: "Kader name with numbers",
            value: "Kader12345",
            expectedMessage: /tidak boleh mengandung angka atau karakter spesial/i,
          },
          {
            title: "Kader name with special characters",
            value: "@@@###",
            expectedMessage: /tidak boleh mengandung angka atau karakter spesial/i,
          },
          {
            title: "Kader name too long",
            value: "A".repeat(300),
            expectedMessage: /terlalu panjang|maks 100 karakter/i,
          },
        ];

        for (const kaderCase of invalidKaderNameCases) {
          test(`TCDK.6 ${kaderCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData["NAMA KADER"] = kaderCase.value;

            const form = await fillKaderForm({
              data: kaderData,
              page,
              isSuperAdmin: label === "Super Admin",
              TCDK: "TCDK.6",
            });
            await form.fillAll();
            await form.submitButton();

            if (kaderCase.expectedMessage === null) {
              const namaKaderInput = page.getByRole("textbox", { name: /Nama Kader/i });
              const isValid = await namaKaderInput.evaluate((el: HTMLInputElement) =>
                el.checkValidity(),
              );
              expect(isValid).toBe(false);
            } else {
              await expect(page.getByText(kaderCase.expectedMessage)).toBeVisible();
            }
          });
        }
      });

      // TCDK.8 Invalid PIC Name
      test.describe(`TCDK.8 ${label} invalid PIC name`, () => {
        const invalidPICCases = [
          { title: "Empty PIC name", value: "", expectedMessage: null },
          { title: "PIC name too short", value: "A", expectedMessage: /minimal 3 karakter/i },
          {
            title: "PIC name with numbers",
            value: "PIC12345",
            expectedMessage: /tidak boleh mengandung angka atau karakter spesial/i,
          },
          {
            title: "PIC name with special characters",
            value: "@@@###",
            expectedMessage: /tidak boleh mengandung angka atau karakter spesial/i,
          },
          {
            title: "PIC name too long",
            value: "A".repeat(200),
            expectedMessage: /terlalu panjang|maks 100 karakter/i,
          },
        ];

        for (const picCase of invalidPICCases) {
          test(`TCDK.8 ${picCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData.PIC = picCase.value;

            const form = await fillKaderForm({
              data: kaderData,
              page,
              isSuperAdmin: label === "Super Admin",
              TCDK: "TCDK.8",
            });
            await form.fillAll();
            await form.submitButton();

            if (picCase.expectedMessage === null) {
              const picInput = page.getByRole("textbox", { name: /Nama Person in Charge/i });
              const isValid = await picInput.evaluate((el: HTMLInputElement) => el.checkValidity());
              expect(isValid).toBe(false);
            } else {
              await expect(page.getByText(picCase.expectedMessage)).toBeVisible();
            }
          });
        }
      });

      // TCDK.9 Invalid Kontak
      test.describe(`TCDK.9 ${label} invalid kontak`, () => {
        const invalidKontakCases = [
          { title: "Empty kontak", value: "", expectedMessage: null },
          {
            title: "Kontak too short",
            value: "08123",
            expectedMessage: /nomor telepon pic terlalu pendek/i,
          },
          {
            title: "Kontak with letters",
            value: "08ABCDE123",
            expectedMessage: /nomor telepon pic tidak boleh mengandung huruf/i,
          },
          {
            title: "Kontak with special characters",
            value: "08!@#$%^&*",
            expectedMessage: /nomor telepon pic tidak boleh mengandung karakter spesial/i,
          },
          {
            title: "Kontak too long",
            value: "081234567890123456789",
            expectedMessage: /nomor telepon pic terlalu panjang/i,
          },
        ];

        for (const kontakCase of invalidKontakCases) {
          test(`TCDK.9 ${kontakCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData["NO HP"] = kontakCase.value;

            const form = await fillKaderForm({
              data: kaderData,
              page,
              isSuperAdmin: label === "Super Admin",
              TCDK: "TCDK.9",
            });
            await form.fillAll();
            await form.submitButton();

            if (kontakCase.expectedMessage === null) {
              const kontakInput = page.getByRole("textbox", { name: /Nomor HP/i });
              const isValid = await kontakInput.evaluate((el: HTMLInputElement) =>
                el.checkValidity(),
              );
              expect(isValid).toBe(false);
            } else {
              await expect(
                page.getByText(kontakCase.expectedMessage, { exact: true }),
              ).toBeVisible();
            }
          });
        }
      });
    });

    // TCDK.10 Upload Valid Excel
    test(`TCDK.10 ${label} upload Kader data excel file`, async ({ page }) => {
      const filePath = generateKaderExcel({ type: "valid", total: 5 });

      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      const fileInput = page.locator("input[type='file']");
      await fileInput.setInputFiles(filePath);
      await page.getByRole("button", { name: /lanjutkan/i }).click();
      await page.getByRole("button", { name: /simpan data bersih/i }).click();

      await expect(page.getByText(/berhasil|success/i)).toBeVisible();
    });

    // TCDK.11 Upload Invalid Excel
    test(`TCDK.11 ${label} upload invalid template excel Kader data`, async ({ page }) => {
      const filePath = generateKaderExcel({ type: "invalid", total: 3 });

      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      const fileInput = page.locator("input[type='file']");
      await fileInput.setInputFiles(filePath);
      await page.getByRole("button", { name: "Lanjutkan" }).click();
      await page.getByRole("button", { name: /simpan data bersih/i }).click();

      await expect(page.getByText(/error|invalid/i)).toBeVisible();
    });

    // TCDK.12 Download Template Excel
    test(`TCDK.12 ${label} click Templat Excel Data Kader hyperlink`, async ({ page }) => {
      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      await page.getByRole("link", { name: /templat excel data kader/i }).click();

      await expect(page).toHaveURL(/excel|template|dokumen|download/);
    });

    // TCDK.13 Cancel Upload Excel
    test(`TCDK.13 ${label} cancel upload Kader data excel`, async ({ page }) => {
      const filePath = generateKaderExcel({ type: "valid", total: 1 });

      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      const fileInput = page.locator("input[type='file']");
      await fileInput.setInputFiles(filePath);

      await page.getByRole("button").filter({ hasText: /^$/ }).nth(2).click();

      await expect(page.getByRole("heading", { name: /daftar kader/i })).toBeVisible();
    });

    // TCDK.14-21 Search Bar
    test.describe(`TCDK.14-21 ${label} Search Bar`, () => {
      const searchCases = [
        {
          id: "TCDK.14",
          title: "input keyword in search bar",
          keyword: "Kader Kesehatan",
          expectNoData: false,
        },
        {
          id: "TCDK.15",
          title: "input keyword from copy paste characters",
          keyword: "Kader Kesehatan".split("").join(""),
          expectNoData: false,
        },
        {
          id: "TCDK.16",
          title: "input search bar in Daftar Kader page",
          keyword: "demo",
          expectNoData: false,
        },
        {
          id: "TCDK.17",
          title: "input with upper case",
          keyword: "KADER KESEHATAN",
          expectNoData: false,
        },
        {
          id: "TCDK.18",
          title: "input with lower case",
          keyword: "kader kesehatan",
          expectNoData: false,
        },
        {
          id: "TCDK.19",
          title: "input with specific word",
          keyword: "kesehatan",
          expectNoData: false,
        },
        {
          id: "TCDK.20",
          title: "input with random keyword",
          keyword: "xqz99randomkeyword",
          expectNoData: true,
        },
        {
          id: "TCDK.21",
          title: "input with special characters",
          keyword: "@#$%^&*()",
          expectNoData: true,
        },
      ];

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${label} ${searchCase.title}`, async ({ page }) => {
          const searchInput = page.getByRole("textbox", { name: /cari|search/i });

          await searchInput.fill(searchCase.keyword);

          if (searchCase.expectNoData) {
            await expect(page.getByText(/tidak ada data|no data|Belum ada kader/i)).toBeVisible();
          } else {
            await expect(page.getByRole("table")).toBeVisible();
          }
        });
      }
    });

    // TCDK.22 Export Tabel
    test(`TCDK.22 ${label} export Daftar Kader tabel`, async ({ page }) => {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Ekspor PDF" }).click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/kader/i);
    });

    // TCDK.23 Access Kader Detail
    test(`TCDK.23 ${label} access Kader detail`, async ({ page }) => {
      await page.getByRole("button", { name: "Detail" }).first().click();

      await expect(page.getByRole("heading", { name: /detail kader/i })).toBeVisible();
    });

    // TCDK.24-25 Nonaktif Kader
    test.describe(`TCDK.24-25 ${label} Nonaktif Kader`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Nonaktif" }).first().click();
      });

      // TCDK.24
      test(`TCDK.24 ${label} Nonaktif Kader`, async ({ page }) => {
        await page.getByRole("button", { name: "Lanjutkan" }).click();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // TCDK.25
      test(`TCDK.25 ${label} cancel Nonaktif Kader`, async ({ page }) => {
        await page.getByRole("button", { name: /batal/i }).click();

        await expect(page).toHaveURL(/daftar-kader/);
      });
    });

    // TCDK.26 Next Page
    test(`TCDK.26 ${label} open next Kader table page`, async ({ page }) => {
      await page.getByRole("button", { name: /next|selanjutnya|>/i }).click();

      await expect(page.getByRole("table")).toBeVisible();
    });
  });
}
