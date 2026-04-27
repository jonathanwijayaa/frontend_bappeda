import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { credentials } from "@/helpers/credentials.helper";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // await page.goto(`${process.env.URL_APP}/auth/login.spec.ts`);
  // await loginBAPPEDA ({ page })
  await page.goto("https://frontend-bappeda.vercel.app/");
});

// Login Test Scenario
test.describe("Login BAPPEDA", () => {
  test("Super Admin Login", async ({ page }) => {
    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("OPD Login", async ({ page }) => {
    await loginBAPPEDA({
      NIK: credentials.opd.NIK,
      page,
      password: credentials.opd.password,
    });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("Relawan Login", async ({ page }) => {
    await loginBAPPEDA({
      NIK: credentials.relawan.NIK,
      page,
      password: credentials.relawan.password,
    });
    await expect(page).toHaveURL(/profil-relawan/);
  });
});

test.describe("TCL.2 Login with invalid NIK and invalid Password", () => {
  const invalidCredentialCases = [
    {
      nik: "12345",
      password: "123",
      title: "NIK too short and password too short",
    },
    {
      nik: "12345678901234567890",
      password: "abcdef123",
      title: "NIK too long and password random",
    },
    {
      nik: "12345678901ABCDE",
      password: "wrongpass",
      title: "NIK with letters and password with letters",
    },
    {
      nik: "12345!@#$%67890",
      password: "!@#$%^&*",
      title: "NIK with special characters and password special characters",
    },
    {
      nik: "9999999999999999",
      password: "wrongpassword",
      title: "Unregistered NIK and random password",
    },
  ];

  for (const credential of invalidCredentialCases) {
    test(`TCL.2 ${credential.title}`, async ({ page }) => {
      await page.getByRole("textbox", { name: "NIK" }).fill(credential.nik);

      await page.getByRole("textbox", { name: "Password" }).fill(credential.password);

      await page.getByRole("button", { name: "Masuk" }).click();

      await expect(page).not.toHaveURL(/dashboard|profil-relawan/);

      await expect(page.getByText(/error|invalid|salah|tidak ditemukan/i)).toBeVisible();
    });
  }
});
// TCL.3 Login with empty NIK and password
test("TCL.3 Super Admin/OPD/Relawan input empty NIK and password", async ({ page }) => {
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).not.toHaveURL(/dashboard|profil-relawan/);
});
// TCL.4 Unregistered NIK
test("TCL.4 Login with unregistered NIK", async ({ page }) => {
  await page.getByRole("textbox", { name: "NIK" }).fill("1234567890123999");
  await page.getByRole("textbox", { name: "Password" }).fill("rahasia123");

  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByText(/tidak ditemukan|not found/i)).toBeVisible();
});
test.describe("TCL.5 Correct NIK but wrong password", () => {
  const wrongPasswordCases = [
    { nik: credentials.superAdmin.NIK, role: "Super Admin" },
    { nik: credentials.opd.NIK, role: "OPD" },
    { nik: credentials.relawan.NIK, role: "Relawan" },
  ];

  for (const user of wrongPasswordCases) {
    test(`TCL.5 ${user.role} input correct NIK but wrong password`, async ({ page }) => {
      await page.getByRole("textbox", { name: "NIK" }).fill(user.nik);
      await page.getByRole("textbox", { name: "Password" }).fill("wrongpassword");

      await page.getByRole("button", { name: "Masuk" }).click();

      await expect(page).not.toHaveURL(/dashboard|profil-relawan/);
    });
  }
});
test.describe("TCL.6 Wrong NIK but correct password", () => {
  const wrongNIKCases = [
    { password: credentials.superAdmin.password, role: "Super Admin" },
    { password: credentials.opd.password, role: "OPD" },
    { password: credentials.relawan.password, role: "Relawan" },
  ];

  for (const user of wrongNIKCases) {
    test(`TCL.6 ${user.role} input wrong NIK but correct password`, async ({ page }) => {
      await page.getByRole("textbox", { name: "NIK" }).fill("9999999999999999");
      await page.getByRole("textbox", { name: "Password" }).fill(user.password);

      await page.getByRole("button", { name: "Masuk" }).click();

      await expect(page).not.toHaveURL(/dashboard|profil-relawan/);
    });
  }
});
// // TCL.7 Join / Sign Up
// test("TCL.7 User click Join to Sign Up", async ({ page }) => {
//   await page.getByRole("link", { name: /join/i }).click();

//   await expect(page).toHaveURL(/sign-up|register/i);
// });
// TCL.8 Show Password
test("TCL.8 Show password", async ({ page }) => {
  const passwordInput = page.getByRole("textbox", { name: "Password" });

  await passwordInput.fill("rahasia123");

  await page.getByRole("button").filter({ hasText: /^$/ }).click();

  await expect(passwordInput).toHaveAttribute("type", "text");
});

// TCL.9 Forget Password
test("TCL.9 Click forget password", async ({ page }) => {
  await page.getByRole("link", { name: /Lupa Password/i }).click();

  await expect(page).toHaveURL(/forgot|reset/i);
});
