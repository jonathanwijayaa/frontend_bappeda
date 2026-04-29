import { generateKaderExcel } from "@/helpers/baseExcel.helper";
import { credentials } from "@/helpers/credentials.helper";
import { buildKaderData, fillKaderForm } from "@/helpers/formKader.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

/* ======================================
   ROLE CONFIG
====================================== */
const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

/* ======================================
   DAFTAR KADER
====================================== */
for (const { label, creds } of roles) {
  test.describe(`Daftar Kader - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await page.getByRole("link", { name: /manajemen kader/i }).click();
    });

    // TCDK.1
    test(`TCDK.1 ${label} access Manajemen Kader page`, async ({ page }) => {
      await expect(page).toHaveURL(/manajemen-kader/);
    });

    // TCDK.2
    test(`TCDK.2 ${label} click Ajukan Kader Baru button`, async ({ page }) => {
      await page.getByRole("button", { name: /ajukan kader baru/i }).click();

      await expect(page.getByRole("heading", { name: /tambah data kader/i })).toBeVisible();
    });

    // TCDK.3-5 Fill Form
    test.describe(`TCDK.3-5 ${label} Fill Form Add Kader`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: /ajukan kader baru/i }).click();
      });

      // TCDK.3
      test(`TCDK.3 ${label} fill tambah data form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = await fillKaderForm({ data: kaderData, page });
        await form.fillAll();

        await expect(page.getByRole("textbox", { name: "Nama Kader atau komunitas" })).toHaveValue(
          kaderData["NAMA KADER"],
        );
        await expect(
          page.getByRole("textbox", { name: "Nama Person in Charge (opsional)" }),
        ).toHaveValue(kaderData.PIC);
        await expect(page.getByRole("textbox", { name: "Nomor HP PIC (opsional)" })).toHaveValue(
          kaderData["NO HP"],
        );
        await expect(page.getByRole("textbox", { name: "16 digit NIK PIC" })).toHaveValue(
          kaderData["NIK PIC"],
        );
        await expect(
          page.getByRole("textbox", { name: "Alamat sesuai KTP (opsional)" }),
        ).toHaveValue(kaderData["ALAMAT PIC"]);
        await expect(page.getByRole("textbox", { name: "Kelurahan/Desa (opsional)" })).toHaveValue(
          kaderData["KELURAHAN PIC"],
        );
      });

      // TCDK.4
      test(`TCDK.4 ${label} save new Kader form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = await fillKaderForm({ data: kaderData, page });
        await form.fillAll();
        await form.submit();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // TCDK.5
      test(`TCDK.5 ${label} cancel new Kader form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = await fillKaderForm({ data: kaderData, page });
        await form.fillAll();
        await form.cancel();

        await expect(page).toHaveURL(/manajemen-kader/);
      });
    });

    // TCDK.6-9 Invalid Form — nested describe, beforeEach buka form cukup sekali
    test.describe(`TCDK.6-9 ${label} Fill Form Invalid`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: /ajukan kader baru/i }).click();
      });

      // TCDK.6 Invalid Kader Name
      test.describe(`TCDK.6 ${label} invalid Kader name`, () => {
        const invalidKaderNameCases = [
          { title: "Empty Kader name", value: "" },
          { title: "Kader name too short", value: "A" },
          { title: "Kader name with numbers", value: "Kader12345" },
          { title: "Kader name with special characters", value: "@@@###" },
          { title: "Kader name too long", value: "A".repeat(300) },
        ];

        for (const kaderCase of invalidKaderNameCases) {
          test(`TCDK.6 ${kaderCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData["NAMA KADER"] = kaderCase.value;

            const form = await fillKaderForm({ data: kaderData, page });
            await form.fillAll();
            await form.submit();

            const namaKaderInput = page.getByRole("textbox", {
              name: "Nama Kader atau komunitas",
            });
            const isValid = await namaKaderInput.evaluate((el: HTMLInputElement) =>
              el.checkValidity(),
            );

            expect(isValid).toBe(false);
          });
        }
      });

      // TCDK.7 Invalid Status — di-skip karena STATUS tidak ada di form
      // test.describe(`TCDK.7 ${label} invalid Status`, () => { ... });

      // TCDK.8 Invalid PIC Name
      test.describe(`TCDK.8 ${label} invalid PIC name`, () => {
        const invalidPICCases = [
          { title: "Empty PIC name", value: "" },
          { title: "PIC name too short", value: "A" },
          { title: "PIC name with numbers", value: "PIC12345" },
          { title: "PIC name with special characters", value: "@@@###" },
          { title: "PIC name too long", value: "A".repeat(200) },
        ];

        for (const picCase of invalidPICCases) {
          test(`TCDK.8 ${picCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData.PIC = picCase.value;

            const form = await fillKaderForm({ data: kaderData, page });
            await form.fillAll();
            await form.submit();

            await expect(page).not.toHaveURL(/manajemen-kader/);
            await expect(page.getByText(/pic|wajib|invalid/i)).toBeVisible();
          });
        }
      });

      // TCDK.9 Invalid Kontak
      test.describe(`TCDK.9 ${label} invalid kontak`, () => {
        const invalidKontakCases = [
          { title: "Empty kontak", value: "" },
          { title: "Kontak too short", value: "08123" },
          { title: "Kontak with letters", value: "08ABCDE123" },
          { title: "Kontak with special characters", value: "08!@#$%^&*" },
          { title: "Kontak too long", value: "081234567890123456789" },
        ];

        for (const kontakCase of invalidKontakCases) {
          test(`TCDK.9 ${kontakCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData["NO HP"] = kontakCase.value;

            const form = await fillKaderForm({ data: kaderData, page });
            await form.fillAll();
            await form.submit();

            await expect(page).not.toHaveURL(/manajemen-kader/);
            await expect(page.getByText(/kontak|no hp|wajib|invalid/i)).toBeVisible();
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
      await page.getByRole("button", { name: /lanjutkan/i }).click();
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

      await page.getByRole("button").nth(5).click();

      await expect(page.getByRole("heading", { name: /manajemen kader/i })).toBeVisible();
    });

    // TCDK.14-21 Search Bar
    test.describe(`TCDK.14-21 ${label} Search Bar`, () => {
      const searchCases = [
        { id: "TCDK.14", title: "input keyword in search bar", keyword: "Kader Kesehatan" },
        {
          id: "TCDK.15",
          title: "input keyword from copy paste characters",
          keyword: "Kader Sosial",
        },
        { id: "TCDK.16", title: "input search bar in Manajemen Kader page", keyword: "Dinas" },
        { id: "TCDK.17", title: "input with upper case", keyword: "KADER KESEHATAN" },
        { id: "TCDK.18", title: "input with lower case", keyword: "kader kesehatan" },
        { id: "TCDK.19", title: "input with specific word", keyword: "Aktif" },
        { id: "TCDK.20", title: "input with random keyword", keyword: "xqz99randomkeyword" },
        { id: "TCDK.21", title: "input with special characters", keyword: "@#$%^&*()" },
      ];

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${label} ${searchCase.title}`, async ({ page }) => {
          const searchInput = page.getByRole("textbox", { name: /cari|search/i });
          await searchInput.fill(searchCase.keyword);
          await page.getByRole("button", { name: /cari|search/i }).click();

          if (searchCase.id === "TCDK.20") {
            await expect(page.getByText(/tidak ada data|no data/i)).toBeVisible();
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
        page.getByRole("button", { name: /export/i }).click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/kader/i);
    });

    // TCDK.23 Access Kader Detail
    test(`TCDK.23 ${label} access Kader detail`, async ({ page }) => {
      await page.getByRole("table").getByRole("row").nth(1).click();

      await expect(page.getByRole("heading", { name: /detail kader/i })).toBeVisible();
    });

    // TCDK.24-25 Nonaktif Kader
    test.describe(`TCDK.24-25 ${label} Nonaktif Kader`, () => {
      test.beforeEach(async ({ page }) => {
        await page
          .getByRole("button", { name: /nonaktif/i })
          .first()
          .click();
      });

      // TCDK.24
      test(`TCDK.24 ${label} Nonaktif Kader`, async ({ page }) => {
        await page.getByRole("button", { name: /ya|konfirmasi|nonaktif/i }).click();

        await expect(page.getByText(/berhasil|nonaktif|success/i)).toBeVisible();
      });

      // TCDK.25
      test(`TCDK.25 ${label} cancel Nonaktif Kader`, async ({ page }) => {
        await page.getByRole("button", { name: /batal/i }).click();

        await expect(page).toHaveURL(/manajemen-kader/);
      });
    });

    // TCDK.26 Next Page
    test(`TCDK.26 ${label} open next Kader table page`, async ({ page }) => {
      await page.getByRole("button", { name: /next|selanjutnya|>/i }).click();

      await expect(page.getByRole("table")).toBeVisible();
    });
  });
}
