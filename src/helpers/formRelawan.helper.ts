import { faker } from "@faker-js/faker";
import { expect, Page } from "@playwright/test";

import {
  clickThink,
  fillThink,
  LOAD_TIME,
  pesanLoadTime,
  selectThink,
  typeThink,
  waitLoaded,
} from "@/helpers/timing.helper";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan",
  "Dinas Perhubungan",
  "Dinas Sosial Tenaga Kerja dan Transmigrasi",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana",
];

const KADER_MAP: Record<string, string[]> = {
  "Opd Demo": ["Kader Demo"],

  "Dinas Kesehatan": ["KADER KESEHATAN"],

  "Dinas Perhubungan": ["Kader Perhubungan C", "Kader Perhubungan D"],

  "Dinas Sosial Tenaga Kerja dan Transmigrasi": ["PORDAM", "TAGANA", "IPSM"],

  "Dinas Pariwisata": ["Kader Pariwisata"],

  "Dinas Kebudayaan": ["Kader Kebudayaan A", "Kader Kebudayaan B"],

  "Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana": [
    "SIGRAK",
    "POSYANDU",
    "PKK",
  ],
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
  Danurejan: [
    "Bausasran",
    "Suryatmajan",
    "Tegalpanggung",
  ],
  Gedongtengen: [
    "Pringgokusuman",
    "Sosromenduran",
  ],
  Gondokusuman: [
    "Baciro",
    "Demangan",
    "Klitren",
    "Kotabaru",
    "Terban",
  ],
  Gondomanan: [
    "Ngupasan",
    "Prawirodirjan",
  ],
  Jetis: [
    "Bumijo",
    "Cokrodiningratan",
    "Gowongan",
  ],
  Kotagede: [
    "Prenggan",
    "Purbayan",
    "Rejowinangun",
  ],
  Kraton: [
    "Kadipaten",
    "Panembahan",
    "Patehan",
  ],
  Mantrijeron: [
    "Gedongkiwo",
    "Mantrijeron",
    "Suryodiningratan",
  ],
  Mergangsan: [
    "Brontokusuman",
    "Keparakan",
    "Wirogunan",
  ],
  Ngampilan: [
    "Ngampilan",
    "Notoprajan",
  ],
  Pakualaman: [
    "Gunungketur",
    "Purwokinanti",
  ],
  Tegalrejo: [
    "Bener",
    "Karangwaru",
    "Kricak",
    "Tegalrejo",
  ],
  Umbulharjo: [
    "Giwangan",
    "Mujamuju",
    "Pandeyan",
    "Semaki",
    "Sorosutan",
    "Tahunan",
    "Warungboto",
  ],
  Wirobrajan: [
    "Pakuncen",
    "Patangpuluhan",
    "Wirobrajan",
  ],
};


// Tabel Pengajuan Perubahan Data
export const pengajuanTable = (page: Page) =>
  page
    .getByRole("table")
    .filter({ hasText: /nik.*nama lengkap.*tanggal pengajuan.*status.*aksi/i });

// Tabel Daftar Relawan (urutan kolom: NIK, NAMA, ALAMAT, KEMANTREN, KELURAHAN, AKSI)
export const relawanTable = (page: Page) =>
  page.getByRole("table").filter({ hasText: /nik.*nama.*alamat.*kemantren.*kelurahan.*aksi/i });

// Search bar Pengajuan Perubahan Data
export const searchPengajuan = (page: Page) => page.getByPlaceholder(/cari pengajuan/i);

// Search bar Daftar Relawan
export const searchRelawan = (page: Page) => page.getByPlaceholder(/cari relawan/i);

// Index dipakai bila ada lebih dari satu blok penugasan.
const fieldWrapper = (page: Page, label: string, index = 0) =>
  page
    .locator(`xpath=//label[normalize-space(text())="${label}"]/following-sibling::*[1]`)
    .nth(index);

// Sebagian field dibungkus <div> (autocomplete), sebagian lagi <input> langsung
const fieldInput = (page: Page, label: string, index = 0) =>
  fieldWrapper(page, label, index).locator("xpath=descendant-or-self::input").first();

// Input OPD pada blok penugasan ke-index (berlaku untuk super admin maupun OPD)
export const opdField = (page: Page, index = 0) => fieldInput(page, "OPD", index);

// Input Kader pada blok penugasan ke-index
export const kaderField = (page: Page, index = 0) => fieldInput(page, "Kader", index);

// Opsi dropdown autocomplete milik field terkait saja, bukan semua listitem di halaman
const fieldOptions = (page: Page, label: string, index = 0) =>
  fieldWrapper(page, label, index).getByRole("listitem");

// Cocokkan teks opsi secara persis supaya nama yang mirip (mis. "PKK" vs "PKK RW")
// tidak ikut terpilih
const exactText = (value: string) =>
  new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");

/**
 * Pilih satu opsi pada AutocompleteInput.
 *
 * Opsi diambil dari API, sedangkan komponen hanya memfilter saat teks diketik.
 * Pengetikan dilakukan SEKALI (tanpa percobaan ulang): bila opsi yang dicari
 * tidak muncul dalam LOAD_TIME, itu kegagalan valid — data opsi terlambat
 * atau tidak tersedia bagi pengguna.
 */
const selectAutocompleteOption = async (page: Page, label: string, value: string, index = 0) => {
  const textbox = fieldInput(page, label, index);
  const option = fieldOptions(page, label, index).filter({ hasText: exactText(value) });

  // Field masih disabled selama opsinya dimuat ("Memuat kader...")
  await waitLoaded(textbox, `field ${label} aktif`, "enabled");
  await clickThink(textbox);
  await textbox.fill("");
  await typeThink(textbox, value);

  await waitLoaded(option.first(), `opsi ${label} "${value}" muncul di daftar`);
  await clickThink(option.first());
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
  KEMANTREN: string;
}

interface IFillRelawanForm {
  data: RelawanData;
  page: Page;
  isSuperAdmin: boolean;
}

/**
 * Membaca nama OPD yang tampil pada blok penugasan.
 * Role OPD tidak bisa memilih OPD (field dikunci ke instansi milik user), jadi nilainya
 * harus diambil dari form, bukan dari data hasil generate.
 */
export const readOPDFromForm = async (page: Page, index = 0): Promise<string> => {
  const field = opdField(page, index);

  await waitLoaded(field, "field OPD pada blok penugasan tampil");
  await expect
    .poll(async () => (await field.inputValue()).trim(), {
      message: pesanLoadTime("field OPD pada blok penugasan terisi"),
      timeout: LOAD_TIME,
    })
    .not.toBe("");

  return (await field.inputValue()).trim();
};

/**
 * Mengambil daftar kader yang benar-benar tersedia untuk OPD yang aktif di form,
 * lalu memilih salah satu secara acak. Dipakai supaya kader yang diisi selalu
 * cocok dengan OPD di form (KADER_MAP hanya dipakai saat OPD dipilih sendiri).
 */
export const pickKaderFromForm = async (page: Page, index = 0): Promise<string> => {
  const field = kaderField(page, index);

  try {
    // Field kader baru aktif setelah opsi kader milik OPD selesai dimuat
    await expect(field).toBeEnabled({ timeout: LOAD_TIME });
  } catch {
    const placeholder = await field.getAttribute("placeholder");
    throw new Error(
      pesanLoadTime(
        `field Kader tidak aktif (placeholder: "${placeholder}"). ` +
          `OPD "${await readOPDFromForm(page, index)}" kemungkinan belum memiliki kader.`,
      ),
    );
  }

  // Dikosongkan dulu: dropdown memfilter berdasarkan teks yang ada, sehingga
  // field yang sudah terisi (form edit) bisa tidak menampilkan opsi apa pun
  await clickThink(field);
  await field.fill("");

  const options = fieldOptions(page, "Kader", index);
  await waitLoaded(options.first(), "daftar opsi Kader muncul");

  const kaderList = (await options.allTextContents())
    .map((text: string) => text.trim())
    .filter(Boolean);

  if (kaderList.length === 0) {
    throw new Error("Tidak ada opsi kader pada OPD yang aktif di form penugasan");
  }

  return faker.helpers.arrayElement(kaderList);
};

/**
 * Menyelaraskan data.OPD dan data.KADER dengan isi form penugasan.
 * Dipakai untuk role selain super admin, yang OPD-nya sudah ditentukan sistem.
 */
export const syncOPDFromForm = async (page: Page, data: RelawanData, index = 0) => {
  data.OPD = await readOPDFromForm(page, index);
  data.KADER = await pickKaderFromForm(page, index);

  return data;
};

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
    "JENIS KELAMIN": faker.person.sex() === "male" ? "Laki-laki (L)" : "Perempuan (P)",
    NIK: faker.number.bigInt({ min: 3201000000000000n, max: 3201999999999999n }).toString(),
    // Apostrof (mis. "O'Conner") ditolak REGEX ALAMAT_VALID
    ALAMAT: faker.location.streetAddress().replace(/'/g, "") + ", Yogyakarta",
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

export const fillRelawanForm = async ({ data, page, isSuperAdmin }: IFillRelawanForm) => ({
  async fillAlamat() {
    await fillThink(
      page
        .getByRole("textbox", { name: /alamat sesuai ktp/i })
        .or(page.getByRole("textbox").nth(4)),
      data.ALAMAT,
    );
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
    if (isSuperAdmin) {
      await this.fillOPD();
    } else {
      // Role OPD: OPD sudah dikunci ke instansi user, jadi data OPD & kader
      // diselaraskan dengan isi form supaya kader yang dipilih valid
      await this.syncOPDFromForm();
    }
    await this.fillKader();
    await this.fillJabatan();
    await this.fillDetailJabatan();
    await this.fillPenugasan();
    await this.fillStatusKeaktifan();
  },
  // async expectFillAll() {
  //   await ensureTextboxValue(page.getByRole("textbox", { name: /nama lengkap relawan/i })
  //     .or(page.getByRole("textbox").nth(2))).
  // },
  async fillDetailJabatan() {
    await fillThink(fieldInput(page, "Detail Jabatan"), data["DETAIL JABATAN"]);
  },
  async fillJabatan() {
    if (await page.getByRole("button", { name: "-- Pilih Jabatan --" }).isVisible()) {
      await clickThink(page.getByRole("button", { name: "-- Pilih Jabatan --" }));
      await clickThink(page.getByRole("button", { name: data.JABATAN }));
      return;
    } else if (await page.getByRole("combobox").nth(1).isVisible()) {
      await clickThink(page.getByRole("combobox").nth(1));
      await selectThink(page.getByRole("combobox").nth(1), data.JABATAN);
      return;
    }
  },

  async fillJenisKelamin() {
    await clickThink(page.getByRole("button", { name: "Laki-laki (L)" }));
    if (data["JENIS KELAMIN"] === "Laki-laki (L)") {
      await clickThink(page.getByRole("button", { name: data["JENIS KELAMIN"] }).nth(1));
    } else {
      await clickThink(page.getByRole("button", { name: data["JENIS KELAMIN"] }));
    }
  },
  async fillKelurahan() {
    await selectAutocompleteOption(page, "Kelurahan", data.KELURAHAN);
  },
  // Menyamakan data.OPD & data.KADER dengan OPD yang terkunci di form (role OPD)
  async syncOPDFromForm() {
    await syncOPDFromForm(page, data);
  },
  async fillKader() {
    await selectAutocompleteOption(page, "Kader", data.KADER);
  },
  async fillNamaLengkap() {
    await fillThink(
      page
        .getByRole("textbox", { name: /nama lengkap relawan/i })
        .or(page.getByRole("textbox").nth(2)),
      data["NAMA LENGKAP"],
    );
  },
  async fillNIK() {
    await fillThink(
      page.getByRole("textbox", { name: /^nik$/i }).or(page.getByRole("textbox").nth(3)),
      data.NIK,
    );
  },
  async fillNoHP() {
    await fillThink(
      page.getByRole("textbox", { name: /nomor hp/i }).or(page.getByRole("textbox").nth(5)),
      data["NO HP"],
    );
  },
  async fillOPD() {
    const textbox = opdField(page);

    // Field OPD hanya bisa diisi oleh super admin; role lain memakai syncOPDFromForm()
    if (!(await textbox.isEditable())) {
      await this.syncOPDFromForm();
      return;
    }

    await selectAutocompleteOption(page, "OPD", data.OPD);
  },
  async fillPenugasan() {
    await fillThink(fieldInput(page, "Penugasan"), data.PENUGASAN);
  },
  async clickTambahDataPenugasan() {
    await clickThink(page.getByRole("button", { name: "Tambah Data Penugasan" }));
  },
  async fillStatusKeaktifan() {
    if (data["STATUS KEAKTIFAN"] === "Nonaktif") {
      await clickThink(page.getByRole("radio", { name: "Nonaktif" }));
    } else {
      await clickThink(page.getByRole("radio", { name: "Aktif", exact: true }));
    }
  },
  async fillKemantren() {
    const textbox = page.getByRole("textbox", { name: /nama kemantren/i });
    await clickThink(textbox);
    await typeThink(textbox, data.KEMANTREN);
    const option = page.getByRole("listitem").filter({ hasText: data.KEMANTREN });
    await waitLoaded(option, `opsi Kemantren "${data.KEMANTREN}" muncul di daftar`);
    await clickThink(option);
  },
  /** Satu kali klik Simpan, lalu tunggu form tertutup (maks LOAD_TIME), tanpa percobaan ulang. */
  async submitButton() {
    const submitButton = page.getByRole("button", {
      name: "Simpan",
    });

    await clickThink(submitButton);
    await waitLoaded(submitButton, "form relawan tertutup setelah simpan", "hidden");
  },
});

export const selectOPD = async ({ data, page, isSuperAdmin }: IFillRelawanForm) => {
  const textbox = opdField(page);

  // Role OPD: field terkunci ke instansi user, jadi data yang menyesuaikan form
  if (!isSuperAdmin || !(await textbox.isEditable())) {
    await syncOPDFromForm(page, data);
    return;
  }

  await selectAutocompleteOption(page, "OPD", data.OPD);
};

export const selectKader = async ({ data, page }: IFillRelawanForm) => {
  await selectAutocompleteOption(page, "Kader", data.KADER);
};

export const selectPenugasan = async ({ data, page }: IFillRelawanForm) => {
  // Relawan bisa punya lebih dari satu blok penugasan, isi blok pertama saja
  await fillThink(fieldInput(page, "Penugasan"), data.PENUGASAN);
};
