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

const KADER_MAP: Record<string, string[]> = {
  "Opd Demo": ["Kader Angie Padberg", "Kader Dana West", "Kader Miss Gladys Mraz", "Demo Kader"],

  "Dinas Kesehatan (Dinkes)": ["KADER KESEHATAN"],

  "Dinas Perhubungan": ["Kader Perhubungan C", "Kader Perhubungan C1"],

  "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)": ["PORDAM", "TAGANA", "IPSM"],

  "Dinas Pariwisata": ["Kader Pariwisata 1", "Kader Pariwisata 2"],

  "Dinas Kebudayaan": ["Kader Kebudayaan 1", "Kader Kebudayaan 2"],

  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)":
    ["SIGRAK", "POSYANDU", "PKK"],
};

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

// Tabel Pengajuan Perubahan Data
export const pengajuanTable = (page: Page) =>
  page
    .getByRole("table")
    .filter({ hasText: /nik.*nama lengkap.*tanggal pengajuan.*status.*aksi/i });

// Tabel Daftar Relawan
export const relawanTable = (page: Page) =>
  page.getByRole("table").filter({ hasText: /nama.*nik.*alamat.*kelurahan.*aksi/i });

// Search bar Pengajuan Perubahan Data
export const searchPengajuan = (page: Page) => page.getByPlaceholder(/cari pengajuan/i);

// Search bar Daftar Relawan
export const searchRelawan = (page: Page) => page.getByPlaceholder(/cari relawan/i);

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
  KEMANTREN: string;
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

  const kemantren = faker.helpers.arrayElement(KEMANTREN_LIST);
  const kelurahan = faker.helpers.arrayElement(KELURAHAN_MAP[kemantren]);

  return {
    "NAMA LENGKAP": generateSafeName(),
    "JENIS KELAMIN": faker.person.sex() === "male" ? "L" : "P",
    NIK: faker.number.bigInt({ min: 3201000000000000n, max: 3201999999999999n }).toString(),
    ALAMAT: faker.location.streetAddress() + ", Yogyakarta",
    "NO HP": `08${faker.string.numeric(10)}`,
    OPD: opd,
    KEMANTREN: kemantren,
    KELURAHAN: kelurahan,
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
    await page
      .getByRole("textbox", { name: /alamat sesuai ktp/i })
      .or(page.getByRole("textbox").nth(4))
      .fill(data.ALAMAT);
  },
  async fillAll() {
    await this.fillNamaLengkap();
    await this.fillNIK();
    await this.fillAlamat();
    await this.fillNoHP();
    await this.fillKemantren();
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
      .getByRole("textbox", { name: /detail jabatan/i })
      .or(page.getByRole("textbox", { name: "Detail jabatan (contoh: Anggota Umum Bidang X)" }))
      .fill(data["DETAIL JABATAN"]);
  },
  async fillJabatan() {
    await page.getByRole("combobox").nth(1).selectOption(data.JABATAN);
  },
  async fillJenisKelamin() {
    await page.getByRole("combobox").first().selectOption(data["JENIS KELAMIN"]);
  },
  async fillKelurahan() {
    await page
      .getByRole("textbox", { name: /kelurahan/i })
      .or(page.getByRole("textbox").nth(7))
      .fill(data.KELURAHAN);
  },
  async fillKader() {
    await page
      .getByRole("textbox", { name: /memuat kader/i })
      .or(page.getByRole("textbox", { name: "Cari nama Kader..." }))
      .fill(data.KADER);
  },
  async fillNamaLengkap() {
    await page
      .getByRole("textbox", { name: /nama lengkap relawan/i })
      .or(page.getByRole("textbox").nth(2))
      .fill(data["NAMA LENGKAP"]);
  },
  async fillNIK() {
    await page
      .getByRole("textbox", { name: /^nik$/i })
      .or(page.getByRole("textbox").nth(3))
      .fill(data.NIK);
  },
  async fillNoHP() {
    await page
      .getByRole("textbox", { name: /nomor hp/i })
      .or(page.getByRole("textbox").nth(5))
      .fill(data["NO HP"]);
  },
  async fillOPD() {
    if (await page.getByRole("textbox", { name: /cari nama opd/i }).isVisible()) {
      await page.getByRole("textbox", { name: /cari nama opd/i }).fill(data.OPD);
      return;
    }
    if (await page.getByRole("listitem").isVisible()) {
      await page.getByRole("listitem").click();
      return;
    }
    return;
  },
  async fillPenugasan() {
    await page.getByRole("textbox", { name: /nama\/detail penugasan/i }).fill(data.PENUGASAN);
  },
  async clickTambahDataPenugasan() {
    await page.getByRole("button", { name: "Tambah Data Penugasan" }).click();
  },
  async fillStatusKeaktifan() {
    if (data["STATUS KEAKTIFAN"] === "Nonaktif") {
      await page.getByRole("radio", { name: "Nonaktif" }).click();
    } else {
      await page.getByRole("radio", { name: "Aktif", exact: true }).click();
    }
  },
  async fillKemantren() {
    await page.getByRole("textbox", { name: /nama kemantren/i }).fill(data.KEMANTREN);
  },
});

export const selectOPD = async ({ data, page }: IFillRelawanForm) => {
  await page.getByRole("textbox", { name: /cari nama opd/i }).fill(data.OPD);
  if (await page.getByRole("listitem", { name: data.OPD }).isVisible()) {
    await page.getByRole("listitem", { name: data.OPD }).click();
    return;
  }
};

export const selectKader = async ({ data, page }: IFillRelawanForm) => {
  await page
    .getByRole("textbox", { name: /memuat kader/i })
    .or(page.getByRole("textbox", { name: "Cari nama Kader..." }))
    .fill(data.KADER);
};

export const selectPenugasan = async ({ data, page }: IFillRelawanForm) => {
  await page.getByRole("textbox", { name: /nama\/detail penugasan/i }).fill(data.PENUGASAN);
};
