import { generateRelawanExcel } from "@/helpers/baseExcel.helper";
import { credentials } from "@/helpers/credentials.helper";
import {
  buildRelawanData,
  fillRelawanForm,
  kaderField,
  opdField,
  pengajuanTable,
  relawanTable,
  searchRelawan,
  selectKader,
  selectOPD,
  selectPenugasan,
} from "@/helpers/formRelawan.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { ensurePengajuanExists } from "@/helpers/submitPengajuan.helper";
import { Browser, expect, Page, test } from "@playwright/test";

// Tombol tutup (X) pada header modal tidak punya accessible name,
// jadi dicari lewat strukturnya: <h2>judul</h2> -> parent -> button
const modalCloseButton = (page: Page, judul: string) =>
  page
    .locator(`xpath=//h2[normalize-space(text())="${judul}"]/parent::div/following-sibling::button`)
    .first();

// Aplikasi yang diuji berjalan di deployment publik: pemuatan opsi OPD/Kader
// kerap melebihi timeout bawaan 30 detik saat beberapa test berjalan paralel
test.describe.configure({ timeout: 90_000 });

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

      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
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
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();

        await expect(page.getByRole("textbox", { name: "Nama lengkap" })).toHaveValue(
          relawanData["NAMA LENGKAP"],
        );
        await expect(page.getByRole("textbox", { name: "digit NIK" })).toHaveValue(relawanData.NIK);
        await expect(page.getByRole("textbox", { name: "Alamat" })).toHaveValue(relawanData.ALAMAT);
        await expect(page.getByRole("textbox", { name: "Nomor HP" })).toHaveValue(
          relawanData["NO HP"],
        );
      });

      // TCDR.4
      test(`TCDR.4 ${label} save new Relawan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();

        await page.getByRole("button", { name: /simpan/i }).click();

        await expect(
          page.getByText(
            /berhasil|success|data baru ditambahkan|relawan baru ditambahkan|baru ditambahkan./i,
          ),
        ).toBeVisible();
      });

      // TCDR.5
      test(`TCDR.5 ${label} cancel new Relawan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();

        // Modal ini tidak punya tombol "Batal"; pembatalan lewat tombol X di
        // header. Dulu diklik lewat indeks tombol tanpa teks ke-3 di halaman,
        // lalu memeriksa URL yang memang tidak pernah berubah.
        await modalCloseButton(page, "Tambah Relawan Baru").click();

        await expect(page.getByRole("heading", { name: "Tambah Relawan Baru" })).toBeHidden();
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
            expectedMessage:
              /Format nama relawan tidak valid \(hanya huruf, spasi, titik, koma, petik\)/i,
          },
          {
            title: "Name with special characters",
            value: "@@@###",
            expectedMessage:
              /Format nama relawan tidak valid \(hanya huruf, spasi, titik, koma, petik\)/i,
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

            const form = await fillRelawanForm({
              data: relawanData,
              page,
              isSuperAdmin: label === "Super Admin",
            });
            await form.fillAll();
            await page.getByRole("button", { name: /simpan/i }).click();

            if (nameCase.expectedMessage === null) {
              const namaInput = page.getByRole("textbox", { name: "Nama lengkap" });
              const isValid = await namaInput.evaluate((el: HTMLInputElement) =>
                el.checkValidity(),
              );
              expect(isValid).toBe(false);
            } else {
              await expect(page.getByText(nameCase.expectedMessage)).toBeVisible({
                timeout: 12000,
              });
            }
          });
        }
      });

      // TCDR.7 Invalid NIK
      test.describe(`TCDR.7 ${label} invalid NIK`, () => {
        const invalidNIKCases: {
          title: string;
          value: string;
          expectedMessage: RegExp | null;
          /** Nilai yang tersisa di input bila kelebihan digit dipotong oleh maxLength */
          expectedTruncatedValue?: string;
        }[] = [
          { title: "Empty NIK", value: "", expectedMessage: null },
          {
            title: "NIK too short",
            value: "1234567890",
            expectedMessage:
              /NIK harus terdiri tepat 16 digit angka|NIK harus tepat 16 digit angka/i,
          },
          {
            title: "NIK with letters",
            value: "320100ABCD123456",
            expectedMessage:
              /NIK harus terdiri tepat 16 digit angka|NIK harus tepat 16 digit angka/i,
          },
          {
            title: "NIK with special characters",
            value: "3201@#$%^&123456",
            expectedMessage:
              /NIK harus terdiri tepat 16 digit angka|NIK harus tepat 16 digit angka/i,
          },
          {
            title: "NIK too long",
            value: "32010000000000001",
            expectedMessage: null,
            // Input NIK memakai maxLength=16, jadi digit ke-17 ditolak di level input
            expectedTruncatedValue: "3201000000000000",
          },
        ];

        for (const nikCase of invalidNIKCases) {
          test(`TCDR.7 ${nikCase.title}`, async ({ page }) => {
            const relawanData = buildRelawanData();
            relawanData.NIK = nikCase.value;

            const form = await fillRelawanForm({
              data: relawanData,
              page,
              isSuperAdmin: label === "Super Admin",
            });
            await form.fillAll();

            // Kelebihan digit sudah ditolak input, form tidak perlu disubmit
            if (nikCase.expectedTruncatedValue) {
              await expect(page.getByRole("textbox", { name: "digit NIK" })).toHaveValue(
                nikCase.expectedTruncatedValue,
              );
              return;
            }

            await page.getByRole("button", { name: /simpan/i }).click();

            if (nikCase.expectedMessage === null) {
              const nikInput = page.getByRole("textbox", { name: "digit NIK" });
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
          { title: "Address too short", value: "A", expectedMessage: /Alamat minimal 5 karakter/i },
          {
            title: "Address only numbers",
            value: "1234567890",
            expectedMessage:
              /alamat tidak valid|hanya angka|Alamat tidak boleh hanya berupa angka/i,
          },
          {
            title: "Address with special characters",
            value: "@@@###$$$",
            expectedMessage:
              /tidak boleh mengandung karakter spesial|Alamat mengandung karakter tidak valid/i,
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

            const form = await fillRelawanForm({
              data: relawanData,
              page,
              isSuperAdmin: label === "Super Admin",
            });
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
            expectedMessage:
              /nomor hp tidak valid.*harus 10.*13 digit angka|Format Nomor HP tidak valid (harus diawali 08 atau +628, 9-13 digit angka)|Format Nomor HP tidak valid/i,
          },
          {
            title: "Phone number with letters",
            value: "08ABCDE123",
            expectedMessage:
              /nomor hp tidak valid.*harus 10.*13 digit angka|Nomor HP tidak boleh mengandung huruf|Nomor HP tidak boleh/i,
          },
          {
            title: "Phone number with special characters",
            value: "08!@#$%^&*",
            expectedMessage:
              /nomor hp tidak valid.*harus 10.*13 digit angka|Format Nomor HP tidak valid/i,
          },
          {
            title: "Phone number too long",
            value: "081234567890123456789",
            expectedMessage:
              /nomor hp tidak valid.*harus 10.*13 digit angka|Format Nomor HP tidak valid/i,
          },
        ];

        for (const phoneCase of invalidPhoneCases) {
          test(`TCDR.9 ${phoneCase.title}`, async ({ page }) => {
            const relawanData = buildRelawanData();
            relawanData["NO HP"] = phoneCase.value;

            const form = await fillRelawanForm({
              data: relawanData,
              page,
              isSuperAdmin: label === "Super Admin",
            });
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
                page.getByText(phoneCase.expectedMessage, { exact: true }),
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
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();

        await expect(page.getByRole("textbox", { name: "Penugasan" })).toHaveValue(
          relawanData.PENUGASAN,
        );
      });

      // TCDR.11
      test(`TCDR.11 ${label} select OPD on Penugasan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();
        await selectOPD({ data: relawanData, page, isSuperAdmin: label === "Super Admin" });

        await expect(opdField(page)).toHaveValue(relawanData.OPD);
      });

      // TCDR.12
      test(`TCDR.12 ${label} select Kader on Penugasan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();
        await selectOPD({ data: relawanData, page, isSuperAdmin: label === "Super Admin" });
        await selectKader({ data: relawanData, page, isSuperAdmin: label === "Super Admin" });

        await expect(kaderField(page)).toHaveValue(relawanData.KADER);
      });

      // TCDR.13
      test(`TCDR.13 ${label} select Peran on Penugasan form`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();
        await selectPenugasan({ data: relawanData, page, isSuperAdmin: label === "Super Admin" });

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
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();
        await form.fillStatusKeaktifan();

        // Label "Nonaktif" pada form dikirim dengan value "Tidak Aktif"
        const expectedRadioValue =
          relawanData["STATUS KEAKTIFAN"] === "Nonaktif" ? "Tidak Aktif" : "Aktif";

        await expect(
          page.locator(`input[type="radio"][value="${expectedRadioValue}"]`),
        ).toBeChecked();
      });

      // TCDR.16
      test(`TCDR.16 ${label} add more data penugasan`, async ({ page }) => {
        const relawanData = buildRelawanData();
        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
        await form.fillAll();
        await page.getByRole("button", { name: /tambah data penugasan/i }).click();

        await expect(opdField(page, 1)).toBeVisible();
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

      await expect(
        page.getByText(/berhasil|success|data baru ditambahkan|relawan baru ditambahkan/i),
      ).toBeVisible();
    });

    // TCDR.18 Upload Invalid Excel
    test(`TCDR.18 ${label} upload invalid template excel Relawan data`, async ({ page }) => {
      const filePath = generateRelawanExcel({ type: "invalid", total: 3 });

      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      await page.locator("input[type='file']").setInputFiles(filePath);
      await page.getByRole("button", { name: /lanjutkan/i }).click();

      // Seluruh baris ditolak: tidak ada data bersih untuk disimpan
      await expect(page.getByRole("heading", { name: "Data Bersih (0)" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Data Kotor (3)" })).toBeVisible();

      // Tombol simpan berubah jadi "Tidak Ada Data Bersih" dan tidak bisa diklik
      await expect(
        page.getByRole("button", { name: /simpan data bersih|tidak ada data bersih/i }),
      ).toBeDisabled();

      // Tiap baris bermasalah didaftar beserta keterangan masalahnya
      const barisKotor = page
        .locator('xpath=//h3[starts-with(normalize-space(.), "Data Kotor")]/following::table[1]')
        .locator("tbody tr");
      await expect(barisKotor).toHaveCount(3);
      await expect(barisKotor.first().getByRole("listitem").first()).toBeVisible();
    });

    // TCDR.19 Download Template Excel
    test(`TCDR.19 ${label} click Templat Excel Relawan Kader hyperlink`, async ({ page }) => {
      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      await page.getByRole("link", { name: "Unduh Templat Excel Data" }).click();

      // Tautannya mengarah ke halaman Dokumen tempat seluruh template disimpan
      await expect(page).toHaveURL(/dokumen/);
      await expect(page.getByRole("heading", { name: "Format Excel Data Relawan" })).toBeVisible();
    });

    // TCDR.20 Cancel Upload Excel
    test(`TCDR.20 ${label} cancel upload Relawan data excel`, async ({ page }) => {
      const filePath = generateRelawanExcel({ type: "valid", total: 1 });

      await page.getByRole("button", { name: /unggah dari excel/i }).click();

      const fileInput = page.locator("input[type='file']");
      await fileInput.setInputFiles(filePath);

      await modalCloseButton(page, "Unggah Data Relawan").click();

      await expect(page.getByRole("heading", { name: "Unggah Data Relawan" })).toBeHidden();
      await expect(page.getByRole("main")).toBeVisible();
    });

    // TCDR.21-26 Search Bar
    test.describe(`TCDR.21-26 ${label} Search Bar`, () => {
      // Kata kunci untuk kasus "ada hasil" diambil dari baris pertama tabel
      // (kolom NIK / NAMA), supaya test tidak bergantung pada data seed tertentu.
      const searchCases: {
        id: string;
        title: string;
        expectNoData: boolean;
        keyword?: string;
        source?: "NIK" | "NAMA";
        transform?: (value: string) => string;
      }[] = [
        {
          id: "TCDR.21",
          title: "input keyword in search bar",
          expectNoData: false,
          source: "NAMA",
        },
        {
          id: "TCDR.22",
          title: "input with upper case",
          expectNoData: false,
          source: "NAMA",
          transform: (value) => value.toUpperCase(),
        },
        {
          id: "TCDR.23",
          title: "input with lower case",
          expectNoData: false,
          source: "NAMA",
          transform: (value) => value.toLowerCase(),
        },
        {
          id: "TCDR.24",
          title: "input with specific word (NIK)",
          expectNoData: false,
          source: "NIK",
        },
        {
          id: "TCDR.25",
          title: "input with random keyword",
          keyword: "xqz99randomkeyword",
          expectNoData: true,
        },
        {
          id: "TCDR.26",
          title: "input with special characters",
          keyword: "@#$%^&*()",
          expectNoData: true,
        },
      ];

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${label} ${searchCase.title}`, async ({ page }) => {
          const table = relawanTable(page);
          // Halaman ini punya dua search bar (Pengajuan & Daftar Relawan),
          // jadi pakai locator khusus search bar Daftar Relawan
          const searchInput = searchRelawan(page);

          let keyword = searchCase.keyword ?? "";

          if (searchCase.source) {
            await expect(table).toBeVisible();

            // Kolom: NIK (0), NAMA (1), ALAMAT, KEMANTREN, KELURAHAN, AKSI
            const cellIndex = searchCase.source === "NIK" ? 0 : 1;
            const cellText = await table
              .getByRole("row")
              .nth(1)
              .getByRole("cell")
              .nth(cellIndex)
              .textContent();

            keyword = (cellText ?? "").trim();
            expect(keyword, `Kolom ${searchCase.source} baris pertama kosong`).not.toBe("");
            keyword = searchCase.transform ? searchCase.transform(keyword) : keyword;
          }

          await searchInput.fill(keyword);

          if (searchCase.expectNoData) {
            await expect(page.getByText(/Belum ada relawan/i)).toBeVisible();
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

        const form = await fillRelawanForm({
          data: relawanData,
          page,
          isSuperAdmin: label === "Super Admin",
        });
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
        await selectOPD({ data: relawanData, page, isSuperAdmin: label === "Super Admin" });
        await selectKader({ data: relawanData, page, isSuperAdmin: label === "Super Admin" });
        await selectPenugasan({ data: relawanData, page, isSuperAdmin: label === "Super Admin" });

        await page.getByRole("button", { name: /simpan/i }).click();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // -------- TCDR.30 - TCDR.31 dihilangkan sementara untuk penyesuaian dengan perubahan form penugasan --------
      // // TCDR.30
      // test(`TCDR.30 ${label} delete penugasan on detail form`, async ({ page }) => {
      //   await page.getByRole("button", { name: /hapus/i }).first().click();
      //   await page.getByRole("button", { name: /ya|konfirmasi/i }).click();

      //   await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      // });

      // // TCDR.31
      // test(`TCDR.31 ${label} click Lihat SK hyperlink`, async ({ page }) => {
      //   await page.getByRole("link", { name: /lihat sk/i }).click();

      //   await expect(page).toHaveURL(/sk|dokumen|document/);
      // });
    });

    // ================================================================
    // TCDR.32-35 — Pengajuan Perubahan Data (Sequential)
    //
    // Dijalankan dalam SATU test.describe dengan test.serial agar
    // urutan terjamin dan tiap test mendapat pengajuan yang fresh.
    //
    // Tambahkan import di bagian atas dataRelawan.spec.ts:
    //   import { ensurePengajuanExists } from "@/helpers/submitPengajuan.helper";
    // ================================================================

    // TCDR.32-35 Tabel Pengajuan Perubahan Data
    test.describe.serial(`TCDR.32-35 ${label} Pengajuan Perubahan Data`, () => {
      // Tiap test bisa membuat pengajuan baru lewat login akun relawan di
      // context terpisah, jadi butuh waktu lebih dari timeout default 30 detik
      test.describe.configure({ timeout: 120_000 });

      // Helper lokal: navigasi ke halaman relawan, pastikan ada
      // pengajuan pending, lalu buka halaman Review-nya.
      async function goToReviewPage(page: Page, browser: Browser) {
        // Kembali ke halaman Data Relawan dulu (kalau sudah berpindah)
        await page.getByRole("link", { name: "Relawan", exact: true }).click();
        await expect(page).toHaveURL(/relawan/);

        // Pastikan ada pengajuan pending — buat baru jika perlu
        await ensurePengajuanExists(page, browser);

        // Verifikasi section Pengajuan Perubahan Data tampil
        await expect(page.getByRole("heading", { name: "Pengajuan Perubahan Data" })).toBeVisible();
        await expect(pengajuanTable(page)).toBeVisible();

        // Buka Review pada baris pertama yang berstatus Menunggu
        await pengajuanTable(page)
          .getByRole("row")
          .filter({ hasText: /menunggu|pending/i })
          .first()
          .getByRole("button", { name: /review/i })
          .click();

        // Centang checkbox konfirmasi verifikasi
        await page.getByRole("checkbox", { name: /saya telah memverifikasi/i }).click();
      }

      // TCDR.32 — Akses halaman Review
      test(`TCDR.32 ${label} access Relawan Review`, async ({ page, browser }) => {
        await goToReviewPage(page, browser);

        await expect(
          page.getByRole("heading", { name: /review pengajuan perubahan data/i }),
        ).toBeVisible();
      });

      // TCDR.33 — Accept pengajuan
      test(`TCDR.33 ${label} accept Pengajuan perubahan data`, async ({ page, browser }) => {
        // Pengajuan dari TCDR.32 sudah dipakai (hanya lihat, tidak diubah),
        // tapi untuk keamanan kita pastikan lagi ada yang pending.
        await goToReviewPage(page, browser);

        await page
          .getByRole("button", { name: /setuju|terima|accept/i })
          .first()
          .click();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // TCDR.34 — Decline pengajuan (butuh pengajuan BARU karena TCDR.33 sudah accept)
      test(`TCDR.34 ${label} decline Pengajuan perubahan data`, async ({ page, browser }) => {
        await goToReviewPage(page, browser);

        await page
          .getByRole("button", { name: /tolak|decline/i })
          .first()
          .click();

        await expect(
          page
            .getByText(/berhasil|ditolak|success/i)
            .or(page.getByText("Pengajuan berhasil ditolak")),
        ).toBeVisible();
      });

      // TCDR.35 — Decline dengan catatan (butuh pengajuan BARU lagi)
      test(`TCDR.35 ${label} add verification notes to Pengajuan perubahan`, async ({
        page,
        browser,
      }) => {
        await goToReviewPage(page, browser);

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
