/// <reference types="node" />
import { credentials } from "@/helpers/credentials.helper";
import { APIRequestContext, expect, request as playwrightRequest, test } from "@playwright/test";

/**
 * Security Testing — Broken Access Control (OWASP A01)
 *
 * Menguji langsung ke backend bahwa otorisasi ditegakkan di sisi server, bukan
 * hanya disembunyikan di UI. Pengujian DEFENSIF terhadap sistem sendiri:
 * setiap test memastikan server MENOLAK akses yang tidak berhak.
 *
 * Yang dinilai:
 *   1. Kontrol vertikal   — peran rendah tidak bisa memakai endpoint peran tinggi
 *                           (privilege escalation gagal).
 *   2. Kontrol horizontal — satu OPD tidak bisa menyentuh data OPD lain (IDOR).
 *   3. Autentikasi        — tanpa token / token rusak / token dipalsukan ditolak.
 */
test.describe.configure({ timeout: 90_000 });

const API_BASE =
  process.env.VITE_API_URL?.replace(/\/$/, "") ?? "https://backend-skripsi-relawan.vercel.app/api";

// Endpoint nyata yang dipakai aplikasi, dikelompokkan per peran yang berhak.
const ADMIN_ONLY = ["/admin/logs?limit=5", "/admin/relawan", "/opd", "/kader"];
const OPD_ONLY = ["/opd-admin/relawan", "/opd-admin/kader"];
const RELAWAN_ONLY = ["/relawan/profile"];

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

const expectNoServerError = (status: number, body: string) => {
  expect(status, `Server membalas ${status}. Body: ${body.slice(0, 200)}`).toBeLessThan(500);
};

test.describe("Broken Access Control — API level", () => {
  let ctx: APIRequestContext;
  const token: Record<"opd" | "relawan" | "superAdmin", string> = {
    opd: "",
    relawan: "",
    superAdmin: "",
  };

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: API_BASE });

    for (const role of ["superAdmin", "opd", "relawan"] as const) {
      const res = await ctx.post("/auth/login", {
        data: { nik: credentials[role].NIK, password: credentials[role].password },
      });
      expect(res.ok(), `Login ${role} gagal`).toBeTruthy();
      token[role] = (await res.json()).token;
      expect(token[role], `Token ${role} kosong`).toBeTruthy();
    }
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  // ── TCAC.1 Kontrol akses vertikal (privilege escalation) ─────────────────
  // Matriks: tiap peran hanya boleh pada kelompok endpoint-nya sendiri.
  const matrix = [
    { boleh: ADMIN_ONLY, label: "Super Admin", role: "superAdmin" as const },
    { boleh: OPD_ONLY, label: "OPD", role: "opd" as const },
    { boleh: RELAWAN_ONLY, label: "Relawan", role: "relawan" as const },
  ];
  const allEndpoints = [...ADMIN_ONLY, ...OPD_ONLY, ...RELAWAN_ONLY];

  for (const subjek of matrix) {
    for (const endpoint of allEndpoints) {
      const seharusnyaBoleh = subjek.boleh.includes(endpoint);

      test(`TCAC.1 ${subjek.label} ${seharusnyaBoleh ? "boleh" : "DITOLAK"} GET ${endpoint}`, async () => {
        const res = await ctx.get(endpoint, { headers: bearer(token[subjek.role]) });
        const body = await res.text();

        if (seharusnyaBoleh) {
          expect(res.status(), `${subjek.label} seharusnya boleh: ${body.slice(0, 150)}`).toBe(200);
        } else {
          // Peran lain harus ditolak (403 Forbidden), bukan 200
          expect(
            res.status(),
            `${subjek.label} TIDAK boleh mengakses ${endpoint}, tetapi dapat ${res.status()}`,
          ).toBe(403);
        }
        expectNoServerError(res.status(), body);
      });
    }
  }

  // ── TCAC.2 Peran rendah tidak bisa menulis lewat endpoint admin ──────────
  test("TCAC.2 Relawan cannot create data via an admin-only endpoint", async () => {
    const res = await ctx.post("/opd", {
      data: {
        alamat: "Jl. Uji Otorisasi No. 1",
        kontak: "081200000001",
        nama_opd: "OPD Uji Otorisasi",
        nik_pic: "3201000000000001",
        pic: "Budi Santoso",
        status: "Aktif",
      },
      headers: bearer(token.relawan),
    });
    const body = await res.text();

    expect(res.status(), `Relawan malah bisa membuat OPD. Body: ${body.slice(0, 150)}`).toBe(403);
    expectNoServerError(res.status(), body);
  });

  test("TCAC.2 OPD cannot create data via an admin-only endpoint", async () => {
    const res = await ctx.post("/opd", {
      data: {
        alamat: "Jl. Uji Otorisasi No. 2",
        kontak: "081200000002",
        nama_opd: "OPD Uji Otorisasi 2",
        nik_pic: "3201000000000002",
        pic: "Citra Dewi",
        status: "Aktif",
      },
      headers: bearer(token.opd),
    });
    const body = await res.text();

    expect(res.status(), `OPD malah bisa membuat OPD. Body: ${body.slice(0, 150)}`).toBe(403);
    expectNoServerError(res.status(), body);
  });

  // ── TCAC.3 Kontrol akses horizontal / IDOR ───────────────────────────────
  test("TCAC.3 OPD only sees relawan from its own instansi", async () => {
    const saRes = await ctx.get("/admin/relawan", { headers: bearer(token.superAdmin) });
    const opdRes = await ctx.get("/opd-admin/relawan", { headers: bearer(token.opd) });

    const saData = (await saRes.json()).data as unknown[];
    const opdData = (await opdRes.json()).data as unknown[];

    // OPD melihat sebagian (data instansinya), Super Admin melihat seluruhnya.
    // OPD juga tidak boleh menembus endpoint tak ter-scope (/admin/relawan → 403).
    expect(opdData.length).toBeGreaterThan(0);
    expect(opdData.length).toBeLessThan(saData.length);
  });

  test("TCAC.3 OPD cannot modify a relawan belonging to another instansi (IDOR)", async () => {
    // Cari relawan yang TIDAK ada di daftar milik OPD ini
    const saData = (
      await (await ctx.get("/admin/relawan", { headers: bearer(token.superAdmin) })).json()
    ).data as { relawan_id: number }[];
    const opdData = (
      await (await ctx.get("/opd-admin/relawan", { headers: bearer(token.opd) })).json()
    ).data as { relawan_id: number }[];

    const opdIds = new Set(opdData.map((r) => r.relawan_id));
    const foreign = saData.find((r) => !opdIds.has(r.relawan_id));
    expect(foreign, "Tidak ada relawan milik OPD lain untuk diuji").toBeTruthy();

    // Body sengaja dikosongkan: kalau otorisasi bocor pun, tidak ada data yang
    // berubah. Yang benar: server menolak karena bukan milik instansi ini.
    const res = await ctx.put(`/opd-admin/relawan/${foreign!.relawan_id}`, {
      data: {},
      headers: bearer(token.opd),
    });
    const body = await res.text();

    expect(
      res.status(),
      `OPD malah bisa menyentuh relawan milik OPD lain (${res.status()}). Body: ${body.slice(0, 150)}`,
    ).toBe(403);
    expectNoServerError(res.status(), body);
  });

  // ── TCAC.4 Autentikasi: token wajib, tidak boleh dipalsukan ──────────────
  test("TCAC.4 protected endpoints reject requests without a token", async () => {
    for (const endpoint of [...ADMIN_ONLY, ...OPD_ONLY, ...RELAWAN_ONLY]) {
      const res = await ctx.get(endpoint);
      expect([401, 403], `${endpoint} tanpa token seharusnya ditolak`).toContain(res.status());
    }
  });

  test("TCAC.4 a garbage / malformed token is rejected", async () => {
    const res = await ctx.get("/admin/relawan", { headers: bearer("ini.token.palsu") });
    expect(res.status()).toBe(401);
  });

  test("TCAC.4 a JWT with a tampered role is rejected (signature verified)", async () => {
    // Ambil token OPD, ubah payload-nya menjadi super_admin, biarkan signature.
    // Kalau server memverifikasi tanda tangan, token ini harus ditolak.
    const [header, , signature] = token.opd.split(".");
    const payload = JSON.parse(
      Buffer.from(token.opd.split(".")[1], "base64").toString("utf8"),
    ) as Record<string, unknown>;
    payload.role = "super_admin";
    payload.opd_id = null;
    const forgedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const forgedToken = `${header}.${forgedPayload}.${signature}`;

    for (const endpoint of ADMIN_ONLY) {
      const res = await ctx.get(endpoint, { headers: bearer(forgedToken) });
      expect(
        res.status(),
        `Token palsu berhasil mengakses ${endpoint} — tanda tangan JWT tidak diverifikasi!`,
      ).toBe(401);
    }
  });
});
