import { faker } from "@faker-js/faker";
import { expect, Page } from "@playwright/test";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan",
  "Dinas Perhubungan",
  "Dinas Sosial Tenaga Kerja dan Transmigrasi",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana",
];

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

export interface KaderData {
  OPD: string;
  "NAMA KADER": string;
  DESKRIPSI: string;
  PIC: string;
  "NIK PIC": string;
  "NO HP": string;
  "ALAMAT PIC": string;
  "KELURAHAN PIC": string;
  KEMANTREN: string;
}

interface IFillKaderForm {
  data: KaderData;
  page: Page;
  isSuperAdmin: boolean;
}

function generateSafeName(): string {
  // Hapus semua karakter selain huruf dan spasi supaya lolos REGEX NAMA_RELAWAN
  return faker.person
    .fullName()
    .replace(/[^a-zA-Z\s]/g, "")
    .trim();
}

export const buildKaderData = (): KaderData => {
  const kemantren = faker.helpers.arrayElement(KEMANTREN_LIST);
  const kelurahan = faker.helpers.arrayElement(KELURAHAN_MAP[kemantren]);

  return {
    OPD: faker.helpers.arrayElement(OPD_LIST),
    "NAMA KADER": `Kader ${generateSafeName()}`,
    DESKRIPSI: faker.lorem.sentences(2),
    PIC: generateSafeName(),
    "NIK PIC": faker.number.bigInt({ min: 1000000000000000n, max: 9999999999999999n }).toString(),
    "NO HP": `08${faker.string.numeric(10)}`,
    "ALAMAT PIC": faker.location.streetAddress() + ", Yogyakarta",
    "KELURAHAN PIC": kelurahan,
    KEMANTREN: kemantren,
  };
};

/**
 * Locator field pada modal "Tambah Kader Baru".
 *
 * <label> di modal ini tidak terhubung ke input-nya (tanpa htmlFor/id), jadi
 * nama aksesibilitas tiap input berasal dari placeholder-nya. Teks placeholder
 * dipakai persis supaya tidak saling tertukar — mis. /Alamat/i juga cocok
 * dengan field alamat pada modal "Ganti PIC".
 */
export const kaderField = {
  alamatPIC: (page: Page) => page.getByRole("textbox", { name: "Alamat sesuai KTP" }),
  deskripsi: (page: Page) => page.getByRole("textbox", { name: "Deskripsi singkat" }),
  // Placeholder Kelurahan berubah mengikuti status Kemantren
  kelurahanPIC: (page: Page) =>
    page.getByRole("textbox", {
      name: /Cari nama Kelurahan|Pilih Kemantren terlebih dahulu/,
    }),
  kemantren: (page: Page) => page.getByRole("textbox", { name: "Cari nama Kemantren..." }),
  namaKader: (page: Page) => page.getByRole("textbox", { name: "Nama Kader atau komunitas" }),
  nikPIC: (page: Page) => page.getByRole("textbox", { name: "16 digit NIK PIC" }),
  noHP: (page: Page) => page.getByRole("textbox", { name: "Nomor HP PIC" }),
  opd: (page: Page) => page.getByRole("textbox", { name: "Ketik nama OPD..." }),
  pic: (page: Page) => page.getByRole("textbox", { name: "Nama Person in Charge" }),
};

export const submitKaderButton = (page: Page) => page.getByRole("button", { name: "Simpan" });
export const cancelKaderButton = (page: Page) => page.getByRole("button", { name: "Batal" });

export const fillKaderForm = ({ data, page, isSuperAdmin }: IFillKaderForm) => ({
  async fillAlamatPIC() {
    await kaderField.alamatPIC(page).fill(data["ALAMAT PIC"]);
  },

  async fillAll() {
    if (isSuperAdmin) {
      await this.fillOPD();
    }
    await this.fillNamaKader();
    await this.fillPIC();
    await this.fillNIKPIC();
    await this.fillNoHP();
    await this.fillAlamatPIC();
    await this.fillDeskripsi();
    // Kemantren harus lebih dulu: field Kelurahan baru aktif setelah terisi
    await this.fillKemantren();
    await this.fillKelurahanPIC();
  },

  async fillDeskripsi() {
    await kaderField.deskripsi(page).fill(data.DESKRIPSI);
  },

  async fillKelurahanPIC() {
    await kaderField.kelurahanPIC(page).fill(data["KELURAHAN PIC"]);
  },

  async fillKemantren() {
    await kaderField.kemantren(page).fill(data.KEMANTREN);
  },

  async fillNamaKader() {
    await kaderField.namaKader(page).fill(data["NAMA KADER"]);
  },

  async fillNIKPIC() {
    await kaderField.nikPIC(page).fill(data["NIK PIC"]);
  },

  async fillNoHP() {
    await kaderField.noHP(page).fill(data["NO HP"]);
  },

  /**
   * OPD wajib dipilih dari daftar, bukan sekadar diketik: aplikasi menyimpan
   * opd_id hasil pencocokan dan menolak submit bila nilainya masih kosong.
   */
  async fillOPD() {
    const textbox = kaderField.opd(page);

    await textbox.click();
    await textbox.fill("");
    await textbox.pressSequentially(data.OPD, { delay: 60 });

    const option = page.getByRole("listitem").filter({ hasText: data.OPD }).first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();

    await expect(page.getByText("✓ OPD ditemukan dan siap disimpan")).toBeVisible({
      timeout: 10_000,
    });
  },

  async fillPIC() {
    await kaderField.pic(page).fill(data.PIC);
  },

  /** Memeriksa seluruh isian form sudah sesuai data yang dikirim. */
  async expectFillAll() {
    await expect(kaderField.namaKader(page)).toHaveValue(data["NAMA KADER"]);
    await expect(kaderField.pic(page)).toHaveValue(data.PIC);
    await expect(kaderField.nikPIC(page)).toHaveValue(data["NIK PIC"]);
    await expect(kaderField.noHP(page)).toHaveValue(data["NO HP"]);
    await expect(kaderField.alamatPIC(page)).toHaveValue(data["ALAMAT PIC"]);
    await expect(kaderField.deskripsi(page)).toHaveValue(data.DESKRIPSI);
    await expect(kaderField.kemantren(page)).toHaveValue(data.KEMANTREN);
    await expect(kaderField.kelurahanPIC(page)).toHaveValue(data["KELURAHAN PIC"]);

    if (isSuperAdmin) {
      await expect(kaderField.opd(page)).toHaveValue(data.OPD);
    }
  },

  /**
   * Menekan "Simpan".
   *
   * `expectClose` dipakai untuk kasus yang memang diharapkan berhasil: modal
   * baru tertutup setelah server membalas, jadi kita tunggu sampai hilang.
   * Untuk kasus negatif modalnya sengaja dibiarkan terbuka.
   */
  async submit({ expectClose = true }: { expectClose?: boolean } = {}) {
    await submitKaderButton(page).click();

    if (expectClose) {
      await expect(page.getByRole("heading", { name: "Tambah Kader Baru" })).toBeHidden({
        timeout: 20_000,
      });
    }
  },

  async cancel() {
    await cancelKaderButton(page).click();
    await expect(page.getByRole("heading", { name: "Tambah Kader Baru" })).toBeHidden();
  },
});
