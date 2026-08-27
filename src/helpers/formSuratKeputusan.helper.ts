import { faker } from "@faker-js/faker";
import { expect, Locator, Page } from "@playwright/test";
import path from "path";

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
  FILE: string;
}
interface IFillSKForm {
  data: SKData;
  page: Page;
  isSuperAdmin: boolean;
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

function findKaderListForOPD(opdText: string): string[] {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const normalized = normalize(opdText);

  const matchedKey = Object.keys(KADER_MAP).find((key) => normalize(key) === normalized);

  if (!matchedKey) {
    throw new Error(`Tidak ditemukan daftar Kader untuk OPD: "${opdText}"`);
  }

  return KADER_MAP[matchedKey];
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
  page: Page,
  fileInput: Locator,
  filePath: string,
  maxRetry = 3,
): Promise<void> {
  const fileName = path.basename(filePath);

  for (let i = 0; i < maxRetry; i++) {
    const attachedFiles = await fileInput.evaluate((el: HTMLInputElement) =>
      Array.from(el.files ?? []).map((f) => f.name),
    );

    if (attachedFiles.includes(fileName)) {
      return;
    }

    await fileInput.setInputFiles(filePath);
  }

  // Verifikasi akhir: kalau setelah maxRetry masih belum ke-attach, test langsung gagal di sini
  await expect
    .poll(() =>
      fileInput.evaluate((el: HTMLInputElement) => Array.from(el.files ?? []).map((f) => f.name)),
    )
    .toContain(fileName);

  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Sample_SK\.pdf\(6\.09 KB\)$/ })
      .first(),
  ).toBeVisible({ timeout: 30000 });
}

export const buildSKData = (): SKData => {
  const opd = OPD_LIST[Math.floor(Math.random() * OPD_LIST.length)];
  const kaderList = KADER_MAP[opd];
  const kader = kaderList[Math.floor(Math.random() * kaderList.length)];
  const filePath = path.resolve("src/assets/files/Sample_SK.pdf");

  return {
    "NO SK": generateSafeSKNumber(),
    "JUDUL SK": `SK ${generateSafeSKTitle()}`,
    "TANGGAL TERBIT": faker.date.past().toISOString().split("T")[0],
    "BATAS AKTIF": faker.date.future().toISOString().split("T")[0],
    OPD: opd,
    KADER: kader,
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
    await ensureTextboxValue(page.getByRole("textbox", { name: "/123/BPBD/2026" }), data["NO SK"]);
    await ensureTextboxValue(
      page.getByRole("textbox", { name: "Pengangkatan Kader" }),
      data["JUDUL SK"],
    );
    await ensureTextboxValue(page.getByRole("textbox").nth(3), data["TANGGAL TERBIT"]);
    await ensureTextboxValue(page.getByRole("textbox").nth(4), data["BATAS AKTIF"]);

    if (isSuperAdmin) {
      await expect(page.getByRole("textbox").nth(5)).toHaveValue(data.OPD);
    } else {
      if (!(await page.getByText("✓ OPD valid dipilih").isVisible())) {
        await this.selectOPD();
      }
      await expect(page.getByText("✓ OPD valid dipilih")).toBeVisible();
    }

    const kader = page.getByRole("checkbox", {
      name: data.KADER,
    });
    if (!(await kader.isChecked())) {
      await kader.check();
    }

    await expect(kader).toBeChecked();
    await ensureFileUploaded(page, page.locator("input[type='file']"), data.FILE);
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
    const textbox = page.getByRole("textbox").nth(5);
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
    if (isSuperAdmin) {
      const opdTextbox = page.getByRole("textbox").nth(5);

      await expect.poll(() => opdTextbox.inputValue(), { timeout: 10000 }).not.toBe("");

      const OPDValue = await opdTextbox.inputValue();

      if (OPDValue !== data.OPD) {
        const kaderList = findKaderListForOPD(OPDValue);
        data.OPD = OPDValue;
        data.KADER = faker.helpers.arrayElement(kaderList);
      }
    }

    await page.getByRole("checkbox", { name: data.KADER }).check();
  },
  async uploadFile() {
    await page.getByText("Tarik & lepas file PDF di sini").click();

    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles(data.FILE);
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

export const selectKader = async ({ data, page, isSuperAdmin }: IFillSKForm) => {
  if (isSuperAdmin) {
    const opdTextbox = page.getByRole("textbox").nth(5);

    await expect.poll(() => opdTextbox.inputValue(), { timeout: 10000 }).not.toBe("");

    const OPDValue = await opdTextbox.inputValue();

    if (OPDValue !== data.OPD) {
      const kaderList = findKaderListForOPD(OPDValue);
      data.OPD = OPDValue;
      data.KADER = faker.helpers.arrayElement(kaderList);
    }
  }

  await page.getByRole("checkbox", { name: data.KADER }).check();
};

export const selectOPD = async ({ data, page }: IFillSKForm) => {
  const textbox = page.getByRole("textbox").nth(5);
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
