import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { faker } from "@faker-js/faker";
import type { Browser, Page } from "@playwright/test";

export interface PengajuanPerubahanData {
  alamat?: string;
  noHP?: string;
}

/**
 * Login sebagai relawan di browser context terpisah, lalu submit
 * pengajuan perubahan data profil.
 *
 * Context relawan SELALU ditutup setelah selesai agar tidak
 * mengganggu session Super Admin / OPD di `page` utama.
 */
export async function submitPengajuanPerubahan(
  browser: Browser,
  data?: PengajuanPerubahanData,
): Promise<void> {
  const relawanContext = await browser.newContext();
  const relawanPage = await relawanContext.newPage();

  try {
    // 1. Buka aplikasi & login sebagai relawan
    await relawanPage.goto("https://frontend-bappeda.vercel.app/");
    await loginBAPPEDA({
      NIK: credentials.relawan.NIK,
      page: relawanPage,
      password: credentials.relawan.password,
    });

    // Relawan diarahkan ke /profil-relawan (bukan /dashboard)
    await relawanPage.waitForURL(/profil-relawan/, { timeout: 15_000 });

    // 2. Buka form pengajuan perubahan data
    await relawanPage
      .getByRole("button", { name: /ajukan pembaruan|edit profil|ubah data/i })
      .click();

    // 3. Isi minimal satu field yang berubah agar form valid
    const newAlamat = data?.alamat ?? `${faker.location.streetAddress()}, Yogyakarta`;
    const newNoHP = data?.noHP ?? `08${faker.string.numeric(10)}`;
    const newAlasan = faker.lorem.sentence();

    const alamatInput = relawanPage.getByRole("textbox", { name: /alamat/i });
    const noHPInput = relawanPage.getByRole("textbox", { name: /nomor hp/i });
    const alasanInput = relawanPage.getByRole("textbox", { name: "Tuliskan alasan mengapa data" });

    if (await alasanInput.isVisible()) {
      await alasanInput.clear();
      await alasanInput.fill(newAlasan);
    }

    if (await alamatInput.isVisible()) {
      await alamatInput.clear();
      await alamatInput.fill(newAlamat);
    }

    if (await noHPInput.isVisible()) {
      await noHPInput.clear();
      await noHPInput.fill(newNoHP);
    }

    // 4. Submit
    await relawanPage.getByRole("button", { name: "Ajukan", exact: true }).click();

    // 5. Submit Konfirmasi
    await relawanPage.getByRole("button", { name: "Ya, Ajukan" }).click();

    // 6. Tunggu konfirmasi sukses (maks 10 detik)
    await relawanPage
      .getByText(/berhasil.*dikirim|success/i)
      .or(relawanPage.getByRole("alert").filter({ hasText: /berhasil.*dikirim|success/i }))
      .or(
        relawanPage.getByText(
          "Pengajuan perubahan data berhasil dikirim dan sedang menunggu review Admin.",
        ),
      )
      .waitFor({ timeout: 10_000 });
  } finally {
    await relawanContext.close();
  }
}

/**
 * Pastikan tabel "Pengajuan Perubahan Data" memiliki setidaknya
 * 1 baris berstatus "Menunggu" sebelum test TCDR.32-35 dijalankan.
 *
 * Jika tabel kosong atau tidak ada baris pending, fungsi ini akan
 * otomatis memanggil `submitPengajuanPerubahan()` lalu reload page.
 *
 * @param page    - Page Super Admin / OPD yang sudah login & berada di /relawan
 * @param browser - Playwright Browser instance untuk membuka context relawan
 */
export async function ensurePengajuanExists(page: Page, browser: Browser): Promise<void> {
  await page.reload();
  await page.waitForLoadState("networkidle");

  const pengajuanTableLocator = page
    .getByRole("table")
    .filter({ hasText: /nik.*nama lengkap.*tanggal pengajuan.*status.*aksi/i });

  // Cek apakah ada baris dengan status Menunggu / Pending
  const tableVisible = await pengajuanTableLocator.isVisible();
  const pendingCount = tableVisible
    ? await pengajuanTableLocator
        .getByRole("row")
        .filter({ hasText: /menunggu|pending/i })
        .count()
    : 0;

  if (pendingCount === 0) {
    // Tidak ada pengajuan → buat dulu lewat akun relawan
    await submitPengajuanPerubahan(browser);

    // Reload halaman utama dan tunggu data masuk
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2_000);
  }
}
