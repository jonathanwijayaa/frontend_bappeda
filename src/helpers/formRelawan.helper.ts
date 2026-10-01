import { faker } from "@faker-js/faker";
import { expect, Page } from "@playwright/test";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan",
  // "Dinas Perhubungan",
  "Dinas Sosial Tenaga Kerja dan Transmigrasi",
  // "Dinas Pariwisata",
  // "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan Perlindungan Anak Pengendalian Penduduk dan Keluarga Berencana",
];

const KADER_MAP: Record<string, string[]> = {
  "Opd Demo": ["Kader Demo", "Kader Yvonne Keeling"],

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
];

const KELURAHAN_MAP: Record<string, string[]> = {
  Danurejan: ["Bausasran", "Suryatmajan", "Tegalpanggung"],
  Gedongtengen: ["Pringgokusuman", "Sosromenduran"],
  Gondokusuman: ["Baciro", "Demangan", "Klitren", "Kotabaru", "Terban"],
  Gondomanan: ["Ngupasan", "Prawirodirjan"],
  Jetis: ["Bumijo", "Cokrodiningratan", "Gowongan"],
  Kotagede: ["Prenggan", "Rejowinangun"],
  Kraton: ["Kadipaten", "Panembahan", "Patehan"],
  Mantrijeron: ["Gedongkiwo", "Mantrijeron", "Suryodiningratan"],
  Mergangsan: ["Brontokusuman", "Keparakan", "Wirogunan"],
  Ngampilan: ["Ngampilan", "Notoprajan"],
  Pakualaman: ["Gunungketur", "Purwokinanti"],
  Tegalrejo: ["Bener", "Karangwaru", "Kricak", "Tegalrejo"],
  Umbulharjo: ["Giwangan", "Pandeyan", "Sorosutan", "Tahunan", "Warungboto", "Semaki"],
  Wirobrajan: ["Pakuncen", "Patangpuluhan", "Wirobrajan"],
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

// Field pada form relawan dicari lewat strukturnya: <label>X</label> -> <div> -> input.
// Ini perlu karena label tidak terhubung ke input-nya; khusus role OPD, field OPD
// bahkan dikunci (disabled) tanpa placeholder sehingga tidak punya accessible name
// dan tidak bisa ditemukan lewat getByRole("textbox", { name: /opd/i }).
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
 * Opsi diambil dari API, sedangkan komponen hanya memfilter saat teks diketik —
 * jika data baru tiba setelah pengetikan selesai, dropdown tetap kosong.
 * Karena itu pengetikan diulang selama opsi yang dicari belum muncul.
 */
const selectAutocompleteOption = async (
  page: Page,
  label: string,
  value: string,
  index = 0,
  options: { maxRetry?: number; onRetry?: () => Promise<void> } = {},
) => {
  const { maxRetry = 3, onRetry } = options;
  const textbox = fieldInput(page, label, index);
  const option = fieldOptions(page, label, index).filter({ hasText: exactText(value) });

  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    try {
      // Field masih disabled selama opsinya dimuat ("Memuat kader...")
      await expect(textbox).toBeEnabled({ timeout: 10000 });
      await textbox.click();
      await textbox.fill("");
      await textbox.pressSequentially(value, { delay: 80 });

      await expect(option.first()).toBeVisible({ timeout: 5000 });
      await option.first().click();
      return;
    } catch (error) {
      if (attempt === maxRetry) {
        throw error;
      }

      console.log(`Opsi "${value}" pada field ${label} belum siap, ulangi (${attempt}/${maxRetry})`);
      await onRetry?.();
    }
  }
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

  await expect(field).toBeVisible({ timeout: 10000 });
  await expect
    .poll(async () => (await field.inputValue()).trim(), {
      message: "Field OPD pada blok penugasan tidak pernah terisi",
      timeout: 10000,
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
    await expect(field).toBeEnabled({ timeout: 15000 });
  } catch {
    const placeholder = await field.getAttribute("placeholder");
    throw new Error(
      `Field Kader tidak aktif (placeholder: "${placeholder}"). ` +
        `OPD "${await readOPDFromForm(page, index)}" kemungkinan belum memiliki kader.`,
    );
  }

  // Dikosongkan dulu: dropdown memfilter berdasarkan teks yang ada, sehingga
  // field yang sudah terisi (form edit) bisa tidak menampilkan opsi apa pun
  await field.click();
  await field.fill("");

  const options = fieldOptions(page, "Kader", index);
  await expect(options.first()).toBeVisible({ timeout: 10000 });

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

export const fillRelawanForm = async ({ data, page, isSuperAdmin }: IFillRelawanForm) => ({
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
    await fieldInput(page, "Detail Jabatan").fill(data["DETAIL JABATAN"]);
  },
  async fillJabatan() {
    if (await page.getByRole("button", { name: "-- Pilih Jabatan --" }).isVisible()) {
      await page.getByRole("button", { name: "-- Pilih Jabatan --" }).click();
      await page.getByRole("button", { name: data.JABATAN }).click();
      return;
    } else if (await page.getByRole("combobox").nth(1).isVisible()) {
      await page.getByRole("combobox").nth(1).click();
      await page.getByRole("combobox").nth(1).selectOption(data.JABATAN);
      return;
    }
  },

  async fillJenisKelamin() {
    await page.getByRole("button", { name: "Laki-laki (L)" }).click();
    if (data["JENIS KELAMIN"] === "Laki-laki (L)") {
      await page.getByRole("button", { name: data["JENIS KELAMIN"] }).nth(1).click();
    } else {
      await page.getByRole("button", { name: data["JENIS KELAMIN"] }).click();
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
    await selectAutocompleteOption(page, "Kader", data.KADER, 0, {
      // Opsi kader kadang gagal/lambat dimuat; memilih ulang OPD memicu pemuatan ulang
      onRetry: async () => {
        if (await opdField(page).isEditable()) {
          await selectAutocompleteOption(page, "OPD", data.OPD);
        }
      },
    });
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
    const textbox = opdField(page);

    // Field OPD hanya bisa diisi oleh super admin; role lain memakai syncOPDFromForm()
    if (!(await textbox.isEditable())) {
      await this.syncOPDFromForm();
      return;
    }

    await selectAutocompleteOption(page, "OPD", data.OPD);
  },
  async fillPenugasan() {
    await fieldInput(page, "Penugasan").fill(data.PENUGASAN);
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
    const textbox = page.getByRole("textbox", { name: /nama kemantren/i });
    await textbox.click();
    await textbox.pressSequentially(data.KEMANTREN, { delay: 80 });
    const option = page.getByRole("listitem").filter({ hasText: data.KEMANTREN });
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  },
  async submitButton(maxRetry = 3) {
    const submitButton = page.getByRole("button", {
      name: "Simpan",
    });

    for (let i = 1; i <= maxRetry; i++) {
      try {
        await submitButton.click();

        // Tunggu sampai tombol hilang/disabled
        await expect(submitButton).toBeHidden({
          timeout: 3000,
        });

        return;
      } catch (error) {
        console.log(`Retry submit (${i}/${maxRetry})`);

        if (i === maxRetry) {
          throw error;
        }
      }
    }
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
  await selectAutocompleteOption(page, "Kader", data.KADER, 0, {
    onRetry: async () => {
      if (await opdField(page).isEditable()) {
        await selectAutocompleteOption(page, "OPD", data.OPD);
      }
    },
  });
};

export const selectPenugasan = async ({ data, page }: IFillRelawanForm) => {
  // Relawan bisa punya lebih dari satu blok penugasan, isi blok pertama saja
  await fieldInput(page, "Penugasan").fill(data.PENUGASAN);
};
