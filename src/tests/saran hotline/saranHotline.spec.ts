import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

const roles = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

async function navigateToSaranHotline(page: any, role: "sidebar" | "hamburger") {
  if (role === "hamburger") {
    // Relawan — hamburger menu di kanan atas
    await page.getByRole("button", { name: /menu|hamburger/i }).click();
    await page.getByRole("link", { name: /saran.*hotline/i }).click();
  } else {
    // Super Admin & OPD — sidebar kiri
    await page.getByRole("link", { name: /saran.*hotline/i }).click();
  }
  await expect(page).toHaveURL(/saran-hotline/);
}

for (const { label, creds } of roles) {
  test.describe(`Saran/Hotline - ${label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: creds.NIK,
        page,
        password: creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await navigateToSaranHotline(page, "sidebar");
    });

    // TCSH.1-2 Hotline
    test.describe(`TCSH.1-2 ${label} Hotline`, () => {
      test(`TCSH.1 ${label} clicks the telephone number hyperlink`, async ({ page }) => {
        const telLink = page.getByRole("link", { name: /0274/i });

        await expect(telLink).toBeVisible();

        const href = await telLink.getAttribute("href");
        expect(href).toMatch(/^tel:/);
      });

      test(`TCSH.2 ${label} clicks the WhatsApp number hyperlink`, async ({ page }) => {
        const waLink = page.getByRole("link", { name: /\+62 812/i });

        await expect(waLink).toBeVisible();

        const href = await waLink.getAttribute("href");
        expect(href).toMatch(/^(https:\/\/wa\.me|https:\/\/api\.whatsapp\.com|whatsapp:)/);
      });
    });

    // TCSH.3-4 Kirim Saran Form
    test.describe(`TCSH.3-4 ${label} Kirim Saran Form`, () => {
      test(`TCSH.3 ${label} fills out the suggestion form and submits it`, async ({ page }) => {
        await page.getByRole("textbox").nth(0).fill(creds.NIK);
        await page
          .getByRole("textbox")
          .nth(1)
          .fill(`08${faker.string.numeric(10)}`);
        await page.getByPlaceholder(/tuliskan saran atau kendala/i).fill(faker.lorem.sentences(2));

        await page.getByRole("button", { name: /kirim saran/i }).click();

        await expect(page.getByText(/berhasil|terima kasih|success/i)).toBeVisible();
      });

      test.describe(`TCSH.4 ${label} enters invalid phone number`, () => {
        const invalidPhoneCases = [
          { title: "Empty phone number", value: "" },
          { title: "Phone number too short", value: "08123" },
          { title: "Phone number with letters", value: "08ABCDE123" },
          { title: "Phone number with special characters", value: "08!@#$%^&*" },
          { title: "Phone number too long", value: "081234567890123456789" },
        ];

        for (const phoneCase of invalidPhoneCases) {
          test(`TCSH.4 ${phoneCase.title}`, async ({ page }) => {
            await page.getByRole("textbox").nth(0).fill(creds.NIK);
            await page.getByRole("textbox").nth(1).fill(phoneCase.value);
            await page
              .getByPlaceholder(/tuliskan saran atau kendala/i)
              .fill(faker.lorem.sentence());

            await page.getByRole("button", { name: /kirim saran/i }).click();

            const phoneInput = page.getByRole("textbox").nth(1);
            const isValid = await phoneInput.evaluate((el: HTMLInputElement) => el.checkValidity());

            expect(isValid).toBe(false);
          });
        }
      });
    });
  });
}

test.describe("Saran/Hotline - Relawan", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://frontend-bappeda.vercel.app/");

    await loginBAPPEDA({
      NIK: credentials.relawan.NIK,
      page,
      password: credentials.relawan.password,
    });

    await expect(page).toHaveURL(/profil-relawan|dashboard/);

    // Relawan — buka hamburger menu di kanan atas
    await page.locator("button").filter({ hasText: "" }).last().click();
    await page.getByRole("link", { name: /saran.*hotline/i }).click();
    await expect(page).toHaveURL(/saran-hotline/);
  });

  // TCSH.1-2 Hotline
  test.describe("TCSH.1-2 Relawan Hotline", () => {
    test("TCSH.1 Relawan clicks the telephone number hyperlink", async ({ page }) => {
      const telLink = page.getByRole("link", { name: /0274/i });

      await expect(telLink).toBeVisible();

      const href = await telLink.getAttribute("href");
      expect(href).toMatch(/^tel:/);
    });

    test("TCSH.2 Relawan clicks the WhatsApp number hyperlink", async ({ page }) => {
      const waLink = page.getByRole("link", { name: /\+62 812/i });

      await expect(waLink).toBeVisible();

      const href = await waLink.getAttribute("href");
      expect(href).toMatch(/^(https:\/\/wa\.me|https:\/\/api\.whatsapp\.com|whatsapp:)/);
    });
  });

  // TCSH.3-4 Kirim Saran Form
  test.describe("TCSH.3-4 Relawan Kirim Saran Form", () => {
    test("TCSH.3 Relawan fills out the suggestion form and submits it", async ({ page }) => {
      await page.getByRole("textbox").nth(0).fill(credentials.relawan.NIK);
      await page
        .getByRole("textbox")
        .nth(1)
        .fill(`08${faker.string.numeric(10)}`);
      await page.getByPlaceholder(/tuliskan saran atau kendala/i).fill(faker.lorem.sentences(2));

      await page.getByRole("button", { name: /kirim saran/i }).click();

      await expect(page.getByText(/berhasil|terima kasih|success/i)).toBeVisible();
    });

    test.describe("TCSH.4 Relawan enters invalid phone number", () => {
      const invalidPhoneCases = [
        { title: "Empty phone number", value: "" },
        { title: "Phone number too short", value: "08123" },
        { title: "Phone number with letters", value: "08ABCDE123" },
        { title: "Phone number with special characters", value: "08!@#$%^&*" },
        { title: "Phone number too long", value: "081234567890123456789" },
      ];

      for (const phoneCase of invalidPhoneCases) {
        test(`TCSH.4 ${phoneCase.title}`, async ({ page }) => {
          await page.getByRole("textbox").nth(0).fill(credentials.relawan.NIK);
          await page.getByRole("textbox").nth(1).fill(phoneCase.value);
          await page.getByPlaceholder(/tuliskan saran atau kendala/i).fill(faker.lorem.sentence());

          await page.getByRole("button", { name: /kirim saran/i }).click();

          const phoneInput = page.getByRole("textbox").nth(1);
          const isValid = await phoneInput.evaluate((el: HTMLInputElement) => el.checkValidity());

          expect(isValid).toBe(false);
        });
      }
    });
  });
});
