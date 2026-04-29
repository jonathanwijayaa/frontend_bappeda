import { generateOPDExcel } from "@/helpers/baseExcel.helper";
import { credentials } from "@/helpers/credentials.helper";
import { buildKaderData, fillKaderForm } from "@/helpers/formKader.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("https://frontend-bappeda.vercel.app/");

  await loginBAPPEDA({
    NIK: credentials.superAdmin.NIK,
    page,
    password: credentials.superAdmin.password,
  });

  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("link", { name: /daftar kader/i }).click();
});
