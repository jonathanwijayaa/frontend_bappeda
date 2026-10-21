import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink, LOAD_TIME } from "@/helpers/timing.helper";
import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";

// Kartu Hotline dan form "Kirim Saran" hanya ada pada tampilan OPD & Relawan.
// Super Admin mendapat tampilan pengelolaan (ubah info hotline + balas saran),
// jadi TCSH.1-4 dijalankan untuk kedua role di bawah ini saja.
const roles = [
  { label: "OPD", creds: credentials.opd, menu: "sidebar" },
  { label: "Relawan", creds: credentials.relawan, menu: "hamburger" },
] as const;

async function navigateToSaranHotline(page: Page, menu: "sidebar" | "hamburger") {
  if (menu === "hamburger") {
    // Relawan memakai menu hamburger, dan item menunya berupa <button>, bukan <a>
    await clickThink(page.getByRole("button", { name: "Menu", exact: true }));
    await clickThink(page.getByRole("button", { name: /saran.*hotline/i }));
  } else {
    await clickThink(page.getByRole("link", { name: /saran.*hotline/i }));
  }

  await expect(page).toHaveURL(/saran-hotline/);
}

// Nilai kontak pada kartu Hotline: <p>Telepon</p> diikuti elemen berisi nomornya.
// Dicari lewat struktur supaya tidak bergantung pada nomor yang tersimpan di database.
const hotlineValue = (page: Page, label: string) =>
  page.locator(`xpath=//p[normalize-space(text())="${label}"]/following-sibling::*[1]`).first();

// Field pada form Kirim Saran
const namaField = (page: Page) => page.getByPlaceholder("Nama Lengkap");
const teleponField = (page: Page) => page.getByPlaceholder("No. Telepon");
const saranField = (page: Page) => page.getByPlaceholder(/tuliskan saran atau kendala/i);
// exact: true supaya tidak tertukar dengan tab "Kirim Saran & Hotline"
const kirimSaranButton = (page: Page) =>
  page.getByRole("button", { name: "Kirim Saran", exact: true });

for (const { label, creds, menu } of roles) {
  test.describe(`Saran/Hotline - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard|profil-relawan/);
      await navigateToSaranHotline(page, menu);

      // Nama & No. Telepon diisi otomatis dari profil, tetapi data profilnya
      // bisa datang belakangan dan mengisi ulang field yang sedang kosong
      // (`prev.noTelepon || autoNoHp`). Kalau test mengosongkan field sebelum
      // itu, isiannya tertimpa lagi dan saran malah terkirim. Jadi ditunggu
      // sampai prefill selesai — kedua akun uji punya nomor HP di profilnya.
      await expect(teleponField(page)).not.toHaveValue("", { timeout: LOAD_TIME });
    });

    // TCSH.1-2 Hotline
    test.describe(`TCSH.1-2 ${label} Hotline`, () => {
      test(`TCSH.1 ${label} clicks the telephone number hyperlink`, async ({ page }) => {
        const telLink = hotlineValue(page, "Telepon");

        await expect(telLink).toBeVisible();
        expect((await telLink.innerText()).trim()).not.toBe("");

        await expect(telLink).toHaveAttribute("href", /^tel:/);
      });

      test(`TCSH.2 ${label} clicks the WhatsApp number hyperlink`, async ({ page }) => {
        const waLink = hotlineValue(page, "WhatsApp");

        await expect(waLink).toBeVisible();
        expect((await waLink.innerText()).trim()).not.toBe("");

        await expect(waLink).toHaveAttribute(
          "href",
          /^(https:\/\/wa\.me|https:\/\/api\.whatsapp\.com|whatsapp:)/,
        );
      });
    });

    // TCSH.3-4 Kirim Saran Form
    test.describe(`TCSH.3-4 ${label} Kirim Saran Form`, () => {
      test(`TCSH.3 ${label} fills out the suggestion form and submits it`, async ({ page }) => {
        await fillThink(
          namaField(page),
          faker.person
            .fullName()
            .replace(/[^a-zA-Z\s]/g, "")
            .trim(),
        );
        await fillThink(teleponField(page), `08${faker.string.numeric(10)}`);
        await fillThink(saranField(page), faker.lorem.sentences(2));

        await clickThink(kirimSaranButton(page));

        await expect(page.getByText(/berhasil|terima kasih|success/i)).toBeVisible();
      });

      test.describe(`TCSH.4 ${label} enters invalid phone number`, () => {
        // Input nomor telepon tidak memakai constraint HTML (tanpa required/pattern),
        // validasinya dilakukan aplikasi saat submit dan ditampilkan sebagai notifikasi
        const invalidPhoneCases = [
          {
            title: "Empty phone number",
            value: "",
            expectedMessage: /nomor telepon wajib diisi/i,
          },
          {
            title: "Phone number too short",
            value: "08123",
            expectedMessage: /nomor telepon tidak valid/i,
          },
          {
            title: "Phone number with letters",
            value: "08ABCDE123",
            expectedMessage: /nomor telepon tidak valid/i,
          },
          {
            title: "Phone number with special characters",
            value: "08!@#$%^&*",
            expectedMessage: /nomor telepon tidak valid/i,
          },
          {
            title: "Phone number too long",
            value: "081234567890123456789",
            expectedMessage: /nomor telepon tidak valid/i,
          },
        ];

        for (const phoneCase of invalidPhoneCases) {
          test(`TCSH.4 ${phoneCase.title}`, async ({ page }) => {
            await fillThink(
              namaField(page),
              faker.person
                .fullName()
                .replace(/[^a-zA-Z\s]/g, "")
                .trim(),
            );
            await fillThink(teleponField(page), phoneCase.value);
            await fillThink(saranField(page), faker.lorem.sentence());

            await clickThink(kirimSaranButton(page));

            await expect(page.getByText(phoneCase.expectedMessage)).toBeVisible();
            // Saran tidak boleh ikut terkirim saat nomor telepon tidak valid
            await expect(page.getByText(/berhasil|terima kasih/i)).toBeHidden();
          });
        }
      });
    });
  });
}

// Super Admin tidak punya form Kirim Saran; halamannya untuk mengelola info
// hotline (yang dipakai role lain) dan membalas saran yang masuk.
test.describe("Saran/Hotline - Super Admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://frontend-bappeda.vercel.app/");

    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });

    await expect(page).toHaveURL(/dashboard/);
    await navigateToSaranHotline(page, "sidebar");
  });

  // TCSH.1-2 versi Super Admin: info hotline yang tampil di role lain dikelola di sini
  test("TCSH.1-2 Super Admin views the Hotline information", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /informasi hotline/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /ubah|edit/i }).first()).toBeVisible();
  });

  // Super Admin menerima saran, bukan mengirimnya
  test("TCSH.3-4 Super Admin manages incoming Saran", async ({ page }) => {
    await expect(page.getByPlaceholder(/cari nama, telepon, atau pesan/i)).toBeVisible();
    await expect(kirimSaranButton(page)).toBeHidden();
  });
});
