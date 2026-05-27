import { generateRelawanExcel } from "@/helpers/baseExcel.helper";
import { credentials } from "@/helpers/credentials.helper";
import {
  buildRelawanData,
  fillRelawanForm,
  pengajuanTable,
  selectKader,
  selectOPD,
  selectPenugasan,
} from "@/helpers/formRelawan.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { ensurePengajuanExists } from "@/helpers/submitPengajuan.helper";
import { expect, test } from "@playwright/test";

const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

for (const { label, creds } of roles) {
  test.describe(`Data Relawan - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await page.getByRole("link", { name: "Relawan", exact: true }).click();
    });

    // TCDR.1
    test(`TCDR.1 ${label} access Data Relawan page`, async ({ page }) => {
      await expect(page).toHaveURL(/relawan/);
    });

    // TCDR.2
    test(`TCDR.2 ${label} click Ajukan Relawan Baru button`, async ({ page }) => {
      await page.getByRole("button", { name: /Tambah Relawan/i }).click();

      await expect(page.getByRole("heading", { name: "Tambah Relawan Baru" })).toBeVisible();
    });

    // TCDR.3-5 Fill Form
    test.describe(`TCDR.3-5 ${label} Fill Form Add Relawan`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: /Tambah Relawan/i }).click();
      });

      // TCDR.3
      test(`TCDR.3 ${label} fill tambah Relawan data form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();

        await expect(page.getByRole("textbox", { name: "Nama lengkap" })).toHaveValue(
          relawanData["NAMA LENGKAP"],
        );
        await expect(page.getByRole("textbox", { name: "NIK" })).toHaveValue(relawanData.NIK);
        await expect(page.getByRole("textbox", { name: "Alamat" })).toHaveValue(relawanData.ALAMAT);
        await expect(page.getByRole("textbox", { name: "Nomor HP" })).toHaveValue(
          relawanData["NO HP"],
        );
      });

      // TCDR.4
      test(`TCDR.4 ${label} save new Relawan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();

        await page.getByRole("button", { name: /simpan/i }).click();

        await expect(page.getByText(/berhasil|success|data baru ditambahkan./i)).toBeVisible();
      });

      // TCDR.5
      test(`TCDR.5 ${label} cancel new Relawan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();

        await page.getByRole("button").filter({ hasText: /^$/ }).nth(2).click();

        await expect(page).toHaveURL(/relawan/);
      });
    });

    // TCDR.6-9 Invalid Form
    test.describe(`TCDR.6-9 ${label} Fill Form Invalid`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: /Tambah Relawan/i }).click();
      });

      // TCDR.6 Invalid Relawan Name
      test.describe(`TCDR.6 ${label} invalid Relawan name`, () => {
        const invalidNameCases = [
          { title: "Empty name", value: "", expectedMessage: null },
          { title: "Name too short", value: "A", expectedMessage: /minimal 3 karakter/i },
          {
            title: "Name with numbers",
            value: "Relawan12345",
            expectedMessage: /tidak boleh mengandung angka atau karakter spesial/i,
          },
          {
            title: "Name with special characters",
            value: "@@@###",
            expectedMessage: /tidak boleh mengandung angka atau karakter spesial/i,
          },
          {
            title: "Name too long",
            value: "A".repeat(300),
            expectedMessage: /terlalu panjang|maks 100 karakter/i,
          },
        ];

        for (const nameCase of invalidNameCases) {
          test(`TCDR.6 ${nameCase.title}`, async ({ page }) => {
            const relawanData = buildRelawanData();
            relawanData["NAMA LENGKAP"] = nameCase.value;

            const form = await fillRelawanForm({ data: relawanData, page });
            await form.fillAll();
            await page.getByRole("button", { name: /simpan/i }).click();

            if (nameCase.expectedMessage === null) {
              const namaInput = page.getByRole("textbox", { name: "Nama lengkap" });
              const isValid = await namaInput.evaluate((el: HTMLInputElement) =>
                el.checkValidity(),
              );
              expect(isValid).toBe(false);
            } else {
              await expect(page.getByText(nameCase.expectedMessage)).toBeVisible();
            }
          });
        }
      });

      // TCDR.7 Invalid NIK
      test.describe(`TCDR.7 ${label} invalid NIK`, () => {
        const invalidNIKCases = [
          { title: "Empty NIK", value: "", expectedMessage: null },
          {
            title: "NIK too short",
            value: "1234567890",
            expectedMessage: /NIK harus terdiri dari tepat 16 digit angka/i,
          },
          {
            title: "NIK with letters",
            value: "320100ABCD123456",
            expectedMessage: /NIK harus terdiri dari tepat 16 digit angka/i,
          },
          {
            title: "NIK with special characters",
            value: "3201@#$%^&123456",
            expectedMessage: /NIK harus terdiri dari tepat 16 digit angka/i,
          },
          {
            title: "NIK too long",
            value: "32010000000000001",
            expectedMessage: /NIK harus terdiri dari tepat 16 digit angka/i,
          },
        ];

        for (const nikCase of invalidNIKCases) {
          test(`TCDR.7 ${nikCase.title}`, async ({ page }) => {
            const relawanData = buildRelawanData();
            relawanData.NIK = nikCase.value;

            const form = await fillRelawanForm({ data: relawanData, page });
            await form.fillAll();
            await page.getByRole("button", { name: /simpan/i }).click();

            if (nikCase.expectedMessage === null) {
              const nikInput = page.getByRole("textbox", { name: "NIK" });
              const isValid = await nikInput.evaluate((el: HTMLInputElement) => el.checkValidity());
              expect(isValid).toBe(false);
            } else {
              await expect(page.getByText(nikCase.expectedMessage)).toBeVisible();
            }
          });
        }
      });

      // TCDR.8 Invalid Address
      test.describe(`TCDR.8 ${label} invalid Relawan address`, () => {
        const invalidAddressCases = [
          { title: "Empty address", value: "", expectedMessage: null },
          { title: "Address too short", value: "A", expectedMessage: /minimal 3 karakter/i },
          {
            title: "Address only numbers",
            value: "1234567890",
            expectedMessage: /alamat tidak valid|hanya angka/i,
          },
          {
            title: "Address with special characters",
            value: "@@@###$$$",
            expectedMessage: /tidak boleh mengandung karakter spesial/i,
          },
          {
            title: "Address too long",
            value: "A".repeat(300),
            expectedMessage: /terlalu panjang|maks \d+ karakter/i,
          },
        ];

        for (const addressCase of invalidAddressCases) {
          test(`TCDR.8 ${addressCase.title}`, async ({ page }) => {
            const relawanData = buildRelawanData();
            relawanData.ALAMAT = addressCase.value;

            const form = await fillRelawanForm({ data: relawanData, page });
            await form.fillAll();
            await page.getByRole("button", { name: /simpan/i }).click();

            if (addressCase.expectedMessage === null) {
              const alamatInput = page.getByRole("textbox", { name: "Alamat sesuai KTP" });
              const isValid = await alamatInput.evaluate((el: HTMLInputElement) =>
                el.checkValidity(),
              );
              expect(isValid).toBe(false);
            } else {
              await expect(page.getByText(addressCase.expectedMessage)).toBeVisible();
            }
          });
        }
      });

      // TCDR.9 Invalid Phone Number
      test.describe(`TCDR.9 ${label} invalid phone number`, () => {
        const invalidPhoneCases = [
          { title: "Empty phone number", value: "", expectedMessage: null },
          {
            title: "Phone number too short",
            value: "08123",
            expectedMessage: /nomor hp tidak valid.*harus 10.*13 digit angka/i,
          },
          {
            title: "Phone number with letters",
            value: "08ABCDE123",
            expectedMessage: /nomor hp tidak valid.*harus 10.*13 digit angka/i,
          },
          {
            title: "Phone number with special characters",
            value: "08!@#$%^&*",
            expectedMessage: /nomor hp tidak valid.*harus 10.*13 digit angka/i,
          },
          {
            title: "Phone number too long",
            value: "081234567890123456789",
            expectedMessage: /nomor hp tidak valid.*harus 10.*13 digit angka/i,
          },
        ];

        for (const phoneCase of invalidPhoneCases) {
          test(`TCDR.9 ${phoneCase.title}`, async ({ page }) => {
            const relawanData = buildRelawanData();
            relawanData["NO HP"] = phoneCase.value;

            const form = await fillRelawanForm({ data: relawanData, page });
            await form.fillAll();
            await page.getByRole("button", { name: /simpan/i }).click();

            if (phoneCase.expectedMessage === null) {
              const phoneInput = page.getByRole("textbox", { name: "Nomor HP" });
              const isValid = await phoneInput.evaluate((el: HTMLInputElement) =>
                el.checkValidity(),
              );
              expect(isValid).toBe(false);
            } else {
              await expect(
                page.getByText(/nomor hp tidak valid.*harus 10.*13 digit angka/i),
              ).toBeVisible();
            }
          });
        }
      });
    });

    // TCDR.10-16 Penugasan Form
    test.describe(`TCDR.10-16 ${label} Penugasan Form`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: /Tambah Relawan/i }).click();
      });

      // TCDR.10
      test(`TCDR.10 ${label} fill Penugasan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();

        await expect(page.getByRole("textbox", { name: "Penugasan" })).toHaveValue(
          relawanData.PENUGASAN,
        );
      });

      // TCDR.11
      test(`TCDR.11 ${label} select OPD on Penugasan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();
        await selectOPD({ data: relawanData, page });

        await expect(page.getByRole("textbox", { name: "OPD" })).toHaveValue(relawanData.OPD);
      });

      // TCDR.12
      test(`TCDR.12 ${label} select Kader on Penugasan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();
        await selectOPD({ data: relawanData, page });
        await selectKader({ data: relawanData, page });

        await expect(page.getByRole("textbox", { name: "Kader" })).toHaveValue(relawanData.KADER);
      });

      // TCDR.13
      test(`TCDR.13 ${label} select Peran on Penugasan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();
        await selectPenugasan({ data: relawanData, page });

        await expect(page.getByRole("textbox", { name: "Penugasan" })).toHaveValue(
          relawanData.PENUGASAN,
        );
      });

      // // TCDR.14 Invalid SK Number
      // test.describe(`TCDR.14 ${label} invalid SK Number`, () => {
      //   const invalidSKCases = [
      //     { title: "Empty SK number", value: "" },
      //     { title: "SK number too short", value: "SK" },
      //     { title: "SK number with special characters", value: "@@@###" },
      //     { title: "SK number too long", value: "SK" + "A".repeat(200) },
      //   ];

      //   for (const skCase of invalidSKCases) {
      //     test(`TCDR.14 ${skCase.title}`, async ({ page }) => {
      //       const relawanData = buildRelawanData();
      //       const form = await fillRelawanForm({ data: relawanData, page });
      //       await form.fillAll();

      //       await page.getByRole("textbox", { name: /nomor sk/i }).fill(skCase.value);

      //       await page.getByRole("button", { name: /simpan/i }).click();

      //       await expect(page).not.toHaveURL(/data-relawan/);
      //       await expect(page.getByText(/sk|nomor|wajib|invalid/i)).toBeVisible();
      //     });
      //   }
      // });

      // TCDR.15
      test(`TCDR.15 ${label} select status keaktifan`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();
        await form.fillStatusKeaktifan();

        if (relawanData["STATUS KEAKTIFAN"]) {
          await expect(
            page.locator(`input[type="radio"][value="${relawanData["STATUS KEAKTIFAN"]}"]`),
          ).toBeChecked();
        } else {
          await expect(page.locator(`input[type="radio"][value="Aktif"]`)).toBeChecked();
        }
      });

      // TCDR.16
      test(`TCDR.16 ${label} add more data penugasan`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillAll();
        await page.getByRole("button", { name: /tambah data penugasan/i }).click();

        await expect(page.getByRole("textbox", { name: "OPD" }).nth(1)).toBeVisible();
      });
    });

    // TCDR.17 Upload Valid Excel
    test(`TCDR.17 ${label} upload Relawan data excel file`, async ({ page }) => {
      const filePath = generateRelawanExcel({ type: "valid", total: 5 });

      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      const fileInput = page.locator("input[type='file']");
      await fileInput.setInputFiles(filePath);
      await page.getByRole("button", { name: /lanjutkan/i }).click();
      await expect(page.getByRole("heading", { name: "Data Kotor (0)" })).toBeVisible();
      await page.getByRole("button", { name: /simpan data bersih/i }).click();

      await expect(page.getByText(/berhasil|success|data baru ditambahkan/i)).toBeVisible();
    });

    // TCDR.18 Upload Invalid Excel
    test(`TCDR.18 ${label} upload invalid template excel Relawan data`, async ({ page }) => {
      const filePath = generateRelawanExcel({ type: "invalid", total: 3 });

      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      const fileInput = page.locator("input[type='file']");
      const saveButton = page.getByRole("button", { name: /data/i });
      await fileInput.setInputFiles(filePath);
      await page.getByRole("button", { name: /lanjutkan/i }).click();
      await page.waitForTimeout(5000);
      if (await saveButton.isEnabled()) {
        await saveButton.click();
        await expect(page.getByText(/error|invalid/i)).toBeVisible();
      }

      await expect(saveButton).toBeDisabled();
      await expect(
        page.locator(".border.rounded-lg.overflow-y-auto.flex-1.bg-white.border-red-200"),
      ).toBeVisible();
    });

    // TCDR.19 Download Template Excel
    test(`TCDR.19 ${label} click Templat Excel Relawan Kader hyperlink`, async ({ page }) => {
      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      await page.getByRole("link", { name: "Unduh Templat Excel Data" }).click();

      await expect(page).toHaveURL(/excel|template|dokumen|download/);
    });

    // TCDR.20 Cancel Upload Excel
    test(`TCDR.20 ${label} cancel upload Relawan data excel`, async ({ page }) => {
      const filePath = generateRelawanExcel({ type: "valid", total: 1 });

      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      const fileInput = page.locator("input[type='file']");
      await fileInput.setInputFiles(filePath);

      await page.getByRole("button").filter({ hasText: /^$/ }).nth(2).click();

      await expect(page.getByRole("main")).toBeVisible();
      await expect(
        page
          .locator("div")
          .filter({ hasText: /^Unggah Data Relawan$/ })
          .first(),
      ).not.toBeVisible();
      await expect(page.locator(".px-6.py-6")).not.toBeVisible();
    });

    // TCDR.21-26 Search Bar
    test.describe(`TCDR.21-26 ${label} Search Bar`, () => {
      const searchCases = [
        {
          id: "TCDR.21",
          title: "input keyword in search bar",
          keyword: "Relawan Demo",
          expectNoData: false,
          expectedContent: /relawan demo/i,
        },
        {
          id: "TCDR.22",
          title: "input with upper case",
          keyword: "RELAWAN DEMO",
          expectNoData: false,
          expectedContent: /relawan demo/i,
        },
        {
          id: "TCDR.23",
          title: "input with lower case",
          keyword: "relawan demo",
          expectNoData: false,
          expectedContent: /relawan demo/i,
        },
        {
          id: "TCDR.24",
          title: "input with specific word (NIK)",
          keyword: "0000000000000000",
          expectNoData: false,
          expectedContent: /0000000000000000/,
        },
        {
          id: "TCDR.25",
          title: "input with random keyword",
          keyword: "xqz99randomkeyword",
          expectNoData: true,
          expectedContent: null,
        },
        {
          id: "TCDR.26",
          title: "input with special characters",
          keyword: "@#$%^&*()",
          expectNoData: true,
          expectedContent: null,
        },
      ];

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${label} ${searchCase.title}`, async ({ page }) => {
          const searchInput = page.getByRole("textbox", { name: /cari|search/i });
          await searchInput.fill(searchCase.keyword);

          // Gunakan tabel Daftar Relawan secara spesifik — berdasarkan header kolom
          const relawanTable = page
            .getByRole("table")
            .filter({ hasText: /nama.*nik.*alamat.*kelurahan/i });

          if (searchCase.expectNoData) {
            await expect(page.getByText(/Belum ada relawan/i)).toBeVisible();
          } else {
            await expect(relawanTable).toBeVisible();

            const matchingRows = relawanTable
              .getByRole("row")
              .filter({ hasText: searchCase.expectedContent! });

            await expect(matchingRows.first()).toBeVisible();
            expect(await matchingRows.count()).toBeGreaterThan(0);
          }
        });
      }
    });

    // TCDR.27 Access Relawan Detail
    test(`TCDR.27 ${label} access Relawan detail`, async ({ page }) => {
      await page.getByRole("button", { name: "Detail" }).first().click();

      await expect(page.getByRole("heading", { name: /detail relawan/i })).toBeVisible();
    });

    // TCDR.28-31 Detail Page
    test.describe(`TCDR.28-31 ${label} Detail Relawan`, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "Detail" }).first().click();
        await expect(page.getByRole("heading", { name: /detail relawan/i })).toBeVisible();
      });

      // TCDR.28
      test(`TCDR.28 ${label} edit Relawan detail form`, async ({ page }) => {
        const relawanData = buildRelawanData();

        await page.getByRole("button", { name: /edit/i }).click();

        const form = await fillRelawanForm({ data: relawanData, page });
        await form.fillNamaLengkap();
        await form.fillAlamat();
        await form.fillNoHP();

        await page.getByRole("button", { name: /simpan/i }).click();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // TCDR.29
      test(`TCDR.29 ${label} edit Relawan penugasan detail form`, async ({ page }) => {
        await page.getByRole("button", { name: /edit/i }).click();

        const relawanData = buildRelawanData();
        await selectOPD({ data: relawanData, page });
        await selectKader({ data: relawanData, page });
        await selectPenugasan({ data: relawanData, page });

        await page.getByRole("button", { name: /simpan/i }).click();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // -------- TCDR.30 - TCDR.31 dihilangkan sementara untuk penyesuaian dengan perubahan form penugasan --------
      // TCDR.30
      test(`TCDR.30 ${label} delete penugasan on detail form`, async ({ page }) => {
        await page.getByRole("button", { name: /hapus/i }).first().click();
        await page.getByRole("button", { name: /ya|konfirmasi/i }).click();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // TCDR.31
      test(`TCDR.31 ${label} click Lihat SK hyperlink`, async ({ page }) => {
        await page.getByRole("link", { name: /lihat sk/i }).click();

        await expect(page).toHaveURL(/sk|dokumen|document/);
      });
    });

    // Salin blok ini ke dataRelawan.spec.ts sebagai pengganti
    // test.describe TCDR.32-35 yang lama.
    //
    // Tambahkan import di bagian atas file:
    //   import { ensurePengajuanExists } from "@/helpers/submitPengajuan.helper";

    // TCDR.32-35 Tabel Pengajuan Perubahan Data
    test.describe(`TCDR.32-35 ${label} Pengajuan Perubahan Data`, () => {
      // -----------------------------------------------------------
      // SETUP
      // `browser` fixture dibutuhkan untuk membuka isolated context
      // relawan tanpa mengganggu session Super Admin/OPD di `page`.
      // -----------------------------------------------------------
      test.beforeEach(async ({ page, browser }) => {
        // Pastikan sudah di halaman Data Relawan
        await expect(page).toHaveURL(/relawan/);

        // Jika belum ada pengajuan pending, buat dulu lewat akun relawan
        await ensurePengajuanExists(page, browser);

        // Verifikasi section Pengajuan Perubahan Data tampil
        await expect(page.getByRole("heading", { name: "Pengajuan Perubahan Data" })).toBeVisible();
        await expect(pengajuanTable(page)).toBeVisible();

        // Klik Review pada baris pertama yang berstatus Menunggu
        await pengajuanTable(page)
          .getByRole("row")
          .filter({ hasText: /menunggu|pending/i })
          .first()
          .getByRole("button", { name: /review/i })
          .click();

        // Centang checkbox konfirmasi verifikasi
        await page.getByRole("checkbox", { name: /saya telah memverifikasi/i }).click();
      });

      // TCDR.32
      test(`TCDR.32 ${label} access Relawan Review`, async ({ page }) => {
        await expect(
          page.getByRole("heading", { name: /review pengajuan perubahan data/i }),
        ).toBeVisible();
      });

      // TCDR.33
      test(`TCDR.33 ${label} accept Pengajuan perubahan data`, async ({ page }) => {
        await page
          .getByRole("button", { name: /setuju|terima|accept/i })
          .first()
          .click();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // TCDR.34
      test(`TCDR.34 ${label} decline Pengajuan perubahan data`, async ({ page }) => {
        await page
          .getByRole("button", { name: /tolak|decline/i })
          .first()
          .click();

        await expect(page.getByText(/berhasil|ditolak|success/i)).toBeVisible();
      });

      // TCDR.35
      test(`TCDR.35 ${label} add verification notes to Pengajuan perubahan`, async ({ page }) => {
        await page
          .getByRole("button", { name: /tolak|decline/i })
          .first()
          .click();

        await page
          .getByRole("textbox", { name: /catatan|notes/i })
          .fill("Catatan verifikasi dari " + label);

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });
    });
  });
}
