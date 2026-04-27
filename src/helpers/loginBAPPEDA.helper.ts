import type { Page } from "@playwright/test";

interface ILoginBAPPEDA {
  NIK: string;
  page: Page;
  password: string;
}

export const loginBAPPEDA = async ({ NIK, page, password }: ILoginBAPPEDA) => {
  await page.getByRole("textbox", { name: "NIK" }).fill(NIK);
  await page.getByRole("textbox", { name: "Password" }).fill(password);

  const loginButton = page.getByRole("button", { name: "Masuk" });

  if (await loginButton.isEnabled()) {
    await loginButton.click();
  }
};
