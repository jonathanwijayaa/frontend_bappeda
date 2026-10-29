import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink } from "@/helpers/timing.helper";
import { expect, Page, test } from "@playwright/test";

const BASE_URL = "https://frontend-bappeda.vercel.app/";

// ── Locator ──────────────────────────────────────────────────────────────
const nikField = (page: Page) => page.getByRole("textbox", { name: "NIK" });
const passwordField = (page: Page) => page.getByRole("textbox", { name: "Password" });
const masukButton = (page: Page) => page.getByRole("button", { name: "Masuk" });

// Pesan error login dirender sebagai satu blok teks di atas tombol Masuk.
// Pesannya berasal dari server ("NIK tidak ditemukan", "Password salah!"),
// kecuali validasi kosong yang dilakukan di aplikasi.
const pesanError = (page: Page, teks: string | RegExp) =>
  page.getByText(teks, { exact: typeof teks === "string" });

// Tombol mata tidak punya teks; letaknya tepat setelah input password
const togglePasswordButton = (page: Page) =>
  page.locator('xpath=//input[@id="password"]/following-sibling::button[1]');

// Tombol avatar di header (Super Admin & OPD) — lihat catatan di profil.spec.ts
const avatarButton = (page: Page) =>
  page.locator("xpath=//h1/parent::div/following-sibling::div[1]//button").first();

const isiLogin = async (page: Page, nik: string, password: string) => {
  await fillThink(nikField(page), nik);
  await fillThink(passwordField(page), password);
  await clickThink(masukButton(page));
};

const tetapDiHalamanLogin = async (page: Page) => {
  await expect(page).not.toHaveURL(/dashboard|profil-relawan/);
  await expect(masukButton(page)).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(nikField(page)).toBeVisible();
});

// TCL.0 Akses website
test("TCL.0 Super Admin/OPD/Relawan access Website", async ({ page }) => {
  const response = await page.goto(BASE_URL);

  // Website dapat dijangkau dan halaman awalnya adalah form login
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Selamat Datang" })).toBeVisible();
  await expect(nikField(page)).toBeVisible();
  await expect(passwordField(page)).toBeVisible();
  await expect(masukButton(page)).toBeVisible();
});

// TCL.1 Login dengan kredensial valid
test.describe("TCL.1 Login BAPPEDA", () => {
  const validCases = [
    { creds: credentials.superAdmin, label: "Super Admin", tujuan: /dashboard/ },
    { creds: credentials.opd, label: "OPD", tujuan: /dashboard/ },
    // Relawan tidak punya dashboard; langsung ke halaman profilnya
    { creds: credentials.relawan, label: "Relawan", tujuan: /profil-relawan/ },
  ];

  for (const kasus of validCases) {
    test(`TCL.1 ${kasus.label} Login`, async ({ page }) => {
      await loginBAPPEDA({ NIK: kasus.creds.NIK, page, password: kasus.creds.password });

      await expect(page).toHaveURL(kasus.tujuan);
    });
  }
});

// TCL.2 NIK dan password tidak valid
test.describe("TCL.2 Login with invalid NIK and invalid Password", () => {
  // Field NIK membuang karakter non-angka saat diketik dan dibatasi 16 digit,
  // jadi yang sampai ke server adalah hasil saringannya (kolom `nilaiInput`).
  const invalidCredentialCases = [
    {
      nik: "12345",
      nilaiInput: "12345",
      password: "123",
      title: "NIK too short and password too short",
    },
    {
      nik: "12345678901234567890",
      nilaiInput: "1234567890123456",
      password: "abcdef123",
      title: "NIK too long and password random",
    },
    {
      nik: "12345678901ABCDE",
      nilaiInput: "12345678901",
      password: "wrongpass",
      title: "NIK with letters and password with letters",
    },
    {
      nik: "12345!@#$%67890",
      nilaiInput: "1234567890",
      password: "!@#$%^&*",
      title: "NIK with special characters and password special characters",
    },
    {
      nik: "9999999999999999",
      nilaiInput: "9999999999999999",
      password: "wrongpassword",
      title: "Unregistered NIK and random password",
    },
  ];

  for (const credential of invalidCredentialCases) {
    test(`TCL.2 ${credential.title}`, async ({ page }) => {
      await fillThink(nikField(page), credential.nik);
      await expect(nikField(page)).toHaveValue(credential.nilaiInput);

      await fillThink(passwordField(page), credential.password);
      await clickThink(masukButton(page));

      await expect(pesanError(page, "NIK tidak ditemukan")).toBeVisible();
      await tetapDiHalamanLogin(page);
    });
  }
});

// TCL.3 Field kosong
test.describe("TCL.3 Login with empty fields", () => {
  const emptyCases = [
    { nik: "", password: "", title: "empty NIK and password" },
    { nik: credentials.superAdmin.NIK, password: "", title: "empty password" },
    { nik: "", password: credentials.superAdmin.password, title: "empty NIK" },
  ];

  for (const kasus of emptyCases) {
    test(`TCL.3 Super Admin/OPD/Relawan input ${kasus.title}`, async ({ page }) => {
      await isiLogin(page, kasus.nik, kasus.password);

      // Ditolak aplikasi sebelum request dikirim ke server
      await expect(pesanError(page, "NIK dan Password harus diisi")).toBeVisible();
      await tetapDiHalamanLogin(page);
    });
  }
});

// TCL.4 NIK tidak terdaftar
test("TCL.4 Login with unregistered NIK", async ({ page }) => {
  await isiLogin(page, "1234567890123999", "rahasia123");

  await expect(pesanError(page, "NIK tidak ditemukan")).toBeVisible();
  await tetapDiHalamanLogin(page);
});

// TCL.5 NIK benar, password salah
test.describe("TCL.5 Correct NIK but wrong password", () => {
  const wrongPasswordCases = [
    { nik: credentials.superAdmin.NIK, role: "Super Admin" },
    { nik: credentials.opd.NIK, role: "OPD" },
    { nik: credentials.relawan.NIK, role: "Relawan" },
  ];

  for (const user of wrongPasswordCases) {
    test(`TCL.5 ${user.role} input correct NIK but wrong password`, async ({ page }) => {
      await isiLogin(page, user.nik, "wrongpassword");

      await expect(pesanError(page, "Password salah!")).toBeVisible();
      await tetapDiHalamanLogin(page);
    });
  }
});

// TCL.6 NIK salah, password benar
test.describe("TCL.6 Wrong NIK but correct password", () => {
  const wrongNIKCases = [
    { password: credentials.superAdmin.password, role: "Super Admin" },
    { password: credentials.opd.password, role: "OPD" },
    { password: credentials.relawan.password, role: "Relawan" },
  ];

  for (const user of wrongNIKCases) {
    test(`TCL.6 ${user.role} input wrong NIK but correct password`, async ({ page }) => {
      await isiLogin(page, "9999999999999999", user.password);

      await expect(pesanError(page, "NIK tidak ditemukan")).toBeVisible();
      await tetapDiHalamanLogin(page);
    });
  }
});

// TCL.7 Join / Sign Up
// TIDAK ADA DI APLIKASI: halaman login tidak punya tautan pendaftaran; akun
// dibuat oleh Super Admin / OPD. Test case dinonaktifkan sampai fiturnya ada.

// TCL.8 Show / hide password
test("TCL.8 Show password", async ({ page }) => {
  await fillThink(passwordField(page), "rahasia123");
  await expect(passwordField(page)).toHaveAttribute("type", "password");

  await clickThink(togglePasswordButton(page));
  await expect(passwordField(page)).toHaveAttribute("type", "text");
  await expect(passwordField(page)).toHaveValue("rahasia123");

  // Klik kedua menyembunyikan lagi
  await clickThink(togglePasswordButton(page));
  await expect(passwordField(page)).toHaveAttribute("type", "password");
});

// TCL.9 Lupa password
test("TCL.9 Click forget password", async ({ page }) => {
  await clickThink(page.getByRole("link", { name: /lupa password/i }));

  // Tautannya masih href="#" dengan preventDefault(), jadi belum membawa ke
  // mana pun. Dilewati dengan alasan jelas sampai alur reset password dibuat.
  test.skip(
    /\/login$|\/$/.test(new URL(page.url()).pathname),
    'Tautan "Lupa Password ?" belum mengarah ke halaman apa pun (href="#" di Login.tsx)',
  );

  await expect(page).toHaveURL(/forgot|reset|lupa/i);
});

// TCL.10 Field NIK hanya menerima angka
test("TCL.10 NIK field only accepts up to 16 digits", async ({ page }) => {
  await fillThink(nikField(page), "abc-12 34!@#56");
  await expect(nikField(page)).toHaveValue("123456");

  await fillThink(nikField(page), "1".repeat(20));
  await expect(nikField(page)).toHaveValue("1".repeat(16));
});

// TCL.11 Pesan sesi berakhir
test("TCL.11 Login page shows the session expired message", async ({ page }) => {
  // Aplikasi mengarahkan ke /login?expired=... saat token kedaluwarsa
  await page.goto(`${BASE_URL}login?expired=1`);

  await expect(pesanError(page, "Sesi Anda telah berakhir. Silakan masuk kembali.")).toBeVisible();
});

// TCL.12 Halaman terproteksi tanpa login
test.describe("TCL.12 Protected pages require login", () => {
  for (const rute of ["dashboard", "data-relawan", "profil", "profil-relawan"]) {
    test(`TCL.12 Guest opening /${rute} is redirected to login`, async ({ page }) => {
      await page.goto(`${BASE_URL}${rute}`);

      await expect(page).toHaveURL(/\/login/);
      await expect(masukButton(page)).toBeVisible();
    });
  }
});

// TCL.13 Pengguna yang sudah login tidak kembali ke halaman login
test("TCL.13 Logged-in user opening the login page is redirected", async ({ page }) => {
  await loginBAPPEDA({
    NIK: credentials.opd.NIK,
    page,
    password: credentials.opd.password,
  });
  await expect(page).toHaveURL(/dashboard/);

  await page.goto(`${BASE_URL}login`);

  await expect(page).toHaveURL(/dashboard/);
  await expect(masukButton(page)).toBeHidden();
});

// TCL.14 Logout
test.describe("TCL.14 Logout", () => {
  const adminCases = [
    { creds: credentials.superAdmin, label: "Super Admin" },
    { creds: credentials.opd, label: "OPD" },
  ];

  for (const kasus of adminCases) {
    test(`TCL.14 ${kasus.label} logs out from the header menu`, async ({ page }) => {
      await loginBAPPEDA({ NIK: kasus.creds.NIK, page, password: kasus.creds.password });
      await expect(page).toHaveURL(/dashboard/);

      await clickThink(avatarButton(page));
      await clickThink(page.getByRole("button", { name: "Keluar" }));

      await expect(page).toHaveURL(/\/login/);

      // Sesi benar-benar berakhir: kembali ke halaman sebelumnya tetap ditolak
      await page.goBack();
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("TCL.14 Relawan logs out from the side menu", async ({ page }) => {
    await loginBAPPEDA({
      NIK: credentials.relawan.NIK,
      page,
      password: credentials.relawan.password,
    });
    await expect(page).toHaveURL(/profil-relawan/);

    await clickThink(page.getByRole("button", { name: "Menu", exact: true }));
    await clickThink(page.getByRole("button", { name: "Keluar" }));

    await expect(page).toHaveURL(/\/login/);

    await page.goto(`${BASE_URL}profil-relawan`);
    await expect(page).toHaveURL(/\/login/);
  });
});
