import { credentials } from "@/helpers/credentials.helper";
import { buildOPDData, fillOPDForm } from "@/helpers/form.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("https://frontend-bappeda.vercel.app/");

  await loginBAPPEDA({
    NIK: credentials.superAdmin.NIK,
    page,
    password: credentials.superAdmin.password,
  });

  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("link", { name: /manajemen opd/i }).click();
});

// TCMO.1 Access Manajemen OPD
test("TCMO.1 Super Admin access Manajemen OPD page", async ({ page }) => {
  await expect(page).toHaveURL(/manajemen-opd/);
});

// TCMO.2 Click Tambah OPD
test("TCMO.2 Super Admin click Tambah OPD button", async ({ page }) => {
  await page.getByRole("button", { name: /Tambah OPD/i }).click();

  await expect(page.getByRole("heading", { name: "Tambah OPD Baru" })).toBeVisible();
});

test.describe("TCMO.3-5 Fill Form Add OPD", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: /Tambah OPD/i }).click();
  });

  // TCMO.3
  test("TCMO.3 Super Admin fill tambah data form", async ({ page }) => {
    const opdData = buildOPDData();

    const form = await fillOPDForm({
      data: opdData,
      page,
    });

    await form.fillAll();

    await expect(page.getByRole("textbox", { name: "Nama Dinas / OPD" })).toHaveValue(
      opdData.namaOPD,
    );
    await expect(page.getByRole("textbox", { name: "Alamat OPD" })).toHaveValue(opdData.alamat);
    await expect(page.getByRole("textbox", { name: "Penanggung jawab" })).toHaveValue(opdData.pic);
    await expect(page.getByRole("textbox", { name: "Nomor telepon / email" })).toHaveValue(
      opdData.kontak,
    );
  });

  // TCMO.4
  test("TCMO.4 Super Admin save new OPD form", async ({ page }) => {
    const opdData = buildOPDData();

    const form = await fillOPDForm({
      data: opdData,
      page,
    });

    await form.fillAll();

    await page.getByRole("button", { name: /simpan/i }).click();

    await expect(page.getByText(/berhasil|success/i)).toBeVisible();
  });

  // TCMO.5
  test("TCMO.5 Super Admin cancel new OPD form", async ({ page }) => {
    const opdData = buildOPDData();

    const form = await fillOPDForm({
      data: opdData,
      page,
    });

    await form.fillAll();

    await page.getByRole("button", { name: /batal/i }).click();

    await expect(page).toHaveURL(/manajemen-opd/);
  });
});

// TCMO.6 Invalid OPD Name
test.describe("TCMO.6 Super Admin fill invalid OPD name", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: /Tambah OPD/i }).click();
  });
  const invalidOPDNameCases = [
    { title: "Empty OPD name", value: "" },
    { title: "OPD name too short", value: "A" },
    { title: "OPD name with numbers", value: "OPD12345" },
    { title: "OPD name with special characters", value: "@@@###" },
    { title: "OPD name too long", value: "A".repeat(300) },
  ];

  for (const opdCase of invalidOPDNameCases) {
    test(`TCMO.6 ${opdCase.title}`, async ({ page }) => {
      const opdData = buildOPDData();

      // override namaOPD dengan invalid value
      opdData.namaOPD = opdCase.value;

      const form = await fillOPDForm({
        data: opdData,
        page,
      });

      await form.fillAll();

      await page.getByRole("button", { name: /simpan/i }).click();

      // Expected: gagal submit
      await expect(page).not.toHaveURL(/manajemen-opd/);

      // Optional assertion
      await expect(page.getByText(/Nama OPD|nama opd|invalid|wajib|warning/i)).toBeVisible();
    });
  }
});

// ================ Function tidak digunakan ===================
// // TCMO.7 Invalid Status
// test.describe("TCMO.7 Super Admin fill invalid Status", () => {
// test.beforeEach(async ({ page }) => {
//   await page.getByRole("button", { name: /Tambah OPD/i }).click();
// });
//   const invalidStatusCases = [
//     { title: "Status empty", value: "" },
//     { title: "Status placeholder", value: "Pilih Status" },
//     { title: "Invalid status value", value: "UnknownStatus" },
//   ];

//   for (const statusCase of invalidStatusCases) {
//     test(`TCMO.7 ${statusCase.title}`, async ({ page }) => {
//       const opdData = buildOPDData();

//       await fillOPDForm({
//         data: opdData,
//         page,
//       });

//       // isi status dengan data invalid
//       if (statusCase.value !== "") {
//         await page.getByLabel(/status/i).selectOption({ label: statusCase.value });
//       }

//       await page.getByRole("button", { name: /simpan/i }).click();

//       // Expected result: gagal submit
//       await expect(page).not.toHaveURL(/manajemen-opd/);

//       // optional validation message
//       await expect(page.getByText(/status wajib|invalid/i)).toBeVisible();
//     });
//   }
// });

// TCMO.8 Invalid Address
test.describe("TCMO.8 Super Admin fill invalid OPD address", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: /Tambah OPD/i }).click();
  });
  const invalidAddressCases = [
    { title: "Empty address", value: "" },
    { title: "Address too short", value: "A" },
    { title: "Address only numbers", value: "1234567890" },
    { title: "Address with special characters", value: "@@@###$$$" },
    { title: "Address too long", value: "A".repeat(300) },
  ];

  for (const addressCase of invalidAddressCases) {
    test(`TCMO.8 ${addressCase.title}`, async ({ page }) => {
      const opdData = buildOPDData();

      // override alamat dengan invalid value
      opdData.alamat = addressCase.value;

      const form = await fillOPDForm({
        data: opdData,
        page,
      });

      await form.fillAll();

      await page.getByRole("button", { name: /simpan/i }).click();

      // Expected: gagal submit
      await expect(page).not.toHaveURL(/manajemen-opd/);

      // Optional validation
      await expect(page.getByText(/alamat|wajib|invalid|warning/i)).toBeVisible();
    });
  }
});

// TCMO.9 Invalid PIC Name
test.describe("TCMO.9 Super Admin fill invalid PIC name", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: /Tambah OPD/i }).click();
  });
  const invalidPICCases = [
    { title: "Empty PIC name", value: "" },
    { title: "PIC name too short", value: "A" },
    { title: "PIC name with numbers", value: "PIC12345" },
    { title: "PIC name with special characters", value: "@@@###" },
    { title: "PIC name too long", value: "A".repeat(200) },
  ];

  for (const picCase of invalidPICCases) {
    test(`TCMO.9 ${picCase.title}`, async ({ page }) => {
      const opdData = buildOPDData();

      // override PIC dengan invalid value
      opdData.pic = picCase.value;

      const form = await fillOPDForm({
        data: opdData,
        page,
      });

      await form.fillAll();

      await page.getByRole("button", { name: /simpan/i }).click();

      // Expected: gagal submit
      await expect(page).not.toHaveURL(/manajemen-opd/);

      // Optional validation
      await expect(page.getByText(/pic|wajib|invalid/i)).toBeVisible();
    });
  }
});

// TCMO.10 Invalid Kontak
test.describe("TCMO.10 Super Admin fill invalid kontak", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: /Tambah OPD/i }).click();
  });
  const invalidKontakCases = [
    { title: "Empty kontak", value: "" },
    { title: "Kontak too short", value: "08123" },
    { title: "Kontak with letters", value: "08ABCDE123" },
    { title: "Kontak with special characters", value: "08!@#$%^&*" },
    { title: "Kontak too long", value: "081234567890123456789" },
  ];

  for (const kontakCase of invalidKontakCases) {
    test(`TCMO.10 ${kontakCase.title}`, async ({ page }) => {
      const opdData = buildOPDData();

      // override kontak dengan invalid value
      opdData.kontak = kontakCase.value;

      const form = await fillOPDForm({
        data: opdData,
        page,
      });

      await form.fillAll();

      await page.getByRole("button", { name: /simpan/i }).click();

      // Expected: gagal submit
      await page.waitForResponse(/manajemen-opd/);
      await expect(page).not.toHaveURL(/manajemen-opd/);

      // Optional validation
      await expect(page.getByText(/kontak|invalid|wajib/i)).toBeVisible();
    });
  }
});

// TCMO.11 Upload Excel OPD
test("TCMO.11 Super Admin upload OPD excel file", async ({ page }) => {
  await page.getByRole("button", { name: "Unggah dari Excel" }).click();

  const fileInput = page.locator("input[type='file']");

  await fileInput.setInputFiles("src/assets/files/Sample_Data_OPD.xlsx");
  await page.getByRole("button", { name: "Lanjutkan" }).click();

  await expect(page.getByText(/berhasil|success/i)).toBeVisible();
});

// TCMO.12 Upload Invalid Excel
test("TCMO.12 Super Admin upload invalid template excel OPD data", async ({ page }) => {
  const fileInput = page.locator("input[type='file']");

  await fileInput.setInputFiles("tests/files/Invalid_Sample_Data_OPD.xlsx");
  await page.getByRole("button", { name: "Lanjutkan" }).click();

  await expect(page.getByText(/error|invalid/i)).toBeVisible();
});

// TCMO.13 Download Template Excel
test("TCMO.13 Super Admin click Template Excel Data OPD hyperlink", async ({ page }) => {
  await page.getByRole("link", { name: /templat excel data opd/i }).click();

  await expect(page).toHaveURL(/excel|template/);
});

// TCMO.14 Cancel Upload Excel
test("TCMO.14 Super Admin cancel upload OPD data excel", async ({ page }) => {
  await page.getByRole("button", { name: /upload excel/i }).click();

  await page.getByRole("button", { name: /batal/i }).click();

  await expect(page.getByText(/upload/i)).toBeVisible();
});
