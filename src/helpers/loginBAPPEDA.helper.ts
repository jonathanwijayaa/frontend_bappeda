import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

interface ILoginBAPPEDA {
  NIK: string;
  page: Page;
  password: string;
}

export const loginBAPPEDA = async ({ NIK, page, password }: ILoginBAPPEDA) => {
  await page.getByRole("textbox", { name: "NIK" }).fill(NIK);
  await page.getByRole("textbox", { name: "Password" }).fill(password);

  // Tombol "Masuk" nonaktif selama request login sebelumnya diproses. Dulu klik
  // dilewati diam-diam bila tombolnya nonaktif, sehingga test gagal jauh di
  // langkah berikutnya tanpa jejak; sekarang ditunggu sampai aktif lalu diklik.
  const loginButton = page.getByRole("button", { name: "Masuk" });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
};
