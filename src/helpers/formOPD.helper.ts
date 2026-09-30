import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";

export interface OPDData {
  "NAMA OPD": string;
  STATUS: string;
  ALAMAT: string;
  PIC: string;
  "NIK PIC": string;
  KONTAK: string;
}
interface IFillOPDForm {
  data: OPDData;
  page: Page;
}
function generateSafeOPDName(): string {
  const opdName = faker.company.name();
  return opdName
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export const buildOPDData = (): OPDData => ({
  "NAMA OPD": `OPD ${generateSafeOPDName()}`,
  STATUS: "Aktif",
  ALAMAT: faker.location.streetAddress() + ", Yogyakarta",
  PIC: faker.person.fullName(),
  "NIK PIC": faker.number.bigInt({ min: 1000000000000000n, max: 9999999999999999n }).toString(),
  KONTAK: `08${faker.string.numeric(10)}`,
});
export const fillOPDForm = async ({ data, page }: IFillOPDForm) => ({
  async fillAlamat() {
    await page.getByRole("textbox", { name: "Alamat OPD" }).fill(data.ALAMAT);
  },
  async fillAll() {
    await this.fillNamaOPD();
    await this.fillAlamat();
    await this.fillPIC();
    await this.fillKontak();
    await this.fillNIKPIC();
  },
  async fillKontak() {
    await page.getByRole("textbox", { name: "Nomor telepon / email" }).fill(data.KONTAK);
  },
  async fillNamaOPD() {
    await page.getByRole("textbox", { name: "Nama Dinas / OPD" }).fill(data["NAMA OPD"]);
  },
  async fillPIC() {
    await page.getByRole("textbox", { name: "Penanggung jawab" }).fill(data.PIC);
  },
  async fillNIKPIC() {
    await page.getByRole("textbox", { name: "digit NIK PIC" }).fill(data["NIK PIC"]);
  },
});
