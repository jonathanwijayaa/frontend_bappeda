import { credentials } from "@/helpers/credentials.helper";
import { loginBAPPEDA } from "@/helpers/loginBAPPEDA.helper";
import { expect, Page, test } from "@playwright/test";
import path from "path";

test.describe.configure({ timeout: 90_000 });

const BASE_URL = "https://frontend-bappeda.vercel.app/";
const FOTO_VALID = path.resolve("src/assets/image/a.jpg");

// Halaman /profil hanya untuk super_admin & opd. Relawan punya halaman
// terpisah (/profil-relawan) dengan alur yang berbeda, diuji di bagian bawah.
const rolesAdmin = [
  { label: "Super Admin", creds: credentials.superAdmin },
  { label: "OPD", creds: credentials.opd },
] as const;

// ── Navigasi ─────────────────────────────────────────────────────────────
// Tombol avatar di header tidak punya teks; nama aksesibilitasnya berasal dari
// alt gambar yang berisi nama akun. Dicari lewat struktur (blok kanan header,
// tepat setelah blok judul halaman) supaya tidak bergantung data akun.
const avatarButton = (page: Page) =>
  page.locator("xpath=//h1/parent::div/following-sibling::div[1]//button").first();

const bukaProfil = async (page: Page) => {
  await avatarButton(page).click();
  await page.getByRole("button", { name: "Edit Profil" }).click();

  await expect(page).toHaveURL(/\/profil$/);
  await expect(page.getByText(/memuat profil/i)).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Informasi Pribadi" })).toBeVisible();
};

// ── Locator halaman /profil ──────────────────────────────────────────────
// <label> pada halaman ini tidak terhubung ke input-nya (tanpa htmlFor/id),
// sehingga input tidak punya accessible name. Dipakai atribut name-nya, yang
// juga dipakai aplikasi sebagai kunci state form.
const namaField = (page: Page) => page.locator('input[name="nama_lengkap"]');
const noHpField = (page: Page) => page.locator('input[name="no_hp"]');
const nikField = (page: Page) =>
  page.locator('xpath=//label[starts-with(normalize-space(.), "NIK")]/following-sibling::input[1]');

const passwordLamaField = (page: Page) => page.locator('input[name="passwordLama"]');
const passwordBaruField = (page: Page) => page.locator('input[name="passwordBaru"]');
const konfirmasiPasswordField = (page: Page) => page.locator('input[name="konfirmasiPassword"]');

const fileInput = (page: Page) => page.locator('input[type="file"]');
const avatarImage = (page: Page) => page.getByRole("img", { name: "Profile" });
const avatarSrc = (page: Page) => avatarImage(page).getAttribute("src");

// Ada dua tombol simpan di halaman ini, jadi namanya harus lengkap
const simpanProfilButton = (page: Page) =>
  page.getByRole("button", { name: "Simpan Informasi Pribadi" });
const simpanPasswordButton = (page: Page) => page.getByRole("button", { name: "Simpan Password" });

const TOAST_PROFIL_SUKSES = "Informasi pribadi berhasil diperbarui!";

// Backend menolak nama yang mengandung angka (lihat TCP.28). Akun yang nama
// tersimpannya sudah terlanjur mengandung angka tidak bisa menyimpan perubahan
// apa pun — termasuk foto profil, karena nama ikut terkirim di payload yang
// sama. Test simpan dilewati dengan alasan jelas untuk akun seperti itu.
const namaDitolakBackend = (nama: string) => /\d/.test(nama);

const lewatiJikaNamaBermasalah = (nama: string) =>
  test.skip(
    namaDitolakBackend(nama),
    `Nama akun "${nama}" mengandung angka sehingga ditolak backend; simpan profil tidak dapat diuji (lihat TCP.28)`,
  );

// Toast menutup sendiri setelah 5 detik. Saat satu test menyimpan dua kali,
// toast lama harus benar-benar hilang dulu agar assertion kedua tidak lolos
// hanya karena membaca toast sebelumnya.
const tungguToastHilang = async (page: Page, teks: string) => {
  await expect(page.getByText(teks)).toBeHidden({ timeout: 15_000 });
};

for (const role of rolesAdmin) {
  test.describe(`Profil - ${role.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);

      await loginBAPPEDA({
        NIK: role.creds.NIK,
        page,
        password: role.creds.password,
      });

      await expect(page).toHaveURL(/dashboard/);
      await bukaProfil(page);
    });

    // TCP.1 & TCP.3 mengubah data akun yang sama, jadi dijalankan berurutan
    // supaya tidak saling menimpa saat test berjalan paralel.
    test.describe.serial(`TCP.1 & TCP.3 ${role.label} Simpan Perubahan`, () => {
      // TCP.1 Change Profile Picture
      test(`TCP.1 ${role.label} changes profile picture`, async ({ page }) => {
        // Simpan foto ikut mengirim nama_lengkap, jadi nama yang tersimpan harus
        // lolos validasi backend lebih dulu.
        lewatiJikaNamaBermasalah(await namaField(page).inputValue());

        // Kontrol "Ganti" berupa <label> yang membungkus <input type="file">
        // tersembunyi, bukan <button>, jadi file diisikan langsung ke input-nya.
        await expect(page.getByText("Ganti", { exact: true })).toBeVisible();

        await fileInput(page).setInputFiles(FOTO_VALID);

        // Foto dibaca jadi base64 untuk preview, belum tersimpan ke server
        await expect.poll(() => avatarSrc(page)).toMatch(/^data:image\//);

        await simpanProfilButton(page).click();
        await expect(page.getByText(TOAST_PROFIL_SUKSES)).toBeVisible();

        // Kembalikan ke avatar bawaan supaya data akun tidak berubah setelah uji
        await tungguToastHilang(page, TOAST_PROFIL_SUKSES);
        await page.getByRole("button", { name: "Hapus" }).click();
        await simpanProfilButton(page).click();

        await expect(page.getByText(TOAST_PROFIL_SUKSES)).toBeVisible();
        await expect.poll(() => avatarSrc(page)).toContain("ui-avatars.com");
      });

      // TCP.3 Isi form informasi pribadi lalu simpan
      test(`TCP.3 ${role.label} fills all edit form personal information`, async ({ page }) => {
        const namaAwal = await namaField(page).inputValue();
        lewatiJikaNamaBermasalah(namaAwal);

        const hpAwal = await noHpField(page).inputValue();

        const namaUji = `${namaAwal} Uji`;
        const hpUji = `0813${Date.now().toString().slice(-8)}`;

        await namaField(page).fill(namaUji);
        await noHpField(page).fill(hpUji);
        await simpanProfilButton(page).click();

        await expect(page.getByText(TOAST_PROFIL_SUKSES)).toBeVisible();

        // Form disinkronkan ulang dari data server setelah simpan berhasil
        await expect(namaField(page)).toHaveValue(namaUji);
        await expect(noHpField(page)).toHaveValue(hpUji);

        // Kembalikan ke nilai semula
        await tungguToastHilang(page, TOAST_PROFIL_SUKSES);
        await namaField(page).fill(namaAwal);
        await noHpField(page).fill(hpAwal);
        await simpanProfilButton(page).click();

        await expect(page.getByText(TOAST_PROFIL_SUKSES)).toBeVisible();
        await expect(namaField(page)).toHaveValue(namaAwal);
      });
    });

    // TCP.2 Tampilan data akun di halaman profil
    test(`TCP.2 ${role.label} views the personal information form`, async ({ page }) => {
      await expect(namaField(page)).toBeVisible();
      await expect(namaField(page)).not.toHaveValue("");

      await expect(noHpField(page)).toBeVisible();
      await expect(avatarImage(page)).toBeVisible();
      await expect(simpanProfilButton(page)).toBeEnabled();

      // Form ubah password ada di halaman yang sama
      await expect(page.getByRole("heading", { name: "Ubah Password" })).toBeVisible();
    });

    // TCP.4 Negative: nomor telepon tidak valid
    test.describe(`TCP.4 ${role.label} invalid phone number`, () => {
      // Input No. Telepon bertipe "tel" tanpa constraint HTML (tanpa required /
      // pattern / maxlength), jadi checkValidity() selalu true. Validasinya
      // dilakukan aplikasi saat submit: non-digit dibuang lalu sisanya wajib
      // 10–13 digit, dan hasilnya ditampilkan sebagai notifikasi.
      const invalidPhoneCases = [
        { title: "Phone with letters", value: "08ABCDE123" },
        { title: "Phone too short", value: "08123" },
        { title: "Phone with special characters", value: "08!@#$%^&*" },
        { title: "Phone too long", value: "081234567890123456789" },
      ];

      for (const phoneCase of invalidPhoneCases) {
        test(`TCP.4 ${role.label} ${phoneCase.title}`, async ({ page }) => {
          await noHpField(page).fill(phoneCase.value);
          await simpanProfilButton(page).click();

          await expect(page.getByText(/nomor hp tidak valid/i)).toBeVisible();
          await expect(page.getByText(TOAST_PROFIL_SUKSES)).toBeHidden();
        });
      }
    });

    // TCP.5 Perubahan yang tidak disimpan tidak ikut tersimpan
    test(`TCP.5 ${role.label} discards unsaved personal information`, async ({ page }) => {
      // Halaman ini tidak punya tombol Batal; perubahan dibuang saat user
      // berpindah halaman tanpa menekan Simpan.
      const namaAwal = await namaField(page).inputValue();
      await namaField(page).fill("Nama Yang Tidak Disimpan");

      await page.getByRole("link", { name: "Dashboard" }).click();
      await expect(page).toHaveURL(/dashboard/);

      await bukaProfil(page);

      await expect(namaField(page)).toHaveValue(namaAwal);
      await expect(page.getByText("Nama Yang Tidak Disimpan")).toBeHidden();
    });

    // TCP.6 Negative: simpan tanpa mengubah apa pun
    test(`TCP.6 ${role.label} saves without changing anything`, async ({ page }) => {
      await simpanProfilButton(page).click();

      await expect(page.getByText(/tidak ada data yang disimpan/i)).toBeVisible();
      await expect(page.getByText(TOAST_PROFIL_SUKSES)).toBeHidden();
    });

    // TCP.7 Negative: foto profil melebihi 1MB
    test(`TCP.7 ${role.label} uploads a profile picture larger than 1MB`, async ({ page }) => {
      const srcAwal = await avatarSrc(page);

      // Dibuat saat test berjalan supaya tidak perlu menyimpan berkas besar di repo
      await fileInput(page).setInputFiles({
        buffer: Buffer.alloc(1024 * 1024 + 1),
        mimeType: "image/jpeg",
        name: "foto-terlalu-besar.jpg",
      });

      await expect(page.getByText(/ukuran gambar maksimal 1mb/i)).toBeVisible();
      // Foto yang ditolak tidak boleh ikut mengganti preview
      expect(await avatarSrc(page)).toBe(srcAwal);
    });

    // TCP.8 Hapus foto profil
    test(`TCP.8 ${role.label} removes the selected profile picture`, async ({ page }) => {
      await fileInput(page).setInputFiles(FOTO_VALID);
      await expect.poll(() => avatarSrc(page)).toMatch(/^data:image\//);

      await page.getByRole("button", { name: "Hapus" }).click();

      // Kembali ke avatar bawaan; belum disimpan selama tombol Simpan tidak ditekan
      await expect.poll(() => avatarSrc(page)).toContain("ui-avatars.com");
    });

    // TCP.9 NIK tidak dapat diubah
    test(`TCP.9 ${role.label} cannot edit the NIK field`, async ({ page }) => {
      await expect(nikField(page)).toBeDisabled();
      await expect(nikField(page)).toHaveValue(role.creds.NIK);
      await expect(page.getByText(/tidak dapat diubah/i)).toBeVisible();
    });

    // TCP.10 Negative: validasi form Ubah Password
    test.describe(`TCP.10 ${role.label} invalid password form`, () => {
      // Semua kasus di bawah ditolak sebelum request dikirim, sehingga password
      // akun tidak pernah benar-benar berubah saat pengujian berjalan.
      const invalidPasswordCases = [
        {
          baru: "Rahasia123!",
          konfirmasi: "Rahasia123!",
          lama: "",
          pesan: /password saat ini wajib diisi/i,
          title: "Empty current password",
        },
        {
          baru: "",
          konfirmasi: "Rahasia123!",
          lama: "PasswordLamaSalah123",
          pesan: /password baru wajib diisi/i,
          title: "Empty new password",
        },
        {
          baru: "Rahasia123!",
          konfirmasi: "",
          lama: "PasswordLamaSalah123",
          pesan: /konfirmasi password wajib diisi/i,
          title: "Empty password confirmation",
        },
        {
          baru: "abc",
          konfirmasi: "abc",
          lama: "PasswordLamaSalah123",
          pesan: /terlalu pendek/i,
          title: "New password shorter than 6 characters",
        },
        {
          baru: "Rahasia123!",
          konfirmasi: "Rahasia999!",
          lama: "PasswordLamaSalah123",
          pesan: /tidak cocok dengan password baru/i,
          title: "Confirmation does not match",
        },
      ];

      for (const passwordCase of invalidPasswordCases) {
        test(`TCP.10 ${role.label} ${passwordCase.title}`, async ({ page }) => {
          await passwordLamaField(page).fill(passwordCase.lama);
          await passwordBaruField(page).fill(passwordCase.baru);
          await konfirmasiPasswordField(page).fill(passwordCase.konfirmasi);

          await simpanPasswordButton(page).click();

          await expect(page.getByText(passwordCase.pesan)).toBeVisible();
          await expect(page.getByText(/password berhasil diperbarui/i)).toBeHidden();
        });
      }
    });

    // TCP.28 Negative: nama lengkap dengan angka / karakter spesial
    test(`TCP.28 ${role.label} saves a name containing digits`, async ({ page }) => {
      // Tidak ada validasi nama di sisi aplikasi; penolakan datang dari backend,
      // sehingga nama akun tidak ikut berubah saat kasus ini dijalankan.
      await namaField(page).fill("Nama Uji 123");
      await simpanProfilButton(page).click();

      await expect(page.getByText(/nama lengkap tidak boleh mengandung angka/i)).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(TOAST_PROFIL_SUKSES)).toBeHidden();
    });

    // TCP.11 Negative: password lama salah
    test(`TCP.11 ${role.label} enters a wrong current password`, async ({ page }) => {
      await passwordLamaField(page).fill("PasswordLamaSalah123");
      await passwordBaruField(page).fill("Rahasia123!");
      await konfirmasiPasswordField(page).fill("Rahasia123!");

      await simpanPasswordButton(page).click();

      // Ditolak server, sehingga password akun tetap seperti semula
      await expect(page.getByText(/password lama tidak sesuai/i)).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/password berhasil diperbarui/i)).toBeHidden();
    });
  });
}

/* ======================================
   PROFIL — Relawan (/profil-relawan)
====================================== */

// Nilai informasi pribadi: <label>Nama Lengkap</label> diikuti <p> berisi datanya
const infoValue = (page: Page, label: string) =>
  page.locator(`xpath=//label[normalize-space(.)="${label}"]/following-sibling::p[1]`).first();

// Field pada modal pengajuan. Label tidak terhubung ke input (tanpa htmlFor),
// dan placeholder-nya diisi data profil saat ini, jadi keduanya tidak bisa
// dipakai sebagai locator. Field diambil dari elemen tepat setelah label-nya.
const modalField = (page: Page, label: string) =>
  page
    .locator(`xpath=//label[starts-with(normalize-space(.), "${label}")]/following-sibling::*[1]`)
    .locator("xpath=descendant-or-self::*[self::input or self::textarea]")
    .first();

const modalSaran = (page: Page, label: string) =>
  page
    .locator(`xpath=//label[starts-with(normalize-space(.), "${label}")]/following-sibling::*[1]`)
    .getByRole("listitem");

const modalCloseButton = (page: Page) =>
  page
    .locator('xpath=//h2[normalize-space(.)="Ajukan Pembaruan Data"]/following-sibling::button[1]')
    .first();

const ajukanButton = (page: Page) => page.getByRole("button", { name: "Ajukan", exact: true });
const konfirmasiDialog = (page: Page) =>
  page.getByRole("heading", { name: "Konfirmasi Pengajuan" });

const bukaModalPengajuan = async (page: Page) => {
  await page.getByRole("button", { name: "Ajukan Pembaruan Data" }).click();
  await expect(page.getByRole("heading", { name: "Ajukan Pembaruan Data" })).toBeVisible();
};

// Pengajuan dikirim dua tahap: "Ajukan" membuka dialog konfirmasi, lalu
// "Ya, Ajukan" yang benar-benar mengirim ke server.
const kirimPengajuan = async (page: Page) => {
  await ajukanButton(page).click();
  await expect(konfirmasiDialog(page)).toBeVisible();
  await page.getByRole("button", { name: "Ya, Ajukan" }).click();
};

test.describe("Profil - Relawan", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);

    await loginBAPPEDA({
      NIK: credentials.relawan.NIK,
      page,
      password: credentials.relawan.password,
    });

    // Relawan langsung diarahkan ke profilnya setelah login
    await expect(page).toHaveURL(/profil-relawan/);
    await expect(infoValue(page, "NIK")).toBeVisible({ timeout: 30_000 });
  });

  // TCP.12 Tampilan informasi pribadi relawan
  test("TCP.12 Relawan views their personal information", async ({ page }) => {
    await expect(infoValue(page, "NIK")).toHaveText(credentials.relawan.NIK);
    await expect(infoValue(page, "Nama Lengkap")).not.toHaveText("-");
    await expect(infoValue(page, "Jenis Kelamin")).toHaveText(/laki-laki|perempuan/i);

    for (const label of ["Alamat KTP", "Kemantren", "Kelurahan", "No. HP"]) {
      await expect(infoValue(page, label)).toBeVisible();
    }

    // Nama pada kartu sambutan mengikuti data profil
    const nama = await infoValue(page, "Nama Lengkap").innerText();
    await expect(page.getByText(nama.trim(), { exact: true }).first()).toBeVisible();

    // Relawan tidak punya fitur ganti foto profil seperti Super Admin / OPD
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });

  // TCP.13 Modal Ajukan Pembaruan Data
  test("TCP.13 Relawan clicks Ajukan Pembaruan Data button", async ({ page }) => {
    await bukaModalPengajuan(page);

    for (const label of [
      "Alamat Baru",
      "Kemantren Baru",
      "Kelurahan Baru",
      "No. HP Baru",
      "Catatan / Alasan Perubahan",
    ]) {
      await expect(modalField(page, label)).toBeVisible();
    }

    // Data identitas tidak boleh bisa diajukan lewat modal ini
    for (const label of ["Nama Lengkap Baru", "NIK Baru", "Jenis Kelamin Baru"]) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }

    await expect(page.getByText(/informasi kontak & domisili/i)).toBeVisible();
    await expect(ajukanButton(page)).toBeVisible();
  });

  // TCP.14 Kirim pengajuan pembaruan data
  test("TCP.14 Relawan fills all Ajukan Pembaruan Data form", async ({ page }) => {
    // Diajukan dengan alamat yang sama seperti sekarang, supaya data relawan
    // tidak ikut berubah kalau pengajuannya nanti disetujui admin.
    const alamatSekarang = (await infoValue(page, "Alamat KTP").innerText()).trim();

    await bukaModalPengajuan(page);
    await modalField(page, "Alamat Baru").fill(alamatSekarang);
    await modalField(page, "Catatan / Alasan Perubahan").fill("Pengujian otomatis E2E");

    await kirimPengajuan(page);

    await expect(page.getByText(/berhasil dikirim dan sedang menunggu review/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: "Ajukan Pembaruan Data" })).toBeHidden();
  });

  // TCP.15 Negative: nomor HP tidak valid
  test.describe("TCP.15 Relawan invalid phone number", () => {
    // Aplikasi hanya membuang karakter non-digit sebelum mengirim; panjang dan
    // formatnya divalidasi server, jadi pesannya datang dari response API.
    const invalidPhoneCases = [
      { title: "Phone with letters", value: "08ABCDE123" },
      { title: "Phone too short", value: "08123" },
      { title: "Phone with special characters", value: "08!@#$%^&*" },
      { title: "Phone too long", value: "081234567890123456789" },
    ];

    for (const phoneCase of invalidPhoneCases) {
      test(`TCP.15 Relawan ${phoneCase.title}`, async ({ page }) => {
        await bukaModalPengajuan(page);
        await modalField(page, "No. HP Baru").fill(phoneCase.value);
        await modalField(page, "Catatan / Alasan Perubahan").fill("Uji nomor HP tidak valid");

        await kirimPengajuan(page);

        await expect(page.getByText(/format nomor hp tidak valid/i)).toBeVisible({
          timeout: 20_000,
        });
        await expect(page.getByText(/berhasil dikirim/i)).toBeHidden();
      });
    }
  });

  // TCP.16 Batal / tutup modal
  test("TCP.16 Relawan cancels Ajukan Pembaruan Data", async ({ page }) => {
    await bukaModalPengajuan(page);
    await modalField(page, "Alamat Baru").fill("Alamat Yang Tidak Diajukan");

    await page.getByRole("button", { name: "Batal" }).click();
    await expect(page.getByRole("heading", { name: "Ajukan Pembaruan Data" })).toBeHidden();

    // Modal dibuka ulang dalam keadaan kosong, dan tombol X juga menutupnya
    await bukaModalPengajuan(page);
    await expect(modalField(page, "Alamat Baru")).toHaveValue("");

    await modalCloseButton(page).click();
    await expect(page.getByRole("heading", { name: "Ajukan Pembaruan Data" })).toBeHidden();
    await expect(page.getByText(/berhasil dikirim/i)).toBeHidden();
  });

  // TCP.17 Negative: tidak ada data yang diubah
  test("TCP.17 Relawan submits without changing any data", async ({ page }) => {
    await bukaModalPengajuan(page);
    await modalField(page, "Catatan / Alasan Perubahan").fill("Tanpa perubahan data");

    await kirimPengajuan(page);

    await expect(page.getByText(/minimal satu data harus diubah/i)).toBeVisible();
    await expect(page.getByText(/berhasil dikirim/i)).toBeHidden();
  });

  // TCP.18 Negative: catatan wajib diisi
  test("TCP.18 Relawan submits without filling the reason", async ({ page }) => {
    await bukaModalPengajuan(page);
    await modalField(page, "Alamat Baru").fill("Jl. Uji Tanpa Catatan No. 1, Yogyakarta");

    await kirimPengajuan(page);

    await expect(page.getByText(/catatan \/ alasan perubahan wajib diisi/i)).toBeVisible();
    await expect(page.getByText(/berhasil dikirim/i)).toBeHidden();
  });

  // TCP.19 Autocomplete Kemantren & Kelurahan
  test("TCP.19 Relawan picks a Kemantren suggestion", async ({ page }) => {
    await bukaModalPengajuan(page);

    const kemantren = modalField(page, "Kemantren Baru");
    await kemantren.click();

    const saran = modalSaran(page, "Kemantren Baru");
    await expect(saran.first()).toBeVisible();

    const pilihan = (await saran.first().innerText()).trim();
    await saran.first().click();

    await expect(kemantren).toHaveValue(pilihan);
    // Memilih Kemantren mengosongkan Kelurahan yang sudah terlanjur diisi
    await expect(modalField(page, "Kelurahan Baru")).toHaveValue("");

    // Daftar Kelurahan menyesuaikan Kemantren yang baru dipilih
    const kelurahan = modalField(page, "Kelurahan Baru");
    await kelurahan.click();
    await expect(modalSaran(page, "Kelurahan Baru").first()).toBeVisible({ timeout: 15_000 });
  });

  // TCP.20 Batalkan dialog konfirmasi
  test("TCP.20 Relawan cancels the confirmation dialog", async ({ page }) => {
    await bukaModalPengajuan(page);
    await modalField(page, "Alamat Baru").fill("Jl. Uji Konfirmasi No. 1, Yogyakarta");
    await modalField(page, "Catatan / Alasan Perubahan").fill("Uji batal konfirmasi");

    await ajukanButton(page).click();
    await expect(konfirmasiDialog(page)).toBeVisible();

    // Tombol Batal di dialog konfirmasi (dialog dirender di atas modal)
    await page.getByRole("button", { name: "Batal" }).last().click();

    await expect(konfirmasiDialog(page)).toBeHidden();
    // Kembali ke modal dengan isian yang masih utuh, tanpa mengirim apa pun
    await expect(page.getByRole("heading", { name: "Ajukan Pembaruan Data" })).toBeVisible();
    await expect(modalField(page, "Alamat Baru")).toHaveValue(
      "Jl. Uji Konfirmasi No. 1, Yogyakarta",
    );
    await expect(page.getByText(/berhasil dikirim/i)).toBeHidden();
  });
});

/* ======================================
   UBAH KATA SANDI — Relawan (/ubah-password)
====================================== */

// Form punya tombol submit bernama sama dengan item menu "Ubah Kata Sandi",
// jadi tombolnya dibatasi ke dalam <form>.
const formPassword = (page: Page) => page.locator("form");
const submitPasswordButton = (page: Page) =>
  formPassword(page).getByRole("button", { name: "Ubah Kata Sandi" });

const sandiLamaField = (page: Page) => page.getByPlaceholder("Masukkan kata sandi lama");
const sandiBaruField = (page: Page) => page.getByPlaceholder("Masukkan kata sandi baru");
const konfirmasiSandiField = (page: Page) => page.getByPlaceholder("Ulangi kata sandi baru");

// Tombol mata tidak punya teks; letaknya tepat setelah input di dalam wadahnya
const toggleLihatSandi = (page: Page, id: string) =>
  page.locator(`xpath=//input[@id="${id}"]/following-sibling::button[1]`);

test.describe("Ubah Kata Sandi - Relawan", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);

    await loginBAPPEDA({
      NIK: credentials.relawan.NIK,
      page,
      password: credentials.relawan.password,
    });

    await expect(page).toHaveURL(/profil-relawan/);

    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("button", { name: "Ubah Kata Sandi" }).first().click();

    await expect(page).toHaveURL(/ubah-password/);
    await expect(page.getByRole("heading", { name: "Ubah Kata Sandi" })).toBeVisible();
  });

  // TCP.21 Akses halaman ubah kata sandi
  test("TCP.21 Relawan opens the change password page", async ({ page }) => {
    await expect(sandiLamaField(page)).toBeVisible();
    await expect(sandiBaruField(page)).toBeVisible();
    await expect(konfirmasiSandiField(page)).toBeVisible();

    // Tombol simpan terkunci sampai seluruh syarat terpenuhi
    await expect(submitPasswordButton(page)).toBeDisabled();
  });

  // TCP.22 Syarat kata sandi baru
  test("TCP.22 Relawan sees the new password requirements", async ({ page }) => {
    for (const syarat of [/minimal 8 karakter/i, /mengandung angka/i, /karakter spesial/i]) {
      await expect(formPassword(page).getByText(syarat)).toBeVisible();
    }

    // Tiap syarat diuji satu per satu lewat peringatan yang muncul saat belum terpenuhi
    const kasusKurang = ["abc", "abcdefgh", "abcdefg1", "abcdefgh!"];
    for (const sandi of kasusKurang) {
      await sandiBaruField(page).fill(sandi);
      await expect(page.getByText(/harap penuhi semua syarat kata sandi/i)).toBeVisible();
    }

    await sandiBaruField(page).fill("Rahasia123!");
    await expect(page.getByText(/harap penuhi semua syarat kata sandi/i)).toBeHidden();
  });

  // TCP.23 Konfirmasi kata sandi
  test("TCP.23 Relawan confirms the new password", async ({ page }) => {
    await sandiBaruField(page).fill("Rahasia123!");
    await konfirmasiSandiField(page).fill("Rahasia999!");

    await expect(page.getByText("Kata Sandi tidak cocok.")).toBeVisible();
    await expect(submitPasswordButton(page)).toBeDisabled();

    await konfirmasiSandiField(page).fill("Rahasia123!");

    await expect(page.getByText("Kata sandi cocok")).toBeVisible();
  });

  // TCP.24 Negative: kata sandi lama salah
  test("TCP.24 Relawan enters a wrong current password", async ({ page }) => {
    // Kata sandi lama diverifikasi ke server sambil mengetik (debounce 700ms),
    // dan tombol simpan tetap terkunci selama hasilnya belum valid — sehingga
    // kata sandi akun tidak pernah benar-benar berubah saat pengujian.
    await sandiLamaField(page).fill("KataSandiLamaSalah123");

    await expect(page.getByText(/kata sandi lama tidak sesuai/i)).toBeVisible({ timeout: 20_000 });

    await sandiBaruField(page).fill("Rahasia123!");
    await konfirmasiSandiField(page).fill("Rahasia123!");

    await expect(submitPasswordButton(page)).toBeDisabled();
  });

  // TCP.25 Lihat / sembunyikan kata sandi
  test("TCP.25 Relawan toggles password visibility", async ({ page }) => {
    const kolom = [
      { field: sandiLamaField(page), id: "old-password" },
      { field: sandiBaruField(page), id: "new-password" },
      { field: konfirmasiSandiField(page), id: "confirm-password" },
    ];

    for (const { field, id } of kolom) {
      await field.fill("Rahasia123!");
      await expect(field).toHaveAttribute("type", "password");

      await toggleLihatSandi(page, id).click();
      await expect(field).toHaveAttribute("type", "text");

      await toggleLihatSandi(page, id).click();
      await expect(field).toHaveAttribute("type", "password");
    }
  });
});

/* ======================================
   PEMBATASAN AKSES
====================================== */

// TCP.26 Halaman profil tiap role tidak bisa diakses role lain
test("TCP.26 Super Admin cannot access the Relawan profile pages", async ({ page }) => {
  await page.goto(BASE_URL);

  await loginBAPPEDA({
    NIK: credentials.superAdmin.NIK,
    page,
    password: credentials.superAdmin.password,
  });

  await expect(page).toHaveURL(/dashboard/);

  for (const rute of ["profil-relawan", "ubah-password"]) {
    await page.goto(`${BASE_URL}${rute}`);
    await expect(page).toHaveURL(/unauthorized/);
  }
});

test("TCP.27 Relawan cannot access the admin profile page", async ({ page }) => {
  await page.goto(BASE_URL);

  await loginBAPPEDA({
    NIK: credentials.relawan.NIK,
    page,
    password: credentials.relawan.password,
  });

  await expect(page).toHaveURL(/profil-relawan/);

  await page.goto(`${BASE_URL}profil`);

  await expect(page).toHaveURL(/unauthorized/);
  await expect(page.getByRole("heading", { name: "Informasi Pribadi" })).toBeHidden();
});
