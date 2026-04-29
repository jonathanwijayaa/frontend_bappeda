import { faker } from "@faker-js/faker";

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