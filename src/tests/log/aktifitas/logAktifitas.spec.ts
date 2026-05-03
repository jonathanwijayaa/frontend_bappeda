import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, test } from "@playwright/test";

test.describe("Log Aktifitas - Super Admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://frontend-bappeda.vercel.app/");

    await loginBAPPEDA({
      NIK: credentials.superAdmin.NIK,
      page,
      password: credentials.superAdmin.password,
    });

    await expect(page).toHaveURL(/dashboard/);
    await page.getByRole("link", { name: /log.*aktifitas/i }).click();
    await expect(page).toHaveURL(/log-aktifitas/);
  });

  // TCLA.1-3 Filter & Sort
  test.describe("TCLA.1-3 Super Admin Filter & Sort", () => {
    // TCLA.1
    test("TCLA.1 Super Admin filters data by time period", async ({ page }) => {
      await page.getByRole("combobox").first().selectOption({ index: 1 });

      await expect(page.getByRole("table")).toBeVisible();
      await expect(page.getByText(/menampilkan/i)).toBeVisible();
    });

    // TCLA.2
    test("TCLA.2 Super Admin filters data by activity type", async ({ page }) => {
      const activityTypes = ["INSERT", "UPDATE", "DELETE"];

      for (const activity of activityTypes) {
        await page.getByRole("combobox").first().selectOption({ label: activity });

        await expect(page.getByRole("table")).toBeVisible();
      }
    });

    // TCLA.3
    test("TCLA.3 Super Admin filters data by user subject", async ({ page }) => {
      await page.getByRole("combobox").nth(1).selectOption({ index: 1 });

      await expect(page.getByRole("table")).toBeVisible();
      await expect(page.getByText(/menampilkan/i)).toBeVisible();
    });
  });

  // TCLA.4-9 Search Bar
  test.describe("TCLA.4-9 Super Admin Search Bar", () => {
    const searchCases = [
      { id: "TCLA.4", title: "input keyword in search bar", keyword: "Super Admin" },
      { id: "TCLA.5", title: "input with upper case", keyword: "SUPER ADMIN" },
      { id: "TCLA.6", title: "input with lower case", keyword: "super admin" },
      { id: "TCLA.7", title: "input with specific word", keyword: "INSERT" },
      { id: "TCLA.8", title: "input with random keyword", keyword: "xqz99randomkeyword" },
      { id: "TCLA.9", title: "input with special characters", keyword: "@#$%^&*()" },
    ];

    for (const searchCase of searchCases) {
      test(`${searchCase.id} Super Admin ${searchCase.title}`, async ({ page }) => {
        await page.getByPlaceholder(/cari/i).fill(searchCase.keyword);
        await page.getByPlaceholder(/cari/i).press("Enter");

        if (["TCLA.8", "TCLA.9"].includes(searchCase.id)) {
          await expect(page.getByText(/tidak ada data|no data|0 log/i)).toBeVisible();
        } else {
          await expect(page.getByRole("table")).toBeVisible();
        }
      });
    }
  });

  // TCLA.10 Export Log Table
  test("TCLA.10 Super Admin exports the Log table", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /export/i }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/log|aktifitas/i);
  });

  // TCLA.11 Navigate to Log Table
  test("TCLA.11 Super Admin navigates to the Log Aktivitas table", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /log aktivitas/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText(/menampilkan/i)).toBeVisible();
  });
});
