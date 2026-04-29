import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
// import { uploadSingleImage } from "./uploadSingleImage.helper";

export interface OPDData {
  alamat: string;
  kontak: string;
  namaOPD: string;
  pic: string;
  nikpic: string;
}

interface IFillOPDForm {
  data: OPDData;
  page: Page;
}

export const buildOPDData = (): OPDData => {
  return {
    alamat: faker.location.streetAddress(),
    kontak: `08${faker.number.int({ max: 9999999999, min: 1000000000 })}`,
    namaOPD: `OPD ${faker.company.name()}`,
    pic: faker.person.fullName(),
    nikpic: `0000000000000${faker.number.int({ max: 999, min: 100 })}`,
  };
};

export const fillOPDForm = async ({ data, page }: IFillOPDForm) => {
  return {
    async fillAlamat() {
      await page.getByRole("textbox", { name: "Alamat OPD" }).fill(data.alamat);
    },
    async fillAll() {
      await this.fillNamaOPD();
      await this.fillAlamat();
      await this.fillPIC();
      await this.fillKontak();
      await this.fillNIKPIC();
    },
    async fillKontak() {
      await page.getByRole("textbox", { name: "Nomor telepon / email" }).fill(data.kontak);
    },
    async fillNamaOPD() {
      await page.getByRole("textbox", { name: "Nama Dinas / OPD" }).fill(data.namaOPD);
    },
    async fillPIC() {
      await page.getByRole("textbox", { name: "Penanggung jawab" }).fill(data.pic);
    },
    async fillNIKPIC() {
      await page.getByRole("textbox", { name: "digit NIK PIC" }).fill(data.nikpic);
    },
  };
};
