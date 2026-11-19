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

  const loginButton = page.getByRole("button", { name: "Masuk" });
  await waitLoaded(loginButton, 'tombol "Masuk" aktif', "enabled");
  await clickThink(loginButton);
};
