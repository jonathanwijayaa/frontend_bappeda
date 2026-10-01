/// <reference types="node" />
import { credentials } from "@/helpers/credentials.helper";
import { APIRequestContext, expect, request as playwrightRequest, test } from "@playwright/test";

/**
 * Security Testing — SQL Injection tingkat API (backend langsung)
 *
 * Berbeda dengan sqlInjection.spec.ts yang lewat UI, file ini menembak endpoint
 * backend SECARA LANGSUNG sehingga payload TIDAK tersaring lebih dulu oleh
 * sanitasi di sisi klien (mis. field NIK yang membuang non-angka, atau filter
 * pencarian yang berjalan di browser). Inilah yang benar-benar menguji apakah
 * query database aman (parameterized), bukan sekadar menguji pertahanan form.
 *
 * Pengujian ini DEFENSIF terhadap sistem milik sendiri: setiap test memastikan
 * server MENOLAK/menetralkan payload —
 *   1. Auth bypass gagal   — login payload tidak pernah mengembalikan token.
 *   2. Tidak ada 5xx       — query tidak "pecah"; input diperlakukan sebagai data.
 *   3. Tidak ada kebocoran — respons tidak memuat error DB mentah.
 *   4. Tidak time-based    — payload SLEEP/pg_sleep tidak menunda respons.
 *   5. Tautologi gagal     — "' OR 1=1" tidak membuka data lebih dari semestinya.
 */
test.describe.configure({ timeout: 90_000 });

// Base URL backend. Bisa ditimpa lewat VITE_API_URL; default mengikuti URL
// deployment yang dipakai frontend.
const API_BASE =
  process.env.VITE_API_URL?.replace(/\/$/, "") ?? "https://backend-skripsi-relawan.vercel.app/api";

// Payload SQLi klasik untuk auth bypass & manipulasi query.
const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "admin' --",
  "admin' #",
  "' OR 1=1--",
  '" OR ""="',
  "') OR ('1'='1",
  "'; DROP TABLE users; --",
  "1' UNION SELECT null, username, password FROM users --",
  "' OR 'x'='x",
];

// Payload time-based blind untuk MySQL (SLEEP) dan PostgreSQL (pg_sleep).
const TIME_BASED_PAYLOADS = [
  "x' OR SLEEP(5) --",
  "x'); SELECT pg_sleep(5); --",
  "x' OR pg_sleep(5) --",
];

// Tanda kebocoran error database mentah yang TIDAK boleh muncul di respons.
const SQL_ERROR_SIGNATURE =
  /syntax error|sequelize|unterminated|pg_|postgres|psql|mysql|sqlite|mariadb|ora-\d{4,}|odbc|jdbc|native client|quoted string not properly terminated|column .* does not exist|relation .* does not exist|near ".*": syntax/i;

const expectNoServerError = (status: number, body: string) => {
  // 5xx menandakan query kemungkinan "pecah" oleh payload — harus dihindari.
  expect(status, `Server membalas ${status}. Body: ${body.slice(0, 200)}`).toBeLessThan(500);
  expect(body).not.toMatch(SQL_ERROR_SIGNATURE);
};

test.describe("SQL Injection — API level", () => {
  let adminToken = "";
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: API_BASE });

    const res = await ctx.post("/auth/login", {
      data: { nik: credentials.superAdmin.NIK, password: credentials.superAdmin.password },
    });
    expect(res.ok(), "Login Super Admin gagal — cek kredensial / API_BASE").toBeTruthy();
    adminToken = (await res.json()).token;
    expect(adminToken, "Token login kosong").toBeTruthy();
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  const authHeader = () => ({ Authorization: `Bearer ${adminToken}` });

  // ── TCSQLA.1 Auth bypass pada endpoint login ─────────────────────────────
  test.describe("TCSQLA.1 Login endpoint rejects auth bypass", () => {
    for (const payload of SQLI_PAYLOADS) {
      test(`TCSQLA.1 login with ${JSON.stringify(payload)}`, async () => {
        const res = await ctx.post("/auth/login", {
          data: { nik: payload, password: payload },
        });
        const body = await res.text();

        // Tidak boleh berhasil login
        expect(res.status(), `Payload malah diterima (200). Body: ${body.slice(0, 200)}`).not.toBe(
          200,
        );
        expect(body).not.toContain("token");
        expectNoServerError(res.status(), body);
      });
    }

    // NIK valid + password payload — password tidak boleh menembus otentikasi
    test("TCSQLA.1 valid NIK with SQLi password is rejected", async () => {
      const res = await ctx.post("/auth/login", {
        data: { nik: credentials.superAdmin.NIK, password: "' OR '1'='1' --" },
      });
      const body = await res.text();

      expect(res.status()).not.toBe(200);
      expect(body).not.toContain("token");
      expect(body).toMatch(/password salah/i);
      expectNoServerError(res.status(), body);
    });

    // Payload di kolom NIK sekalipun tidak boleh memicu kebocoran/5xx
    test("TCSQLA.1 UNION-based payload in NIK is neutralized", async () => {
      const res = await ctx.post("/auth/login", {
        data: {
          nik: "1' UNION SELECT nik,password FROM users--",
          password: "x",
        },
      });
      const body = await res.text();

      expect(res.status()).not.toBe(200);
      expect(body).not.toContain("token");
      expectNoServerError(res.status(), body);
    });
  });

  // ── TCSQLA.2 Time-based blind SQL injection ──────────────────────────────
  test("TCSQLA.2 login endpoint is not vulnerable to time-based blind SQLi", async () => {
    // Baseline: waktu respons login gagal yang wajar
    const t0 = Date.now();
    await ctx.post("/auth/login", {
      data: { nik: credentials.superAdmin.NIK, password: "pasti-salah" },
    });
    const baselineMs = Date.now() - t0;

    for (const payload of TIME_BASED_PAYLOADS) {
      const start = Date.now();
      const res = await ctx.post("/auth/login", {
        data: { nik: credentials.superAdmin.NIK, password: payload },
      });
      const elapsed = Date.now() - start;
      const body = await res.text();

      // Bila SLEEP/pg_sleep(5) benar-benar dieksekusi, respons akan tertunda
      // ~5 detik. Ambang 3 detik memberi longgar dari jitter jaringan tetapi
      // tetap jauh di bawah 5 detik, sehingga penundaan nyata pasti tertangkap.
      expect(
        elapsed,
        `Respons tertunda ${elapsed}ms (baseline ${baselineMs}ms) untuk payload ${payload} — indikasi time-based SQLi`,
      ).toBeLessThan(3000);
      expect(res.status()).not.toBe(200);
      expectNoServerError(res.status(), body);
    }
  });

  // ── TCSQLA.3 Injeksi lewat query parameter (endpoint terproteksi) ────────
  test.describe("TCSQLA.3 Query parameters are safe against injection", () => {
    // Endpoint GET nyata yang dipakai aplikasi. `baseline` mengambil SELURUH
    // data secara wajar (nilai jinak), `inject` menaruh payload di parameter
    // yang sama. Hasil injeksi tidak boleh melebihi data penuh baseline.
    const getTargets = [
      {
        baseline: "/admin/logs?limit=1000",
        inject: (p: string) => `/admin/logs?limit=${encodeURIComponent(p)}`,
        name: "admin logs limit",
      },
      {
        baseline: "/opd?search=",
        inject: (p: string) => `/opd?search=${encodeURIComponent(p)}`,
        name: "opd search",
      },
    ];

    for (const target of getTargets) {
      test(`TCSQLA.3 ${target.name}`, async () => {
        // Baseline: jumlah data penuh pada permintaan normal
        const baseRes = await ctx.get(target.baseline, { headers: authHeader() });
        const baseJson = await baseRes.json().catch(() => ({}));
        const baseCount = Array.isArray(baseJson.data) ? baseJson.data.length : 0;

        for (const payload of SQLI_PAYLOADS) {
          const res = await ctx.get(target.inject(payload), { headers: authHeader() });
          const body = await res.text();

          expectNoServerError(res.status(), body);

          // Tautologi tidak boleh membuka baris lebih banyak dari data penuh —
          // payload diperlakukan sebagai nilai parameter biasa, bukan SQL.
          if (res.ok()) {
            const json = JSON.parse(body);
            if (Array.isArray(json.data)) {
              expect(
                json.data.length,
                `Payload ${payload} mengembalikan ${json.data.length} baris > data penuh ${baseCount}`,
              ).toBeLessThanOrEqual(baseCount);
            }
          }
        }
      });
    }
  });

  // ── TCSQLA.4 Injeksi lewat body POST (buat data) ─────────────────────────
  test("TCSQLA.4 create OPD endpoint rejects SQLi in the body", async () => {
    for (const payload of ["'; DROP TABLE opd; --", "' OR '1'='1", "test'); DELETE FROM opd;--"]) {
      const res = await ctx.post("/opd", {
        data: {
          alamat: "Jl. Uji Keamanan No. 1, Yogyakarta",
          kontak: "081200000001",
          nama_opd: payload,
          nik_pic: "3201000000000001",
          pic: "Budi Santoso",
          status: "Aktif",
        },
        headers: authHeader(),
      });
      const body = await res.text();

      // Payload tidak boleh tersimpan sebagai OPD baru (ditolak validasi),
      // dan tidak boleh memicu error server / kebocoran DB.
      expect(
        res.status(),
        `Payload "${payload}" malah dibuat (2xx). Body: ${body.slice(0, 200)}`,
      ).toBeGreaterThanOrEqual(400);
      expectNoServerError(res.status(), body);
    }
  });

  // ── TCSQLA.5 Endpoint terproteksi menolak akses tanpa token ──────────────
  // Memastikan payload tidak bisa dikirim sebagai anonim (injeksi tetap butuh
  // otorisasi, sekaligus memverifikasi endpoint tidak bocor tanpa auth).
  test("TCSQLA.5 protected endpoint refuses SQLi without a valid token", async () => {
    const res = await ctx.get(`/admin/logs?limit=${encodeURIComponent("' OR 1=1--")}`);
    const body = await res.text();

    expect([401, 403]).toContain(res.status());
    expectNoServerError(res.status(), body);
  });
});
