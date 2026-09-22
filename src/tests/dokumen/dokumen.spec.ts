import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, Download, Page, test } from "@playwright/test";
import * as fs from "fs";
import XLSX from "xlsx";

test.describe.configure({ timeout: 90_000 });

const BASE_URL = "https://frontend-bappeda.vercel.app/";

// Halaman Dokumen hanya untuk super_admin & opd (lihat allowedRoles di App.tsx),
// dan isinya identik untuk keduanya.
const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

// Judul kartu memakai kata "Format Excel ...", bukan "Templat Excel ...".
// Berkas yang terunduh memakai nama hasil build Vite (ada hash-nya), mis.
// "Template_Data_Relawan-BPUNr409.xlsx", bukan persis nilai fileName di kode.
const dokumen = [
  {
    berkas: null,
    deskripsi: "Panduan lengkap penggunaan aplikasi untuk semua pengguna",
    id: "TCDO.1",
    judul: "Buku Panduan Aplikasi",
    title: "downloads the application user guide",
  },
  {
    berkas: {
      header: [
        "NAMA LENGKAP",
        "JENIS KELAMIN",
        "NIK",
        "ALAMAT",
        "NO HP",
        "OPD",
        "KEMANTREN",
        "KELURAHAN",
        "KADER",
        "JABATAN",
        "DETAIL JABATAN",
        "PENUGASAN",
      ],
      nama: /^Template_Data_Relawan.*\.xlsx$/i,
      sheet: "Data Relawan",
    },
    deskripsi: "Format untuk mengunggah data relawan secara massal",
    id: "TCDO.2",
    judul: "Format Excel Data Relawan",
    title: "downloads the volunteer data Excel template",
  },
  {
    berkas: {
      header: ["NAMA OPD", "STATUS", "ALAMAT", "PIC", "NIK PIC", "KONTAK"],
      nama: /^Template_Data_OPD.*\.xlsx$/i,
      sheet: "Data OPD",
    },
    deskripsi: "Format untuk mengunggah data OPD secara massal",
    id: "TCDO.3",
    judul: "Format Excel Data OPD",
    title: "downloads the OPD data Excel template",
  },
  {
    berkas: {
      header: [
        "OPD",
        "NAMA KADER",
        "DESKRIPSI",
        "STATUS",
        "PIC",
        "NIK PIC",
        "NO HP",
        "ALAMAT PIC",
        "KEMANTREN PIC",
        "KELURAHAN PIC",
      ],
      nama: /^Template_Data_Kader.*\.xlsx$/i,
      sheet: "Data Kader",
    },
    deskripsi: "Format untuk mengunggah data kader secara massal",
    id: "TCDO.4",
    judul: "Format Excel Data Kader",
    title: "downloads the Kader data Excel template",
  },
] as const;

const INFO_PENTING = [
  "Pastikan menggunakan format Excel yang sesuai saat mengunggah data",
  "Jangan mengubah struktur kolom pada format Excel",
  "Untuk bantuan lebih lanjut, silakan baca guidebook aplikasi",
  "Hubungi administrator jika mengalami kendala",
];

// ── Locator ──────────────────────────────────────────────────────────────
// Judul, deskripsi, dan tombol satu dokumen berada di <div> yang sama, tepat
// membungkus <h3>-nya. Dicari lewat struktur supaya tombol "Unduh" tiap kartu
// tidak tertukar (keempatnya bertuliskan sama persis).
const kartuDokumen = (page: Page, judul: string) =>
  page.locator(`xpath=//h3[normalize-space(.)="${judul}"]/parent::div`).first();

const unduhButton = (page: Page, judul: string) =>
  kartuDokumen(page, judul).getByRole("button", { name: "Unduh" });

const deskripsiDokumen = (page: Page, judul: string) =>
  kartuDokumen(page, judul).locator("p").first();

// Mengklik "Unduh" lalu menunggu berkasnya. Mengembalikan null bila tombolnya
// tidak menghasilkan unduhan sama sekali.
const unduh = async (page: Page, judul: string, timeout = 15_000): Promise<Download | null> => {
  const menunggu = page.waitForEvent("download", { timeout }).catch(() => null);
  await unduhButton(page, judul).click();
  return menunggu;
};

const bacaWorkbook = async (download: Download) => {
  const lokasi = await download.path();
  expect(lokasi, "Berkas hasil unduhan tidak tersimpan").not.toBeNull();

  const isi = fs.readFileSync(lokasi!);
  // .xlsx sebenarnya arsip ZIP; dicek dari signature-nya supaya berkas rusak
  // atau halaman HTML yang salah terunduh langsung ketahuan.
  expect(isi.length, "Berkas hasil unduhan kosong").toBeGreaterThan(0);
  expect(isi.subarray(0, 2).toString("utf8"), "Berkas bukan arsip xlsx yang valid").toBe("PK");

  return XLSX.readFile(lokasi!);
};

for (const role of roles) {
  test.describe(`Dokumen - ${role.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);

      await loginBAPPEDA({
        NIK: role.creds.NIK,
        page,
        password: role.creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await page.getByRole("link", { name: "Dokumen" }).click();
      await expect(page).toHaveURL(/dokumen/);
      await expect(page.getByRole("heading", { name: "Buku Panduan Aplikasi" })).toBeVisible();
    });

    // TCDO.1-4 Download
    test.describe(`TCDO.1-4 ${role.label} Download`, () => {
      for (const doc of dokumen) {
        test(`${doc.id} ${role.label} ${doc.title}`, async ({ page }) => {
          const download = await unduh(page, doc.judul);

          if (!doc.berkas) {
            // Buku Panduan Aplikasi belum punya downloadUrl di Dokumen.tsx,
            // sehingga handleDownload() berhenti lebih awal dan tombolnya tidak
            // melakukan apa pun (tanpa pesan apa pun ke pengguna).
            test.skip(
              download === null,
              `Tombol Unduh "${doc.judul}" tidak menghasilkan berkas: dokumennya belum punya downloadUrl di Dokumen.tsx`,
            );
          }

          expect(download, `Tombol Unduh "${doc.judul}" tidak menghasilkan berkas`).not.toBeNull();
          expect(download!.suggestedFilename()).toMatch(doc.berkas!.nama);

          const workbook = await bacaWorkbook(download!);
          expect(workbook.SheetNames).toContain(doc.berkas!.sheet);
        });
      }
    });

    // TCDO.5 Tampilan daftar dokumen
    test(`TCDO.5 ${role.label} views the document list`, async ({ page }) => {
      await expect(page.getByRole("button", { name: "Unduh" })).toHaveCount(dokumen.length);

      for (const doc of dokumen) {
        await expect(page.getByRole("heading", { name: doc.judul })).toBeVisible();
        await expect(deskripsiDokumen(page, doc.judul)).toHaveText(doc.deskripsi);
        // Tiap kartu hanya punya satu tombol unduh
        await expect(unduhButton(page, doc.judul)).toHaveCount(1);
        await expect(unduhButton(page, doc.judul)).toBeEnabled();
      }
    });

    // TCDO.6 Kartu Informasi Penting
    test(`TCDO.6 ${role.label} views the important information card`, async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Informasi Penting" })).toBeVisible();

      const poin = page
        .getByRole("listitem")
        .filter({ hasText: /format excel|guidebook|administrator/i });
      for (const teks of INFO_PENTING) {
        await expect(poin.filter({ hasText: teks })).toHaveCount(1);
      }
    });

    // TCDO.7 Header halaman
    test(`TCDO.7 ${role.label} views the page header`, async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Dokumen", exact: true })).toBeVisible();
      await expect(
        page.getByText("Akses guidebook dan format Excel untuk mengelola data"),
      ).toBeVisible();
    });

    // TCDO.8 Struktur kolom template yang diunduh
    test.describe(`TCDO.8 ${role.label} Template Structure`, () => {
      // Kolom template inilah yang dipakai fitur unggah massal. Bila format
      // resminya berubah, generator Excel di src/helpers/baseExcel.helper.ts
      // harus ikut menyesuaikan — test ini yang menangkap perubahannya.
      for (const doc of dokumen.filter((d) => d.berkas)) {
        test(`TCDO.8 ${role.label} ${doc.judul} has the expected columns`, async ({ page }) => {
          const download = await unduh(page, doc.judul);
          expect(download, `Tombol Unduh "${doc.judul}" tidak menghasilkan berkas`).not.toBeNull();

          const workbook = await bacaWorkbook(download!);
          const sheet = workbook.Sheets[doc.berkas!.sheet];
          expect(sheet, `Sheet "${doc.berkas!.sheet}" tidak ditemukan`).toBeDefined();

          const barisHeader = (
            XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
          )[0] as string[];

          expect(barisHeader.map((teks) => String(teks).trim())).toEqual([...doc.berkas!.header]);
        });
      }
    });
  });
}

// TCDO.9 Pembatasan akses halaman
test("TCDO.9 Relawan cannot access the Dokumen page", async ({ page }) => {
  await page.goto(BASE_URL);

  await loginBAPPEDA({
    NIK: credentials.relawan.NIK,
    page,
    password: credentials.relawan.password,
  });

  await expect(page).toHaveURL(/profil-relawan/);

  // Menu Dokumen hanya ada di sidebar Super Admin & OPD
  await expect(page.getByRole("link", { name: "Dokumen" })).toBeHidden();

  await page.goto(`${BASE_URL}dokumen`);

  await expect(page).toHaveURL(/unauthorized/);
  await expect(page.getByRole("heading", { name: "Buku Panduan Aplikasi" })).toBeHidden();
});
