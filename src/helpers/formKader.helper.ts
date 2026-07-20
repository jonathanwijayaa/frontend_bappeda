import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";
import { roles } from "src/tests/daftar kader/daftarKader.spec";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan (Dinkes)",
  "Dinas Perhubungan",
  // "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)",
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

function generateSafeName(): string {
  const name = faker.person.fullName();

  // Hapus semua karakter selain huruf dan spasi
  return name.replace(/[^a-zA-Z\s]/g, "").trim();
}

export const fillKaderForm = async ({ data, page }: IFillKaderForm) => ({
  async fillAlamatPIC() {
    await page.getByRole("textbox", { name: /Alamat/i }).fill(data["ALAMAT PIC"]);
  },
  async fillAllOPD() {
    await this.fillNamaKader();
    await this.fillDeskripsi();
    await this.fillPIC();
    await this.fillNIKPIC();
    await this.fillNoHP();
    await this.fillAlamatPIC();
    await this.fillKemantren();
    await this.fillKelurahanPIC();
  },
  async fillAllSuperAdmin() {
    await this.fillOPD();
    await this.OPDvalidation();
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
    await page.getByRole("textbox", { name: /Ketik nama OPD/i }).fill(data.OPD);
  },
  async submit() {
    await page.getByRole("button", { name: "Simpan" }).click();
  },
  async cancel() {
    await page.getByRole("button", { name: "Batal" }).click();
  },
  // TOLONG BENERIN STATUS LABEL INI
  async OPDvalidation() {
    if (Array.isArray(roles) ? roles.some((r: any) => r.label === "Super Admin") : false) {
      await page.getByText("✓ OPD ditemukan dan siap").waitFor({ state: "visible" });
    }
  },
});
