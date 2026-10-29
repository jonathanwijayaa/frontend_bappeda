import { generateKaderExcel } from "@/helpers/baseExcel.helper";
import { credentials } from "@/helpers/credentials.helper";
import { buildKaderData, fillKaderForm, kaderField } from "@/helpers/formKader.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink, LOAD_TIME, uploadThink } from "@/helpers/timing.helper";
import { expect, Page, test } from "@playwright/test";

const BASE_URL = "https://frontend-bappeda.vercel.app/";

// Kolom tabel berbeda per role: Super Admin melihat kolom OPD & DESKRIPSI,
// OPD melihat JUMLAH ANGGOTA untuk instansinya sendiri.
const roles = [
  {
    creds: credentials.superAdmin,
    header: ["NAMA KADER", "STATUS", "OPD", "PIC", "DESKRIPSI", "AKSI"],
    isSuperAdmin: true,
    kolom: { nama: 1, pic: 4, status: 2 },
    label: "Super Admin",
  },
  {
    creds: credentials.opd,
    header: ["NAMA KADER", "STATUS", "PIC", "JUMLAH ANGGOTA", "AKSI"],
    isSuperAdmin: false,
    kolom: { nama: 1, pic: 3, status: 2 },
    label: "OPD",
  },
] as const;

// ── Locator ──────────────────────────────────────────────────────────────
// Table menyisipkan baris kosong (satu <td> ber-colSpan) untuk menjaga tinggi
// tabel, jadi baris data dikenali dari kolomnya yang lebih dari satu.
const barisData = (page: Page) => page.locator("table tbody tr:has(td:nth-child(2))");

const nilaiKolom = async (page: Page, kolom: number) =>
  (await barisData(page).locator(`td:nth-child(${kolom})`).allInnerTexts()).map((teks) =>
    teks.trim(),
  );

const searchField = (page: Page) => page.getByPlaceholder("Cari");
const infoJumlah = (page: Page) => page.getByText(/^Menampilkan \d+-\d+ dari \d+ Kader$/);

const totalKader = async (page: Page) =>
  Number((await infoJumlah(page).innerText()).match(/dari (\d+)/)![1]);

const emptyState = (page: Page) => page.getByText("Belum ada kader", { exact: true });

// Tombol tutup (X) pada header modal tidak punya accessible name,
// jadi dicari lewat strukturnya: <h2>judul</h2> -> parent -> button
const modalCloseButton = (page: Page, judul: string) =>
  page
    .locator(`xpath=//h2[normalize-space(text())="${judul}"]/parent::div/following-sibling::button`)
    .first();

const tambahKaderButton = (page: Page) =>
  page.getByRole("button", { name: "Tambah Kader Baru", exact: true });

const bukaFormTambah = async (page: Page) => {
  await clickThink(tambahKaderButton(page));
  await expect(page.getByRole("heading", { name: "Tambah Kader Baru" })).toBeVisible();
};

// Nilai pada modal Detail Kader: <label>Nama Kader</label> diikuti input/textarea
const detailField = (page: Page, label: string) =>
  page
    .locator(`xpath=//label[normalize-space(.)="${label}"]/following-sibling::*[1]`)
    .locator("xpath=descendant-or-self::*[self::input or self::textarea]")
    .first();

// Baris info PIC di modal detail: <span>Label</span> diikuti <span> berisi nilainya
const detailPICValue = (page: Page, label: string) =>
  page
    .locator(`xpath=//span[normalize-space(text())="${label}"]/following-sibling::span[1]`)
    .first();

for (const role of roles) {
  test.describe(`Daftar Kader - ${role.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);

      await loginBAPPEDA({
        NIK: role.creds.NIK,
        page,
        password: role.creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await clickThink(page.getByRole("link", { name: "Kader", exact: true }));
      await expect(page).toHaveURL(/daftar-kader/);

      await expect(page.getByText(/memuat data kader/i)).toBeHidden({ timeout: LOAD_TIME });
      await expect(barisData(page).first()).toBeVisible();
    });

    // TCDK.1 Access Daftar Kader page
    test(`TCDK.1 ${role.label} access Daftar Kader page`, async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Daftar Kader" })).toBeVisible();
      await expect(page.getByRole("table")).toBeVisible();
      await expect(infoJumlah(page)).toBeVisible();
      await expect(tambahKaderButton(page)).toBeEnabled();
      await expect(page.getByRole("button", { name: "Unggah dari Excel" })).toBeEnabled();
    });

    // TCDK.2 Buka form Tambah Kader Baru
    test(`TCDK.2 ${role.label} click Tambah Kader Baru button`, async ({ page }) => {
      await bukaFormTambah(page);

      // Modal benar-benar terbuka dengan field yang bisa diisi — sebelumnya TC
      // ini hanya memeriksa tombolnya masih terlihat, yang selalu benar karena
      // tombol itu tetap tampak di belakang modal.
      for (const field of [
        kaderField.namaKader,
        kaderField.pic,
        kaderField.nikPIC,
        kaderField.noHP,
        kaderField.alamatPIC,
        kaderField.deskripsi,
        kaderField.kemantren,
      ]) {
        await expect(field(page)).toBeVisible();
      }

      // Kelurahan terkunci sampai Kemantren dipilih
      await expect(kaderField.kelurahanPIC(page)).toBeDisabled();

      // Pemilihan OPD hanya ada pada Super Admin
      if (role.isSuperAdmin) await expect(kaderField.opd(page)).toBeVisible();
      else await expect(kaderField.opd(page)).toHaveCount(0);
    });

    test.describe(`TCDK.3-5 ${role.label} Fill Form Add Kader`, () => {
      test.beforeEach(async ({ page }) => {
        await bukaFormTambah(page);
      });

      // TCDK.3 Isi form
      test(`TCDK.3 ${role.label} fill tambah data form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });

        await form.fillAll();
        await form.expectFillAll();
      });

      // TCDK.4 Simpan kader baru
      test(`TCDK.4 ${role.label} save new Kader form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });

        await form.fillAll();
        await form.submit();

        // Notifikasi cepat hilang, jadi keberhasilan dipastikan dari datanya:
        // kader baru harus bisa ditemukan lewat pencarian.
        await fillThink(searchField(page), kaderData["NAMA KADER"]);
        await expect(barisData(page).first()).toBeVisible();

        // Aplikasi menyimpan nama lewat toTitleCase(), jadi kapitalisasinya bisa
        // berbeda dari yang diketik (mis. "KuhlmanHarvey III" -> "Kuhlmanharvey Iii").
        const namaTersimpan = (await nilaiKolom(page, role.kolom.nama)).map((nama) =>
          nama.toLowerCase(),
        );
        expect(namaTersimpan).toContain(kaderData["NAMA KADER"].toLowerCase());
      });

      // TCDK.5 Batalkan form
      test(`TCDK.5 ${role.label} cancel new Kader form`, async ({ page }) => {
        const kaderData = buildKaderData();
        const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });

        await form.fillAll();
        await form.cancel();

        // URL halaman tidak pernah berubah saat modal dibuka/ditutup, jadi yang
        // diperiksa adalah modalnya benar-benar tertutup dan data tidak tersimpan
        await fillThink(searchField(page), kaderData["NAMA KADER"]);
        await expect(emptyState(page)).toBeVisible();
      });
    });

    // TCDK.6-9 Invalid Form
    test.describe(`TCDK.6-9 ${role.label} Fill Form Invalid`, () => {
      test.beforeEach(async ({ page }) => {
        await bukaFormTambah(page);
      });

      /**
       * Field wajib pada form ini memakai atribut `required`, sehingga browser
       * menahan submit dan menampilkan bubble bawaannya. Bubble itu bukan teks
       * di DOM dan tidak bisa dicari dengan getByText, jadi yang diperiksa
       * adalah status validitas input-nya.
       */
      const expectDitolakBrowser = async (
        page: Page,
        field: (p: Page) => ReturnType<typeof kaderField.namaKader>,
      ) => {
        expect(await field(page).evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(
          false,
        );
        await expect(page.getByText(/berhasil|success/i)).toBeHidden();
      };

      // TCDK.6 Invalid Kader Name
      test.describe(`TCDK.6 ${role.label} invalid Kader name`, () => {
        const invalidKaderNameCases = [
          { ditolakBrowser: true, title: "Empty Kader name", value: "" },
          { pesan: /nama kader minimal 3 karakter/i, title: "Kader name too short", value: "A" },
          {
            pesan: /nama kader tidak boleh mengandung angka atau karakter spesial/i,
            title: "Kader name with numbers",
            value: "Kader12345",
          },
          {
            pesan: /nama kader tidak boleh mengandung angka atau karakter spesial/i,
            title: "Kader name with special characters",
            value: "@@@###",
          },
          {
            pesan: /nama kader terlalu panjang/i,
            title: "Kader name too long",
            value: "A".repeat(300),
          },
        ];

        for (const kaderCase of invalidKaderNameCases) {
          test(`TCDK.6 ${role.label} ${kaderCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData["NAMA KADER"] = kaderCase.value;

            const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });
            await form.fillAll();
            await form.submit({ expectClose: false });

            if (kaderCase.ditolakBrowser) {
              await expectDitolakBrowser(page, kaderField.namaKader);
              return;
            }

            await expect(page.getByText(kaderCase.pesan!)).toBeVisible();
            await expect(page.getByText(/berhasil|success/i)).toBeHidden();
          });
        }
      });

      // TCDK.7 Invalid NIK PIC
      test.describe(`TCDK.7 ${role.label} invalid NIK PIC`, () => {
        const invalidNIKCases = [
          { ditolakBrowser: true, title: "Empty NIK PIC", value: "" },
          {
            pesan: /nik pic harus tepat 16 digit angka/i,
            title: "NIK PIC too short",
            value: "3201",
          },
          {
            pesan: /nik pic harus tepat 16 digit angka/i,
            title: "NIK PIC with letters",
            value: "32010ABCDE12345",
          },
          {
            pesan: /nik pic harus tepat 16 digit angka/i,
            title: "NIK PIC with special characters",
            value: "3201-0000-0000",
          },
        ];

        for (const nikCase of invalidNIKCases) {
          test(`TCDK.7 ${role.label} ${nikCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData["NIK PIC"] = nikCase.value;

            const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });
            await form.fillAll();
            await form.submit({ expectClose: false });

            if (nikCase.ditolakBrowser) {
              await expectDitolakBrowser(page, kaderField.nikPIC);
              return;
            }

            await expect(page.getByText(nikCase.pesan!)).toBeVisible();
          });
        }

        test(`TCDK.7 ${role.label} NIK PIC longer than 16 digits is truncated`, async ({
          page,
        }) => {
          // Field NIK memakai maxLength=16, jadi kelebihan digit tidak pernah
          // sampai ke validasi aplikasi — input-nya yang memotong.
          await fillThink(kaderField.nikPIC(page), "3201000000000000999");

          await expect(kaderField.nikPIC(page)).toHaveValue("3201000000000000");
        });
      });

      // TCDK.8 Invalid PIC Name
      test.describe(`TCDK.8 ${role.label} invalid PIC name`, () => {
        const invalidPICCases = [
          { ditolakBrowser: true, title: "Empty PIC name", value: "" },
          { pesan: /nama pic minimal 3 karakter/i, title: "PIC name too short", value: "A" },
          {
            pesan: /nama pic tidak boleh mengandung angka atau karakter spesial/i,
            title: "PIC name with numbers",
            value: "PIC12345",
          },
          {
            pesan: /nama pic tidak boleh mengandung angka atau karakter spesial/i,
            title: "PIC name with special characters",
            value: "@@@###",
          },
          {
            pesan: /nama pic terlalu panjang/i,
            title: "PIC name too long",
            value: "A".repeat(200),
          },
        ];

        for (const picCase of invalidPICCases) {
          test(`TCDK.8 ${role.label} ${picCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData.PIC = picCase.value;

            const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });
            await form.fillAll();
            await form.submit({ expectClose: false });

            if (picCase.ditolakBrowser) {
              await expectDitolakBrowser(page, kaderField.pic);
              return;
            }

            await expect(page.getByText(picCase.pesan!)).toBeVisible();
          });
        }
      });

      // TCDK.9 Invalid Kontak
      test.describe(`TCDK.9 ${role.label} invalid kontak`, () => {
        const invalidKontakCases = [
          { ditolakBrowser: true, title: "Empty kontak", value: "" },
          {
            pesan: /nomor telepon pic terlalu pendek/i,
            title: "Kontak too short",
            value: "08123",
          },
          {
            pesan: /nomor telepon pic tidak boleh mengandung huruf/i,
            title: "Kontak with letters",
            value: "08ABCDE123",
          },
          {
            pesan: /nomor telepon pic tidak boleh mengandung karakter spesial/i,
            title: "Kontak with special characters",
            value: "08!@#$%^&*",
          },
          {
            pesan: /nomor telepon pic terlalu panjang/i,
            title: "Kontak too long",
            value: "081234567890123456789",
          },
        ];

        for (const kontakCase of invalidKontakCases) {
          test(`TCDK.9 ${role.label} ${kontakCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData["NO HP"] = kontakCase.value;

            const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });
            await form.fillAll();
            await form.submit({ expectClose: false });

            if (kontakCase.ditolakBrowser) {
              await expectDitolakBrowser(page, kaderField.noHP);
              return;
            }

            await expect(page.getByText(kontakCase.pesan!)).toBeVisible();
          });
        }
      });

      // TCDK.27 Invalid Alamat PIC
      test.describe(`TCDK.27 ${role.label} invalid Alamat PIC`, () => {
        const invalidAlamatCases = [
          { pesan: /alamat pic terlalu pendek/i, title: "Alamat too short", value: "Jl. A" },
          {
            pesan: /alamat pic terlalu panjang/i,
            title: "Alamat too long",
            value: `Jl. ${"A".repeat(120)}`,
          },
          {
            pesan: /alamat pic tidak boleh hanya berisi angka/i,
            title: "Alamat with digits only",
            value: "1234567890",
          },
          {
            pesan: /alamat pic hanya boleh berisi huruf, angka, spasi/i,
            title: "Alamat with illegal characters",
            value: "Jl. Mawar @@@ *** !!!",
          },
        ];

        for (const alamatCase of invalidAlamatCases) {
          test(`TCDK.27 ${role.label} ${alamatCase.title}`, async ({ page }) => {
            const kaderData = buildKaderData();
            kaderData["ALAMAT PIC"] = alamatCase.value;

            const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });
            await form.fillAll();
            await form.submit({ expectClose: false });

            await expect(page.getByText(alamatCase.pesan)).toBeVisible();
            await expect(page.getByText(/berhasil|success/i)).toBeHidden();
          });
        }
      });

      // TCDK.28 Nama kader duplikat
      test(`TCDK.28 ${role.label} cannot reuse an existing Kader name`, async ({ page }) => {
        // Nama diambil dari tabel supaya dipastikan benar-benar sudah terdaftar
        const kaderData = buildKaderData();
        const form = fillKaderForm({ data: kaderData, isSuperAdmin: role.isSuperAdmin, page });

        await form.fillAll();
        await form.cancel();

        const namaTerdaftar = (await nilaiKolom(page, role.kolom.nama))[0];
        await bukaFormTambah(page);

        kaderData["NAMA KADER"] = namaTerdaftar;
        const formDuplikat = fillKaderForm({
          data: kaderData,
          isSuperAdmin: role.isSuperAdmin,
          page,
        });
        await formDuplikat.fillAll();
        await formDuplikat.submit({ expectClose: false });

        await expect(page.getByText(/nama kader sudah terdaftar/i)).toBeVisible();
      });

      // TCDK.29 OPD wajib dipilih dari daftar (khusus Super Admin)
      test(`TCDK.29 ${role.label} must pick the OPD from the list`, async ({ page }) => {
        test.skip(!role.isSuperAdmin, "Role OPD tidak memilih OPD; otomatis instansinya sendiri");

        const kaderData = buildKaderData();
        const form = fillKaderForm({ data: kaderData, isSuperAdmin: false, page });

        // Semua field diisi kecuali OPD, yang hanya diketik bebas tanpa dipilih
        await form.fillAll();
        await fillThink(kaderField.opd(page), "OPD Yang Tidak Terdaftar");

        await form.submit({ expectClose: false });

        await expect(page.getByText(/pilih opd yang valid dari daftar/i)).toBeVisible();
      });
    });

    // TCDK.10 Upload Valid Excel
    test(`TCDK.10 ${role.label} upload Kader data excel file`, async ({ page }) => {
      const filePath = generateKaderExcel({ total: 5, type: "valid" });

      await clickThink(page.getByRole("button", { name: "Unggah dari Excel" }));
      await uploadThink(page.locator("input[type='file']"), filePath);
      await clickThink(page.getByRole("button", { name: "Lanjutkan" }));

      // Dipastikan dulu semua baris lolos validasi, supaya kegagalan data
      // tidak terbaca sebagai kegagalan proses simpan
      await expect(page.getByRole("heading", { name: "Data Kotor (0)" })).toBeVisible();
      await clickThink(page.getByRole("button", { name: "Simpan Data Bersih" }));

      await expect(page.getByText(/berhasil|success/i)).toBeVisible({ timeout: LOAD_TIME });
    });

    // TCDK.11 Upload Invalid Excel
    test(`TCDK.11 ${role.label} upload invalid template excel Kader data`, async ({ page }) => {
      const totalBarisInvalid = 3;
      const filePath = generateKaderExcel({ total: totalBarisInvalid, type: "invalid" });

      await clickThink(page.getByRole("button", { name: "Unggah dari Excel" }));
      await uploadThink(page.locator("input[type='file']"), filePath);
      await clickThink(page.getByRole("button", { name: "Lanjutkan" }));

      // Seluruh baris ditolak: tidak ada data bersih untuk disimpan
      await expect(page.getByRole("heading", { name: "Data Bersih (0)" })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: `Data Kotor (${totalBarisInvalid})` }),
      ).toBeVisible();

      // Tombol simpan berubah jadi "Tidak Ada Data Bersih" dan tidak bisa diklik
      await expect(
        page.getByRole("button", { name: /simpan data bersih|tidak ada data bersih/i }),
      ).toBeDisabled();

      // Tiap baris bermasalah didaftar beserta keterangan masalahnya
      const barisKotor = page
        .locator('xpath=//h3[starts-with(normalize-space(.), "Data Kotor")]/following::table[1]')
        .locator("tbody tr");

      await expect(barisKotor).toHaveCount(totalBarisInvalid);
      await expect(barisKotor.first().getByRole("listitem").first()).toBeVisible();
    });

    // TCDK.12 Download Template Excel
    test(`TCDK.12 ${role.label} click Templat Excel Data Kader hyperlink`, async ({ page }) => {
      await clickThink(page.getByRole("button", { name: "Unggah dari Excel" }));
      await clickThink(page.getByRole("link", { name: /templat excel data kader/i }));

      // Tautannya mengarah ke halaman Dokumen tempat seluruh template disimpan
      await expect(page).toHaveURL(/dokumen/);
      await expect(page.getByRole("heading", { name: "Format Excel Data Kader" })).toBeVisible();
    });

    // TCDK.13 Cancel Upload Excel
    test(`TCDK.13 ${role.label} cancel upload Kader data excel`, async ({ page }) => {
      const filePath = generateKaderExcel({ total: 1, type: "valid" });

      await clickThink(page.getByRole("button", { name: "Unggah dari Excel" }));
      await uploadThink(page.locator("input[type='file']"), filePath);

      await clickThink(modalCloseButton(page, "Unggah Data Kader"));

      // Modal harus tertutup — sebelumnya hanya memeriksa judul halaman, yang
      // tetap terlihat di belakang modal sehingga selalu lolos
      await expect(page.getByRole("heading", { name: "Unggah Data Kader" })).toBeHidden();
      await expect(page.getByRole("table")).toBeVisible();
    });

    // TCDK.14-21 Search Bar
    test.describe(`TCDK.14-21 ${role.label} Search Bar`, () => {
      // Kata kunci diambil dari baris pertama tabel supaya tidak bergantung
      // pada data seed tertentu yang bisa berubah.
      const searchCases = [
        {
          adaHasil: true,
          id: "TCDK.14",
          kata: (baris: { nama: string; pic: string }) => baris.nama,
          title: "input keyword in search bar",
        },
        {
          adaHasil: true,
          id: "TCDK.15",
          kata: (baris: { nama: string; pic: string }) => baris.nama.slice(0, 8),
          title: "input partial keyword",
        },
        {
          adaHasil: true,
          id: "TCDK.16",
          kata: (baris: { nama: string; pic: string }) => baris.pic,
          title: "input PIC name in search bar",
        },
        {
          adaHasil: true,
          id: "TCDK.17",
          kata: (baris: { nama: string; pic: string }) => baris.nama.toUpperCase(),
          title: "input with upper case",
        },
        {
          adaHasil: true,
          id: "TCDK.18",
          kata: (baris: { nama: string; pic: string }) => baris.nama.toLowerCase(),
          title: "input with lower case",
        },
        {
          adaHasil: true,
          id: "TCDK.19",
          kata: () => "Kader",
          title: "input with specific word",
        },
        {
          adaHasil: false,
          id: "TCDK.20",
          kata: () => "xqz99randomkeyword",
          title: "input with random keyword",
        },
        {
          adaHasil: false,
          id: "TCDK.21",
          kata: () => "@#$%^&*()",
          title: "input with special characters",
        },
      ];

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${role.label} ${searchCase.title}`, async ({ page }) => {
          const totalAwal = await totalKader(page);
          const baris = {
            nama: (await nilaiKolom(page, role.kolom.nama))[0],
            pic: (await nilaiKolom(page, role.kolom.pic))[0],
          };
          const keyword = searchCase.kata(baris);

          // Pencarian berjalan saat mengetik (onChange), bukan saat menekan Enter
          await fillThink(searchField(page), keyword);

          if (!searchCase.adaHasil) {
            await expect(emptyState(page)).toBeVisible();
            await expect(
              page.getByText(/tidak ada kader yang cocok dengan pencarian/i),
            ).toBeVisible();
            await expect(page.getByRole("table")).toBeHidden();
            return;
          }

          await expect(barisData(page).first()).toBeVisible();
          expect(await totalKader(page)).toBeLessThanOrEqual(totalAwal);

          // Setiap baris hasil harus mengandung kata kunci pada Nama Kader atau PIC
          const nama = await nilaiKolom(page, role.kolom.nama);
          const pic = await nilaiKolom(page, role.kolom.pic);
          for (let i = 0; i < nama.length; i++) {
            expect(`${nama[i]} ${pic[i]}`.toLowerCase()).toContain(keyword.toLowerCase());
          }
        });
      }
    });

    // TCDK.22 Export Tabel
    test(`TCDK.22 ${role.label} export Daftar Kader tabel`, async ({ page }) => {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: LOAD_TIME }),
        clickThink(page.getByRole("button", { name: "Ekspor PDF" })),
      ]);

      expect(download.suggestedFilename()).toMatch(/^daftar-kader-\d{4}-\d{2}-\d{2}\.pdf$/);
      await expect(page.getByText(/berhasil diekspor/i)).toBeVisible();
    });

    // TCDK.23 Access Kader Detail
    test(`TCDK.23 ${role.label} access Kader detail`, async ({ page }) => {
      const nama = (await nilaiKolom(page, role.kolom.nama))[0];
      const pic = (await nilaiKolom(page, role.kolom.pic))[0];

      await clickThink(barisData(page).first().getByRole("button", { name: "Detail" }));

      await expect(page.getByRole("heading", { name: "Detail Kader" })).toBeVisible();
      await expect(detailField(page, "Nama Kader")).toHaveValue(nama);
      await expect(detailField(page, "OPD")).toBeDisabled();
      await expect(detailField(page, "Deskripsi")).toBeVisible();

      // Informasi PIC aktif dan tombol penggantinya
      await expect(page.getByRole("heading", { name: "Informasi PIC Aktif" })).toBeVisible();
      await expect(detailPICValue(page, "Nama PIC")).toHaveText(pic);
      await expect(page.getByRole("button", { name: "Ganti PIC" })).toBeEnabled();

      // Tombol simpan baru aktif setelah ada perubahan
      await expect(page.getByRole("button", { name: "Simpan Perubahan" })).toBeDisabled();
      await fillThink(detailField(page, "Deskripsi"), "Deskripsi uji perubahan");
      await expect(page.getByRole("button", { name: "Simpan Perubahan" })).toBeEnabled();
    });

    // TCDK.30 Modal Ganti PIC
    test(`TCDK.30 ${role.label} opens the change PIC form`, async ({ page }) => {
      await clickThink(barisData(page).first().getByRole("button", { name: "Detail" }));
      await expect(page.getByRole("heading", { name: "Detail Kader" })).toBeVisible();

      await clickThink(page.getByRole("button", { name: "Ganti PIC" }));

      await expect(page.getByRole("heading", { name: "Ganti PIC Kader" })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "16 digit NIK" })).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Nama (jika NIK belum terdaftar)" }),
      ).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Nomor HP" })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Alamat KTP" })).toBeVisible();

      // Field kosong ditolak sebelum permintaan dikirim ke server
      await clickThink(page.getByRole("button", { name: "Simpan PIC Baru" }));
      await expect(page.getByText(/semua data pribadi pic wajib diisi/i)).toBeVisible();

      await clickThink(page.getByRole("button", { name: "Batal" }));
      await expect(page.getByRole("heading", { name: "Ganti PIC Kader" })).toBeHidden();
    });

    // TCDK.24-25 Nonaktif / Aktifkan Kader
    // Keduanya mengubah status data yang sama, jadi dijalankan berurutan supaya
    // tidak saling menimpa saat test berjalan paralel.
    test.describe.serial(`TCDK.24-25 ${role.label} Toggle Status Kader`, () => {
      // TCDK.24 Ubah status lalu kembalikan seperti semula
      test(`TCDK.24 ${role.label} toggles a Kader status`, async ({ page }) => {
        const baris = barisData(page).first();
        const statusAwal = (await nilaiKolom(page, role.kolom.status))[0];

        // Label tombolnya mengikuti status baris: "Nonaktif" untuk kader aktif,
        // "Aktifkan" untuk kader yang sedang tidak aktif.
        const tombolToggle = statusAwal === "Aktif" ? "Nonaktif" : "Aktifkan";
        await clickThink(baris.getByRole("button", { name: tombolToggle }));

        await expect(page.getByRole("heading", { name: "Konfirmasi" })).toBeVisible();
        await clickThink(page.getByRole("button", { name: "Lanjutkan" }));

        await expect(page.getByRole("heading", { name: "Konfirmasi" })).toBeHidden();
        await expect
          .poll(async () => (await nilaiKolom(page, role.kolom.status))[0], { timeout: LOAD_TIME })
          .not.toBe(statusAwal);

        // Kembalikan ke status semula supaya data tidak berubah setelah pengujian
        const tombolKembali = statusAwal === "Aktif" ? "Aktifkan" : "Nonaktif";
        await clickThink(barisData(page).first().getByRole("button", { name: tombolKembali }));
        await clickThink(page.getByRole("button", { name: "Lanjutkan" }));

        await expect
          .poll(async () => (await nilaiKolom(page, role.kolom.status))[0], { timeout: LOAD_TIME })
          .toBe(statusAwal);
      });

      // TCDK.25 Batalkan perubahan status
      test(`TCDK.25 ${role.label} cancel Nonaktif Kader`, async ({ page }) => {
        const baris = barisData(page).first();
        const statusAwal = (await nilaiKolom(page, role.kolom.status))[0];
        const tombolToggle = statusAwal === "Aktif" ? "Nonaktif" : "Aktifkan";

        await clickThink(baris.getByRole("button", { name: tombolToggle }));
        await expect(page.getByRole("heading", { name: "Konfirmasi" })).toBeVisible();

        await clickThink(page.getByRole("button", { name: "Batal" }));

        // Dialog tertutup dan status barisnya tidak berubah
        await expect(page.getByRole("heading", { name: "Konfirmasi" })).toBeHidden();
        expect((await nilaiKolom(page, role.kolom.status))[0]).toBe(statusAwal);
      });
    });

    // TCDK.26 Pagination
    test(`TCDK.26 ${role.label} navigates between Kader table pages`, async ({ page }) => {
      const total = await totalKader(page);
      test.skip(total <= 10, "Data kurang dari dua halaman, pagination tidak relevan");

      await expect(barisData(page)).toHaveCount(5);
      await expect(infoJumlah(page)).toHaveText(new RegExp(`Menampilkan 1-5 dari ${total} Kader`));
      await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();

      const halamanSatu = await nilaiKolom(page, role.kolom.nama);

      await clickThink(page.getByRole("button", { name: "Selanjutnya" }));

      await expect(infoJumlah(page)).toHaveText(new RegExp(`Menampilkan 6-10 dari ${total} Kader`));
      expect(await nilaiKolom(page, role.kolom.nama)).not.toEqual(halamanSatu);

      await clickThink(page.getByRole("button", { name: "Sebelumnya" }));

      await expect(infoJumlah(page)).toHaveText(new RegExp(`Menampilkan 1-5 dari ${total} Kader`));
      expect(await nilaiKolom(page, role.kolom.nama)).toEqual(halamanSatu);
    });

    // TCDK.31 Kolom tabel
    test(`TCDK.31 ${role.label} views the Kader table columns`, async ({ page }) => {
      const header = (await page.locator("table thead th").allInnerTexts()).map((teks) =>
        teks.trim(),
      );

      expect(header).toEqual([...role.header]);
    });
  });
}

// TCDK.32 Pembatasan akses halaman
test("TCDK.32 Relawan cannot access the Daftar Kader page", async ({ page }) => {
  await page.goto(BASE_URL);

  await loginBAPPEDA({
    NIK: credentials.relawan.NIK,
    page,
    password: credentials.relawan.password,
  });

  await expect(page).toHaveURL(/profil-relawan/);

  // Menu Kader hanya ada di sidebar Super Admin & OPD
  await expect(page.getByRole("link", { name: "Kader", exact: true })).toBeHidden();

  await page.goto(`${BASE_URL}daftar-kader`);

  await expect(page).toHaveURL(/unauthorized/);
  await expect(page.getByRole("heading", { name: "Daftar Kader" })).toBeHidden();
});
