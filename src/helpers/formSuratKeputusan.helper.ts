import { faker } from "@faker-js/faker";
import { expect, Page } from "@playwright/test";
import path from "path";

import {
  checkThink,
  clickThink,
  fillThink,
  LOAD_TIME,
  pesanLoadTime,
  typeThink,
  uploadThink,
  waitLoaded,
} from "@/helpers/timing.helper";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan",
  "Dinas Perhubungan",
  "Dinas Sosial Tenaga Kerja dan Transmigrasi",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana",
];

export interface SKData {
  "NO SK": string;
  "JUDUL SK": string;
  "TANGGAL TERBIT": string;
  "BATAS AKTIF": string;
  OPD: string;
  KADER: string;
  "STATUS KEAKTIFAN"?: string;
  FILE: string;
}

interface IFillSKForm {
  data: SKData;
  page: Page;
  isSuperAdmin: boolean;
}

// ── Locator form upload SK ────────────────────────────────────────────────
// Label pada form tidak terhubung ke input-nya (tanpa htmlFor/id), dan untuk
// role OPD field OPD dikunci (disabled) tanpa placeholder sehingga tidak punya
// accessible name. Karena itu field dicari lewat struktur:
// <label>X</label> -> elemen berikutnya. Locator berbasis indeks (nth) dihindari
// karena urutannya berubah tergantung role dan isi halaman di balik modal.
const fieldWrapper = (page: Page, label: string) =>
  page.locator(`xpath=//label[normalize-space(text())="${label}"]/following-sibling::*[1]`).first();

const fieldInput = (page: Page, label: string) =>
  fieldWrapper(page, label).locator("xpath=descendant-or-self::input").first();

export const noSKField = (page: Page) => page.getByPlaceholder("800/123/BPBD/2026");
export const judulSKField = (page: Page) => page.getByPlaceholder("Pengangkatan Kader");
export const tanggalTerbitField = (page: Page) => fieldInput(page, "Tanggal Terbit");
export const batasAktifField = (page: Page) => fieldInput(page, "Batas Aktif");

// Berlaku untuk super admin (autocomplete) maupun OPD (input terkunci)
export const opdField = (page: Page) => fieldInput(page, "OPD");

const opdOptions = (page: Page) => fieldWrapper(page, "OPD").getByRole("listitem");

// Label pembungkus tiap checkbox kader, termasuk "Pilih Semua (N kader)"
const kaderLabels = (page: Page) =>
  page.locator("label").filter({ has: page.locator("input[type='checkbox']") });

// Cocokkan teks secara persis supaya nama mirip (mis. "PKK" vs "PKK RW") tidak salah pilih
const exactText = (value: string) =>
  new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");

function generateSafeSKTitle(): string {
  const skTitle = faker.company.name();
  // Rapatkan spasi ganda sisa tanda baca (mis. "Hills - Smith")
  return skTitle
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// With format example "800/123/BPBD/YYYY"
function generateSafeSKNumber(): string {
  const skNumber = faker.number.int({ min: 100, max: 999 });
  const skSubNumber = faker.number.int({ min: 100, max: 999 });
  const skOpd = OPD_LIST[Math.floor(Math.random() * OPD_LIST.length)];
  const currentYear = new Date().getFullYear();
  return `${skNumber}/${skSubNumber}/${skOpd}/${currentYear}`;
}

// Nama file yang tampil di modal setelah dilampirkan
const fileChip = (page: Page, filePath: string) =>
  page.getByText(path.basename(filePath), { exact: true });

/**
 * Melampirkan file PDF SEKALI dan menunggu file masuk ke state komponen.
 *
 * Komponen memakai react-dropzone: file yang tampil berasal dari state React,
 * bukan dari FileList input, jadi yang ditunggu adalah nama file yang tampil
 * di modal. Tidak ada percobaan ulang: bila nama file tidak tampil dalam
 * LOAD_TIME (mis. form ter-reset oleh re-render halaman induk), itu kegagalan
 * valid aplikasi.
 */
export async function attachFile(page: Page, filePath: string): Promise<void> {
  await uploadThink(page.locator("input[type='file']"), filePath);
  await waitLoaded(fileChip(page, filePath), `file "${path.basename(filePath)}" terlampir`);
}

/**
 * Memilih OPD pada autocomplete (khusus super admin), SEKALI ketik.
 *
 * AutocompleteInput hanya memfilter saat teks diketik; bila daftar OPD tidak
 * muncul dalam LOAD_TIME setelah pengetikan, itu kegagalan valid.
 */
export async function selectOPDOption(page: Page, opd: string): Promise<void> {
  const textbox = opdField(page);
  const option = opdOptions(page).filter({ hasText: exactText(opd) });

  await clickThink(textbox);
  await textbox.fill("");
  await typeThink(textbox, opd);

  await waitLoaded(option.first(), `opsi OPD "${opd}" muncul di daftar`);
  await clickThink(option.first());
  await waitLoaded(page.getByText("✓ OPD valid dipilih"), "konfirmasi OPD valid tampil");
}

/**
 * Mengambil nama kader yang benar-benar tersedia untuk OPD yang aktif di form.
 * Daftar kader mengikuti OPD, jadi tidak boleh ditebak dari data hasil generate.
 */
export async function pickKaderFromForm(page: Page): Promise<string> {
  const labels = kaderLabels(page);

  try {
    // Checkbox baru muncul setelah daftar kader milik OPD selesai dimuat
    await expect(labels.first()).toBeVisible({ timeout: LOAD_TIME });
  } catch {
    throw new Error(
      pesanLoadTime(
        `tidak ada checkbox kader pada OPD "${await opdField(page).inputValue()}". ` +
          "OPD tersebut kemungkinan belum memiliki kader terdaftar.",
      ),
    );
  }

  const kaderList = (await labels.allInnerTexts())
    .map((text) => text.trim())
    // Baris pertama adalah "Pilih Semua (N kader)", bukan nama kader
    .filter((text) => text && !/^pilih semua/i.test(text));

  if (kaderList.length === 0) {
    throw new Error("Tidak ada opsi kader pada OPD yang aktif di form SK");
  }

  return faker.helpers.arrayElement(kaderList);
}

/** Menyelaraskan data OPD & KADER dengan isi form (OPD menentukan daftar kadernya). */
export async function syncKaderWithForm(page: Page, data: SKData): Promise<SKData> {
  await expect
    .poll(() => opdField(page).inputValue(), {
      message: pesanLoadTime("field OPD pada form SK terisi"),
      timeout: LOAD_TIME,
    })
    .not.toBe("");

  data.OPD = (await opdField(page).inputValue()).trim();
  data.KADER = await pickKaderFromForm(page);

  return data;
}

export const buildSKData = (): SKData => {
  const opd = OPD_LIST[Math.floor(Math.random() * OPD_LIST.length)];
  const filePath = path.resolve("src/assets/files/Sample_SK.pdf");

  return {
    "NO SK": generateSafeSKNumber(),
    "JUDUL SK": `SK ${generateSafeSKTitle()}`,
    "TANGGAL TERBIT": faker.date.past().toISOString().split("T")[0],
    "BATAS AKTIF": faker.date.future().toISOString().split("T")[0],
    OPD: opd,
    // Diisi dari form saat selectKader(), karena daftar kader mengikuti OPD
    KADER: "",
    FILE: filePath,
  };
};

export const fillSKForm = async ({ data, page, isSuperAdmin }: IFillSKForm) => ({
  async fillAll() {
    await this.uploadFile();
    await this.fillNoSK();
    await this.fillJudulSK();
    await this.fillTanggalTerbit();
    await this.fillBatasAktif();
    if (isSuperAdmin) {
      await this.selectOPD();
    }
    await this.selectKader();
  },

  /**
   * Memeriksa seluruh isian form masih sesuai data. Tidak ada pengisian ulang:
   * bila isian hilang (form ter-reset oleh re-render), itu kegagalan valid.
   */
  async expectFillALL() {
    await expect(noSKField(page)).toHaveValue(data["NO SK"]);
    await expect(judulSKField(page)).toHaveValue(data["JUDUL SK"]);
    await expect(tanggalTerbitField(page)).toHaveValue(data["TANGGAL TERBIT"]);
    await expect(batasAktifField(page)).toHaveValue(data["BATAS AKTIF"]);

    await expect(opdField(page)).toHaveValue(data.OPD);
    if (isSuperAdmin) {
      await expect(page.getByText("✓ OPD valid dipilih")).toBeVisible();
    }

    await expect(page.getByRole("checkbox", { name: exactText(data.KADER) })).toBeChecked();

    // File diperiksa paling akhir: state file paling rentan hilang saat form re-render
    await expect(fileChip(page, data.FILE)).toBeVisible();
  },

  async fillNoSK() {
    await fillThink(noSKField(page), data["NO SK"]);
    await expect(noSKField(page)).toHaveValue(data["NO SK"]);
  },

  async fillJudulSK() {
    await fillThink(judulSKField(page), data["JUDUL SK"]);
    await expect(judulSKField(page)).toHaveValue(data["JUDUL SK"]);
  },

  async fillTanggalTerbit() {
    await fillThink(tanggalTerbitField(page), data["TANGGAL TERBIT"]);
    await expect(tanggalTerbitField(page)).toHaveValue(data["TANGGAL TERBIT"]);
  },

  async fillBatasAktif() {
    await fillThink(batasAktifField(page), data["BATAS AKTIF"]);
    await expect(batasAktifField(page)).toHaveValue(data["BATAS AKTIF"]);
  },

  async selectOPD() {
    // Role selain super admin: field OPD terkunci ke instansi user
    if (!(await opdField(page).isEditable())) {
      data.OPD = (await opdField(page).inputValue()).trim();
      return;
    }

    await selectOPDOption(page, data.OPD);
  },

  async selectKader() {
    await syncKaderWithForm(page, data);

    const checkbox = page.getByRole("checkbox", { name: exactText(data.KADER) });
    await checkThink(checkbox);
    await expect(checkbox).toBeChecked();
  },

  async uploadFile() {
    await attachFile(page, data.FILE);
  },

  /**
   * Satu kali klik "Unggah SK", lalu tunggu form tertutup (maks LOAD_TIME).
   * Tidak ada pengisian ulang/percobaan ulang: form yang ter-reset sendiri
   * sebelum submit adalah kegagalan valid aplikasi.
   */
  async submitButton() {
    const submitButton = page.getByRole("button", { name: "Unggah SK" });

    // Form menolak lewat alert() bawaan browser; pesannya ditangkap supaya
    // kegagalan menyebutkan field mana yang kosong, bukan sekadar "tombol masih tampil"
    const alerts: string[] = [];
    const onDialog = (dialog: { message: () => string; dismiss: () => Promise<void> }) => {
      alerts.push(dialog.message());
      void dialog.dismiss();
    };
    page.on("dialog", onDialog);

    try {
      await clickThink(submitButton);

      try {
        await waitLoaded(submitButton, "form SK tertutup setelah unggah", "hidden");
      } catch (error) {
        throw alerts.length > 0
          ? new Error(`Form SK ditolak aplikasi: ${alerts.join(" | ")}`)
          : error;
      }
    } finally {
      page.off("dialog", onDialog);
    }
  },
});

export const selectKader = async ({ data, page }: IFillSKForm) => {
  await syncKaderWithForm(page, data);

  const checkbox = page.getByRole("checkbox", { name: exactText(data.KADER) });
  await checkThink(checkbox);
  await expect(checkbox).toBeChecked();
};

export const selectOPD = async ({ data, page }: IFillSKForm) => {
  // Role selain super admin: field terkunci, jadi data yang menyesuaikan form
  if (!(await opdField(page).isEditable())) {
    data.OPD = (await opdField(page).inputValue()).trim();
    return;
  }

  await selectOPDOption(page, data.OPD);
};
