/// <reference types="node" />
import { credentials } from "@/helpers/credentials.helper";
import {
  APIRequestContext,
  APIResponse,
  expect,
  request as playwrightRequest,
  test,
} from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Load Testing per Test Case TCLT.01–TCLT.23 (REFERENSI)
 * ─────────────────────────────────────────────────────────────────────────────
 * Setiap test di file ini mengikuti satu baris sheet "Load Testing Test Case"
 * (Test Case Bappeda.xlsx): jumlah Virtual User (VU), ramp-up, durasi, step
 * stress, dan fase spike ditulis persis seperti rancangan di kolom F–H.
 *
 * Model eksekusi meniru executor `ramping-vus` k6: setiap VU adalah perulangan
 * async yang menjalankan satu "flow" (serangkaian request API) lalu berhenti
 * sejenak (think time). Jumlah VU aktif mengikuti tahapan (stages) secara linear.
 *
 * SKALA
 * ─────────────────────────────────────────────────────────────────────────────
 * Rancangan asli (mis. 800 VU, soak 2 jam) tidak realistis dijalankan dari satu
 * laptop ke deployment Vercel produksi: proteksi edge Vercel memblokir IP penguji
 * dengan HTTP 403 (lihat CATATAN-LOADTEST.md). Karena itu beban DISKALAKAN:
 *   LT_VU_SCALE   — pengali jumlah VU            (default 0.05 → 100 VU jadi 5 VU)
 *   LT_TIME_SCALE — pengali ramp-up & durasi     (default 0.05 → 5 menit jadi 15 detik)
 * Jalankan sesuai rancangan penuh (mis. ke backend lokal):
 *   LT_VU_SCALE=1 LT_TIME_SCALE=1 VITE_API_URL=http://localhost:3000/api \
 *     npx playwright test performance/loadTestCases.spec.ts --project=chromium
 *
 * Environment variable lain:
 *   VITE_API_URL  — base URL backend   (default deployment Vercel)
 *   LOAD_BASE_URL — base URL frontend  (default deployment Vercel)
 *   LT_THINK_MS   — think time per iterasi VU dalam ms (default 1000)
 *   LT_STRICT     — "1" = kriteria Expected Result menjadi assertion keras;
 *                   default lunak (dicatat di anotasi, konsol, dan JSON)
 *   LT_OUT_DIR    — folder hasil JSON (default test-results/load-testing)
 *
 * Contoh menjalankan satu test case:
 *   npx playwright test performance/loadTestCases.spec.ts --project=chromium -g "TCLT.03"
 *
 * Hanya endpoint baca (GET) dan login yang ditembak. Tidak ada data yang ditulis,
 * sehingga TC yang menuntut penulisan data atau fitur yang tidak ada di aplikasi
 * (Sign Up, unggah foto profil) di-skip dengan alasan yang jelas.
 */

test.describe.configure({ mode: "serial", timeout: 0 });

const API = (process.env.VITE_API_URL ?? "https://backend-skripsi-relawan.vercel.app/api").replace(
  /\/$/,
  "",
);
const FRONTEND = (process.env.LOAD_BASE_URL ?? "https://frontend-bappeda.vercel.app").replace(
  /\/$/,
  "",
);

const VU_SCALE = Number(process.env.LT_VU_SCALE ?? 0.05);
const TIME_SCALE = Number(process.env.LT_TIME_SCALE ?? 0.05);
const THINK_MS = Number(process.env.LT_THINK_MS ?? 1000);
const STRICT = process.env.LT_STRICT === "1";
const OUT_DIR = process.env.LT_OUT_DIR ?? join("test-results", "load-testing");

// ── Profil beban (setara stages k6) ─────────────────────────────────────────
type Stage = { sec: number; vus: number; label: string };

const vu = (n: number) => Math.max(1, Math.round(n * VU_SCALE));
const sec = (n: number) => Math.max(1, Math.round(n * TIME_SCALE));

/** Ramp-up lalu tahan: "N VU, ramp X, durasi Y". */
const rampHold = (vus: number, rampSec: number, holdSec: number): Stage[] => [
  { label: "ramp-up", sec: sec(rampSec), vus: vu(vus) },
  { label: "sustain", sec: sec(holdSec), vus: vu(vus) },
];

/** Stress bertahap: dari `from` ke `to` dengan kenaikan `step`, tiap step ditahan `holdSec`. */
const steps = (from: number, to: number, step: number, holdSec: number): Stage[] => {
  const out: Stage[] = [];
  for (let n = from; n <= to; n += step) {
    out.push({ label: `step ${n} VU`, sec: 1, vus: vu(n) });
    out.push({ label: `step ${n} VU`, sec: sec(holdSec), vus: vu(n) });
  }
  return out;
};

/** Spike: baseline → lonjakan dalam ≤15 dtk → tahan → kembali ke baseline → pemulihan. */
const spike = (base: number, peak: number, peakSec: number, recoverSec: number): Stage[] => [
  { label: "baseline", sec: sec(60), vus: vu(base) },
  { label: "spike", sec: sec(15), vus: vu(peak) },
  { label: "spike", sec: sec(peakSec), vus: vu(peak) },
  { label: "recovery", sec: sec(15), vus: vu(base) },
  { label: "recovery", sec: sec(recoverSec), vus: vu(base) },
];

// ── Metrik ──────────────────────────────────────────────────────────────────
type Sample = {
  name: string;
  stage: string;
  status: number;
  ok: boolean;
  ms: number;
  valid: boolean;
};

type Summary = {
  requests: number;
  errorPct: number;
  status5xx: number;
  invalidPct: number;
  throughput: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  max: number;
  statusCounts: Record<string, number>;
};

const pct = (sorted: number[], p: number) =>
  sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))]
    : 0;
const r2 = (n: number) => Math.round(n * 100) / 100;

const summarize = (samples: Sample[], wallMs: number): Summary => {
  const ms = samples.map((s) => s.ms).sort((a, b) => a - b);
  const n = samples.length || 1;
  const statusCounts: Record<string, number> = {};
  for (const s of samples) {
    const k = s.status === 0 ? "ERR" : String(s.status);
    statusCounts[k] = (statusCounts[k] ?? 0) + 1;
  }
  return {
    avg: r2(ms.reduce((a, b) => a + b, 0) / n),
    errorPct: r2((samples.filter((s) => !s.ok).length / n) * 100),
    invalidPct: r2((samples.filter((s) => s.ok && !s.valid).length / n) * 100),
    max: ms[ms.length - 1] ?? 0,
    p50: pct(ms, 50),
    p90: pct(ms, 90),
    p95: pct(ms, 95),
    requests: samples.length,
    status5xx: samples.filter((s) => s.status >= 500).length,
    statusCounts,
    throughput: r2(samples.length / (wallMs / 1000 || 1)),
  };
};

// ── Sesi (token) per peran ─────────────────────────────────────────────────
type Role = "superAdmin" | "opd" | "relawan";
const tokens: Partial<Record<Role, string>> = {};

const creds = (role: Role) => credentials[role];

const doLogin = async (api: APIRequestContext, role: Role) => {
  const t0 = Date.now();
  const res = await api.post(`${API}/auth/login`, {
    data: { nik: creds(role).NIK, password: creds(role).password },
    failOnStatusCode: false,
  });
  const ms = Date.now() - t0;
  const body = res.ok() ? await res.json().catch(() => ({})) : {};
  return { body, ms, res };
};

const auth = (role: Role) => ({ Authorization: `Bearer ${tokens[role] ?? ""}` });

// ── Flow per iterasi VU ─────────────────────────────────────────────────────
type Ctx = {
  api: APIRequestContext;
  record: (s: Omit<Sample, "stage">) => void;
  vuId: number;
  iter: number;
};
type Validator = (body: any) => boolean;

/** Satu GET API terukur + validasi isi respons (struktur/scoping). */
const get = async (
  ctx: Ctx,
  role: Role,
  path: string,
  validate: Validator = (b) => b?.success === true,
) => {
  const t0 = Date.now();
  let res: APIResponse | undefined;
  try {
    res = await ctx.api.get(`${API}${path}`, { failOnStatusCode: false, headers: auth(role) });
  } catch {
    ctx.record({ ms: Date.now() - t0, name: path, ok: false, status: 0, valid: false });
    return;
  }
  const ms = Date.now() - t0;
  const body = res.ok() ? await res.json().catch(() => null) : null;
  ctx.record({
    ms,
    name: `${role} GET ${path.split("?")[0]}`,
    ok: res.ok(),
    status: res.status(),
    valid: !!body && validate(body),
  });
};

const isArray: Validator = (b) => b?.success === true && Array.isArray(b.data);

const flows = {
  // Halaman frontend (homepage / login)
  homepage: async (ctx: Ctx) => {
    const t0 = Date.now();
    const res = await ctx.api
      .get(`${FRONTEND}/`, { failOnStatusCode: false })
      .catch(() => undefined);
    const html = res?.ok() ? await res.text() : "";
    ctx.record({
      ms: Date.now() - t0,
      name: "GET /",
      ok: !!res?.ok(),
      status: res?.status() ?? 0,
      valid: html.includes('<div id="root"'),
    });
  },
  // Login peran tertentu; valid bila token dan peran di respons sesuai
  login: (role: Role) => async (ctx: Ctx) => {
    const { body, ms, res } = await doLogin(ctx.api, role);
    ctx.record({
      ms,
      name: `login ${role}`,
      ok: res.ok(),
      status: res.status(),
      valid: typeof body?.token === "string",
    });
  },
  // Pencarian di aplikasi bersifat client-side: beban server = daftar yang dicari
  search: async (ctx: Ctx) => {
    const target = [
      ["superAdmin", "/admin/relawan"],
      ["superAdmin", "/opd"],
      ["opd", "/opd-admin/relawan"],
      ["opd", "/opd-admin/kader"],
    ] as const;
    const [role, path] = target[(ctx.vuId + ctx.iter) % target.length];
    await get(ctx, role, path, isArray);
  },
  // Dashboard Relawan = halaman profil relawan; scoping: NIK sama dengan akun login
  relawanDashboard: async (ctx: Ctx) => {
    await get(ctx, "relawan", "/relawan/profile", (b) => b?.data?.nik === creds("relawan").NIK);
    await get(ctx, "relawan", "/relawan/penugasan", isArray);
  },
  opdDashboard: async (ctx: Ctx) => {
    await get(
      ctx,
      "opd",
      "/opd-admin/dashboard",
      (b) => b?.success === true && typeof b.data?.nama_opd === "string",
    );
  },
  manajemenOPD: async (ctx: Ctx) => {
    await get(ctx, "superAdmin", "/opd", isArray);
  },
  // Scoping: seluruh relawan yang dikembalikan untuk OPD berasal dari satu OPD
  dataRelawanOPD: async (ctx: Ctx) => {
    await get(ctx, "opd", "/opd-admin/relawan", isArray);
    await get(
      ctx,
      "opd",
      "/admin/sk",
      (b) => isArray(b) && new Set(b.data.map((r: any) => r.opd_id)).size <= 1,
    );
  },
  dataRelawanFull: async (ctx: Ctx) => {
    await get(ctx, "superAdmin", "/admin/relawan", isArray);
  },
  suratKeputusan: async (ctx: Ctx) => {
    await get(ctx, ctx.vuId % 2 ? "opd" : "superAdmin", "/admin/sk", isArray);
    if (skIds.length) {
      const id = skIds[(ctx.vuId + ctx.iter) % skIds.length];
      await get(
        ctx,
        "superAdmin",
        `/admin/sk/${id}/pdf`,
        (b) => b?.success === true && !!b.data?.file_path,
      );
    }
  },
  // Log Aktivitas hanya dapat diakses Super Admin (OPD mendapat 403)
  logs: async (ctx: Ctx) => {
    await get(ctx, "superAdmin", "/admin/logs?limit=50", isArray);
  },
  statistikSA: async (ctx: Ctx) => {
    await get(
      ctx,
      "superAdmin",
      "/admin/dashboard",
      (b) => b?.success === true && !!b.data?.ringkasan,
    );
    await get(ctx, "superAdmin", "/statistik/gender", isArray);
    await get(ctx, "superAdmin", "/statistik/kader-per-opd", isArray);
  },
  statistikOPD: async (ctx: Ctx) => {
    await get(ctx, "opd", "/statistik/kelurahan", isArray);
    await get(ctx, "opd", "/statistik/relawan-per-kader", isArray);
  },
  // Relawan tidak punya halaman Statistik; statistik personalnya = riwayat pribadi
  statistikRelawan: async (ctx: Ctx) => {
    await get(
      ctx,
      "relawan",
      "/relawan/history",
      (b) => b?.success === true && !!b.data?.riwayat_penugasan,
    );
  },
  download: async (ctx: Ctx) => {
    if (skIds.length) {
      const id = skIds[(ctx.vuId + ctx.iter) % skIds.length];
      await get(
        ctx,
        ctx.vuId % 2 ? "opd" : "superAdmin",
        `/admin/sk/${id}/pdf`,
        (b) => b?.success === true && !!b.data?.file_path,
      );
    }
  },
};

/** Campuran peran: bobot = jumlah VU per peran pada rancangan. */
const mix = (weights: [number, (ctx: Ctx) => Promise<void>][]) => async (ctx: Ctx) => {
  const total = weights.reduce((a, [w]) => a + w, 0);
  let pick = ctx.vuId % total;
  for (const [w, flow] of weights) {
    if (pick < w) return flow(ctx);
    pick -= w;
  }
};

const mixedRoles = mix([
  [80, async (ctx) => (ctx.iter === 0 ? flows.login("relawan")(ctx) : flows.relawanDashboard(ctx))],
  [
    20,
    async (ctx) =>
      ctx.iter === 0
        ? flows.login("opd")(ctx)
        : ctx.iter % 2
          ? flows.opdDashboard(ctx)
          : flows.dataRelawanOPD(ctx),
  ],
  [
    3,
    async (ctx) =>
      ctx.iter === 0
        ? flows.login("superAdmin")(ctx)
        : ctx.iter % 2
          ? flows.statistikSA(ctx)
          : flows.search(ctx),
  ],
]);

let skIds: number[] = [];

// ── Eksekutor ramping-VU ───────────────────────────────────────────────────
type Run = {
  overall: Summary;
  perStage: Record<string, Summary>;
  stoppedEarly: boolean;
  wallMs: number;
};

const runStages = async (
  api: APIRequestContext,
  stages: Stage[],
  flow: (ctx: Ctx) => Promise<void>,
  stopStage?: (s: Summary) => boolean,
): Promise<Run> => {
  const samples: Sample[] = [];
  const stageTimes: Record<string, { start: number; end: number }> = {};
  let current = 0;
  let desired = 0;
  let stageLabel = stages[0].label;
  let stop = false;
  let stoppedEarly = false;
  const active = new Set<Promise<void>>();

  const vuLoop = async (vuId: number) => {
    let iter = 0;
    while (!stop && vuId < desired) {
      const label = stageLabel;
      await flow({ api, iter, record: (s) => samples.push({ ...s, stage: label }), vuId });
      iter++;
      await new Promise((r) => setTimeout(r, THINK_MS));
    }
  };

  const t0 = Date.now();
  let from = 0;
  for (const [i, st] of stages.entries()) {
    const start = Date.now();
    stageLabel = st.label;
    stageTimes[st.label] ??= { end: start, start };
    while (Date.now() - start < st.sec * 1000) {
      const f = Math.min(1, (Date.now() - start) / (st.sec * 1000));
      desired = Math.round(from + (st.vus - from) * f);
      while (current < desired) {
        const p = vuLoop(current);
        active.add(p);
        p.finally(() => active.delete(p));
        current++;
      }
      if (current > desired) current = desired; // VU dengan id >= desired berhenti sendiri
      await new Promise((r) => setTimeout(r, 250));
    }
    from = st.vus;
    stageTimes[st.label].end = Date.now();
    // Stress "sampai titik gagal": dinilai di akhir step (bukan di fase naiknya);
    // berhenti bila step ini sudah melewati ambang
    if (stopStage && stages[i + 1]?.label !== st.label) {
      const stageSamples = samples.filter((s) => s.stage === st.label);
      if (
        stageSamples.length &&
        stopStage(summarize(stageSamples, Date.now() - stageTimes[st.label].start))
      ) {
        stoppedEarly = st !== stages[stages.length - 1];
        break;
      }
    }
  }
  stop = true;
  desired = 0;
  await Promise.all([...active]);
  const wallMs = Date.now() - t0;

  const perStage: Record<string, Summary> = {};
  for (const [label, t] of Object.entries(stageTimes)) {
    perStage[label] = summarize(
      samples.filter((s) => s.stage === label),
      t.end - t.start,
    );
  }
  return { overall: summarize(samples, wallMs), perStage, stoppedEarly, wallMs };
};

// ── Kriteria Expected Result ───────────────────────────────────────────────
type Check = { criterion: string; pass: boolean; actual: string };
const results: Record<string, unknown>[] = [];

const standard = (s: Summary, p90Ms = 3000, maxErr = 1): Check[] => [
  {
    actual: `p90 ${s.p90} ms`,
    criterion: `90% respons < ${p90Ms / 1000} dtk`,
    pass: s.p90 < p90Ms,
  },
  { actual: `${s.errorPct}%`, criterion: `error rate < ${maxErr}%`, pass: s.errorPct < maxErr },
  {
    actual: `${s.status5xx} respons 5xx`,
    criterion: "tidak ada HTTP 5xx",
    pass: s.status5xx === 0,
  },
  {
    actual: `${s.invalidPct}% respons tidak valid`,
    criterion: "isi respons benar (struktur/scoping)",
    pass: s.invalidPct === 0,
  },
];

const report = (id: string, design: string, run: Run, checks: Check[]) => {
  const s = run.overall;
  console.log(`\n──────── ${id} ────────`);
  console.log(`  Rancangan : ${design}`);
  console.log(`  Skala     : VU x${VU_SCALE}, waktu x${TIME_SCALE}, think ${THINK_MS} ms`);
  console.log(
    `  Hasil     : ${s.requests} req, ${s.throughput} req/s, avg ${s.avg} ms, p90 ${s.p90} ms, p95 ${s.p95} ms, error ${s.errorPct}%`,
  );
  console.log(
    `  Status    : ${Object.entries(s.statusCounts)
      .map(([k, v]) => `${k}:${v}`)
      .join(" ")}`,
  );
  if (Object.keys(run.perStage).length > 1) {
    for (const [label, st] of Object.entries(run.perStage)) {
      console.log(
        `    ${label.padEnd(14)} ${String(st.requests).padStart(5)} req | p90 ${String(st.p90).padStart(5)} ms | error ${st.errorPct}%`,
      );
    }
  }
  if (run.stoppedEarly)
    console.log("  Titik gagal tercapai sebelum step terakhir; step berikutnya tidak dijalankan.");
  for (const c of checks) console.log(`  ${c.pass ? "✔" : "✘"} ${c.criterion} → ${c.actual}`);

  const verdict = checks.every((c) => c.pass) ? "PASS" : "FAIL";
  test.info().annotations.push({
    description: `${verdict}: ${
      checks
        .filter((c) => !c.pass)
        .map((c) => c.criterion)
        .join("; ") || "semua kriteria terpenuhi"
    }`,
    type: id,
  });
  results.push({
    checks,
    design,
    id,
    overall: s,
    perStage: run.perStage,
    stoppedEarly: run.stoppedEarly,
    verdict,
    wallMs: run.wallMs,
  });

  expect(s.requests, `${id}: tidak ada request yang terkirim`).toBeGreaterThan(0);
  if (STRICT)
    for (const c of checks) expect.soft(c.pass, `${id}: ${c.criterion} (${c.actual})`).toBe(true);
};

/** Titik gagal stress: step dengan error > 5% atau p90 melewati batas waktu. */
const breaking = (p90Ms: number) => (s: Summary) => s.errorPct > 5 || s.p90 > p90Ms;

const firstBreak = (run: Run, p90Ms: number) =>
  Object.entries(run.perStage).find(([, s]) => breaking(p90Ms)(s))?.[0] ?? "tidak tercapai";

/** Pemulihan spike: p90 fase recovery kembali ≤ 1,5x p90 baseline. */
const recovered = (run: Run): Check => {
  const b = run.perStage.baseline?.p90 ?? 0;
  const r = run.perStage.recovery?.p90 ?? 0;
  return {
    actual: `baseline p90 ${b} ms, recovery p90 ${r} ms`,
    criterion: "pulih ke baseline setelah spike",
    pass: r > 0 && r <= Math.max(b * 1.5, b + 200),
  };
};

// ── Test ───────────────────────────────────────────────────────────────────
test.describe("Load Testing Test Case (TCLT)", () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    api = await playwrightRequest.newContext({ extraHTTPHeaders: { Accept: "application/json" } });
    for (const role of ["superAdmin", "opd", "relawan"] as Role[]) {
      const { body } = await doLogin(api, role);
      tokens[role] = body?.token;
    }
    const sk = await api.get(`${API}/admin/sk`, {
      failOnStatusCode: false,
      headers: auth("superAdmin"),
    });
    const list = sk.ok() ? ((await sk.json()).data ?? []) : [];
    skIds = list
      .filter((r: any) => r.has_file)
      .map((r: any) => r.sk_id)
      .slice(0, 10);
  });

  test.afterAll(async () => {
    await api?.dispose();
    if (!results.length) return;
    mkdirSync(OUT_DIR, { recursive: true });
    const file = join(
      OUT_DIR,
      `tclt-results-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    );
    writeFileSync(
      file,
      JSON.stringify(
        {
          api: API,
          frontend: FRONTEND,
          results,
          thinkMs: THINK_MS,
          timeScale: TIME_SCALE,
          vuScale: VU_SCALE,
        },
        null,
        2,
      ),
    );
    console.log(`\nHasil TCLT disimpan di: ${file}`);
  });

  test("TCLT.01 System handles normal concurrent access to homepage (all roles)", async () => {
    const run = await runStages(api, rampHold(100, 30, 300), flows.homepage);
    report(
      "TCLT.01",
      "Load Test, 100 VU, ramp 30 dtk, 5 menit, homepage/login",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.02 System survives worst-case combined peak access", async () => {
    const run = await runStages(api, steps(100, 800, 100, 60), flows.homepage, breaking(3000));
    report("TCLT.02", "Stress Test, 100 → 800 VU (+100), 1 menit/step, homepage/login", run, [
      {
        actual: `p90 ${run.perStage["step 300 VU"]?.p90 ?? "-"} ms`,
        criterion: "puncak ~300 VU dilayani < 3 dtk",
        pass:
          (run.perStage["step 300 VU"]?.p90 ?? Infinity) < 3000 &&
          (run.perStage["step 300 VU"]?.errorPct ?? 100) < 1,
      },
      { actual: firstBreak(run, 3000), criterion: "titik gagal terdokumentasi", pass: true },
    ]);
  });

  test("TCLT.03 System handles concurrent login by Relawan role (normal day)", async () => {
    const run = await runStages(api, rampHold(80, 30, 300), flows.login("relawan"));
    report(
      "TCLT.03",
      "Load Test, 80 VU, ramp 30 dtk, 5 menit, login Relawan",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.04 System handles a sudden spike of Relawan logins", async () => {
    const run = await runStages(api, spike(30, 250, 300, 120), flows.login("relawan"));
    report("TCLT.04", "Spike Test, 30 → 250 VU dalam 15 dtk, 10 menit, login Relawan", run, [
      {
        actual: `${run.perStage.spike?.errorPct ?? "-"}%`,
        criterion: "error rate saat spike < 5%",
        pass: (run.perStage.spike?.errorPct ?? 100) < 5,
      },
      {
        actual: `${run.overall.status5xx} respons 5xx`,
        criterion: "sistem tidak crash (tanpa 5xx)",
        pass: run.overall.status5xx === 0,
      },
      recovered(run),
    ]);
  });

  test("TCLT.05 System handles concurrent login by OPD Admin role", async () => {
    const run = await runStages(api, rampHold(20, 30, 300), flows.login("opd"));
    report(
      "TCLT.05",
      "Load Test, 20 VU, ramp 30 dtk, 5 menit, login OPD Admin",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.06 System handles concurrent new Relawan registrations", async () => {
    test.skip(
      true,
      "Fitur Sign Up tidak ada di aplikasi (akun dibuat Super Admin/OPD), sejalan dengan TCL.7",
    );
  });

  test("TCLT.07 System handles a sudden surge of registrations", async () => {
    test.skip(
      true,
      "Fitur Sign Up tidak ada di aplikasi (akun dibuat Super Admin/OPD), sejalan dengan TCL.7",
    );
  });

  test("TCLT.08 System handles concurrent search queries across roles", async () => {
    const run = await runStages(api, rampHold(100, 60, 600), flows.search);
    report(
      "TCLT.08",
      "Load Test, 100 VU, ramp 1 menit, 10 menit, pencarian (daftar yang dicari)",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.09 System handles concurrent Relawan dashboard access", async () => {
    const run = await runStages(api, rampHold(80, 30, 600), flows.relawanDashboard);
    report(
      "TCLT.09",
      "Load Test, 80 VU, ramp 30 dtk, 10 menit, dashboard Relawan",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.10 System handles concurrent OPD Admin dashboard access", async () => {
    const run = await runStages(api, rampHold(20, 30, 600), flows.opdDashboard);
    report(
      "TCLT.10",
      "Load Test, 20 VU, ramp 30 dtk, 10 menit, dashboard OPD Admin",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.11 System handles concurrent access to OPD management list", async () => {
    const run = await runStages(api, rampHold(10, 30, 600), flows.manajemenOPD);
    report(
      "TCLT.11",
      "Load Test, 10 VU, ramp 30 dtk, 10 menit, Manajemen OPD",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.12 System handles concurrent access to Data Relawan list, scoped per OPD", async () => {
    const run = await runStages(api, rampHold(20, 30, 600), flows.dataRelawanOPD);
    report(
      "TCLT.12",
      "Load Test, 20 VU, ramp 30 dtk, 10 menit, Data Relawan OPD",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.13 System handles the full Relawan dataset under concurrent Super Admin access", async () => {
    const run = await runStages(api, rampHold(10, 30, 600), flows.dataRelawanFull);
    report("TCLT.13", "Volume Test, 10 VU, ramp 30 dtk, 10 menit, Data Relawan penuh", run, [
      ...standard(run.overall),
      {
        actual: `max ${run.overall.max} ms`,
        criterion: "query dataset penuh < 5 dtk",
        pass: run.overall.max < 5000,
      },
    ]);
  });

  test("TCLT.14 System handles concurrent access and document generation for Surat Keputusan", async () => {
    const run = await runStages(api, steps(5, 40, 5, 60), flows.suratKeputusan, breaking(8000));
    report("TCLT.14", "Stress Test, 5 → 40 VU (+5), 1 menit/step, Surat Keputusan", run, [
      {
        actual: `p90 ${run.overall.p90} ms`,
        criterion: "dokumen < 8 dtk",
        pass: run.overall.p90 < 8000,
      },
      {
        actual: `${run.overall.invalidPct}% respons tidak valid`,
        criterion: "dokumen tidak rusak (file_path ada)",
        pass: run.overall.invalidPct === 0,
      },
      { actual: firstBreak(run, 8000), criterion: "titik gagal terdokumentasi", pass: true },
    ]);
  });

  test("TCLT.15 System handles concurrent access to activity log", async () => {
    const run = await runStages(api, rampHold(15, 30, 600), flows.logs);
    report(
      "TCLT.15",
      "Load Test, 15 VU, ramp 30 dtk, 10 menit, Log Aktivitas",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.16 System handles concurrent Statistik access across roles", async () => {
    const run = await runStages(
      api,
      rampHold(85, 60, 600),
      mix([
        [60, flows.statistikRelawan],
        [20, flows.statistikOPD],
        [5, flows.statistikSA],
      ]),
    );
    report(
      "TCLT.16",
      "Load Test, 85 VU (60 Relawan + 20 OPD + 5 Super Admin), ramp 1 menit, 10 menit, Statistik",
      run,
      standard(run.overall),
    );
  });

  test("TCLT.17 System remains stable when Super Admin runs full aggregate reports", async () => {
    const run = await runStages(api, steps(5, 30, 5, 60), flows.statistikSA, breaking(3000));
    report(
      "TCLT.17",
      "Stress Test, 5 → 30 VU (+5), 1 menit/step, Statistik agregat Super Admin",
      run,
      [
        { actual: firstBreak(run, 3000), criterion: "titik gagal terdokumentasi", pass: true },
        {
          actual: `${run.overall.status5xx} respons 5xx`,
          criterion: "sistem stabil (tanpa 5xx)",
          pass: run.overall.status5xx === 0,
        },
      ],
    );
  });

  test("TCLT.18 System handles concurrent Relawan profile picture uploads", async () => {
    test.skip(
      true,
      "Aplikasi tidak memiliki endpoint unggah foto profil; /relawan/profile/update hanya mengirim pengajuan perubahan data",
    );
  });

  test("TCLT.19 System sustains realistic mixed-role load over an extended period", async () => {
    const run = await runStages(api, rampHold(103, 60, 7200), mixedRoles);
    const sustain = run.perStage.sustain;
    report(
      "TCLT.19",
      "Soak Test, 103 VU (80 Relawan + 20 OPD + 3 Super Admin), ramp 1 menit, 2 jam",
      run,
      [
        ...standard(run.overall),
        {
          actual: `p90 ramp ${run.perStage["ramp-up"]?.p90 ?? "-"} ms, p90 sustain ${sustain?.p90 ?? "-"} ms`,
          criterion: "respons tidak terus memburuk",
          pass:
            (sustain?.p90 ?? Infinity) <= Math.max((run.perStage["ramp-up"]?.p90 ?? 0) * 1.5, 3000),
        },
      ],
    );
  });

  test("TCLT.20 System absorbs the worst-case combined peak", async () => {
    const run = await runStages(api, spike(100, 300, 300, 180), mixedRoles);
    report("TCLT.20", "Spike Test, 100 → 300 VU dalam 15 dtk, 15 menit, campuran peran", run, [
      {
        actual: `${run.overall.status5xx} respons 5xx`,
        criterion: "sistem tidak crash (tanpa 5xx)",
        pass: run.overall.status5xx === 0,
      },
      recovered(run),
    ]);
  });

  test("TCLT.21 System scales predictably as concurrent users increase", async () => {
    const levels = [100, 300, 500, 1000];
    const stages = levels.flatMap((n) => [
      { label: `step ${n} VU`, sec: 1, vus: vu(n) },
      { label: `step ${n} VU`, sec: sec(120), vus: vu(n) },
    ]);
    const run = await runStages(api, stages, mixedRoles);
    const rows = levels
      .map((n) => `${n} VU: p90 ${run.perStage[`step ${n} VU`]?.p90 ?? "-"} ms`)
      .join(", ");
    report(
      "TCLT.21",
      "Scalability Test, 100 → 300 → 500 → 1000 VU, 2 menit/step, campuran peran",
      run,
      [
        { actual: rows, criterion: "degradasi terhadap puncak ~300 VU terdokumentasi", pass: true },
        {
          actual: `p90 ${run.perStage["step 300 VU"]?.p90 ?? "-"} ms`,
          criterion: "puncak ~300 VU < 3 dtk",
          pass: (run.perStage["step 300 VU"]?.p90 ?? Infinity) < 3000,
        },
      ],
    );
  });

  test("TCLT.22 System handles concurrent API requests to key endpoints", async () => {
    const run = await runStages(
      api,
      rampHold(150, 30, 600),
      mix([
        [1, flows.login("superAdmin")],
        [1, flows.search],
        [1, flows.dataRelawanOPD],
        [1, flows.statistikSA],
      ]),
    );
    report(
      "TCLT.22",
      "Load Test, 150 VU, ramp 30 dtk, 10 menit, API (login, search, Data Relawan, Statistik)",
      run,
      standard(run.overall, 1000),
    );
  });

  test("TCLT.23 System handles concurrent report/document downloads", async () => {
    test.skip(!skIds.length, "Tidak ada SK berkas PDF yang bisa diunduh");
    const run = await runStages(api, rampHold(20, 30, 600), flows.download);
    report(
      "TCLT.23",
      "Load Test, 20 VU, ramp 30 dtk, 10 menit, unduh dokumen SK",
      run,
      standard(run.overall),
    );
  });
});
