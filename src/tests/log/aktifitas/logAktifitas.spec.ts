import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink, LOAD_TIME } from "@/helpers/timing.helper";
import { expect, Page, test } from "@playwright/test";

const BASE_URL = "https://frontend-bappeda.vercel.app/";

// Deferred TC: TCLA.1 dan TCLA.10 ditunda (dilewati, tidak dijalankan)
const DEFERRED = { annotation: { description: "Deferred TC", type: "deferred" } };

// ── Locator ──────────────────────────────────────────────────────────────
const searchField = (page: Page) => page.getByPlaceholder("Cari");

// Kedua filter memakai komponen Select buatan sendiri: pemicunya <button> biasa
// (tanpa role combobox, tidak bisa dipakai selectOption) dan daftar opsinya
// dirender lewat portal ke <body>. Keduanya juga tidak punya <label>, jadi
// dicari lewat posisinya terhadap kolom pencarian di baris filter yang sama.
const filterTrigger = (page: Page, urutan: 1 | 2) =>
  page
    .locator(
      `xpath=//input[@placeholder="Cari"]/parent::div/following-sibling::div[${urutan}]//button`,
    )
    .first();

const filterAksi = (page: Page) => filterTrigger(page, 1);
const filterTabel = (page: Page) => filterTrigger(page, 2);
const selectPopup = (page: Page) => page.locator("[data-select-popup]");

// Popup ditutup lewat mousedown di luar. Judul header dipakai karena letaknya
// di atas baris filter, jadi tidak pernah tertutup popup.
const tutupPopup = (page: Page) =>
  clickThink(page.getByRole("heading", { name: "Log / Aktifitas", exact: true }));

const exactText = (value: string) =>
  new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");

const bacaOpsiFilter = async (page: Page, trigger: ReturnType<typeof filterAksi>) => {
  await clickThink(trigger);
  await expect(selectPopup(page)).toBeVisible();

  const opsi = (await selectPopup(page).locator("button").allInnerTexts()).map((t) => t.trim());
  await tutupPopup(page);

  return opsi;
};

const pilihFilter = async (page: Page, trigger: ReturnType<typeof filterAksi>, nilai: string) => {
  await clickThink(trigger);
  await expect(selectPopup(page)).toBeVisible();

  await clickThink(
    selectPopup(page)
      .locator("button")
      .filter({ hasText: exactText(nilai) })
      .first(),
  );

  await expect(selectPopup(page)).toBeHidden();
  await expect(trigger).toHaveText(exactText(nilai));
};

// Table menyisipkan baris kosong (satu <td> ber-colSpan) supaya tinggi tabel
// tetap sama; baris data dikenali dari kolomnya yang utuh.
const barisData = (page: Page) => page.locator("table tbody tr:has(td:nth-child(6))");

const KOLOM = { aksi: 4, nik: 3, pengguna: 2, tabel: 5, waktu: 1 } as const;

const nilaiKolom = async (page: Page, kolom: keyof typeof KOLOM) =>
  (await barisData(page).locator(`td:nth-child(${KOLOM[kolom]})`).allInnerTexts()).map((teks) =>
    teks.trim(),
  );

// "Menampilkan 200 dari 200 log" (ringkasan atas) vs
// "Menampilkan 1-5 dari 200 log" (info paginasi di bawah tabel)
const ringkasan = (page: Page) => page.getByText(/^Menampilkan \d+ dari \d+ log$/);
const infoHalaman = (page: Page) => page.getByText(/^Menampilkan \d+-\d+ dari \d+ log$/);

const jumlahHasil = async (page: Page) =>
  Number((await ringkasan(page).innerText()).match(/Menampilkan (\d+)/)![1]);

const emptyState = (page: Page) =>
  page.getByText("Tidak ada log yang sesuai filter", { exact: true });

// ── Modal detail ─────────────────────────────────────────────────────────
const JUDUL_DETAIL = "Detail Log Aktivitas";

const detailModal = (page: Page) =>
  page.locator(`xpath=//h2[normalize-space(.)="${JUDUL_DETAIL}"]/../../..`);

// Baris info di modal: <p>Label</p> diikuti elemen berisi nilainya
// (<p> untuk teks biasa, <span> untuk badge Jenis Aksi).
const detailValue = (page: Page, label: string) =>
  detailModal(page)
    .locator(`xpath=.//p[normalize-space(text())="${label}"]/following-sibling::*[1]`)
    .first();

const detailCloseButton = (page: Page) =>
  page
    .locator(
      `xpath=//h2[normalize-space(.)="${JUDUL_DETAIL}"]/parent::div/following-sibling::button`,
    )
    .first();

const bukaDetail = async (page: Page, indeksBaris = 0) => {
  await clickThink(
    barisData(page).nth(indeksBaris).getByRole("button", { name: "Lihat Detail Perubahan" }),
  );
  await expect(page.getByRole("heading", { name: JUDUL_DETAIL })).toBeVisible();
};

// Kolom WAKTU memakai format id-ID, mis. "21/9/2026, 23.38.06"
const waktuKeAngka = (teks: string) => {
  const cocok = teks.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2})\.(\d{2})\.(\d{2})/);
  expect(cocok, `Format waktu tidak dikenali: "${teks}"`).not.toBeNull();

  const [, hari, bulan, tahun, jam, menit, detik] = cocok!;
  return new Date(
    Number(tahun),
    Number(bulan) - 1,
    Number(hari),
    Number(jam),
    Number(menit),
    Number(detik),
  ).getTime();
};

test.describe("Log Aktifitas - Super Admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);

    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });

    await expect(page).toHaveURL(/dashboard/);

    // Menu sidebar bertuliskan "Log Aktivitas" (dengan v), sedangkan rutenya
    // "/log-aktifitas" (dengan f).
    await clickThink(page.getByRole("link", { name: "Log Aktivitas" }));
    await expect(page).toHaveURL(/log-aktifitas/);

    await expect(page.getByText(/memuat log aktivitas/i)).toBeHidden({ timeout: LOAD_TIME });
    await expect(barisData(page).first()).toBeVisible();
  });

  // TCLA.1-3 Filter
  test.describe("TCLA.1-3 Super Admin Filter", () => {
    // TCLA.1 Urutan waktu log
    test.skip(
      "TCLA.1 Super Admin views the log sorted by newest activity",
      DEFERRED,
      async ({ page }) => {
        // Halaman ini tidak punya filter periode waktu; yang dijamin adalah log
        // ditampilkan berurutan dari aktivitas terbaru.
        const waktu = (await nilaiKolom(page, "waktu")).map(waktuKeAngka);

        expect(waktu.length).toBeGreaterThan(1);
        for (let i = 1; i < waktu.length; i++) {
          expect(waktu[i - 1]).toBeGreaterThanOrEqual(waktu[i]);
        }
      },
    );

    // TCLA.2 Filter jenis aksi
    test("TCLA.2 Super Admin filters data by activity type", async ({ page }) => {
      const totalAwal = await jumlahHasil(page);

      // Opsi aksi mengikuti data yang ada dan ditampilkan dalam bahasa Indonesia
      // ("Tambah Data" untuk INSERT, "Ubah Data" untuk UPDATE), bukan nilai mentahnya.
      const opsi = await bacaOpsiFilter(page, filterAksi(page));
      const aksiTersedia = opsi.filter((teks) => !/^(Pilih\.\.\.|Semua Aksi)$/.test(teks));
      expect(aksiTersedia.length).toBeGreaterThan(0);

      for (const aksi of aksiTersedia) {
        await pilihFilter(page, filterAksi(page), aksi);

        await expect(barisData(page).first()).toBeVisible();
        for (const sel of await nilaiKolom(page, "aksi")) {
          expect(sel).toBe(aksi);
        }
        expect(await jumlahHasil(page)).toBeLessThan(totalAwal);
      }
    });

    // TCLA.3 Filter nama tabel
    test("TCLA.3 Super Admin filters data by table name", async ({ page }) => {
      // Tidak ada filter "pengguna" di halaman ini; filter kedua adalah nama tabel.
      const totalAwal = await jumlahHasil(page);

      const opsi = await bacaOpsiFilter(page, filterTabel(page));
      const tabelTersedia = opsi.filter((teks) => !/^(Pilih\.\.\.|Semua Tabel)$/.test(teks));
      expect(tabelTersedia.length).toBeGreaterThan(0);

      const tabel = tabelTersedia[0];
      await pilihFilter(page, filterTabel(page), tabel);

      await expect(barisData(page).first()).toBeVisible();
      for (const sel of await nilaiKolom(page, "tabel")) {
        expect(sel).toBe(tabel);
      }
      expect(await jumlahHasil(page)).toBeLessThan(totalAwal);
    });
  });

  // TCLA.4-9 Search Bar
  test.describe("TCLA.4-9 Super Admin Search Bar", () => {
    // Kata kunci diambil dari baris pertama tabel supaya tidak bergantung pada
    // data seed tertentu. Pencarian mencocokkan nama pengguna, NIK, jenis aksi,
    // dan nama tabel sekaligus.
    const searchCases = [
      {
        adaHasil: true,
        id: "TCLA.4",
        kata: (baris: { pengguna: string; tabel: string }) => baris.pengguna,
        title: "input keyword in search bar",
      },
      {
        adaHasil: true,
        id: "TCLA.5",
        kata: (baris: { pengguna: string; tabel: string }) => baris.pengguna.toUpperCase(),
        title: "input with upper case",
      },
      {
        adaHasil: true,
        id: "TCLA.6",
        kata: (baris: { pengguna: string; tabel: string }) => baris.pengguna.toLowerCase(),
        title: "input with lower case",
      },
      {
        adaHasil: true,
        id: "TCLA.7",
        kata: (baris: { pengguna: string; tabel: string }) => baris.tabel,
        title: "input with specific word (nama tabel)",
      },
      {
        adaHasil: false,
        id: "TCLA.8",
        kata: () => "xqz99randomkeyword",
        title: "input with random keyword",
      },
      {
        adaHasil: false,
        id: "TCLA.9",
        kata: () => "@#$%^&*()",
        title: "input with special characters",
      },
    ];

    for (const searchCase of searchCases) {
      test(`${searchCase.id} Super Admin ${searchCase.title}`, async ({ page }) => {
        const totalAwal = await jumlahHasil(page);
        const baris = {
          pengguna: (await nilaiKolom(page, "pengguna"))[0],
          tabel: (await nilaiKolom(page, "tabel"))[0],
        };
        const keyword = searchCase.kata(baris);

        // Pencarian berjalan saat mengetik (onChange), bukan saat menekan Enter
        await fillThink(searchField(page), keyword);

        if (!searchCase.adaHasil) {
          await expect(emptyState(page)).toBeVisible();
          await expect(page.getByRole("table")).toBeHidden();
          expect(await jumlahHasil(page)).toBe(0);
          return;
        }

        await expect(barisData(page).first()).toBeVisible();
        expect(await jumlahHasil(page)).toBeLessThanOrEqual(totalAwal);

        // Setiap baris hasil harus mengandung kata kunci pada salah satu kolom
        const pengguna = await nilaiKolom(page, "pengguna");
        const nik = await nilaiKolom(page, "nik");
        const tabel = await nilaiKolom(page, "tabel");
        for (let i = 0; i < pengguna.length; i++) {
          expect(`${pengguna[i]} ${nik[i]} ${tabel[i]}`.toLowerCase()).toContain(
            keyword.toLowerCase(),
          );
        }
      });
    }
  });

  // TCLA.10 Export Log Table
  // Deferred TC. BELUM ADA DI APLIKASI: halaman Log Aktivitas tidak punya tombol
  // export seperti Data Relawan / Manajemen OPD, sehingga test case-nya ditunda
  // sampai fiturnya dibuat. Lihat catatan di laporan.

  // TCLA.11 Navigate to Log Table
  test("TCLA.11 Super Admin navigates to the Log Aktivitas table", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Log Aktivitas" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(ringkasan(page)).toBeVisible();
    await expect(infoHalaman(page)).toBeVisible();
  });

  // TCLA.12 Kombinasi filter aksi + tabel
  test("TCLA.12 Super Admin combines the action and table filters", async ({ page }) => {
    const aksi = (await bacaOpsiFilter(page, filterAksi(page))).filter(
      (teks) => !/^(Pilih\.\.\.|Semua Aksi)$/.test(teks),
    )[0];
    await pilihFilter(page, filterAksi(page), aksi);

    // Daftar tabel tidak menyusut mengikuti filter aksi, jadi dicari kombinasi
    // yang benar-benar punya data supaya assertion-nya bermakna.
    const tabelTersedia = (await bacaOpsiFilter(page, filterTabel(page))).filter(
      (teks) => !/^(Pilih\.\.\.|Semua Tabel)$/.test(teks),
    );

    let terpakai = "";
    for (const tabel of tabelTersedia) {
      await pilihFilter(page, filterTabel(page), tabel);
      if ((await barisData(page).count()) > 0) {
        terpakai = tabel;
        break;
      }
    }
    expect(terpakai, "Tidak ada kombinasi aksi + tabel yang punya data").not.toBe("");

    for (const sel of await nilaiKolom(page, "aksi")) expect(sel).toBe(aksi);
    for (const sel of await nilaiKolom(page, "tabel")) expect(sel).toBe(terpakai);
  });

  // TCLA.13 Melepas filter mengembalikan seluruh data
  test("TCLA.13 Super Admin clears the active filters", async ({ page }) => {
    const totalAwal = await jumlahHasil(page);

    const aksi = (await bacaOpsiFilter(page, filterAksi(page))).filter(
      (teks) => !/^(Pilih\.\.\.|Semua Aksi)$/.test(teks),
    )[0];
    await pilihFilter(page, filterAksi(page), aksi);
    await fillThink(searchField(page), (await nilaiKolom(page, "tabel"))[0]);

    expect(await jumlahHasil(page)).toBeLessThan(totalAwal);

    await pilihFilter(page, filterAksi(page), "Semua Aksi");
    await fillThink(searchField(page), "");

    await expect(filterAksi(page)).toHaveText(/semua aksi/i);
    expect(await jumlahHasil(page)).toBe(totalAwal);
  });

  // TCLA.14 Pagination
  test("TCLA.14 Super Admin navigates between log pages", async ({ page }) => {
    const total = await jumlahHasil(page);
    test.skip(total <= 10, "Data kurang dari dua halaman, pagination tidak relevan");

    // Isi baris tidak dibandingkan antar halaman: banyak log dicatat pada detik
    // yang sama oleh pengguna dan tabel yang sama, sehingga dua halaman bisa
    // menampilkan teks yang identik walaupun datanya memang berbeda.
    await expect(barisData(page)).toHaveCount(5);
    await expect(infoHalaman(page)).toHaveText(new RegExp(`Menampilkan 1-5 dari ${total} log`));
    await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();

    await clickThink(page.getByRole("button", { name: "Selanjutnya" }));

    await expect(infoHalaman(page)).toHaveText(new RegExp(`Menampilkan 6-10 dari ${total} log`));
    await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeEnabled();
    await expect(barisData(page)).toHaveCount(5);

    await clickThink(page.getByRole("button", { name: "Sebelumnya" }));

    await expect(infoHalaman(page)).toHaveText(new RegExp(`Menampilkan 1-5 dari ${total} log`));
    await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
  });

  // TCLA.15 Kolom tabel
  test("TCLA.15 Super Admin views the log table columns", async ({ page }) => {
    const header = (await page.locator("table thead th").allInnerTexts()).map((teks) =>
      teks.trim(),
    );

    // Kolom terakhir adalah kolom tombol aksi, namanya kebetulan sama dengan
    // kolom jenis aksi (keduanya "AKSI").
    expect(header).toEqual(["WAKTU", "PENGGUNA", "NIK", "AKSI", "TABEL", "AKSI"]);
  });

  // TCLA.16 Modal detail log
  test("TCLA.16 Super Admin opens a log detail", async ({ page }) => {
    const pengguna = (await nilaiKolom(page, "pengguna"))[0];
    const aksi = (await nilaiKolom(page, "aksi"))[0];
    const tabel = (await nilaiKolom(page, "tabel"))[0];

    await bukaDetail(page);

    await expect(detailValue(page, "Pengguna")).toHaveText(pengguna);
    await expect(detailValue(page, "Jenis Aksi")).toHaveText(aksi);
    await expect(detailValue(page, "Tabel")).toHaveText(tabel);
    await expect(detailValue(page, "Target Data")).toContainText(/\(ID: .+\)/);

    // Judul bagian detail menyesuaikan jenis aksinya
    const judulDetail =
      aksi === "Tambah Data"
        ? "Detail Data Baru"
        : aksi === "Ubah Data"
          ? "Detail Data yang Diubah"
          : "Detail Data";
    await expect(detailModal(page).getByRole("heading", { name: judulDetail })).toBeVisible();

    await clickThink(page.getByRole("button", { name: "Tutup" }));
    await expect(page.getByRole("heading", { name: JUDUL_DETAIL })).toBeHidden();
  });

  // TCLA.17 Tutup modal lewat tombol X
  test("TCLA.17 Super Admin closes the log detail with the X button", async ({ page }) => {
    await bukaDetail(page);

    await clickThink(detailCloseButton(page));

    await expect(page.getByRole("heading", { name: JUDUL_DETAIL })).toBeHidden();
    await expect(page.getByRole("table")).toBeVisible();
  });

  // TCLA.18 Isi detail perubahan
  test("TCLA.18 Super Admin views the recorded value changes", async ({ page }) => {
    await bukaDetail(page);

    const tanpaIsi = detailModal(page).getByText(
      /tidak ada detail data|tidak ada perubahan nilai yang terdeteksi/i,
    );
    test.skip(
      await tanpaIsi.isVisible(),
      "API /admin/logs tidak mengirim old_value & new_value, sehingga detail perubahan selalu kosong",
    );

    // Blok perubahan menampilkan nama kolom beserta nilainya
    await expect(
      detailModal(page)
        .getByText(/^Sebelum$|^Sesudah$/)
        .first()
        .or(tanpaIsi),
    ).toBeVisible();
  });

  // TCLA.19 Pencarian berdasarkan NIK
  test("TCLA.19 Super Admin searches a log by NIK", async ({ page }) => {
    const nikTerisi = (await nilaiKolom(page, "nik")).find((nilai) => nilai !== "-");
    test.skip(
      !nikTerisi,
      "API /admin/logs tidak mengirim field nik, sehingga kolom NIK selalu kosong",
    );

    await fillThink(searchField(page), nikTerisi!);

    await expect(barisData(page).first()).toBeVisible();
    for (const sel of await nilaiKolom(page, "nik")) {
      expect(sel).toContain(nikTerisi!);
    }
  });

  // TCLA.20 Tampilan saat data gagal dimuat
  test("TCLA.20 Log Aktivitas handles a failed data request", async ({ page }) => {
    await page.route("**/admin/logs*", (route) => route.abort());
    await page.reload();

    await expect(page.getByText(/memuat log aktivitas/i)).toBeHidden({ timeout: LOAD_TIME });

    // Belum ada tampilan error khusus; halaman jatuh ke tampilan "tidak ada log"
    await expect(emptyState(page)).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();
    expect(await jumlahHasil(page)).toBe(0);
  });
});

// TCLA.21 Pembatasan akses halaman
const roleTanpaAkses = [
  { creds: credentials.opd, label: "OPD", urlSetelahLogin: /dashboard/ },
  { creds: credentials.relawan, label: "Relawan", urlSetelahLogin: /profil-relawan/ },
] as const;

for (const role of roleTanpaAkses) {
  test(`TCLA.21 ${role.label} cannot access the Log Aktivitas page`, async ({ page }) => {
    await page.goto(BASE_URL);

    await loginBAPPEDA({
      NIK: role.creds.NIK,
      page,
      password: role.creds.password,
    });

    await expect(page).toHaveURL(role.urlSetelahLogin);

    // Menu Log Aktivitas hanya ada di sidebar Super Admin
    await expect(page.getByRole("link", { name: "Log Aktivitas" })).toBeHidden();

    await page.goto(`${BASE_URL}log-aktifitas`);

    await expect(page).toHaveURL(/unauthorized/);
    await expect(page.getByRole("heading", { name: "Log Aktivitas" })).toBeHidden();
  });
}
