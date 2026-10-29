import type { Page } from "@playwright/test";

import { clickThink, fillThink, waitLoaded } from "@/helpers/timing.helper";

interface ILoginBAPPEDA {
  NIK: string;
  page: Page;
  password: string;
}

export const loginBAPPEDA = async ({ NIK, page, password }: ILoginBAPPEDA) => {
  const nikField = page.getByRole("textbox", { name: "NIK" });
  await waitLoaded(nikField, "form login tampil");

  await fillThink(nikField, NIK);
  await fillThink(page.getByRole("textbox", { name: "Password" }), password);

  // Tombol "Masuk" nonaktif selama request login sebelumnya diproses. Dulu klik
  // dilewati diam-diam bila tombolnya nonaktif, sehingga test gagal jauh di
  // langkah berikutnya tanpa jejak; sekarang ditunggu sampai aktif lalu diklik.
  const loginButton = page.getByRole("button", { name: "Masuk" });
  await waitLoaded(loginButton, 'tombol "Masuk" aktif', "enabled");
  await clickThink(loginButton);
};
