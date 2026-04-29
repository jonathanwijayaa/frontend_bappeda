import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";

const OPD_LIST = [
  "Dinas Kesehatan",
  "Dinas Pendidikan",
  "Dinas Perhubungan",
  "Dinas Sosial",
];

export interface KaderData {
  OPD: string;
  "NAMA KADER": string;
  DESKRIPSI: string;
  STATUS: string;
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
  "NAMA KADER": `Kader ${faker.person.fullName()}`,
  DESKRIPSI: faker.lorem.sentences(2),
  STATUS: "Aktif",
  PIC: faker.person.fullName(),
  "NIK PIC": faker.number
    .bigInt({ min: 1000000000000000n, max: 9999999999999999n })
    .toString(),
  "NO HP": `08${faker.string.numeric(10)}`,
  "ALAMAT PIC": faker.location.streetAddress() + ", Yogyakarta",
  "KELURAHAN PIC": faker.location.city(),
});

export const fillKaderForm = async ({ data, page }: IFillKaderForm) => ({
  async fillAlamatPIC() {
    await page
      .getByRole("textbox", { name: "Alamat penanggung jawab" })
      .fill(data["ALAMAT PIC"]);
  },
  async fillAll() {
    await this.fillNamaKader();
    await this.fillDeskripsi();
    await this.fillPIC();
    await this.fillNIKPIC();
    await this.fillNoHP();
    await this.fillAlamatPIC();
    await this.fillKelurahanPIC();
  },
  async fillDeskripsi() {
    await page.getByRole("textbox", { name: "Deskripsi" }).fill(data.DESKRIPSI);
  },
  async fillKelurahanPIC() {
    await page
      .getByRole("textbox", { name: "Kelurahan penanggung jawab" })
      .fill(data["KELURAHAN PIC"]);
  },
  async fillNamaKader() {
    await page
      .getByRole("textbox", { name: "Nama Kader" })
      .fill(data["NAMA KADER"]);
  },
  async fillNoHP() {
    await page
      .getByRole("textbox", { name: "Nomor telepon / email" })
      .fill(data["NO HP"]);
  },
  async fillPIC() {
    await page
      .getByRole("textbox", { name: "Penanggung jawab" })
      .fill(data.PIC);
  },
  async fillNIKPIC() {
    await page
      .getByRole("textbox", { name: "digit NIK PIC" })
      .fill(data["NIK PIC"]);
  },
});

export const selectOPD = async ({ data, page }: IFillKaderForm) => {
  await page.getByRole("combobox", { name: "OPD" }).selectOption(data.OPD);
};

export const selectStatus = async ({ data, page }: IFillKaderForm) => {
  await page.getByRole("combobox", { name: "Status" }).selectOption(data.STATUS);
};

export const submitKaderForm = async ({ page }: IFillKaderForm) => {
  await page.getByRole("button", { name: "Simpan" }).click();
};
