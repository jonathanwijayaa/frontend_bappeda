import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";

const OPD_LIST = [
  "Dinas Simulasi Yogyakarta",
  "Dinas Uji Coba Yogyakarta",
  "Dinas Kesehatan (Dinkes)",
  "Dinas Perhubungan",
  "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)",
  "Satuan Polisi Pamong Praja (PP)",
];

const KADER_MAP: Record<string, string[]> = {
  "Dinas Simulasi Yogyakarta": ["Kader Simulasi B"],
  "Dinas Uji Coba Yogyakarta": ["Kader Uji Coba A"],
  "Dinas Kesehatan (Dinkes)": ["KADER KESEHATAN"],
  "Dinas Perhubungan": ["Kader Perhubungan C", "Kader Perhubungan C1"],
  "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)": ["PORDAM", "TAGANA", "IPSM"],
  "Dinas Pariwisata": ["Kader Pariwisata 1", "Kader Pariwisata 2"],
  "Dinas Kebudayaan": ["Kader Kebudayaan 1", "Kader Kebudayaan 2"],
  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)":
    ["SIGRAK", "POSYANDU", "PKK"],
  "Satuan Polisi Pamong Praja (PP)": ["SATLINMAS"],
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

function generateSafeName(): string {
  const name = faker.person.fullName();
  return name.replace(/[^a-zA-Z\s]/g, "").trim();
}

export const buildRelawanData = (): RelawanData => {
  const opd = faker.helpers.arrayElement(OPD_LIST);
  const kader = faker.helpers.arrayElement(KADER_MAP[opd]);

  return {
    "NAMA LENGKAP": generateSafeName(),
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
    "STATUS KEAKTIFAN": faker.helpers.arrayElement(["Aktif", "Nonaktif"]),
  };
};

export const fillRelawanForm = async ({ data, page }: IFillRelawanForm) => ({
  async fillAlamat() {
    if (await page.getByRole("textbox").nth(3).isVisible()) {
      await page.getByRole("textbox").nth(3).clear();
    }
    await page.getByRole("textbox").nth(3).fill(data.ALAMAT);
  },
  async fillAll() {
    await this.fillNamaLengkap();
    await this.fillNIK();
    await this.fillAlamat();
    await this.fillNoHP();
    await this.fillKelurahan();
    await this.fillJenisKelamin();
    await this.clickTambahDataPenugasan();
    await this.fillOPD();
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
    await page.getByRole("combobox").nth(1).selectOption(data.JABATAN);
  },
  async fillJenisKelamin() {
    await page.getByRole("combobox").first().selectOption(data["JENIS KELAMIN"]);
  },
  async fillKelurahan() {
    await page.getByRole("textbox").nth(4).fill(data.KELURAHAN);
  },
  async fillKader() {
    await page.getByRole("textbox", { name: /Kader/i }).fill(data.KADER);
  },
  async fillNamaLengkap() {
    await page.getByRole("textbox").nth(1).fill(data["NAMA LENGKAP"]);
  },
  async fillNIK() {
    await page.getByRole("textbox").nth(2).fill(data.NIK);
  },
  async fillNoHP() {
    await page.getByRole("textbox").nth(3).fill(data["NO HP"]);
  },
  async fillOPD() {
    await page.getByRole("textbox", { name: "Cari nama OPD..." }).fill(data.OPD);
  },
  async fillPenugasan() {
    await page.getByRole("textbox", { name: "Nama/detail penugasan" }).fill(data.PENUGASAN);
  },
  async clickTambahDataPenugasan() {
    await page.getByRole("button", { name: "Tambah Data Penugasan" }).click();
  },
  async fillStatusKeaktifan() {
    if (data["STATUS KEAKTIFAN"]) {
      await page.locator(`input[type="radio"][value="${data["STATUS KEAKTIFAN"]}"]`).click();
    }
  },
});

export const selectOPD = async ({ data, page }: IFillRelawanForm) => {
  await page.getByRole("textbox", { name: "Cari nama OPD..." }).fill(data.OPD);
};

export const selectKader = async ({ data, page }: IFillRelawanForm) => {
  await page.getByRole("textbox", { name: /Kader/i }).fill(data.KADER);
};

export const selectPenugasan = async ({ data, page }: IFillRelawanForm) => {
  await page.getByRole("textbox", { name: "Nama/detail penugasan" }).fill(data.PENUGASAN);
};
