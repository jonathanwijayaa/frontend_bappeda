import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";

const OPD_LIST = ["Dinas Kesehatan", "Dinas Pendidikan", "Dinas Perhubungan", "Dinas Sosial"];

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
  "STATUS KEAKTIFAN"?: string;
}

interface IFillRelawanForm {
  data: RelawanData;
  page: Page;
}

export const buildRelawanData = (): RelawanData => {
  const opd = faker.helpers.arrayElement(OPD_LIST);
  const kader = faker.helpers.arrayElement(KADER_MAP[opd]);

  return {
    "NAMA LENGKAP": faker.person.fullName(),
    "JENIS KELAMIN": faker.person.sex() === "male" ? "L" : "P",
    NIK: faker.number.bigInt({ min: 3201000000000000n, max: 3201999999999999n }).toString(),
    ALAMAT: faker.location.streetAddress() + ", Yogyakarta",
    "NO HP": `08${faker.string.numeric(10)}`,
    OPD: opd,
    KELURAHAN: faker.location.city(),
    KADER: kader,
    JABATAN: faker.helpers.arrayElement([
      "Ketua",
      "Wakil",
      "Sekretaris",
      "Bendahara",
      "Seksi",
      "Anggota",
      "Lainnya",
    ]),
    "DETAIL JABATAN": faker.helpers.arrayElement(["RT", "RW", "II"]),
    PENUGASAN: faker.helpers.arrayElement([
      "RT",
      "RW",
      "Kelurahan",
      "Membantu Ketua I",
      "Membantu Wakil I",
    ]),
    "STATUS KEAKTIFAN": faker.helpers.arrayElement(["Aktif", "NonAktif"]),
  };
};

export const fillRelawanForm = async ({ data, page }: IFillRelawanForm) => ({
  async fillAlamat() {
    await page.getByRole("textbox", { name: "Alamat sesuai KTP" }).fill(data.ALAMAT);
  },
  async fillAll() {
    await this.fillNamaLengkap();
    await this.fillJenisKelamin();
    await this.fillNIK();
    await this.fillAlamat();
    await this.fillNoHP();
    await this.clickTambahDataPenugasan();
    await this.fillOPD();
    await this.fillKelurahan();
    await this.fillKader();
    await this.fillJabatan();
    await this.fillDetailJabatan();
    await this.fillPenugasan();
    await this.fillStatusKeaktifan();
  },
  async fillDetailJabatan() {
    await page
      .getByRole("textbox", { name: "Detail jabatan (contoh: Anggota Umum Bidang X)" })
      .fill(data["DETAIL JABATAN"]);
  },
  async fillJabatan() {
    await page.getByRole("combobox", { name: "Jabatan" }).selectOption(data.JABATAN);
  },
  async fillJenisKelamin() {
    await page.getByRole("combobox").selectOption(data["JENIS KELAMIN"]);
  },
  async fillKelurahan() {
    await page.getByRole("textbox", { name: "Kelurahan" }).fill(data.KELURAHAN);
  },
  async fillKader() {
    await page.getByRole("combobox", { name: "Kader" }).selectOption(data.KADER);
  },
  async fillNamaLengkap() {
    await page.getByRole("textbox", { name: "Nama lengkap" }).fill(data["NAMA LENGKAP"]);
  },
  async fillNIK() {
    await page.getByRole("textbox", { name: "NIK" }).fill(data.NIK);
  },
  async fillNoHP() {
    await page.getByRole("textbox", { name: "Nomor HP" }).fill(data["NO HP"]);
  },
  async fillOPD() {
    await page.getByRole("textbox", { name: /nama OPD/i }).selectOption(data.OPD);
  },
  async fillPenugasan() {
    await page.getByRole("combobox", { name: "Penugasan" }).selectOption(data.PENUGASAN);
  },
  async clickTambahDataPenugasan() {
    await page.getByRole("button", { name: "Tambah Data Penugasan" }).click();
  },
  async fillStatusKeaktifan() {
    if (data["STATUS KEAKTIFAN"]) {
      await page
        .getByRole("combobox", { name: "Status Keaktifan" })
        .selectOption(data["STATUS KEAKTIFAN"]);
    }
  },
});

export const selectOPD = async ({ data, page }: IFillRelawanForm) => {
  await page.getByRole("combobox", { name: "OPD" }).selectOption(data.OPD);
};

export const selectKader = async ({ data, page }: IFillRelawanForm) => {
  await page.getByRole("combobox", { name: "Kader" }).selectOption(data.KADER);
};

export const selectPenugasan = async ({ data, page }: IFillRelawanForm) => {
  await page.getByRole("combobox", { name: "Penugasan" }).selectOption(data.PENUGASAN);
};
