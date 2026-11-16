import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";

import { fillThink } from "@/helpers/timing.helper";

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
  // Apostrof (mis. "O'Conner") ditolak REGEX ALAMAT_VALID
  ALAMAT: faker.location.streetAddress().replace(/'/g, "") + ", Yogyakarta",
  PIC: faker.person.fullName(),
  "NIK PIC": faker.number.bigInt({ min: 1000000000000000n, max: 9999999999999999n }).toString(),
  KONTAK: `08${faker.string.numeric(10)}`,
});
export const fillOPDForm = async ({ data, page }: IFillOPDForm) => ({
  async fillAlamat() {
    await fillThink(page.getByRole("textbox", { name: "Alamat OPD" }), data.ALAMAT);
  },
  async fillAll() {
    await this.fillNamaOPD();
    await this.fillAlamat();
    await this.fillPIC();
    await this.fillKontak();
    await this.fillNIKPIC();
  },
  async fillKontak() {
    await fillThink(page.getByRole("textbox", { name: "Nomor telepon / email" }), data.KONTAK);
  },
  async fillNamaOPD() {
    await fillThink(page.getByRole("textbox", { name: "Nama Dinas / OPD" }), data["NAMA OPD"]);
  },
  async fillPIC() {
    await fillThink(page.getByRole("textbox", { name: "Penanggung jawab" }), data.PIC);
  },
  async fillNIKPIC() {
    await fillThink(page.getByRole("textbox", { name: "digit NIK PIC" }), data["NIK PIC"]);
  },
});
