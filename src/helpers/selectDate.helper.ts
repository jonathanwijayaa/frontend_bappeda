/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { format } from "date-fns";

export interface DateSelector {
  page: Page;
  targetDate: Date;
}

export interface IDateHelper {
  assertInvalidDate(selector: DateSelector): Promise<void>;
  selectDate(selector: DateSelector): Promise<void>;
}

export const DateHelper: IDateHelper = {
  async assertInvalidDate({ page, targetDate }: DateSelector) {
    const targetDay = format(targetDate, "d");
    const pastDate = page.getByRole("button", { exact: true, name: targetDay });
    await expect(pastDate).toBeDisabled();
  },

  async selectDate({ page, targetDate }: DateSelector) {
    const targetMonth = format(targetDate, "MMMM yyyy");
    const targetDay = format(targetDate, "d");

    await page.getByText("Departure Date").first().click();
    // Loop sampai bulan di kalender sesuai
    while (true) {
      const calendarHeader = await page
        .getByRole("paragraph")
        .filter({ hasText: /^[A-Za-z]+\s\d{4}$/ })
        .first()
        .innerText();

      if (calendarHeader.trim() === targetMonth) break;
      await page.getByRole("button").filter({ hasText: /^$/ }).nth(1).click();
    }

    // Klik tanggal
    await page.getByRole("button", { exact: true, name: targetDay }).click();
    // Apply filter
    await page.getByRole("button", { name: "Apply" }).click();

    // Verifikasi hasil
    await expect(page.getByText(format(targetDate, "MMMM dd, yyyy"))).toBeVisible();
  },
};
