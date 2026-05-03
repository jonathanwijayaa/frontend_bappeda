import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import path from "path";

const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

/* ======================================
   PROFIL — Super Admin & OPD
   URL: /profil
====================================== */
for (const { label, creds } of roles) {
  test.describe(`Profil - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);

      // Akses profil via avatar/nama di kanan atas
      await page.getByRole("button", { name: new RegExp(label, "i") }).click();
      await expect(page).toHaveURL(/profil/);
    });

    // TCP.1 Change Profile Picture
    test(`TCP.1 ${label} changes profile picture`, async ({ page }) => {
      const filePath = path.resolve("src/assets/files/sample_photo.jpg");

      // Klik tombol Ganti
      await page.getByRole("button", { name: /ganti/i }).click();

      const fileInput = page.locator("input[type='file']");
      await fileInput.setInputFiles(filePath);

      await expect(page.getByText(/berhasil|success/i)).toBeVisible();
    });

    // TCP.2-5 Personal Information
    test.describe(`TCP.2-5 ${label} Personal Information`, () => {
      // TCP.2 — Klik edit, verifikasi field editable muncul
      test(`TCP.2 ${label} clicks edit personal information`, async ({ page }) => {
        // Super Admin/OPD — field langsung editable di halaman profil
        await expect(page.getByRole("textbox", { name: /nama lengkap/i })).toBeVisible();
        await expect(page.getByRole("textbox", { name: /no.*telepon|no.*hp/i })).toBeVisible();
      });

      // TCP.3 — Isi form valid lalu simpan
      test(`TCP.3 ${label} fills all edit form personal information`, async ({ page }) => {
        await page.getByRole("textbox", { name: /nama lengkap/i }).fill(faker.person.fullName());

        await page
          .getByRole("textbox", { name: /no.*telepon|no.*hp/i })
          .fill(`08${faker.string.numeric(10)}`);

        await page.getByRole("button", { name: /simpan/i }).click();

        await expect(page.getByText(/berhasil|success/i)).toBeVisible();
      });

      // TCP.4 — Input nomor telepon invalid
      test.describe(`TCP.4 ${label} invalid phone number`, () => {
        const invalidPhoneCases = [
          { title: "Phone with letters", value: "08ABCDE123" },
          { title: "Phone too short", value: "08123" },
          { title: "Phone with special characters", value: "08!@#$%^&*" },
          { title: "Phone too long", value: "081234567890123456789" },
        ];

        for (const phoneCase of invalidPhoneCases) {
          test(`TCP.4 ${phoneCase.title}`, async ({ page }) => {
            await page.getByRole("textbox", { name: /no.*telepon|no.*hp/i }).fill(phoneCase.value);

            await page.getByRole("button", { name: /simpan/i }).click();

            const phoneInput = page.getByRole("textbox", {
              name: /no.*telepon|no.*hp/i,
            });
            const isValid = await phoneInput.evaluate((el: HTMLInputElement) => el.checkValidity());

            expect(isValid).toBe(false);
          });
        }
      });

      // TCP.5 — Cancel edit
      test(`TCP.5 ${label} cancels edit personal information`, async ({ page }) => {
        await page.getByRole("textbox", { name: /nama lengkap/i }).fill("Nama Yang Tidak Disimpan");

        await page.getByRole("button", { name: /batal|cancel/i }).click();

        await expect(page).toHaveURL(/profil/);
        await expect(page.getByText("Nama Yang Tidak Disimpan")).not.toBeVisible();
      });
    });
  });
}

/* ======================================
   PROFIL — Relawan
   URL: /profil-relawan
====================================== */
test.describe("Profil - Relawan", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://frontend-bappeda.vercel.app/");

    await loginBAPPEDA({
      NIK: credentials.relawan.NIK,
      page,
      password: credentials.relawan.password,
    });

    // Relawan langsung redirect ke profil-relawan setelah login
    await expect(page).toHaveURL(/profil-relawan/);
  });

  // TCP.1 Change Profile Picture — Relawan tidak memiliki fitur ini
  // berdasarkan screenshot profil relawan tidak menampilkan tombol Ganti/Hapus foto

  // TCP.2-5 Ajukan Pembaruan Data
  test.describe("TCP.2-5 Relawan Ajukan Pembaruan Data", () => {
    test.beforeEach(async ({ page }) => {
      // Buka modal Ajukan Pembaruan Data
      await page.getByRole("button", { name: /ajukan pembaruan data/i }).click();

      await expect(page.getByRole("heading", { name: /ajukan pembaruan data/i })).toBeVisible();
    });

    // TCP.2 — Modal form tampil dengan field yang bisa diisi
    test("TCP.2 Relawan clicks Ajukan Pembaruan Data button", async ({ page }) => {
      await expect(page.getByRole("textbox", { name: /nama lengkap baru/i })).toBeVisible();
      await expect(page.getByRole("combobox", { name: /jenis kelamin baru/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /alamat ktp baru/i })).toBeVisible();
    });

    // TCP.3 — Isi semua field form pembaruan
    test("TCP.3 Relawan fills all Ajukan Pembaruan Data form", async ({ page }) => {
      await page.getByRole("textbox", { name: /nama lengkap baru/i }).fill(faker.person.fullName());

      await page.getByRole("combobox", { name: /jenis kelamin baru/i }).selectOption("L");

      await page
        .getByRole("textbox", { name: /alamat ktp baru/i })
        .fill(faker.location.streetAddress() + ", Yogyakarta");

      await page.getByRole("textbox", { name: /kelurahan baru/i }).fill(faker.location.city());

      await page
        .getByRole("textbox", { name: /no.*hp baru|telepon baru/i })
        .fill(`08${faker.string.numeric(10)}`);

      await page.getByRole("button", { name: /kirim|ajukan|simpan/i }).click();

      await expect(page.getByText(/berhasil|menunggu review|success/i)).toBeVisible();
    });

    // TCP.4 — Input nomor telepon invalid
    test.describe("TCP.4 Relawan invalid phone number", () => {
      const invalidPhoneCases = [
        { title: "Phone with letters", value: "08ABCDE123" },
        { title: "Phone too short", value: "08123" },
        { title: "Phone with special characters", value: "08!@#$%^&*" },
        { title: "Phone too long", value: "081234567890123456789" },
      ];

      for (const phoneCase of invalidPhoneCases) {
        test(`TCP.4 ${phoneCase.title}`, async ({ page }) => {
          await page
            .getByRole("textbox", { name: /no.*hp baru|telepon baru/i })
            .fill(phoneCase.value);

          await page.getByRole("button", { name: /kirim|ajukan|simpan/i }).click();

          const phoneInput = page.getByRole("textbox", {
            name: /no.*hp baru|telepon baru/i,
          });
          const isValid = await phoneInput.evaluate((el: HTMLInputElement) => el.checkValidity());

          expect(isValid).toBe(false);
        });
      }
    });

    // TCP.5 — Cancel / tutup modal
    test("TCP.5 Relawan cancels Ajukan Pembaruan Data", async ({ page }) => {
      await page
        .getByRole("textbox", { name: /nama lengkap baru/i })
        .fill("Nama Yang Tidak Disimpan");

      // Tutup modal via tombol X
      await page.getByRole("button", { name: /close|tutup/i }).click();

      await expect(page.getByRole("heading", { name: /ajukan pembaruan data/i })).not.toBeVisible();
      await expect(page).toHaveURL(/profil-relawan/);
    });
  });
});
