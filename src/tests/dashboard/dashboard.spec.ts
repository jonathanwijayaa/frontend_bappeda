import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, Locator, Page, test } from "@playwright/test";

// Dashboard hanya tersedia untuk Super Admin dan OPD.
// Relawan diarahkan ke /profil-relawan setelah login, sehingga tidak diuji di sini.
const roles = [
  {
    label: "Super Admin",
    creds: credentials.superAdmin,
    // Judul grafik utama & kartu baris bawah berbeda per role
    mainChartTitle: /jumlah relawan per opd/i,
    relawanPerKaderTitle: "Jumlah Relawan Per Kader",
    kaderTitle: "Jumlah Kader Per OPD",
    // Kartu "Total OPD Terdaftar" khusus Super Admin
    hasTotalOpdCard: true,
  },
  {
    label: "OPD",
    creds: credentials.opd,
    mainChartTitle: /jumlah relawan per kader/i,
    // Judul kartu OPD menyertakan nama instansinya, mis. "... (Opd Demo)"
    relawanPerKaderTitle: /jumlah relawan per kader \(/i,
    kaderTitle: /jumlah kader \(/i,
    hasTotalOpdCard: false,
  },
] as const;

// ── Locator ──────────────────────────────────────────────────────────────
// Judul kartu dirender sebagai <h3> di header kartu, isinya ada pada <div>
// tepat setelah header. Dicari lewat struktur supaya tidak bergantung class.
const cardBody = (page: Page, title: string) =>
  page
    .locator(
      `xpath=//h3[contains(normalize-space(.), "${title}")]/parent::div/following-sibling::div[1]`,
    )
    .first();

// Grafik utama dikenali dari subtitle periodenya, karena judulnya berbeda tiap
// role dan pada role OPD mirip dengan judul kartu "Jumlah Relawan Per Kader"
const MAIN_CHART_MARKER = "Semua Periode Data";
const mainChartHeading = (page: Page) =>
  page.getByRole("heading", { name: new RegExp(MAIN_CHART_MARKER, "i") });
const mainChartBody = (page: Page) => cardBody(page, MAIN_CHART_MARKER);

// Nilai KPI: <p>Label</p> diikuti <p> berisi angkanya
const kpiValue = (page: Page, label: string) =>
  page.locator(`xpath=//p[normalize-space(text())="${label}"]/following-sibling::p[1]`).first();

// Angka dengan pemisah ribuan format id-ID, mis. "179" atau "1.234"
const ANGKA_ID = /^\d{1,3}(\.\d{3})*$/;

// Tooltip recharts milik grafik tertentu saja (tiap grafik punya tooltip sendiri)
const chartTooltip = (body: Locator) => body.locator(".recharts-tooltip-wrapper").first();

// Grafik sudah tergambar, atau kartu menampilkan pesan "belum tersedia"
const chartOrEmptyState = (body: Locator) =>
  body.locator(".recharts-surface").or(body.getByText(/belum ada data|belum tersedia/i));

/**
 * Mengarahkan kursor ke cincin donut.
 *
 * Sektor donut ber-animasi saat dirender, sehingga locator.hover() menunggu
 * elemen "stabil" sampai timeout. Karena itu kursor digerakkan langsung ke
 * titik pada cincin (di antara innerRadius dan outerRadius), lalu diulang
 * sampai tooltip berisi teks.
 */
const hoverDonutRing = async (page: Page, body: Locator, maxRetry = 8) => {
  const pie = body.locator(".recharts-pie").first();
  await expect(pie).toBeVisible();

  const tooltip = chartTooltip(body);
  // Arah jam 12, 3, 6, dan 9 supaya kursor tidak jatuh di celah antar sektor
  const arahCincin = [
    { dx: 0, dy: -0.8 },
    { dx: 0.8, dy: 0 },
    { dx: 0, dy: 0.8 },
    { dx: -0.8, dy: 0 },
  ];

  for (let attempt = 0; attempt < maxRetry; attempt++) {
    const box = await pie.boundingBox();

    if (box) {
      const radius = Math.min(box.width, box.height) / 2;
      const { dx, dy } = arahCincin[attempt % arahCincin.length];

      await page.mouse.move(
        box.x + box.width / 2 + dx * radius,
        box.y + box.height / 2 + dy * radius,
      );
      await page.waitForTimeout(300);

      // Tooltip baru dipasang ke DOM setelah sektor pertama kali aktif
      if ((await tooltip.count()) > 0 && (await tooltip.innerText()).trim() !== "") return;
    }

    await page.waitForTimeout(300);
  }

  throw new Error("Tooltip donut tidak muncul setelah kursor diarahkan ke cincin");
};

for (const role of roles) {
  test.describe(`Dashboard - ${role.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("https://frontend-bappeda.vercel.app/");

      await loginBAPPEDA({
        NIK: role.creds.NIK,
        page,
        password: role.creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      // Dashboard menunggu beberapa request statistik sebelum kontennya tampil
      await expect(page.getByText(/memuat data dashboard/i)).toBeHidden({ timeout: 30000 });
    });

    // TCD.1 Access Dashboard
    test(`TCD.1 ${role.label} access Dashboard page`, async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    // TCD.2 Hover Bar Chart
    test(`TCD.2 ${role.label} hover on bar chart diagram`, async ({ page }) => {
      const body = mainChartBody(page);
      const bar = body.locator(".recharts-bar-rectangle").first();

      await expect(bar).toBeVisible();
      await bar.hover();

      // Tooltip berisi nama kategori dan jumlahnya
      const tooltip = chartTooltip(body);
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText(/jumlah/i);
      await expect(tooltip).toContainText(/\d/);
    });

    // TCD.3 Hover Donut Chart Demografi Gender
    test(`TCD.3 ${role.label} hover on gender donut chart`, async ({ page }) => {
      const body = cardBody(page, "Demografi Gender Relawan");

      await hoverDonutRing(page, body);

      const tooltip = chartTooltip(body);
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText(/laki-laki|perempuan/i);
    });

    // TCD.4 Kartu Ringkasan (KPI)
    test(`TCD.4 ${role.label} views the summary KPI cards`, async ({ page }) => {
      const kartuWajib = ["Total Relawan Aktif", "Total Kader", "Pengajuan Pending"];

      for (const label of kartuWajib) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
        await expect(kpiValue(page, label)).toHaveText(ANGKA_ID);
      }

      // Kartu "Total OPD Terdaftar" hanya untuk Super Admin
      const totalOpdCard = page.getByText("Total OPD Terdaftar", { exact: true });
      if (role.hasTotalOpdCard) {
        await expect(totalOpdCard).toBeVisible();
        await expect(kpiValue(page, "Total OPD Terdaftar")).toHaveText(ANGKA_ID);
      } else {
        await expect(totalOpdCard).toBeHidden();
      }
    });

    // TCD.5 Header Status Real-time
    test(`TCD.5 ${role.label} views the real-time data status header`, async ({ page }) => {
      await expect(page.getByText(/data ditampilkan secara real-time/i)).toBeVisible();
      await expect(page.getByText(/^Data per: .+WIB$/)).toBeVisible();
    });

    // TCD.6 Judul & Periode Grafik Utama
    test(`TCD.6 ${role.label} views the main chart title and period`, async ({ page }) => {
      const heading = mainChartHeading(page);

      await expect(heading).toBeVisible();
      await expect(heading).toContainText(role.mainChartTitle);
      // Label periode kumulatif, mis. "Semua Periode Data (Juni 2024 — September 2026)"
      await expect(heading).toContainText(/Semua Periode Data \(.+—.+\)/);
    });

    // TCD.7 Filter Tampilan Grafik Utama (Top 10 / Semua Data)
    test(`TCD.7 ${role.label} switches the main chart data filter`, async ({ page }) => {
      const filterButton = page.getByRole("button", { name: /top 10 data|semua data/i }).first();

      // Filter hanya dirender bila data grafik lebih dari 10
      test.skip(!(await filterButton.isVisible()), "Data grafik kurang dari 10, filter tidak ada");

      const bars = mainChartBody(page).locator(".recharts-bar-rectangle");
      expect(await bars.count()).toBe(10);

      await filterButton.click();
      await page.getByRole("button", { name: /^Semua Data \(\d+\)$/ }).click();

      await expect.poll(() => bars.count(), { timeout: 10000 }).toBeGreaterThan(10);
    });

    // TCD.8 Leaderboard Relawan dengan Penugasan Terbanyak
    test(`TCD.8 ${role.label} views the top volunteer leaderboard`, async ({ page }) => {
      const body = cardBody(page, "Relawan dengan Penugasan Terbanyak");

      await expect(body).toBeVisible();
      await expect(
        body
          .getByText(/\d+ Penugasan/)
          .or(body.getByText(/belum ada data penugasan/i))
          .first(),
      ).toBeVisible();
    });

    // TCD.9 Sebaran Relawan per Kelurahan
    test(`TCD.9 ${role.label} views the volunteer distribution per Kelurahan`, async ({ page }) => {
      const body = cardBody(page, "Sebaran Relawan per Kelurahan");

      await expect(body).toBeVisible();
      await expect(chartOrEmptyState(body).first()).toBeVisible();
    });

    // TCD.10 Jumlah Relawan per Kader
    test(`TCD.10 ${role.label} views the volunteers per Kader chart`, async ({ page }) => {
      const heading = page.getByRole("heading", { name: role.relawanPerKaderTitle });

      await expect(heading).toBeVisible();
      await expect(
        chartOrEmptyState(cardBody(page, "Jumlah Relawan Per Kader")).first(),
      ).toBeVisible();
    });

    // TCD.11 Jumlah Kader per OPD
    test(`TCD.11 ${role.label} views the Kader per OPD chart`, async ({ page }) => {
      const heading = page.getByRole("heading", { name: role.kaderTitle });

      await expect(heading).toBeVisible();
      await expect(chartOrEmptyState(cardBody(page, "Jumlah Kader")).first()).toBeVisible();
    });
  });
}

// TCD.12 Tampilan Gagal Memuat Data
test("TCD.12 Dashboard shows an error state when the data fails to load", async ({ page }) => {
  await page.goto("https://frontend-bappeda.vercel.app/");

  // Gagalkan permintaan data dashboard untuk menguji penanganan errornya
  await page.route("**/dashboard", (route) => route.abort());

  await loginBAPPEDA({
    NIK: credentials.superAdmin.NIK,
    page,
    password: credentials.superAdmin.password,
  });

  await expect(page).toHaveURL(/dashboard/);

  // Pesan mengikuti penyebab kegagalan (mis. "Network Error" dari request yang gagal)
  await expect(
    page.getByText(/network error|tidak dapat terhubung|gagal memuat|tidak tersedia/i),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: /coba lagi/i })).toBeVisible();
  // Konten dashboard tidak boleh ikut tampil saat datanya gagal dimuat
  await expect(page.getByText("Total Relawan Aktif", { exact: true })).toBeHidden();
});

// TCD.13 Pembatasan Akses Dashboard
test("TCD.13 Relawan cannot access the Dashboard page", async ({ page }) => {
  await page.goto("https://frontend-bappeda.vercel.app/");

  await loginBAPPEDA({
    NIK: credentials.relawan.NIK,
    page,
    password: credentials.relawan.password,
  });

  await expect(page).toHaveURL(/profil-relawan/);

  // Dashboard hanya untuk super_admin & opd; relawan diarahkan ke /unauthorized
  await page.goto("https://frontend-bappeda.vercel.app/dashboard");

  await expect(page).toHaveURL(/unauthorized|profil-relawan/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeHidden();
});
