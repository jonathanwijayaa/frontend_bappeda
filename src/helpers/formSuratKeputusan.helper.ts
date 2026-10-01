import { faker } from "@faker-js/faker";
import { expect, Locator, Page } from "@playwright/test";
import path from "path";

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
  page
    .locator(`xpath=//label[normalize-space(text())="${label}"]/following-sibling::*[1]`)
    .first();

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

async function ensureTextboxValue(
  locator: Locator,
  expectedValue: string,
  maxRetry = 3,
): Promise<void> {
  for (let i = 0; i < maxRetry; i++) {
    const currentValue = await locator.inputValue();

    if (currentValue === expectedValue) {
      await expect(locator).toHaveValue(expectedValue);
      return;
    }

    await locator.click();
    await locator.fill("");
    await locator.fill(expectedValue);
  }

  await expect(locator).toHaveValue(expectedValue);
}

/**
 * Melampirkan file PDF dan memastikan file benar-benar masuk ke state komponen.
 *
 * Komponen memakai react-dropzone: file yang tampil berasal dari state React,
 * bukan dari FileList input. Kalau form ter-reset, FileList bisa tetap terisi
 * padahal state-nya sudah kosong — karena itu yang diperiksa adalah nama file
 * yang tampil di modal, dan input dikosongkan dulu supaya event change terpicu.
 */
export async function ensureFileAttached(
  page: Page,
  filePath: string,
  maxRetry = 3,
): Promise<void> {
  const fileInput = page.locator("input[type='file']");
  const fileChip = page.getByText(path.basename(filePath), { exact: true });

  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    if (await fileChip.isVisible()) return;

    await fileInput.setInputFiles([]);
    await fileInput.setInputFiles(filePath);

    try {
      await expect(fileChip).toBeVisible({ timeout: 5000 });
      return;
    } catch (error) {
      if (attempt === maxRetry) {
        throw error;
      }
      console.log(`File SK belum terlampir, ulangi (${attempt}/${maxRetry})`);
    }
  }
}

/**
 * Memilih OPD pada autocomplete (khusus super admin).
 *
 * AutocompleteInput hanya memfilter saat teks diketik, jadi bila daftar OPD
 * baru selesai dimuat setelah pengetikan, dropdown tetap kosong — pengetikan
 * diulang sampai opsinya muncul.
 */
export async function selectOPDOption(page: Page, opd: string, maxRetry = 3): Promise<void> {
  const textbox = opdField(page);
  const option = opdOptions(page).filter({ hasText: exactText(opd) });

  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    try {
      await textbox.click();
      await textbox.fill("");
      await textbox.pressSequentially(opd, { delay: 80 });

      await expect(option.first()).toBeVisible({ timeout: 5000 });
      await option.first().click();
      await expect(page.getByText("✓ OPD valid dipilih")).toBeVisible({ timeout: 10000 });
      return;
    } catch (error) {
      if (attempt === maxRetry) {
        throw error;
      }
      console.log(`Opsi OPD "${opd}" belum muncul, ulangi (${attempt}/${maxRetry})`);
    }
  }
}

/**
 * Mengambil nama kader yang benar-benar tersedia untuk OPD yang aktif di form.
 * Daftar kader mengikuti OPD, jadi tidak boleh ditebak dari data hasil generate.
 */
export async function pickKaderFromForm(page: Page): Promise<string> {
  const labels = kaderLabels(page);

  try {
    // Checkbox baru muncul setelah daftar kader milik OPD selesai dimuat
    await expect(labels.first()).toBeVisible({ timeout: 15000 });
  } catch {
    throw new Error(
      `Tidak ada checkbox kader pada OPD "${await opdField(page).inputValue()}". ` +
        "OPD tersebut kemungkinan belum memiliki kader terdaftar.",
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
  await expect.poll(() => opdField(page).inputValue(), { timeout: 15000 }).not.toBe("");

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

  async expectFillALL() {
    await ensureTextboxValue(noSKField(page), data["NO SK"]);
    await ensureTextboxValue(judulSKField(page), data["JUDUL SK"]);
    await ensureTextboxValue(tanggalTerbitField(page), data["TANGGAL TERBIT"]);
    await ensureTextboxValue(batasAktifField(page), data["BATAS AKTIF"]);

    await expect(opdField(page)).toHaveValue(data.OPD);
    if (isSuperAdmin) {
      await expect(page.getByText("✓ OPD valid dipilih")).toBeVisible();
    }

    const kader = page.getByRole("checkbox", { name: exactText(data.KADER) });
    if (!(await kader.isChecked())) {
      await kader.check();
    }
    await expect(kader).toBeChecked();

    // File diperiksa paling akhir: state file paling rentan hilang saat form re-render
    await ensureFileAttached(page, data.FILE);
  },

  async fillNoSK() {
    await noSKField(page).fill(data["NO SK"]);
    await expect(noSKField(page)).toHaveValue(data["NO SK"]);
  },

  async fillJudulSK() {
    await judulSKField(page).fill(data["JUDUL SK"]);
    await expect(judulSKField(page)).toHaveValue(data["JUDUL SK"]);
  },

  async fillTanggalTerbit() {
    await tanggalTerbitField(page).fill(data["TANGGAL TERBIT"]);
    await expect(tanggalTerbitField(page)).toHaveValue(data["TANGGAL TERBIT"]);
  },

  async fillBatasAktif() {
    await batasAktifField(page).fill(data["BATAS AKTIF"]);
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
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  },

  async uploadFile() {
    await ensureFileAttached(page, data.FILE);
  },

  async submitButton(maxRetry = 3) {
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
      for (let i = 1; i <= maxRetry; i++) {
        alerts.length = 0;
        await submitButton.click();

        try {
          // Tunggu sampai tombol hilang/disabled
          await expect(submitButton).toBeHidden({ timeout: 5000 });
          return;
        } catch (error) {
          if (i === maxRetry) {
            throw alerts.length > 0
              ? new Error(`Form SK ditolak aplikasi: ${alerts.join(" | ")}`)
              : error;
          }

          // Form bisa ter-reset sendiri saat halaman induk re-render,
          // sehingga isian hilang tepat sebelum submit → isi ulang lalu coba lagi
          if (alerts.some((message) => /masih kosong/i.test(message))) {
            console.log(`Form ter-reset sebelum submit, isi ulang (${i}/${maxRetry})`);
            await this.fillAll();
            await this.expectFillALL();
            continue;
          }

          if (alerts.length > 0) {
            throw new Error(`Form SK ditolak aplikasi: ${alerts.join(" | ")}`);
          }

          console.log(`Retry submit (${i}/${maxRetry})`);
        }
      }
    } finally {
      page.off("dialog", onDialog);
    }
  },
});

export const selectKader = async ({ data, page }: IFillSKForm) => {
  await syncKaderWithForm(page, data);

  const checkbox = page.getByRole("checkbox", { name: exactText(data.KADER) });
  await checkbox.check();
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
