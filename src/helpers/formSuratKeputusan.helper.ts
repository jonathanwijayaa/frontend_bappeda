import { faker } from "@faker-js/faker";
import { expect, Locator, Page } from "@playwright/test";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan (Dinkes)",
  "Dinas Perhubungan",
  "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)",
];

const KADER_MAP: Record<string, string[]> = {
  "Opd Demo": ["Kader Dana West", "Demo Kader"],

  "Dinas Kesehatan (Dinkes)": ["KADER KESEHATAN"],

  "Dinas Perhubungan": ["Kader Perhubungan C", "Kader Perhubungan C1"],

  "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)": ["PORDAM", "TAGANA", "IPSM"],

  "Dinas Pariwisata": ["Kader Pariwisata 1"],

  "Dinas Kebudayaan": ["Kader Kebudayaan 1", "Kader Kebudayaan 2"],

  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)":
    ["SIGRAK", "POSYANDU", "PKK"],
};
export interface SKData {
  "NO SK": string;
  "JUDUL SK": string;
  "TANGGAL TERBIT": string;
  "BATAS AKTIF": string;
  OPD: string;
  KADER: string;
  "STATUS KEAKTIFAN"?: string;
}
interface IFillSKForm {
  data: SKData;
  page: Page;
}
function generateSafeSKTitle(): string {
  const skTitle = faker.company.name();
  return skTitle.replace(/[^a-zA-Z\s]/g, "").trim();
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
    await locator.clear();
    await locator.fill(expectedValue);
  }

  await expect(locator).toHaveValue(expectedValue);
}

async function ensureFileUploaded(
  fileInput: Locator,
  filePath: string,
  expectedFileName: string,
  maxRetry = 3,
): Promise<void> {
  // .first() mencegah strict-mode violation kalau selector cocok >1 elemen
  const input = fileInput.first();

  const getUploadedName = () => input.evaluate((el: HTMLInputElement) => el.files?.[0]?.name ?? "");

  for (let i = 1; i <= maxRetry; i++) {
    let uploadedFileName = "";
    try {
      uploadedFileName = await getUploadedName();
    } catch (err) {
      console.log(`Retry (${i}/${maxRetry}) - evaluate error: ${(err as Error).message}`);
    }

    if (uploadedFileName === expectedFileName) return;

    console.log(`Retry upload file (${i}/${maxRetry}) - current: "${uploadedFileName}"`);
    await input.setInputFiles(filePath);

    // beri waktu handler onChange (baca file, render preview) selesai
    await input.page().waitForTimeout(300);
  }

  // pakai expect.poll supaya ada retry+timeout bawaan Playwright, bukan cuma 1x cek terakhir
  await expect
    .poll(getUploadedName, {
      message: `Nama file di <input> tidak sesuai. Diharapkan "${expectedFileName}"`,
      timeout: 5000,
    })
    .toBe(expectedFileName);
}
// ========= UNDER CONSTRUCTION =========

export const buildSKData = (): SKData => {
  const opd = OPD_LIST[Math.floor(Math.random() * OPD_LIST.length)];
  const kaderList = KADER_MAP[opd];
  const kader = kaderList[Math.floor(Math.random() * kaderList.length)];

  return {
    "NO SK": generateSafeSKNumber(),
    "JUDUL SK": `SK ${generateSafeSKTitle()}`,
    "TANGGAL TERBIT": faker.date.past().toISOString().split("T")[0],
    "BATAS AKTIF": faker.date.future().toISOString().split("T")[0],
    OPD: opd,
    KADER: kader,
  };
};

export const fillSKForm = async ({ data, page }: IFillSKForm) => ({
  async fillAll(filePath: string) {
    await this.uploadFile(filePath);
    await this.fillNoSK();
    await this.fillJudulSK();
    await this.fillTanggalTerbit();
    await this.fillBatasAktif();
    await this.selectOPD();
    await this.selectKader();
  },
  async expectFillALL(filePath: string) {
    await ensureTextboxValue(page.getByRole("textbox", { name: "/123/BPBD/2026" }), data["NO SK"]);
    await ensureTextboxValue(
      page.getByRole("textbox", { name: "Pengangkatan Kader" }),
      data["JUDUL SK"],
    );
    await ensureTextboxValue(page.getByRole("textbox").nth(3), data["TANGGAL TERBIT"]);
    await ensureTextboxValue(page.getByRole("textbox").nth(4), data["BATAS AKTIF"]);

    if (!(await page.getByText("✓ OPD valid dipilih").isVisible())) {
      await this.selectOPD();
    }

    await expect(page.getByText("✓ OPD valid dipilih")).toBeVisible();

    const kader = page.getByRole("checkbox", {
      name: data.KADER,
    });

    if (!(await kader.isChecked())) {
      await kader.check();
    }

    await expect(kader).toBeChecked();
    await ensureFileUploaded(page.locator('input[type="file"]'), filePath, "Sample_SK.pdf");
  },
  async fillNoSK() {
    await page.getByRole("textbox", { name: "/123/BPBD/2026" }).fill(data["NO SK"]);
    expect(page.getByRole("textbox", { name: "/123/BPBD/2026" })).toHaveValue(data["NO SK"]);
  },
  async fillJudulSK() {
    await page.getByRole("textbox", { name: "Pengangkatan Kader" }).fill(data["JUDUL SK"]);
    expect(page.getByRole("textbox", { name: "Pengangkatan Kader" })).toHaveValue(data["JUDUL SK"]);
  },
  async fillTanggalTerbit() {
    await page.getByRole("textbox").nth(3).fill(data["TANGGAL TERBIT"]);
    expect(page.getByRole("textbox").nth(3)).toHaveValue(data["TANGGAL TERBIT"]);
  },
  async fillBatasAktif() {
    await page.getByRole("textbox").nth(4).fill(data["BATAS AKTIF"]);
    expect(page.getByRole("textbox").nth(4)).toHaveValue(data["BATAS AKTIF"]);
  },
  async selectOPD() {
    const textbox = page.getByRole("textbox", {
      name: "Ketik nama OPD...",
    });
    await textbox.click();
    await textbox.pressSequentially(data.OPD, {
      delay: 80,
    });
    const option = page.getByRole("listitem").filter({ hasText: data.OPD });
    await expect(option).toBeVisible({
      timeout: 30000,
    });
    await option.click();
    await expect(page.getByText("✓ OPD valid dipilih")).toBeVisible({
      timeout: 30000,
    });
  },
  async selectKader() {
    await page.getByRole("checkbox", { name: data.KADER }).check();
  },
  async uploadFile(filePath: string) {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  },
  async submitButton(maxRetry = 3) {
    const submitButton = page.getByRole("button", {
      name: "Unggah SK",
    });

    for (let i = 1; i <= maxRetry; i++) {
      try {
        await submitButton.click();

        // Tunggu sampai tombol hilang/disabled
        await expect(submitButton).toBeHidden({
          timeout: 3000,
        });

        return;
      } catch (error) {
        console.log(`Retry submit (${i}/${maxRetry})`);

        if (i === maxRetry) {
          throw error;
        }
      }
    }
  },
});

export const selectKader = async ({ data, page }: IFillSKForm) => {
  await page
    .getByRole("textbox", { name: /memuat kader/i })
    .or(page.getByRole("textbox", { name: "Cari nama Kader..." }))
    .fill(data.KADER);
};

export const selectOPD = async ({ data, page }: IFillSKForm) => {
  const textbox = page.getByRole("textbox", {
    name: "Ketik nama OPD...",
  });
  await textbox.click();
  await textbox.pressSequentially(data.OPD, {
    delay: 80,
  });
  const option = page.getByRole("listitem").filter({ hasText: data.OPD });
  await expect(option).toBeVisible({
    timeout: 30000,
  });
  await option.click();
  await expect(page.getByText("✓ OPD valid dipilih")).toBeVisible({
    timeout: 30000,
  });
};
