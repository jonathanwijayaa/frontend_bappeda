import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink, LOAD_TIME, pesanLoadTime } from "@/helpers/timing.helper";
import { expect, Page, test } from "@playwright/test";

const BASE_URL = "https://frontend-bappeda.vercel.app/";

// Riwayat Relawan hanya untuk super_admin & opd (lihat allowedRoles di App.tsx).
// Pada role OPD filter "Nama OPD" dikunci ke instansinya sendiri, sehingga
// pengujian filter OPD-nya dipisah ke TCHR.24.
const roles = [
  { label: "Super Admin", creds: credentials.superAdmin, bisaFilterOpd: true },
  { label: "OPD", creds: credentials.opd, bisaFilterOpd: false },
] as const;

// ── Locator ──────────────────────────────────────────────────────────────
// Filter memakai komponen Select/YearPicker buatan sendiri: pemicunya <button>
// biasa dan daftar opsinya dirender lewat portal ke <body>. Jadi elemennya
// TIDAK punya role "combobox" dan tidak bisa dipakai dengan selectOption().
// Pemicu dicari lewat <label> di atasnya supaya tidak bergantung urutan render.
const filterTrigger = (page: Page, label: string) =>
  page
    .locator(`xpath=//label[normalize-space(text())="${label}"]/following-sibling::*[1]//button`)
    .first();

const selectPopup = (page: Page) => page.locator("[data-select-popup]");
const yearPopup = (page: Page) => page.locator("[data-yearpicker-popup]");

// Teks yang harus sama persis, tanpa peduli huruf besar/kecil
const exactText = (value: string) =>
  new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");

// Popup Select/YearPicker ditutup lewat mousedown di luar popup
const tutupPopup = async (page: Page) => {
  await clickThink(page.getByRole("heading", { name: "Riwayat Relawan", exact: true }));
};

// Beberapa daftar opsi (mis. Kelurahan) baru terisi setelah request wilayah
// selesai. Popup dibuka SEKALI; opsinya dirender langsung dari props (Select.tsx),
// jadi cukup ditunggu sampai jumlah opsinya memenuhi `minimal` (maks LOAD_TIME).
const bacaOpsiSelect = async (page: Page, label: string, minimal = 0) => {
  await clickThink(filterTrigger(page, label));
  await expect(selectPopup(page)).toBeVisible();

  const tombolOpsi = selectPopup(page).locator("button");
  await expect
    .poll(async () => (await tombolOpsi.count()) - 1, {
      message: pesanLoadTime(`opsi filter "${label}" termuat (minimal ${minimal})`),
      timeout: LOAD_TIME,
    })
    .toBeGreaterThanOrEqual(minimal);

  const opsi = (await tombolOpsi.allInnerTexts()).map((t) => t.trim());
  await tutupPopup(page);

  // Opsi pertama adalah placeholder (reset filter), bukan nilai sebenarnya
  return { placeholder: opsi[0], nilai: opsi.slice(1) };
};

const pilihFilter = async (page: Page, label: string, nilai: string) => {
  await clickThink(filterTrigger(page, label));
  await expect(selectPopup(page)).toBeVisible();

  await clickThink(
    selectPopup(page)
      .locator("button")
      .filter({ hasText: exactText(nilai) })
      .first(),
  );

  await expect(selectPopup(page)).toBeHidden();
  await expect(filterTrigger(page, label)).toHaveText(exactText(nilai));
};

const pilihTahun = async (page: Page, label: string, tahun: string) => {
  await clickThink(filterTrigger(page, label));
  await expect(yearPopup(page)).toBeVisible();

  await clickThink(yearPopup(page).getByRole("button", { name: tahun, exact: true }));

  await expect(yearPopup(page)).toBeHidden();
  await expect(filterTrigger(page, label)).toContainText(tahun);
};

// Table menyisipkan baris kosong (satu <td> ber-colSpan) supaya tinggi tabel
// tetap sama di tiap halaman, jadi baris data dikenali dari kolomnya yang utuh.
const barisData = (page: Page) => page.locator("table tbody tr:has(td:nth-child(7))");

const KOLOM = { alamat: 3, kader: 6, kelurahan: 4, nama: 2, nik: 1, opd: 5 } as const;

const nilaiKolom = async (page: Page, kolom: keyof typeof KOLOM) =>
  (await barisData(page).locator(`td:nth-child(${KOLOM[kolom]})`).allInnerTexts()).map((teks) =>
    teks.trim(),
  );

// Sel OPD/KADER berisi gabungan seluruh penugasan, mis. "Kader A, Kader B".
// Nilai pertama yang bukan "-" dipakai sebagai bahan uji filter supaya hasilnya
// dijamin tidak kosong.
const nilaiFilterDariTabel = async (page: Page, kolom: "kader" | "opd") => {
  const terisi = (await nilaiKolom(page, kolom)).find((nilai) => nilai !== "-");
  return terisi ? terisi.split(",")[0].trim() : undefined;
};

const infoJumlah = (page: Page) => page.getByText(/Menampilkan \d+–\d+ dari \d+ relawan/);

const totalData = async (page: Page) => {
  const teks = await infoJumlah(page).innerText();
  return Number(teks.replace(/\./g, "").match(/dari (\d+)/)![1]);
};

const emptyState = (page: Page) => page.getByText("Tidak ada data riwayat", { exact: true });
const resetFilterButton = (page: Page) => page.getByRole("button", { name: /reset filter/i });
const searchField = (page: Page) => page.getByPlaceholder(/cari nama atau nik relawan/i);

// ── Modal detail ─────────────────────────────────────────────────────────
const JUDUL_DETAIL = "Detail Riwayat Relawan";

// Isi modal adalah <div> tepat setelah header-nya; dicari lewat struktur
// supaya label seperti "NIK" tidak tertukar dengan header kolom tabel.
const detailModalBody = (page: Page) =>
  page.locator(
    `xpath=//h2[normalize-space(text())="${JUDUL_DETAIL}"]/../../../following-sibling::div[1]`,
  );

const detailValue = (page: Page, label: string) =>
  detailModalBody(page)
    .locator(`xpath=.//span[normalize-space(text())="${label}"]/following-sibling::span[1]`)
    .first();

const detailCloseButton = (page: Page) =>
  page
    .locator(
      `xpath=//h2[normalize-space(text())="${JUDUL_DETAIL}"]/parent::div/following-sibling::button`,
    )
    .first();

const bukaDetail = async (page: Page, indeksBaris = 0) => {
  await clickThink(barisData(page).nth(indeksBaris).getByRole("button", { name: "Detail" }));
  await expect(page.getByRole("heading", { name: JUDUL_DETAIL })).toBeVisible();
};

// ── Sorting ──────────────────────────────────────────────────────────────
const bandingkan = (a: string, b: string) => a.localeCompare(b, "id", { numeric: true });

const tungguTerurut = async (page: Page, kolom: keyof typeof KOLOM, arah: "asc" | "desc") => {
  await expect
    .poll(
      async () => {
        const nilai = await nilaiKolom(page, kolom);
        const urut = [...nilai].sort((a, b) => (arah === "asc" ? 1 : -1) * bandingkan(a, b));
        return nilai.join("|") === urut.join("|");
      },
      { timeout: LOAD_TIME },
    )
    .toBe(true);

  return nilaiKolom(page, kolom);
};

const ujiSortKolom = async (page: Page, header: string, kolom: keyof typeof KOLOM) => {
  const urutanAwal = await nilaiKolom(page, kolom);
  const kolomHeader = page.getByRole("columnheader", { name: header, exact: true });

  // Klik 1: menaik
  await clickThink(kolomHeader);
  const menaik = await tungguTerurut(page, kolom, "asc");

  // Klik 2: menurun
  await clickThink(kolomHeader);
  const menurun = await tungguTerurut(page, kolom, "desc");

  // Data tersortir untuk SELURUH hasil filter, jadi halaman 1 versi menaik dan
  // menurun pasti berisi baris yang berbeda selama datanya lebih dari 5 baris.
  expect(menurun[0]).not.toBe(menaik[0]);

  // Klik 3: kembali ke urutan asli (sort 3 kondisi: asc → desc → reset)
  await clickThink(kolomHeader);
  await expect
    .poll(async () => (await nilaiKolom(page, kolom)).join("|"), { timeout: LOAD_TIME })
    .toBe(urutanAwal.join("|"));
};

for (const role of roles) {
  test.describe(`Riwayat Relawan - ${role.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);

      await loginBAPPEDA({
        NIK: role.creds.NIK,
        page,
        password: role.creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await clickThink(page.getByRole("link", { name: /riwayat relawan/i }));
      await expect(page).toHaveURL(/histori-relawan/);

      // Tabel baru terisi setelah GET relawan selesai
      await expect(page.getByText(/memuat riwayat data relawan/i)).toBeHidden({
        timeout: LOAD_TIME,
      });
      await expect(barisData(page).first()).toBeVisible();
    });

    // TCHR.1 Filter by Nama OPD
    test(`TCHR.1 ${role.label} filter by Nama OPD`, async ({ page }) => {
      test.skip(!role.bisaFilterOpd, "Filter OPD terkunci untuk role OPD, diuji di TCHR.24");

      const totalAwal = await totalData(page);
      const opd = await nilaiFilterDariTabel(page, "opd");
      expect(opd, "Tidak ada baris dengan OPD terisi untuk diuji").toBeDefined();

      await pilihFilter(page, "Nama OPD", opd!);

      await expect(barisData(page).first()).toBeVisible();
      for (const sel of await nilaiKolom(page, "opd")) {
        expect(sel.toLowerCase()).toContain(opd!.toLowerCase());
      }
      expect(await totalData(page)).toBeLessThan(totalAwal);
      await expect(resetFilterButton(page)).toBeVisible();
    });

    // TCHR.2 Filter by Nama Kader
    test(`TCHR.2 ${role.label} filter by Nama Kader`, async ({ page }) => {
      const totalAwal = await totalData(page);
      const kader = await nilaiFilterDariTabel(page, "kader");
      expect(kader, "Tidak ada baris dengan Kader terisi untuk diuji").toBeDefined();

      await pilihFilter(page, "Nama Kader", kader!);

      await expect(barisData(page).first()).toBeVisible();
      for (const sel of await nilaiKolom(page, "kader")) {
        expect(sel.toLowerCase()).toContain(kader!.toLowerCase());
      }
      expect(await totalData(page)).toBeLessThan(totalAwal);
      await expect(resetFilterButton(page)).toBeVisible();
    });

    // TCHR.3 Filter by Tahun Awal
    test(`TCHR.3 ${role.label} filter by Tahun Awal`, async ({ page }) => {
      const totalAwal = await totalData(page);

      await pilihTahun(page, "Tahun Awal", "2024");

      // Filter tahun membandingkan rentang SK tiap penugasan, sehingga relawan
      // tanpa penugasan ber-SK ikut tersaring keluar.
      await expect(resetFilterButton(page)).toBeVisible();
      expect(await totalData(page)).toBeLessThan(totalAwal);
    });

    // TCHR.4 Filter by Tahun Akhir
    test(`TCHR.4 ${role.label} filter by Tahun Akhir`, async ({ page }) => {
      const totalAwal = await totalData(page);

      await pilihTahun(page, "Tahun Akhir", "2036");

      await expect(resetFilterButton(page)).toBeVisible();
      expect(await totalData(page)).toBeLessThan(totalAwal);
    });

    // TCHR.5 Negative: rentang tahun yang konflik
    test(`TCHR.5 ${role.label} cannot pick a conflicting year range`, async ({ page }) => {
      await pilihTahun(page, "Tahun Awal", "2024");

      await clickThink(filterTrigger(page, "Tahun Akhir"));
      await expect(yearPopup(page)).toBeVisible();

      // Tahun Akhir hanya boleh menawarkan tahun >= Tahun Awal, sehingga
      // kombinasi "awal > akhir" memang tidak bisa dibentuk dari UI.
      const tahunTersedia = (await yearPopup(page).locator("button").allInnerTexts())
        .map((teks) => teks.trim())
        .filter((teks) => /^\d{4}$/.test(teks))
        .map(Number);

      expect(tahunTersedia.length).toBeGreaterThan(0);
      expect(Math.min(...tahunTersedia)).toBeGreaterThanOrEqual(2024);

      // Rentang yang valid tetap bisa dipilih
      await clickThink(yearPopup(page).getByRole("button", { name: "2026", exact: true }));
      await expect(filterTrigger(page, "Tahun Akhir")).toContainText("2026");
      await expect(barisData(page).first().or(emptyState(page))).toBeVisible();
    });

    // TCHR.6-13 Search Bar
    test.describe(`TCHR.6-13 ${role.label} Search Bar`, () => {
      // Kata kunci diambil dari baris pertama tabel supaya tidak bergantung
      // pada data seed tertentu yang bisa berubah di database.
      const searchCases = [
        {
          adaHasil: true,
          id: "TCHR.6",
          kata: (baris: { nama: string; nik: string }) => baris.nama,
          title: "input keyword in search bar",
        },
        {
          adaHasil: true,
          id: "TCHR.7",
          kata: (baris: { nama: string; nik: string }) => baris.nama.toUpperCase(),
          title: "input with upper case",
        },
        {
          adaHasil: true,
          id: "TCHR.8",
          kata: (baris: { nama: string; nik: string }) => baris.nama.toLowerCase(),
          title: "input with lower case",
        },
        {
          adaHasil: true,
          id: "TCHR.9",
          kata: (baris: { nama: string; nik: string }) => baris.nik,
          title: "input with specific word (NIK)",
        },
        {
          adaHasil: false,
          id: "TCHR.10",
          kata: () => "xqz99randomkeyword",
          title: "input with random keyword",
        },
        {
          adaHasil: false,
          id: "TCHR.11",
          kata: () => "@#$%^&*()",
          title: "input with special characters",
        },
        {
          adaHasil: true,
          id: "TCHR.12",
          kata: () => "",
          title: "inputs empty keyword in search bar",
        },
        {
          adaHasil: false,
          id: "TCHR.13",
          kata: () => "   ",
          title: "inputs whitespace only in search bar",
        },
      ];

      for (const searchCase of searchCases) {
        test(`${searchCase.id} ${role.label} ${searchCase.title}`, async ({ page }) => {
          const totalAwal = await totalData(page);
          const baris = {
            nama: (await nilaiKolom(page, "nama"))[0],
            nik: (await nilaiKolom(page, "nik"))[0],
          };
          const keyword = searchCase.kata(baris);

          // Pencarian berjalan saat mengetik (onChange), bukan saat menekan Enter
          await fillThink(searchField(page), keyword);

          if (!searchCase.adaHasil) {
            await expect(emptyState(page)).toBeVisible();
            await expect(page.getByRole("table")).toBeHidden();
            return;
          }

          await expect(barisData(page).first()).toBeVisible();

          if (keyword === "") {
            expect(await totalData(page)).toBe(totalAwal);
            return;
          }

          // Setiap baris hasil harus mengandung kata kunci pada NIK atau Nama
          const nikHasil = await nilaiKolom(page, "nik");
          const namaHasil = await nilaiKolom(page, "nama");
          for (let i = 0; i < nikHasil.length; i++) {
            expect(`${nikHasil[i]} ${namaHasil[i]}`.toLowerCase()).toContain(keyword.toLowerCase());
          }

          // NIK unik 16 digit, jadi pencarian NIK utuh hanya boleh 1 hasil
          if (keyword === baris.nik) expect(await totalData(page)).toBe(1);
          else expect(await totalData(page)).toBeLessThanOrEqual(totalAwal);
        });
      }
    });

    // TCHR.14 Tabel Riwayat Relawan
    test(`TCHR.14 ${role.label} access Relawan history detail`, async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Tabel Riwayat Data Relawan" })).toBeVisible();

      const nik = (await nilaiKolom(page, "nik"))[0];
      const nama = (await nilaiKolom(page, "nama"))[0];

      await bukaDetail(page);

      // Modal harus menampilkan relawan pada baris yang diklik
      await expect(detailValue(page, "NIK")).toHaveText(nik);
      await expect(detailValue(page, "Nama Relawan")).toHaveText(nama);
    });

    // TCHR.15 Filter by Kemantren
    test(`TCHR.15 ${role.label} filter by Kemantren`, async ({ page }) => {
      const totalAwal = await totalData(page);
      const { nilai: daftarKemantren } = await bacaOpsiSelect(page, "Kemantren", 1);
      expect(daftarKemantren.length).toBeGreaterThan(0);

      const kemantren = await pilihKemantrenBerisi(page, daftarKemantren);

      // Kelurahan yang tampil harus milik Kemantren terpilih
      const { nilai: daftarKelurahan } = await bacaOpsiSelect(page, "Kelurahan", 1);
      for (const kelurahan of await nilaiKolom(page, "kelurahan")) {
        expect(
          daftarKelurahan,
          `Kelurahan "${kelurahan}" bukan bagian dari ${kemantren}`,
        ).toContain(kelurahan);
      }
      expect(await totalData(page)).toBeLessThan(totalAwal);
    });

    // TCHR.16 Filter Kelurahan bergantung pada Kemantren
    test(`TCHR.16 ${role.label} filter by Kelurahan after picking a Kemantren`, async ({
      page,
    }) => {
      // Sebelum Kemantren dipilih, Kelurahan terkunci
      await expect(filterTrigger(page, "Kelurahan")).toBeDisabled();
      await expect(filterTrigger(page, "Kelurahan")).toHaveText(/pilih kemantren dulu/i);

      const { nilai: daftarKemantren } = await bacaOpsiSelect(page, "Kemantren", 1);
      await pilihKemantrenBerisi(page, daftarKemantren);

      await expect(filterTrigger(page, "Kelurahan")).toBeEnabled();

      const kelurahan = (await nilaiKolom(page, "kelurahan"))[0];
      await pilihFilter(page, "Kelurahan", kelurahan);

      await expect(barisData(page).first()).toBeVisible();
      for (const sel of await nilaiKolom(page, "kelurahan")) {
        expect(sel.toLowerCase()).toBe(kelurahan.toLowerCase());
      }

      // Melepas Kemantren juga mengosongkan Kelurahan
      await pilihFilter(page, "Kemantren", "Semua Kemantren");
      await expect(filterTrigger(page, "Kelurahan")).toBeDisabled();
      await expect(filterTrigger(page, "Kelurahan")).toHaveText(/pilih kemantren dulu/i);
    });

    // TCHR.17 Reset Filter
    test(`TCHR.17 ${role.label} resets all active filters`, async ({ page }) => {
      const totalAwal = await totalData(page);
      const opdAwal = (await filterTrigger(page, "Nama OPD").innerText()).trim();

      // Tombol reset baru muncul setelah ada filter aktif
      await expect(resetFilterButton(page)).toBeHidden();

      const { nilai: daftarKemantren } = await bacaOpsiSelect(page, "Kemantren", 1);
      await pilihKemantrenBerisi(page, daftarKemantren);
      await pilihTahun(page, "Tahun Awal", "2024");
      await fillThink(searchField(page), "demo");

      await expect(resetFilterButton(page)).toBeVisible();
      await clickThink(resetFilterButton(page));

      await expect(resetFilterButton(page)).toBeHidden();
      await expect(filterTrigger(page, "Kemantren")).toHaveText(/semua kemantren/i);
      await expect(filterTrigger(page, "Kelurahan")).toBeDisabled();
      await expect(filterTrigger(page, "Nama Kader")).toHaveText(/semua kader/i);
      await expect(filterTrigger(page, "Tahun Awal")).toHaveText(/tahun awal/i);
      await expect(searchField(page)).toHaveValue("");
      // Role OPD tetap terkunci ke instansinya sendiri setelah reset
      await expect(filterTrigger(page, "Nama OPD")).toHaveText(exactText(opdAwal));
      expect(await totalData(page)).toBe(totalAwal);
    });

    // TCHR.18 Sort by NIK
    test(`TCHR.18 ${role.label} sorts the table by NIK`, async ({ page }) => {
      test.skip((await totalData(page)) <= 5, "Butuh lebih dari satu halaman data");

      await ujiSortKolom(page, "NIK", "nik");
    });

    // TCHR.19 Sort by Nama
    test(`TCHR.19 ${role.label} sorts the table by Nama`, async ({ page }) => {
      test.skip((await totalData(page)) <= 5, "Butuh lebih dari satu halaman data");

      await ujiSortKolom(page, "NAMA", "nama");
    });

    // TCHR.20 Pagination
    test(`TCHR.20 ${role.label} navigates between table pages`, async ({ page }) => {
      const total = await totalData(page);
      test.skip(total <= 5, "Data kurang dari satu halaman, pagination tidak relevan");

      await expect(barisData(page)).toHaveCount(5);
      await expect(infoJumlah(page)).toHaveText(/Menampilkan 1–5 dari/);
      await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();

      const halamanSatu = await nilaiKolom(page, "nik");

      await clickThink(page.getByRole("button", { name: "Selanjutnya" }));

      await expect(infoJumlah(page)).toHaveText(/Menampilkan 6–/);
      expect(await nilaiKolom(page, "nik")).not.toEqual(halamanSatu);

      await clickThink(page.getByRole("button", { name: "Sebelumnya" }));

      await expect(infoJumlah(page)).toHaveText(/Menampilkan 1–5 dari/);
      expect(await nilaiKolom(page, "nik")).toEqual(halamanSatu);
    });

    // TCHR.21 Kolom tabel
    test(`TCHR.21 ${role.label} views the history table columns`, async ({ page }) => {
      const header = (await page.locator("table thead th").allInnerTexts()).map((teks) =>
        teks.trim(),
      );

      expect(header).toEqual(["NIK", "NAMA", "ALAMAT", "KELURAHAN", "OPD", "KADER", "AKSI"]);
    });

    // TCHR.22 Isi modal detail
    test(`TCHR.22 ${role.label} views the detail modal contents`, async ({ page }) => {
      const kaderPerBaris = await nilaiKolom(page, "kader");
      // Baris dengan kader terisi dipastikan punya penugasan untuk diperiksa
      const indeks = Math.max(
        kaderPerBaris.findIndex((nilai) => nilai !== "-"),
        0,
      );

      await bukaDetail(page, indeks);

      await expect(detailModalBody(page).getByText("Informasi Pribadi")).toBeVisible();
      await expect(detailModalBody(page).getByText("Daftar Penugasan")).toBeVisible();

      // Diperiksa lewat kolom nilainya, karena sebagian data memakai teks yang
      // sama dengan labelnya (mis. kelurahan bernama "Kelurahan").
      const labelWajib = [
        "Nama Relawan",
        "NIK",
        "Jenis Kelamin",
        "Alamat KTP",
        "No. HP",
        "Kemantren",
        "Kelurahan",
      ];
      for (const label of labelWajib) {
        await expect(detailValue(page, label)).toBeVisible();
      }
      await expect(detailValue(page, "NIK")).toHaveText((await nilaiKolom(page, "nik"))[indeks]);
      await expect(detailValue(page, "Jenis Kelamin")).toHaveText(
        /laki-laki \(L\)|perempuan \(P\)/i,
      );

      const kartuPenugasan = detailModalBody(page).getByText(/^Penugasan #\d+$/);
      if (kaderPerBaris[indeks] !== "-") {
        await expect(kartuPenugasan.first()).toBeVisible();
        await expect(detailValue(page, "OPD")).not.toHaveText("-");
        await expect(detailValue(page, "Kader")).not.toHaveText("-");
        await expect(
          detailModalBody(page)
            .getByText(/^(Aktif|Tidak Aktif)$/)
            .first(),
        ).toBeVisible();
      } else {
        await expect(
          detailModalBody(page).getByText(/belum ada data penugasan terdaftar/i),
        ).toBeVisible();
      }

      await clickThink(detailCloseButton(page));
      await expect(page.getByRole("heading", { name: JUDUL_DETAIL })).toBeHidden();
    });
  });
}

// Membantu TCHR.15-17: memilih Kemantren pertama yang benar-benar punya relawan
// supaya pengujian filter tidak berhenti di tampilan "tidak ada data".
async function pilihKemantrenBerisi(page: Page, daftarKemantren: readonly string[]) {
  for (const kemantren of daftarKemantren) {
    await pilihFilter(page, "Kemantren", kemantren);
    if ((await barisData(page).count()) > 0) return kemantren;
  }

  throw new Error("Tidak ada Kemantren yang memiliki data relawan untuk diuji");
}

// TCHR.23 Daftar Kader mengikuti OPD yang dipilih (khusus Super Admin)
test("TCHR.23 Super Admin sees Kader options scoped to the selected OPD", async ({ page }) => {
  await page.goto(BASE_URL);

  await loginBAPPEDA({
    NIK: credentials.superAdmin.NIK,
    page,
    password: credentials.superAdmin.password,
  });

  await clickThink(page.getByRole("link", { name: /riwayat relawan/i }));
  await expect(page.getByText(/memuat riwayat data relawan/i)).toBeHidden({ timeout: LOAD_TIME });
  await expect(barisData(page).first()).toBeVisible();

  const { nilai: semuaKader } = await bacaOpsiSelect(page, "Nama Kader", 1);

  const opd = await nilaiFilterDariTabel(page, "opd");
  expect(opd, "Tidak ada baris dengan OPD terisi untuk diuji").toBeDefined();
  await pilihFilter(page, "Nama OPD", opd!);

  const { nilai: kaderOpd, placeholder } = await bacaOpsiSelect(page, "Nama Kader", 1);
  expect(kaderOpd.length).toBeLessThan(semuaKader.length);
  for (const kader of kaderOpd) expect(semuaKader).toContain(kader);
  expect(placeholder).toMatch(/kader di opd ini/i);

  // Mengganti OPD harus mengosongkan Kader yang sudah tidak relevan
  await pilihFilter(page, "Nama Kader", kaderOpd[0]);

  const { nilai: daftarOpd } = await bacaOpsiSelect(page, "Nama OPD", 2);
  const opdLain = daftarOpd.find((nama) => nama.toLowerCase() !== opd!.toLowerCase());
  expect(opdLain, "Butuh minimal dua OPD untuk menguji reset Kader").toBeDefined();

  await pilihFilter(page, "Nama OPD", opdLain!);
  await expect(filterTrigger(page, "Nama Kader")).toHaveText(/kader di opd ini|tidak ada kader/i);
});

// TCHR.24 Role OPD terkunci ke instansinya sendiri
test("TCHR.24 OPD can only see its own OPD in the history", async ({ page }) => {
  await page.goto(BASE_URL);

  await loginBAPPEDA({
    NIK: credentials.opd.NIK,
    page,
    password: credentials.opd.password,
  });

  await clickThink(page.getByRole("link", { name: /riwayat relawan/i }));
  await expect(page.getByText(/memuat riwayat data relawan/i)).toBeHidden({ timeout: LOAD_TIME });
  await expect(barisData(page).first()).toBeVisible();

  // Filter OPD dikunci: tidak bisa diklik dan sudah terisi nama instansinya
  const pemicuOpd = filterTrigger(page, "Nama OPD");
  await expect(pemicuOpd).toBeDisabled();

  const namaOpd = (await pemicuOpd.innerText()).trim();
  expect(namaOpd).not.toMatch(/semua opd/i);

  // Seluruh baris yang tampil harus milik OPD tersebut
  for (const sel of await nilaiKolom(page, "opd")) {
    expect(sel.toLowerCase()).toContain(namaOpd.toLowerCase());
  }
});

// TCHR.25 Pembatasan akses halaman
test("TCHR.25 Relawan cannot access the Riwayat Relawan page", async ({ page }) => {
  await page.goto(BASE_URL);

  await loginBAPPEDA({
    NIK: credentials.relawan.NIK,
    page,
    password: credentials.relawan.password,
  });

  await expect(page).toHaveURL(/profil-relawan/);

  // Route /histori-relawan hanya untuk super_admin & opd
  await page.goto(`${BASE_URL}histori-relawan`);

  await expect(page).toHaveURL(/unauthorized|profil-relawan/);
  await expect(page.getByRole("heading", { name: "Tabel Riwayat Data Relawan" })).toBeHidden();
});

// TCHR.26 Tampilan saat data gagal dimuat
test("TCHR.26 Riwayat Relawan handles a failed data request", async ({ page }) => {
  await page.goto(BASE_URL);

  await loginBAPPEDA({
    NIK: credentials.superAdmin.NIK,
    page,
    password: credentials.superAdmin.password,
  });

  await expect(page).toHaveURL(/dashboard/);

  // Gagalkan permintaan data riwayat untuk menguji penanganan errornya
  await page.route("**/admin/relawan", (route) => route.abort());
  await clickThink(page.getByRole("link", { name: /riwayat relawan/i }));
  await expect(page).toHaveURL(/histori-relawan/);

  await expect(page.getByText(/memuat riwayat data relawan/i)).toBeHidden({ timeout: LOAD_TIME });
  await expect(emptyState(page)).toBeVisible();
  await expect(page.getByText(/belum ada riwayat data relawan yang tercatat/i)).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
});
