import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { clickThink, fillThink, LOAD_TIME, waitLoaded, waitUrl } from "@/helpers/timing.helper";
import { faker } from "@faker-js/faker";
import type { Browser, Page } from "@playwright/test";

// Field pada modal pengajuan. Label tidak terhubung ke input (tanpa htmlFor),
// dan placeholder-nya diisi data profil saat ini, jadi keduanya tidak bisa
// dipakai sebagai locator. Field diambil dari elemen tepat setelah label-nya
// (sama dengan modalField di profil.spec.ts).
const modalField = (page: Page, label: string) =>
  page
    .locator(`xpath=//label[starts-with(normalize-space(.), "${label}")]/following-sibling::*[1]`)
    .locator("xpath=descendant-or-self::*[self::input or self::textarea]")
    .first();

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
    await waitUrl(relawanPage, /profil-relawan/, "relawan diarahkan ke /profil-relawan");

    // 2. Buka form pengajuan perubahan data
    await clickThink(
      relawanPage.getByRole("button", { name: /ajukan pembaruan|edit profil|ubah data/i }),
    );
    await waitLoaded(
      relawanPage.getByRole("heading", { name: "Ajukan Pembaruan Data" }),
      "modal Ajukan Pembaruan Data tampil",
    );

    // 3. Isi minimal satu field yang berubah agar form valid
    const newAlamat = data?.alamat ?? `${faker.location.streetAddress()}, Yogyakarta`;
    const newNoHP = data?.noHP ?? `08${faker.string.numeric(10)}`;
    const newAlasan = faker.lorem.sentence();

    await fillThink(modalField(relawanPage, "Alamat Baru"), newAlamat);
    await fillThink(modalField(relawanPage, "No. HP Baru"), newNoHP);
    await fillThink(modalField(relawanPage, "Catatan / Alasan Perubahan"), newAlasan);

    // 4. Submit
    await clickThink(relawanPage.getByRole("button", { name: "Ajukan", exact: true }));
    await waitLoaded(
      relawanPage.getByRole("heading", { name: "Konfirmasi Pengajuan" }),
      "dialog Konfirmasi Pengajuan tampil",
    );

    // 5. Submit Konfirmasi
    await clickThink(relawanPage.getByRole("button", { name: "Ya, Ajukan" }));

    // 6. Tunggu konfirmasi sukses (maks LOAD_TIME)
    await waitLoaded(
      relawanPage
        .getByText(/berhasil.*dikirim|success/i)
        .or(relawanPage.getByRole("alert").filter({ hasText: /berhasil.*dikirim|success/i }))
        .or(
          relawanPage.getByText(
            "Pengajuan perubahan data berhasil dikirim dan sedang menunggu review Admin.",
          ),
        )
        .first(),
      "notifikasi pengajuan berhasil dikirim tampil",
    );
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
export async function ensurePengajuanExists(
  page: Page,
  browser: Browser,
  maxRetry = 3,
): Promise<void> {
  const pengajuanTableLocator = page
    .getByRole("table")
    .filter({ hasText: /nik.*nama lengkap.*tanggal pengajuan.*status.*aksi/i });

  // Hitung baris berstatus Menunggu / Pending setelah halaman dimuat ulang
  const countPending = async (): Promise<number> => {
    await page.reload();
    await page.waitForLoadState("networkidle", { timeout: LOAD_TIME });

    if (!(await pengajuanTableLocator.isVisible())) return 0;

    return pengajuanTableLocator
      .getByRole("row")
      .filter({ hasText: /menunggu|pending/i })
      .count();
  };

  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    if ((await countPending()) > 0) return;

    // Belum ada pengajuan → buat lewat akun relawan.
    // Pengajuan bisa saja keburu diproses worker lain, jadi diulang bila perlu.
    await submitPengajuanPerubahan(browser);
  }

  if ((await countPending()) === 0) {
    throw new Error(
      "Pengajuan berhasil dibuat lewat akun relawan tetapi tidak muncul sebagai 'Menunggu'. " +
        `Pastikan relawan uji (NIK ${credentials.relawan.NIK}) terdaftar pada OPD milik akun yang sedang login — ` +
        "admin OPD hanya melihat pengajuan dari relawan di instansinya.",
    );
  }
}
