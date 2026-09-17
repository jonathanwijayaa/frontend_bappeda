import { faker } from "@faker-js/faker";
import { expect, Locator, Page } from "@playwright/test";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan",
  "Dinas Perhubungan",
  "Dinas Sosial Tenaga Kerja dan Transmigrasi",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana",
];

const KEMANTREN_LIST = [
  "Danurejan",
  "Gedongtengen",
  "Gondokusuman",
  "Gondomanan",
  "Jetis",
  "Kotagede",
  "Kraton",
  "Mantrijeron",
  "Mergangsan",
  "Ngampilan",
  "Pakualaman",
  "Tegalrejo",
  "Umbulharjo",
  "Wirobrajan",
];

const KELURAHAN_MAP: Record<string, string[]> = {
  Danurejan: ["Bausasran", "Suryatmajan", "Tegalpanggung"],
  Gedongtengen: ["Pringgokusuman", "Sosromenduran"],
  Gondokusuman: ["Baciro", "Demangan", "Klitren", "Kotabaru", "Terban"],
  Gondomanan: ["Ngupasan", "Prawirodirjan"],
  Jetis: ["Bumijo", "Cokrodiningratan", "Gowongan"],
  Kotagede: ["Prenggan", "Rejowinangun", "Purbayan"],
  Kraton: ["Kadipaten", "Panembahan", "Patehan"],
  Mantrijeron: ["Gedongkiwo", "Mantrijeron", "Suryodiningratan"],
  Mergangsan: ["Brontokusuman", "Keparakan", "Wirogunan"],
  Ngampilan: ["Ngampilan", "Notoprajan"],
  Pakualaman: ["Gunungketur", "Purwokinanti"],
  Tegalrejo: ["Bener", "Karangwaru", "Kricak", "Tegalrejo"],
  Umbulharjo: ["Giwangan", "Muja Muju", "Pandeyan", "Sorosutan", "Tahunan", "Warungboto", "Semaki"],
  Wirobrajan: ["Pakuncen", "Patangpuluhan", "Wirobrajan"],
};

export interface KaderData {
  OPD: string;
  "NAMA KADER": string;
  DESKRIPSI: string;
  // STATUS: string;
  PIC: string;
  "NIK PIC": string;
  "NO HP": string;
  "ALAMAT PIC": string;
  "KELURAHAN PIC": string;
  KEMANTREN: string;
}

interface IFillKaderForm {
  data: KaderData;
  page: Page;
  isSuperAdmin: boolean;
  TCDK: string;
}

export const buildKaderData = (): KaderData => {
  const kemantren = faker.helpers.arrayElement(KEMANTREN_LIST);
  const kelurahan = faker.helpers.arrayElement(KELURAHAN_MAP[kemantren]);

  return {
    OPD: faker.helpers.arrayElement(OPD_LIST),
    "NAMA KADER": `Kader ${generateSafeName()}`,
    DESKRIPSI: faker.lorem.sentences(2),
    PIC: generateSafeName(),
    "NIK PIC": faker.number.bigInt({ min: 1000000000000000n, max: 9999999999999999n }).toString(),
    "NO HP": `08${faker.string.numeric(10)}`,
    "ALAMAT PIC": faker.location.streetAddress() + ", Yogyakarta",
    "KELURAHAN PIC": kelurahan,
    KEMANTREN: kemantren,
  };
};

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

function generateSafeName(): string {
  const name = faker.person.fullName();

  // Hapus semua karakter selain huruf dan spasi
  return name.replace(/[^a-zA-Z\s]/g, "").trim();
}

export const fillKaderForm = async ({ data, page, isSuperAdmin, TCDK }: IFillKaderForm) => ({
  async fillAlamatPIC() {
    await page.getByRole("textbox", { name: /Alamat/i }).fill(data["ALAMAT PIC"]);
  },
  async expectFillAll() {
    await ensureTextboxValue(
      page.getByRole("textbox", { name: /Nama Kader/i }),
      data["NAMA KADER"],
    );
    await ensureTextboxValue(page.getByRole("textbox", { name: /Deskripsi/i }), data["DESKRIPSI"]);
    await ensureTextboxValue(
      page.getByRole("textbox", { name: /Nama Person in Charge/i }),
      data["PIC"],
    );
    await ensureTextboxValue(page.getByRole("textbox", { name: /Nomor HP/i }), data["NO HP"]);
    await ensureTextboxValue(page.getByRole("textbox", { name: /Alamat/i }), data["ALAMAT PIC"]);
    await ensureTextboxValue(
      page.getByRole("textbox", { name: /nama kemantren/i }),
      data["KEMANTREN"],
    );
    await ensureTextboxValue(
      page.getByRole("textbox", { name: /Kelurahan/i }),
      data["KELURAHAN PIC"],
    );
    if (isSuperAdmin) {
      (page.getByRole("textbox", { name: /Ketik nama OPD/i }), data["OPD"]);
    }
  },

  async fillAll() {
    if (isSuperAdmin) {
      await this.fillOPD();
    }
    // await this.OPDvalidation();
    await this.fillNamaKader();
    await this.fillDeskripsi();
    await this.fillPIC();
    await this.fillNIKPIC();
    await this.fillNoHP();
    await this.fillAlamatPIC();
    await this.fillKemantren();
    await this.fillKelurahanPIC();
  },
  async fillKemantren() {
    await page.getByRole("textbox", { name: /nama kemantren/i }).fill(data.KEMANTREN);
  },
  async fillDeskripsi() {
    await page.getByRole("textbox", { name: /Deskripsi/i }).fill(data.DESKRIPSI);
  },
  async fillKelurahanPIC() {
    await page.getByRole("textbox", { name: /Kelurahan/i }).fill(data["KELURAHAN PIC"]);
  },
  async fillNamaKader() {
    await page.getByRole("textbox", { name: /Nama Kader/i }).fill(data["NAMA KADER"]);
  },
  async fillNoHP() {
    await page.getByRole("textbox", { name: /Nomor HP/i }).fill(data["NO HP"]);
  },
  async fillPIC() {
    await page.getByRole("textbox", { name: /Nama Person in Charge/i }).fill(data.PIC);
  },
  async fillNIKPIC() {
    await page.getByRole("textbox", { name: /16 digit NIK PIC/i }).fill(data["NIK PIC"]);
  },
  async fillOPD() {
    const textbox = page.getByRole("textbox", { name: /Ketik nama OPD/i });
    await textbox.click();
    await textbox.pressSequentially(data.OPD, { delay: 80 });
    const option = page.getByRole("listitem").filter({ hasText: data.OPD }).first();
    await expect(option).toBeVisible({
      timeout: 10000,
    });
    await option.click();
    await expect(page.getByText("✓ OPD ditemukan dan siap disimpan")).toBeVisible({
      timeout: 10000,
    });
  },
  async submitButton(maxRetry = 3) {
    const submitButton = page.getByRole("button", {
      name: "Simpan",
    });

    if (TCDK === "TCDK.6" || TCDK === "TCDK.7" || TCDK === "TCDK.8" || TCDK === "TCDK.9") {
      // await expect(submitButton).toBeDisabled();
      await submitButton.click();
    } else {
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
    }
  },
  async cancelButton() {
    await page.getByRole("button", { name: "Batal" }).click();
  },
  // // TOLONG BENERIN STATUS LABEL INI
  // async OPDvalidation() {
  //   if (Array.isArray(roles) ? roles.some((r: any) => r.label === "Super Admin") : false) {
  //     await page.getByText("✓ OPD ditemukan dan siap").waitFor({ state: "visible" });
  //   }
  // },
});
