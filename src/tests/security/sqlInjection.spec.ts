import { credentials } from "@/helpers/credentials.helper";
import { fillKaderForm } from "@/helpers/formKader.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink, LOAD_TIME } from "@/helpers/timing.helper";
import { expect, Page, Response, test } from "@playwright/test";

/**
 * Security Testing — SQL Injection (SQLi)
 *
 * Tujuan: memastikan aplikasi BAPPEDA TAHAN terhadap upaya SQL Injection pada
 * titik masuk data (form login, form input, kolom pencarian). Ini pengujian
 * DEFENSIF terhadap sistem milik sendiri — setiap test membuktikan aplikasi
 * MENOLAK/menetralkan payload, bukan mengeksploitasinya.
 *
 * Tiga jaminan keamanan yang dinilai:
 *   1. Auth bypass gagal        — payload tidak boleh membuat pengguna masuk.
 *   2. Tidak ada kebocoran      — pesan/DOM tidak boleh menampilkan error SQL
 *                                 mentah (nama tabel, sintaks query, driver DB).
 *   3. Server tidak jebol       — tidak ada respons 5xx; query diperlakukan
 *                                 sebagai data (parameterized), bukan perintah.
 */
const BASE_URL = "https://frontend-bappeda.vercel.app/";

// Payload SQLi klasik: auth-bypass, komentar, tautologi, union, stacked query,
// dan time-based. Dipakai untuk memverifikasi input diperlakukan sebagai teks.
const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "admin' --",
  "admin' #",
  "' OR 1=1--",
  '" OR ""="',
  "') OR ('1'='1",
  "'; DROP TABLE users; --",
  "1' UNION SELECT null, username, password FROM users --",
  "' OR SLEEP(5) --",
];

// Tanda-tanda kebocoran error database mentah yang TIDAK boleh muncul ke user.
const SQL_ERROR_SIGNATURE =
  /\bsql\b|syntax error|sequelize|unterminated|pg_|postgres|psql|mysql|sqlite|mariadb|ora-\d{4,}|odbc|jdbc|native client|quoted string not properly terminated|column .* does not exist|relation .* does not exist/i;

const containsSqlError = async (page: Page) => {
  const teks = await page.locator("body").innerText();
  return SQL_ERROR_SIGNATURE.test(teks);
};

// Pemantau respons server: mengumpulkan status 5xx selama satu test berjalan.
// SQLi yang berhasil "memecah" query biasanya memunculkan 500 dari backend.
const pantauServerError = (page: Page) => {
  const errors: string[] = [];
  const handler = (res: Response) => {
    if (res.status() >= 500) errors.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  };
  page.on("response", handler);
  return {
    errors,
    stop: () => page.off("response", handler),
  };
};

const loginError = (page: Page) => page.locator("div.bg-red-50");
const nikField = (page: Page) => page.getByRole("textbox", { name: "NIK" });
const passwordField = (page: Page) => page.getByRole("textbox", { name: "Password" });
const masukButton = (page: Page) => page.getByRole("button", { name: "Masuk" });

// ── TCSQL.1 Auth bypass pada form login ────────────────────────────────────
test.describe("TCSQL.1 Login form resists SQL injection", () => {
  for (const payload of SQLI_PAYLOADS) {
    test(`TCSQL.1 NIK & password = ${JSON.stringify(payload)}`, async ({ page }) => {
      const monitor = pantauServerError(page);
      await page.goto(BASE_URL);

      await fillThink(nikField(page), payload);
      await fillThink(passwordField(page), payload);
      await clickThink(masukButton(page));

      // 1. Tidak boleh berhasil masuk — tetap di halaman login
      await expect(page).not.toHaveURL(/dashboard|profil-relawan/);
      await expect(masukButton(page)).toBeVisible();

      // 2. Bila ada pesan error, isinya pesan aplikasi yang wajar, bukan error DB.
      //    (Field NIK menyaring non-angka, jadi payload jadi "NIK tidak ditemukan"
      //    atau "NIK dan Password harus diisi" — keduanya aman.)
      const pesan = (
        await loginError(page)
          .innerText()
          .catch(() => "")
      ).trim();
      expect(pesan).not.toMatch(SQL_ERROR_SIGNATURE);
      expect(await containsSqlError(page)).toBe(false);

      // 3. Server tidak boleh membalas 5xx
      expect(
        monitor.errors,
        `Server error saat payload dikirim: ${monitor.errors.join("; ")}`,
      ).toHaveLength(0);

      monitor.stop();
    });
  }

  // NIK benar + password payload: memastikan payload di password tidak lolos
  test("TCSQL.1 valid NIK with SQLi password is still rejected", async ({ page }) => {
    const monitor = pantauServerError(page);
    await page.goto(BASE_URL);

    await fillThink(nikField(page), credentials.superAdmin.NIK);
    await fillThink(passwordField(page), "' OR '1'='1' --");
    await clickThink(masukButton(page));

    await expect(page).not.toHaveURL(/dashboard/);
    // Password salah ditolak wajar, bukan menembus otentikasi
    await expect(loginError(page)).toHaveText(/password salah/i);
    expect(await containsSqlError(page)).toBe(false);
    expect(monitor.errors).toHaveLength(0);

    monitor.stop();
  });
});

// ── TCSQL.2 Kolom pencarian ────────────────────────────────────────────────
// Pencarian pada beberapa halaman memfilter di sisi klien, tetapi tetap diuji
// sebagai pertahanan berlapis: aplikasi harus tetap berfungsi dan tidak ada
// data yang bocor karena payload diperlakukan sebagai teks pencarian biasa.
const searchTargets = [
  {
    label: "Data Relawan",
    link: "Relawan",
    loading: /memuat data relawan/i,
    url: /data-relawan/,
  },
  {
    label: "Daftar Kader",
    link: "Kader",
    loading: /memuat data kader/i,
    url: /daftar-kader/,
  },
];

for (const target of searchTargets) {
  test(`TCSQL.2 ${target.label} search resists SQL injection`, async ({ page }) => {
    const monitor = pantauServerError(page);

    await page.goto(BASE_URL);
    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });
    await expect(page).toHaveURL(/dashboard/);

    await clickThink(page.getByRole("link", { name: target.link, exact: true }));
    await expect(page).toHaveURL(target.url);
    await expect(page.getByText(target.loading)).toBeHidden({ timeout: LOAD_TIME });

    const searchInput = page.getByPlaceholder(/cari/i).first();
    // Baris data dikenali dari kolomnya yang utuh (baris kosong pengisi tinggi
    // tabel hanya punya satu <td> ber-colSpan).
    const barisData = page.locator("table tbody tr:has(td:nth-child(2))");
    const barisAwal = await barisData.count();

    for (const payload of SQLI_PAYLOADS) {
      await fillThink(searchInput, payload);
      // Aplikasi tetap berfungsi (tidak crash / blank)
      await expect(page.getByRole("main")).toBeVisible();
      await expect(searchInput).toHaveValue(payload);

      // Payload diperlakukan sebagai teks pencarian biasa: tautologi seperti
      // "' OR '1'='1" TIDAK membuka baris tambahan — hasil ≤ data awal, bukan
      // membocorkan seluruh tabel.
      expect(await barisData.count()).toBeLessThanOrEqual(barisAwal);

      // Tidak ada kebocoran error DB
      expect(await containsSqlError(page)).toBe(false);
    }

    // Sepanjang seluruh payload, server tidak pernah membalas 5xx
    expect(monitor.errors, `Server error: ${monitor.errors.join("; ")}`).toHaveLength(0);

    monitor.stop();
  });
}

// ── TCSQL.3 Form input (submit ke server) ──────────────────────────────────
// Titik yang benar-benar mengirim data ke backend. Nama Kader divalidasi
// (regex menolak tanda kutip & karakter spesial), jadi payload seharusnya
// ditolak sebelum dikirim; kalaupun lolos, harus disimpan sebagai teks literal
// tanpa error SQL dan tanpa 5xx.
test("TCSQL.3 Tambah Kader form resists SQL injection in the name field", async ({ page }) => {
  const monitor = pantauServerError(page);

  await page.goto(BASE_URL);
  await loginBAPPEDA({
    NIK: credentials.superAdmin.NIK,
    page,
    password: credentials.superAdmin.password,
  });
  await expect(page).toHaveURL(/dashboard/);

  await clickThink(page.getByRole("link", { name: "Kader", exact: true }));
  await expect(page.getByText(/memuat data kader/i)).toBeHidden({ timeout: LOAD_TIME });

  await clickThink(page.getByRole("button", { name: "Tambah Kader Baru", exact: true }));
  await expect(page.getByRole("heading", { name: "Tambah Kader Baru" })).toBeVisible();

  // Isi form dengan data valid dulu, lalu ganti Nama Kader dengan payload SQLi
  const kaderData = {
    OPD: "Opd Demo",
    "NAMA KADER": "'; DROP TABLE kader; --",
    DESKRIPSI: "Uji keamanan SQL injection",
    PIC: "Budi Santoso",
    "NIK PIC": "3201000000009999",
    "NO HP": "081200000099",
    "ALAMAT PIC": "Jl. Uji Keamanan No. 1, Yogyakarta",
    "KELURAHAN PIC": "Bausasran",
    KEMANTREN: "Danurejan",
  };
  const form = fillKaderForm({ data: kaderData, isSuperAdmin: true, page });
  await form.fillAll();
  await form.submit({ expectClose: false });

  // Payload ditolak sebagai teks: validasi nama menolaknya (pesan aplikasi),
  // BUKAN error SQL, dan server tidak jebol.
  await expect(
    page.getByText(/nama kader tidak boleh mengandung angka atau karakter spesial/i),
  ).toBeVisible();
  expect(await containsSqlError(page)).toBe(false);
  expect(monitor.errors, `Server error: ${monitor.errors.join("; ")}`).toHaveLength(0);

  // Tidak ada notifikasi berhasil — payload tidak tersimpan
  await expect(page.getByText(/berhasil|success/i)).toBeHidden();

  monitor.stop();
});

// ── TCSQL.4 Manipulasi URL / route param ───────────────────────────────────
// Memastikan payload pada path URL tidak memicu error server dan tetap
// diarahkan secara wajar (login/unauthorized/not found), bukan crash.
test("TCSQL.4 SQL injection in the URL path is handled safely", async ({ page }) => {
  const monitor = pantauServerError(page);

  await page.goto(`${BASE_URL}data-relawan/${encodeURIComponent("1 OR 1=1")}`);
  await expect(page.locator("body")).toBeVisible();

  // Diarahkan ke login (guest) atau halaman aman lain — tidak menampilkan error DB
  expect(await containsSqlError(page)).toBe(false);
  expect(monitor.errors, `Server error: ${monitor.errors.join("; ")}`).toHaveLength(0);

  monitor.stop();
});
