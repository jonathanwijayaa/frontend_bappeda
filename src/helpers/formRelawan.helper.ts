import { faker } from "@faker-js/faker";

const OPD_LIST = [
  "Dinas Kesehatan",
  "Dinas Pendidikan",
  "Dinas Perhubungan",
  "Dinas Sosial",
];

const KADER_MAP: Record<string, string[]> = {
  "Dinas Kesehatan": ["Kader Kesehatan A", "Kader Kesehatan A1"],
  "Dinas Pendidikan": ["Kader Pendidikan B", "Kader Pendidikan B1"],
  "Dinas Perhubungan": ["Kader Perhubungan C", "Kader Perhubungan C1"],
  "Dinas Sosial": ["Kader Sosial D", "Kader Sosial D1"],
};

export interface RelawanData {
  "NAMA LENGKAP": string;
  "JENIS KELAMIN": string;
  NIK: string;
  ALAMAT: string;
  "NO HP": string;
  OPD: string;
  KELURAHAN: string;
  KADER: string;
  JABATAN: string;
  "DETAIL JABATAN": string;
  PENUGASAN: string;
}

export const buildRelawanData = (): RelawanData => {
  const opd = faker.helpers.arrayElement(OPD_LIST);
  const kader = faker.helpers.arrayElement(KADER_MAP[opd]);

  return {
    "NAMA LENGKAP": faker.person.fullName(),
    "JENIS KELAMIN": faker.person.sex() === "male" ? "L" : "P",
    NIK: faker.number
      .bigInt({ min: 3201000000000000n, max: 3201999999999999n })
      .toString(),
    ALAMAT: faker.location.streetAddress() + ", Yogyakarta",
    "NO HP": `08${faker.string.numeric(10)}`,
    OPD: opd,
    KELURAHAN: faker.location.city(),
    KADER: kader,
    JABATAN: faker.helpers.arrayElement([
      "Ketua", "Wakil", "Sekretaris", "Bendahara", "Seksi", "Anggota", "Lainnya",
    ]),
    "DETAIL JABATAN": faker.helpers.arrayElement(["RT", "RW", "II"]),
    PENUGASAN: faker.helpers.arrayElement([
      "RT", "RW", "Kelurahan", "Membantu Ketua I", "Membantu Wakil I",
    ]),
  };
};