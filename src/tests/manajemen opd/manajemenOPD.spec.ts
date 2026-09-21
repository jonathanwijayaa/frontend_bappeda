import { generateOPDExcel } from "@/helpers/baseExcel.helper";
import { credentials } from "@/helpers/credentials.helper";
import { buildOPDData, fillOPDForm } from "@/helpers/formOPD.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, Page, test } from "@playwright/test";

/**
 * Field wajib pada form OPD memakai atribut `required`, sehingga browser
 * menahan submit dan menampilkan bubble bawaannya — pesan itu bukan teks di DOM
 * dan tidak bisa dicari dengan getByText. Yang diperiksa adalah status validitas
 * input dan tidak munculnya notifikasi berhasil.
 */
const expectFieldRejectedByBrowser = async (page: Page, fieldName: string) => {
  const input = page.getByRole("textbox", { name: fieldName });

  expect(await input.evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(false);
  await expect(page.getByText(/berhasil|success/i)).toBeHidden();
};

// Tombol tutup (X) pada header modal tidak punya accessible name,
// jadi dicari lewat strukturnya: <h2>judul</h2> -> parent -> button
const modalCloseButton = (page: Page, title: string) =>
  page
    .locator(`xpath=//h2[normalize-space(text())="${title}"]/parent::div/following-sibling::button`)
    .first();

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
      opdData["NAMA OPD"],
    );
    await expect(page.getByRole("textbox", { name: "Alamat OPD" })).toHaveValue(opdData.ALAMAT);
    await expect(page.getByRole("textbox", { name: "Penanggung jawab" })).toHaveValue(opdData.PIC);
    await expect(page.getByRole("textbox", { name: "Nomor telepon / email" })).toHaveValue(
      opdData.KONTAK,
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

    // Notifikasi berhasil hilang otomatis setelah beberapa detik, jadi yang
    // diperiksa adalah hasilnya: modal tertutup dan datanya ada di daftar
    await expect(page.getByRole("heading", { name: "Tambah OPD Baru" })).toBeHidden();

    await page.getByPlaceholder(/cari/i).fill(opdData["NAMA OPD"]);
    await expect(
      page.getByRole("row").filter({ hasText: opdData["NAMA OPD"] }).first(),
    ).toBeVisible();
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

    // Form harus benar-benar tertutup, bukan sekadar URL tidak berubah
    await expect(page.getByRole("heading", { name: "Tambah OPD Baru" })).toBeHidden();
    await expect(page).toHaveURL(/manajemen-opd/);
  });
});

// TCMO.6 Invalid OPD Name
test.describe("TCMO.6 Super Admin fill invalid OPD name", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: /Tambah OPD/i }).click();
  });
  const invalidOPDNameCases: {
    title: string;
    value: string;
    expectedError?: string | RegExp;
    /** Ditolak browser lewat atribut required, bukan lewat pesan di halaman */
    rejectedByBrowser?: boolean;
  }[] = [
    { title: "Empty OPD name", value: "", rejectedByBrowser: true },
    { title: "OPD name too short", value: "A", expectedError: "Nama OPD minimal 3 karakter" },
    {
      title: "OPD name with numbers",
      value: "OPD12345",
      expectedError: "Nama OPD tidak boleh mengandung angka atau karakter spesial",
    },
    {
      title: "OPD name with special characters",
      value: "@@@###",
      expectedError: "Nama OPD tidak boleh mengandung angka atau karakter spesial",
    },
    {
      title: "OPD name too long",
      value: "A".repeat(300),
      expectedError: "Nama OPD terlalu panjang (maks 100 karakter)",
    },
  ];

  for (const opdCase of invalidOPDNameCases) {
    test(`TCMO.6 ${opdCase.title}`, async ({ page }) => {
      const opdData = buildOPDData();

      // override namaOPD dengan invalid value
      opdData["NAMA OPD"] = opdCase.value;

      const form = await fillOPDForm({
        data: opdData,
        page,
      });

      await form.fillAll();

      await page.getByRole("button", { name: /simpan/i }).click();

      if (opdCase.rejectedByBrowser) {
        await expectFieldRejectedByBrowser(page, "Nama Dinas / OPD");
        return;
      }

      await expect(page.getByText(opdCase.expectedError!)).toBeVisible();
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
  const invalidAddressCases: {
    title: string;
    value: string;
    expectedError?: string | RegExp;
    rejectedByBrowser?: boolean;
  }[] = [
    { title: "Empty address", value: "", rejectedByBrowser: true },
    { title: "Address too short", value: "A", expectedError: "Alamat OPD minimal 5 karakter" },
    {
      title: "Address only numbers",
      value: "1234567890",
      expectedError: "Alamat OPD tidak boleh hanya berisi angka",
    },
    {
      title: "Address with special characters",
      value: "@@@###$$$",
      expectedError: "Alamat OPD tidak boleh mengandung karakter spesial yang tidak valid",
    },
    {
      title: "Address too long",
      value: "A".repeat(300),
      expectedError: "Alamat OPD terlalu panjang (maks 255 karakter)",
    },
  ];

  for (const addressCase of invalidAddressCases) {
    test(`TCMO.8 ${addressCase.title}`, async ({ page }) => {
      const opdData = buildOPDData();

      // override alamat dengan invalid value
      opdData.ALAMAT = addressCase.value;

      const form = await fillOPDForm({
        data: opdData,
        page,
      });

      await form.fillAll();

      await page.getByRole("button", { name: /simpan/i }).click();

      if (addressCase.rejectedByBrowser) {
        await expectFieldRejectedByBrowser(page, "Alamat OPD");
        return;
      }

      await expect(page.getByText(addressCase.expectedError!)).toBeVisible();
    });
  }
});

// TCMO.9 Invalid PIC Name
test.describe("TCMO.9 Super Admin fill invalid PIC name", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: /Tambah OPD/i }).click();
  });
  const invalidPICCases: {
    title: string;
    value: string;
    expectedError?: string | RegExp;
    rejectedByBrowser?: boolean;
  }[] = [
    { title: "Empty PIC name", value: "", rejectedByBrowser: true },
    { title: "PIC name too short", value: "A", expectedError: "Nama PIC minimal 3 karakter" },
    {
      title: "PIC name with numbers",
      value: "PIC12345",
      expectedError: "Nama PIC tidak boleh mengandung angka atau karakter spesial",
    },
    {
      title: "PIC name with special characters",
      value: "@@@###",
      expectedError: "Nama PIC tidak boleh mengandung angka atau karakter spesial",
    },
    {
      title: "PIC name too long",
      value: "A".repeat(200),
      expectedError: "Nama PIC terlalu panjang (maks 100 karakter)",
    },
  ];

  for (const picCase of invalidPICCases) {
    test(`TCMO.9 ${picCase.title}`, async ({ page }) => {
      const opdData = buildOPDData();

      // override PIC dengan invalid value
      opdData.PIC = picCase.value;

      const form = await fillOPDForm({
        data: opdData,
        page,
      });

      await form.fillAll();

      await page.getByRole("button", { name: /simpan/i }).click();

      if (picCase.rejectedByBrowser) {
        await expectFieldRejectedByBrowser(page, "Penanggung jawab");
        return;
      }

      await expect(page.getByText(picCase.expectedError!)).toBeVisible();
    });
  }
});

// TCMO.10 Invalid Kontak
test.describe("TCMO.10 Super Admin fill invalid kontak", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: /Tambah OPD/i }).click();
  });
  const invalidKontakCases: {
    title: string;
    value: string;
    expectedError?: string | RegExp;
    rejectedByBrowser?: boolean;
  }[] = [
    { title: "Empty kontak", value: "", rejectedByBrowser: true },
    {
      title: "Kontak too short",
      value: "08123",
      expectedError:
        "Format nomor kontak tidak valid (harus diawali 08 atau +628, minimal 9-13 digit angka)",
    },
    {
      title: "Kontak with letters",
      value: "08ABCDE123",
      expectedError: "Nomor kontak tidak boleh mengandung huruf",
    },
    {
      title: "Kontak with special characters",
      value: "08!@#$%^&*",
      expectedError:
        "Format nomor kontak tidak valid (harus diawali 08 atau +628, minimal 9-13 digit angka)",
    },
    {
      title: "Kontak too long",
      value: "081234567890123456789",
      expectedError:
        "Format nomor kontak tidak valid (harus diawali 08 atau +628, minimal 9-13 digit angka)",
    },
  ];

  for (const kontakCase of invalidKontakCases) {
    test(`TCMO.10 ${kontakCase.title}`, async ({ page }) => {
      const opdData = buildOPDData();

      // override kontak dengan invalid value
      opdData.KONTAK = kontakCase.value;

      const form = await fillOPDForm({
        data: opdData,
        page,
      });

      await form.fillAll();

      await page.getByRole("button", { name: /simpan/i }).click();

      if (kontakCase.rejectedByBrowser) {
        await expectFieldRejectedByBrowser(page, "Nomor telepon / email");
        return;
      }

      await expect(page.getByText(kontakCase.expectedError!)).toBeVisible();
    });
  }
});

// TCMO.11 Upload Excel OPD
test("TCMO.11 Super Admin upload OPD excel file", async ({ page }) => {
  const filePath = generateOPDExcel({ type: "valid", total: 5 });

  await page.getByRole("button", { name: "Unggah dari Excel" }).click();

  const fileInput = page.locator("input[type='file']");
  await fileInput.setInputFiles(filePath);
  await page.getByRole("button", { name: "Lanjutkan" }).click();

  // Dipastikan dulu semua baris lolos validasi, supaya kegagalan data
  // tidak terbaca sebagai kegagalan proses simpan
  await expect(page.getByRole("heading", { name: "Data Kotor (0)" })).toBeVisible();
  await page.getByRole("button", { name: "Simpan Data Bersih" }).click();

  await expect(page.getByText(/berhasil|success/i)).toBeVisible();
});

// TCMO.12 Upload Invalid Excel
test("TCMO.12 Super Admin upload invalid template excel OPD data", async ({ page }) => {
  const totalBarisInvalid = 3;
  const filePath = generateOPDExcel({ type: "invalid", total: totalBarisInvalid });

  await page.getByRole("button", { name: "Unggah dari Excel" }).click();

  const fileInput = page.locator("input[type='file']");
  await fileInput.setInputFiles(filePath);
  await page.getByRole("button", { name: "Lanjutkan" }).click();

  // Seluruh baris ditolak: tidak ada data bersih untuk disimpan
  await expect(page.getByRole("heading", { name: "Data Bersih (0)" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: `Data Kotor (${totalBarisInvalid})` }),
  ).toBeVisible();

  // Tombol simpan berubah jadi "Tidak Ada Data Bersih" dan tidak bisa diklik
  const simpanButton = page.getByRole("button", {
    name: /simpan data bersih|tidak ada data bersih/i,
  });
  await expect(simpanButton).toBeDisabled();

  // Tiap baris bermasalah didaftar beserta keterangan masalahnya
  const tabelDataKotor = page.locator(
    'xpath=//h3[starts-with(normalize-space(.), "Data Kotor")]/following::table[1]',
  );
  const barisKotor = tabelDataKotor.locator("tbody tr");

  await expect(barisKotor).toHaveCount(totalBarisInvalid);
  await expect(barisKotor.first().getByRole("listitem").first()).toBeVisible();
});

// TCMO.13 Download Template Excel
test("TCMO.13 Super Admin click Template Excel Data OPD hyperlink", async ({ page }) => {
  await page.getByRole("button", { name: "Unggah dari Excel" }).click();

  await page.getByRole("link", { name: /templat excel data opd/i }).click();

  await expect(page).toHaveURL(/excel|template|dokumen|download/);
});

// TCMO.14 Cancel Upload Excel
test("TCMO.14 Super Admin cancel upload OPD data excel", async ({ page }) => {
  const filePath = generateOPDExcel({ type: "valid", total: 1 });

  await page.getByRole("button", { name: "Unggah dari Excel" }).click();

  const fileInput = page.locator("input[type='file']");
  await fileInput.setInputFiles(filePath);

  await modalCloseButton(page, "Unggah Data OPD").click();

  // Modal harus tertutup — sebelumnya hanya memeriksa judul halaman,
  // yang tetap terlihat di belakang modal sehingga selalu lolos
  await expect(page.getByRole("heading", { name: "Unggah Data OPD" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Manajemen OPD" })).toBeVisible();
});
