import { generateOPDExcel } from "@/helpers/baseExcel.helper";
import { credentials } from "@/helpers/credentials.helper";
import { buildOPDData, fillOPDForm } from "@/helpers/formOPD.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink, LOAD_TIME, uploadThink } from "@/helpers/timing.helper";
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
  await clickThink(page.getByRole("link", { name: /manajemen opd/i }));
});

// TCMO.1 Access Manajemen OPD
test("TCMO.1 Super Admin access Manajemen OPD page", async ({ page }) => {
  await expect(page).toHaveURL(/manajemen-opd/);
});

// TCMO.2 Click Tambah OPD
test("TCMO.2 Super Admin click Tambah OPD button", async ({ page }) => {
  await clickThink(page.getByRole("button", { name: /Tambah OPD/i }));

  await expect(page.getByRole("heading", { name: "Tambah OPD Baru" })).toBeVisible();
});

test.describe("TCMO.3-5 Fill Form Add OPD", () => {
  test.beforeEach(async ({ page }) => {
    await clickThink(page.getByRole("button", { name: /Tambah OPD/i }));
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

    await clickThink(page.getByRole("button", { name: /simpan/i }));

    // Notifikasi berhasil hilang otomatis setelah beberapa detik, jadi yang
    // diperiksa adalah hasilnya: modal tertutup dan datanya ada di daftar
    await expect(page.getByRole("heading", { name: "Tambah OPD Baru" })).toBeHidden();

    await fillThink(page.getByPlaceholder(/cari/i), opdData["NAMA OPD"]);
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

    await clickThink(page.getByRole("button", { name: /batal/i }));

    // Form harus benar-benar tertutup, bukan sekadar URL tidak berubah
    await expect(page.getByRole("heading", { name: "Tambah OPD Baru" })).toBeHidden();
    await expect(page).toHaveURL(/manajemen-opd/);
  });
});

// TCMO.6 Invalid OPD Name
test.describe("TCMO.6 Super Admin fill invalid OPD name", () => {
  test.beforeEach(async ({ page }) => {
    await clickThink(page.getByRole("button", { name: /Tambah OPD/i }));
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

      await clickThink(page.getByRole("button", { name: /simpan/i }));

      if (opdCase.rejectedByBrowser) {
        await expectFieldRejectedByBrowser(page, "Nama Dinas / OPD");
        return;
      }

      await expect(page.getByText(opdCase.expectedError!)).toBeVisible();
    });
  }
});

// ================ Function tidak digunakan ===================
// Deferred TC: TCMO.7 ditunda, skrip di bawah tidak dijalankan.
// // TCMO.7 Invalid Status
// test.describe("TCMO.7 Super Admin fill invalid Status", () => {
// test.beforeEach(async ({ page }) => {
//   await clickThink(page.getByRole("button", { name: /Tambah OPD/i }));
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

//       await clickThink(page.getByRole("button", { name: /simpan/i }));

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
    await clickThink(page.getByRole("button", { name: /Tambah OPD/i }));
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

      await clickThink(page.getByRole("button", { name: /simpan/i }));

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
    await clickThink(page.getByRole("button", { name: /Tambah OPD/i }));
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

      await clickThink(page.getByRole("button", { name: /simpan/i }));

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
    await clickThink(page.getByRole("button", { name: /Tambah OPD/i }));
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

      await clickThink(page.getByRole("button", { name: /simpan/i }));

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

  await clickThink(page.getByRole("button", { name: "Unggah dari Excel" }));

  const fileInput = page.locator("input[type='file']");
  await uploadThink(fileInput, filePath);
  await clickThink(page.getByRole("button", { name: "Lanjutkan" }));

  // Dipastikan dulu semua baris lolos validasi, supaya kegagalan data
  // tidak terbaca sebagai kegagalan proses simpan
  await expect(page.getByRole("heading", { name: "Data Kotor (0)" })).toBeVisible();
  await clickThink(page.getByRole("button", { name: "Simpan Data Bersih" }));

  await expect(page.getByText(/berhasil|success/i)).toBeVisible();
});

// TCMO.12 Upload Invalid Excel
test("TCMO.12 Super Admin upload invalid template excel OPD data", async ({ page }) => {
  const totalBarisInvalid = 3;
  const filePath = generateOPDExcel({ type: "invalid", total: totalBarisInvalid });

  await clickThink(page.getByRole("button", { name: "Unggah dari Excel" }));

  const fileInput = page.locator("input[type='file']");
  await uploadThink(fileInput, filePath);
  await clickThink(page.getByRole("button", { name: "Lanjutkan" }));

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
  await clickThink(page.getByRole("button", { name: "Unggah dari Excel" }));

  await clickThink(page.getByRole("link", { name: /templat excel data opd/i }));

  await expect(page).toHaveURL(/excel|template|dokumen|download/);
});

// TCMO.14 Cancel Upload Excel
test("TCMO.14 Super Admin cancel upload OPD data excel", async ({ page }) => {
  const filePath = generateOPDExcel({ type: "valid", total: 1 });

  await clickThink(page.getByRole("button", { name: "Unggah dari Excel" }));

  const fileInput = page.locator("input[type='file']");
  await uploadThink(fileInput, filePath);

  await clickThink(modalCloseButton(page, "Unggah Data OPD"));

  // Modal harus tertutup — sebelumnya hanya memeriksa judul halaman,
  // yang tetap terlihat di belakang modal sehingga selalu lolos
  await expect(page.getByRole("heading", { name: "Unggah Data OPD" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Manajemen OPD" })).toBeVisible();
});

// ── Tabel Daftar OPD (TCMO.15, TCMO.24–33) ────────────────────────────────
// Kolom tabel: 1 Nama OPD, 2 Status, 3 Alamat, 4 PIC, 5 Kontak, 6 Aksi.
const KOLOM = { alamat: 3, kontak: 5, nama: 1, pic: 4, status: 2 };

// Table menyisipkan baris kosong (satu <td> ber-colSpan) untuk menjaga tinggi
// tabel, jadi baris data dikenali dari kolomnya yang lebih dari satu.
const barisData = (page: Page) => page.locator("table tbody tr:has(td:nth-child(2))");

const nilaiKolom = async (page: Page, kolom: number) =>
  (await barisData(page).locator(`td:nth-child(${kolom})`).allInnerTexts()).map((teks) =>
    teks.trim(),
  );

const searchField = (page: Page) => page.getByPlaceholder("Cari");
const infoJumlah = (page: Page) => page.getByText(/Menampilkan \d+-\d+ dari \d+ OPD/);
const totalOPD = async (page: Page) =>
  Number((await infoJumlah(page).innerText()).match(/dari (\d+)/)![1]);
const emptyState = (page: Page) => page.getByText("Belum ada OPD", { exact: true });

// Input pada modal Detail OPD tidak punya placeholder/label terhubung,
// jadi dikenali lewat atribut name-nya
const detailInput = (page: Page, name: string) => page.locator(`input[name="${name}"]`).first();

const tungguTabel = async (page: Page) => {
  await expect(barisData(page).first()).toBeVisible({ timeout: LOAD_TIME });
};

// TCMO.15, TCMO.24–28 Search Bar
test.describe("TCMO.15 & TCMO.24-28 Super Admin Search Bar", () => {
  test.beforeEach(async ({ page }) => {
    await tungguTabel(page);
  });

  // Kata kunci diambil dari baris pertama tabel supaya tidak bergantung
  // pada data seed tertentu yang bisa berubah.
  const searchCases = [
    {
      adaHasil: true,
      id: "TCMO.15",
      kata: (nama: string) => nama,
      title: "input keyword in search bar",
    },
    {
      adaHasil: true,
      id: "TCMO.24",
      kata: (nama: string) => nama.toUpperCase(),
      title: "input with upper case",
    },
    {
      adaHasil: true,
      id: "TCMO.25",
      kata: (nama: string) => nama.toLowerCase(),
      title: "input with lower case",
    },
    {
      adaHasil: true,
      id: "TCMO.26",
      kata: () => "Dinas",
      title: "input with specific word (OPD name)",
    },
    { adaHasil: false, id: "TCMO.27", kata: () => "abcdxyz", title: "input with random keyword" },
    {
      adaHasil: false,
      id: "TCMO.28",
      kata: () => "@#$%^&",
      title: "input with special characters",
    },
  ];

  for (const searchCase of searchCases) {
    test(`${searchCase.id} Super Admin ${searchCase.title}`, async ({ page }) => {
      const totalAwal = await totalOPD(page);
      const keyword = searchCase.kata((await nilaiKolom(page, KOLOM.nama))[0]);

      // Pencarian berjalan saat mengetik (onChange), bukan saat menekan Enter
      await fillThink(searchField(page), keyword);

      if (!searchCase.adaHasil) {
        await expect(emptyState(page)).toBeVisible();
        await expect(page.getByText(/tidak ada opd yang cocok dengan pencarian/i)).toBeVisible();
        await expect(page.getByRole("table")).toBeHidden();
        return;
      }

      await expect(barisData(page).first()).toBeVisible();
      expect(await totalOPD(page)).toBeLessThanOrEqual(totalAwal);

      // Setiap baris hasil harus mengandung kata kunci (pencarian tidak peka huruf besar/kecil)
      const nama = await nilaiKolom(page, KOLOM.nama);
      const alamat = await nilaiKolom(page, KOLOM.alamat);
      const pic = await nilaiKolom(page, KOLOM.pic);
      const kontak = await nilaiKolom(page, KOLOM.kontak);
      for (let i = 0; i < nama.length; i++) {
        expect(`${nama[i]} ${alamat[i]} ${pic[i]} ${kontak[i]}`.toLowerCase()).toContain(
          keyword.toLowerCase(),
        );
      }
    });
  }
});

// TCMO.29 Export Daftar OPD
test("TCMO.29 Super Admin export Daftar OPD tabel", async ({ page }) => {
  await tungguTabel(page);

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: LOAD_TIME }),
    clickThink(page.getByRole("button", { name: "Ekspor PDF" })),
  ]);

  expect(download.suggestedFilename()).toMatch(/^manajemen-opd-\d{4}-\d{2}-\d{2}\.pdf$/);
  await expect(page.getByText(/berhasil diekspor/i)).toBeVisible();
});

// TCMO.30 Akses detail OPD
test("TCMO.30 Super Admin access OPD's detail", async ({ page }) => {
  await tungguTabel(page);
  const nama = (await nilaiKolom(page, KOLOM.nama))[0];
  const kontak = (await nilaiKolom(page, KOLOM.kontak))[0];

  await clickThink(barisData(page).first().getByRole("button", { name: "Detail" }));

  await expect(page.getByRole("heading", { name: "Detail OPD" })).toBeVisible();
  await expect(detailInput(page, "nama_opd")).toHaveValue(nama);
  await expect(detailInput(page, "kontak")).toHaveValue(kontak);
  await expect(page.getByText("Tanggal Dibuat")).toBeVisible();

  // Tombol simpan baru aktif setelah ada perubahan (perubahan tidak disimpan)
  const simpan = page.getByRole("button", { name: "Simpan" });
  await expect(simpan).toBeDisabled();
  await fillThink(detailInput(page, "alamat"), "Jl. Uji Perubahan Detail No. 1, Yogyakarta");
  await expect(simpan).toBeEnabled();
});

// TCMO.31–32 Nonaktif / batal nonaktif OPD
test.describe("TCMO.31-32 Super Admin Toggle Status OPD", () => {
  // TCMO.31 Nonaktifkan OPD, lalu aktifkan kembali.
  // Memakai OPD uji yang dibuat di test ini sendiri, supaya OPD yang dipakai
  // akun/test lain (mis. "Opd Demo") tidak ikut dinonaktifkan.
  test("TCMO.31 Super Admin Nonaktif OPD", async ({ page }) => {
    const opdData = buildOPDData();
    await clickThink(page.getByRole("button", { name: /Tambah OPD/i }));
    const form = await fillOPDForm({ data: opdData, page });
    await form.fillAll();
    await clickThink(page.getByRole("button", { name: /simpan/i }));
    await expect(page.getByRole("heading", { name: "Tambah OPD Baru" })).toBeHidden();

    await fillThink(searchField(page), opdData["NAMA OPD"]);
    const baris = barisData(page).first();
    await expect(baris).toBeVisible();
    await expect(baris.locator(`td:nth-child(${KOLOM.status})`)).toHaveText("Aktif");

    // Nonaktifkan
    await clickThink(baris.getByRole("button", { name: "Nonaktif" }));
    await expect(page.getByRole("heading", { name: "Konfirmasi" })).toBeVisible();
    await expect(page.getByText(/yakin ingin menonaktifkan opd ini/i)).toBeVisible();
    await clickThink(page.getByRole("button", { name: "Lanjutkan" }));

    await expect(page.getByRole("heading", { name: "Konfirmasi" })).toBeHidden();
    await expect(baris.locator(`td:nth-child(${KOLOM.status})`)).toHaveText("Tidak Aktif", {
      timeout: LOAD_TIME,
    });

    // Kembalikan ke status aktif supaya data uji tetap bersih
    await clickThink(baris.getByRole("button", { name: "Aktifkan" }));
    await clickThink(page.getByRole("button", { name: "Lanjutkan" }));
    await expect(baris.locator(`td:nth-child(${KOLOM.status})`)).toHaveText("Aktif", {
      timeout: LOAD_TIME,
    });
  });

  // TCMO.32 Batalkan nonaktif OPD
  test("TCMO.32 Super Admin cancel Nonaktif OPD", async ({ page }) => {
    await tungguTabel(page);

    // Baris dikunci lewat pencarian nama agar tidak bergeser bila ada OPD baru
    const nama = (await nilaiKolom(page, KOLOM.nama))[0];
    await fillThink(searchField(page), nama);
    const baris = barisData(page).first();
    const statusAwal = (await baris.locator(`td:nth-child(${KOLOM.status})`).innerText()).trim();
    const tombolToggle = statusAwal === "Aktif" ? "Nonaktif" : "Aktifkan";

    await clickThink(baris.getByRole("button", { name: tombolToggle }));
    await expect(page.getByRole("heading", { name: "Konfirmasi" })).toBeVisible();

    await clickThink(page.getByRole("button", { name: "Batal" }));

    // Dialog tertutup dan status OPD tidak berubah
    await expect(page.getByRole("heading", { name: "Konfirmasi" })).toBeHidden();
    await expect(baris.locator(`td:nth-child(${KOLOM.status})`)).toHaveText(statusAwal);
  });
});

// TCMO.33 Pagination
test("TCMO.33 Super Admin open next OPD tabel", async ({ page }) => {
  await tungguTabel(page);
  const total = await totalOPD(page);
  test.skip(total <= 5, "Data OPD kurang dari dua halaman, pagination tidak relevan");

  await expect(barisData(page)).toHaveCount(5);
  await expect(infoJumlah(page)).toHaveText(new RegExp(`Menampilkan 1-5 dari ${total} OPD`));
  await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();

  const halamanSatu = await nilaiKolom(page, KOLOM.nama);

  await clickThink(page.getByRole("button", { name: "Selanjutnya" }));

  await expect(infoJumlah(page)).toHaveText(new RegExp(`Menampilkan 6-\\d+ dari ${total} OPD`));
  expect(await nilaiKolom(page, KOLOM.nama)).not.toEqual(halamanSatu);

  await clickThink(page.getByRole("button", { name: "Sebelumnya" }));

  await expect(infoJumlah(page)).toHaveText(new RegExp(`Menampilkan 1-5 dari ${total} OPD`));
  expect(await nilaiKolom(page, KOLOM.nama)).toEqual(halamanSatu);
});
