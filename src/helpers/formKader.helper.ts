import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan (Dinkes)",
  "Dinas Perhubungan",
  "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)",
];

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
}

interface IFillKaderForm {
  data: KaderData;
  page: Page;
}

export const buildKaderData = (): KaderData => ({
  OPD: faker.helpers.arrayElement(OPD_LIST),
  "NAMA KADER": `Kader ${generateSafeName()}`,
  DESKRIPSI: faker.lorem.sentences(2),
  PIC: generateSafeName(),
  "NIK PIC": faker.number.bigInt({ min: 1000000000000000n, max: 9999999999999999n }).toString(),
  "NO HP": `08${faker.string.numeric(10)}`,
  "ALAMAT PIC": faker.location.streetAddress() + ", Yogyakarta",
  "KELURAHAN PIC": faker.location.city(),
});

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
    await this.fillKelurahanPIC();
  },
  async fillAllSuperAdmin() {
    await this.fillOPD();
    await this.fillNamaKader();
    await this.fillDeskripsi();
    await this.fillPIC();
    await this.fillNIKPIC();
    await this.fillNoHP();
    await this.fillAlamatPIC();
    await this.fillKelurahanPIC();
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
});
