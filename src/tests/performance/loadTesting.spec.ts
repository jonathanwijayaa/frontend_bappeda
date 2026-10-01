/// <reference types="node" />
import { credentials } from "@/helpers/credentials.helper";
import { APIRequestContext, expect, request as playwrightRequest, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Load Testing (REFERENSI SAJA — DI LUAR SCOPE SKRIPSI)
 * ─────────────────────────────────────────────────────────────────────────────
 * File ini BUKAN bagian dari laporan skripsi. Batasan masalah skripsi hanya
 * mencakup smoke testing, regression testing, dan SQL Injection security
 * testing. Load testing dilampirkan sebagai bahan eksplorasi/referensi untuk
 * mengukur perilaku sistem saat menerima banyak permintaan sekaligus.
 *
 * CATATAN PENTING
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright BUKAN alat load testing khusus (seperti k6, JMeter, atau Gatling).
 * Ia terikat pada satu proses Node (event loop tunggal), sehingga konkurensi
 * yang sangat tinggi justru mengukur bottleneck di sisi klien, bukan server.
 * Untuk uji beban yang benar-benar valid pada beban tinggi, gunakan skrip k6
 * pendamping di `src/tests/performance/k6/loadTest.k6.js`. File Playwright ini
 * cukup sebagai referensi ringan yang berjalan dalam ekosistem yang sama.
 *
 * Pendekatan di sini memakai `APIRequestContext` Playwright untuk mengirim
 * banyak permintaan HTTP secara konkuren dan mengukur:
 *   • Latensi (min, rata-rata, standar deviasi, p50, p90, p95, p99, maks)
 *   • Throughput (permintaan per detik)
 *   • Error rate (persentase permintaan gagal / non-2xx)
 *   • Sebaran status code (berapa 200 / 401 / 429 / 5xx, dst.)
 *
 * Sebelum pengukuran, dijalankan fase WARM-UP untuk membangunkan fungsi
 * serverless sehingga angka cold-start tidak mengotori hasil. Hasil setiap
 * skenario dikumpulkan lalu diekspor ke JSON & CSV dan diringkas dalam satu
 * tabel lintas-skenario.
 *
 * Karena target adalah deployment Vercel (serverless, tier gratis) milik sendiri,
 * beban dijaga tetap WAJAR (bukan DoS): konkurensi & jumlah permintaan kecil dan
 * dapat diatur lewat environment variable. Endpoint yang diuji hanya baca (GET)
 * dan login, TIDAK menulis/mengubah data agar basis data tidak tercemar.
 *
 * Karena sifatnya referensi, ambang batas (threshold) bersifat LUNAK
 * (informasional) dan sengaja longgar agar tidak menggagalkan build karena
 * cold-start serverless / jitter jaringan.
 *
 * Cara menjalankan (contoh):
 *   npx playwright test performance/loadTesting.spec.ts --project=chromium
 *   LOAD_TOTAL=300 LOAD_CONCURRENCY=30 npx playwright test performance/loadTesting.spec.ts --project=chromium
 *
 * Environment variable yang tersedia:
 *   VITE_API_URL         — base URL backend (default deployment)
 *   LOAD_BASE_URL        — base URL frontend untuk uji ketersediaan halaman
 *   LOAD_TOTAL           — jumlah total permintaan per skenario (default 200)
 *   LOAD_CONCURRENCY     — jumlah permintaan konkuren (default 20)
 *   LOAD_WARMUP          — jumlah permintaan warm-up per endpoint (default 5)
 *   LOAD_PACING_MS       — jeda (think time) antar-permintaan per worker (default 0)
 *   LOAD_MAX_ERROR_PCT   — ambang lunak error rate dalam persen (default 25)
 *   LOAD_MAX_P95_MS      — ambang lunak p95 dalam ms; 0 = nonaktif (default 0)
 *   LOAD_STRESS_LEVELS   — daftar konkurensi stress, mis. "10,20,40" (default 10,20,40)
 *   LOAD_SPIKE_CONCURRENCY — konkurensi saat lonjakan spike (default 40)
 *   LOAD_SOAK_SECONDS    — durasi soak/endurance dalam detik; 0 = lewati (default 15)
 *   LOAD_OUT_DIR         — folder output JSON/CSV (default test-results/load-testing)
 */

// Load testing menembak jaringan berkali-kali; beri waktu longgar per skenario.
test.describe.configure({ mode: "serial", timeout: 600_000 });

const API_BASE =
  process.env.VITE_API_URL?.replace(/\/$/, "") ?? "https://backend-skripsi-relawan.vercel.app/api";

const FRONTEND_BASE =
  process.env.LOAD_BASE_URL?.replace(/\/$/, "") ?? "https://frontend-bappeda.vercel.app";

// Parameter beban — kecil & wajar secara default, dapat ditimpa via env.
const TOTAL = Number(process.env.LOAD_TOTAL ?? 200);
const CONCURRENCY = Number(process.env.LOAD_CONCURRENCY ?? 20);
const WARMUP = Number(process.env.LOAD_WARMUP ?? 5);
const PACING_MS = Number(process.env.LOAD_PACING_MS ?? 0);
const MAX_ERROR_PCT = Number(process.env.LOAD_MAX_ERROR_PCT ?? 25);
const MAX_P95_MS = Number(process.env.LOAD_MAX_P95_MS ?? 0); // 0 = gate p95 nonaktif
const STRESS_LEVELS = (process.env.LOAD_STRESS_LEVELS ?? "10,20,40")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);
const SPIKE_CONCURRENCY = Number(process.env.LOAD_SPIKE_CONCURRENCY ?? 40);
const SOAK_SECONDS = Number(process.env.LOAD_SOAK_SECONDS ?? 15);
const OUT_DIR = process.env.LOAD_OUT_DIR ?? join("test-results", "load-testing");

// ── Tipe & util metrik ───────────────────────────────────────────────────────
type Sample = { ok: boolean; status: number; ms: number };

type Metrics = {
  label: string;
  total: number;
  concurrency: number;
  ok: number;
  fail: number;
  errorPct: number;
  wallMs: number;
  throughput: number; // permintaan / detik
  min: number;
  avg: number;
  stdev: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  statusCounts: Record<string, number>;
};

/** Persentil ke-p (0–100) dari daftar nilai terurut (nearest-rank). */
const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(rank, 0), sorted.length - 1)];
};

const round = (n: number) => Math.round(n * 100) / 100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Ubah daftar sampel mentah menjadi ringkasan metrik. */
const summarize = (
  label: string,
  concurrency: number,
  wallMs: number,
  samples: Sample[],
): Metrics => {
  const latencies = samples.map((s) => s.ms).sort((a, b) => a - b);
  const ok = samples.filter((s) => s.ok).length;
  const fail = samples.length - ok;
  const n = latencies.length || 1;
  const avg = latencies.reduce((a, b) => a + b, 0) / n;
  const variance = latencies.reduce((a, b) => a + (b - avg) ** 2, 0) / n;

  // Sebaran status code: 200, 401, 429, "5xx", "ERR" (0 = gagal jaringan), dst.
  const statusCounts: Record<string, number> = {};
  for (const s of samples) {
    const key = s.status === 0 ? "ERR" : s.status >= 500 ? "5xx" : String(s.status);
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  return {
    label,
    total: samples.length,
    concurrency,
    ok,
    fail,
    errorPct: round((fail / (samples.length || 1)) * 100),
    wallMs,
    throughput: round((samples.length / (wallMs || 1)) * 1000),
    min: latencies[0] ?? 0,
    avg: round(avg),
    stdev: round(Math.sqrt(variance)),
    p50: percentile(latencies, 50),
    p90: percentile(latencies, 90),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    max: latencies[latencies.length - 1] ?? 0,
    statusCounts,
  };
};

/**
 * Jalankan beban dengan kolam pekerja (worker pool) berukuran `concurrency`.
 * Berhenti setelah `total` permintaan (mode hitungan) ATAU setelah `durationMs`
 * (mode durasi, untuk soak test). `pacingMs` menambah think time antar-permintaan
 * per worker agar lebih menyerupai pengguna nyata.
 */
async function runWorkload(opts: {
  label: string;
  concurrency: number;
  total?: number;
  durationMs?: number;
  pacingMs?: number;
  task: () => Promise<{ ok: boolean; status: number }>;
}): Promise<Metrics> {
  const { label, concurrency, total, durationMs, task } = opts;
  const pacingMs = opts.pacingMs ?? PACING_MS;
  const samples: Sample[] = [];
  let dispatched = 0;

  const wallStart = Date.now();
  const deadline = durationMs ? wallStart + durationMs : Number.POSITIVE_INFINITY;
  const shouldContinue = () => (total !== undefined ? dispatched < total : Date.now() < deadline);

  const worker = async () => {
    while (shouldContinue()) {
      if (total !== undefined) dispatched += 1; // klaim satu tiket pekerjaan
      const start = Date.now();
      try {
        const { ok, status } = await task();
        samples.push({ ms: Date.now() - start, ok, status });
      } catch {
        // Kegagalan jaringan/timeout dihitung sebagai error (status 0).
        samples.push({ ms: Date.now() - start, ok: false, status: 0 });
      }
      if (pacingMs > 0) await sleep(pacingMs);
    }
  };

  const poolSize = total !== undefined ? Math.min(concurrency, total) : concurrency;
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return summarize(label, concurrency, Date.now() - wallStart, samples);
}

/** Fase warm-up: bangunkan serverless; hasilnya TIDAK diukur. */
async function warmUp(count: number, task: () => Promise<unknown>) {
  if (count <= 0) return;
  await Promise.all(Array.from({ length: count }, () => task().catch(() => undefined)));
}

// Kumpulan hasil semua skenario untuk ringkasan & ekspor di akhir.
const allResults: Metrics[] = [];

/** Cetak ringkasan metrik satu skenario ke konsol, sekaligus simpan ke koleksi. */
const report = (m: Metrics) => {
  allResults.push(m);
  const status = Object.entries(m.statusCounts)
    .map(([k, v]) => `${k}:${v}`)
    .join(" ");
  /* eslint-disable no-console */
  console.log(`\n──────── ${m.label} ────────`);
  console.log(`  Total permintaan : ${m.total}  (konkurensi ${m.concurrency})`);
  console.log(`  Berhasil / Gagal : ${m.ok} / ${m.fail}  (error rate ${m.errorPct}%)`);
  console.log(`  Sebaran status   : ${status}`);
  console.log(`  Durasi total     : ${m.wallMs} ms`);
  console.log(`  Throughput       : ${m.throughput} req/detik`);
  console.log(
    `  Latensi (ms)     : min ${m.min} | avg ${m.avg} | stdev ${m.stdev} | p50 ${m.p50} | ` +
      `p90 ${m.p90} | p95 ${m.p95} | p99 ${m.p99} | max ${m.max}`,
  );
  /* eslint-enable no-console */
};

/**
 * Ambang lunak bersama: error rate, dan (opsional) p95. Sengaja TIDAK memakai
 * expect() yang melempar — load testing ini bersifat eksploratif/referensi,
 * sehingga pelanggaran ambang hanya DICATAT sebagai peringatan agar seluruh
 * skenario tetap berjalan (suite dijalankan mode serial). Sanity check tunggal
 * memastikan permintaan benar-benar terkirim.
 */
const checkSoftThresholds = (m: Metrics) => {
  /* eslint-disable no-console */
  if (m.errorPct > MAX_ERROR_PCT) {
    console.log(
      `  ⚠  ${m.label}: error rate ${m.errorPct}% > ambang lunak ${MAX_ERROR_PCT}% ` +
        `(status: ${Object.entries(m.statusCounts)
          .map(([k, v]) => `${k}:${v}`)
          .join(" ")})`,
    );
  }
  if (MAX_P95_MS > 0 && m.p95 > MAX_P95_MS) {
    console.log(`  ⚠  ${m.label}: p95 ${m.p95}ms > ambang lunak ${MAX_P95_MS}ms`);
  }
  /* eslint-enable no-console */
  expect(m.total, "Tidak ada permintaan yang terkirim").toBeGreaterThan(0);
};

test.describe("Load Testing", () => {
  let ctx: APIRequestContext;
  let token = "";

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: API_BASE });
    // Login sekali untuk skenario read-heavy pada endpoint terproteksi.
    const res = await ctx.post("/auth/login", {
      data: { nik: credentials.superAdmin.NIK, password: credentials.superAdmin.password },
    });
    if (res.ok()) {
      token = (await res.json()).token ?? "";
    }

    // Warm-up global untuk endpoint BACA agar cold-start serverless tidak
    // mengotori angka. Endpoint login sengaja TIDAK di-warm-up secara konkuren
    // karena rentan memicu proteksi brute-force (login tunggal di atas sudah
    // cukup membangunkannya).
    if (token) {
      await warmUp(WARMUP, () =>
        ctx.get("/opd", { headers: { Authorization: `Bearer ${token}` } }),
      );
    }
  });

  test.afterAll(async () => {
    await ctx.dispose();

    // ── Ekspor hasil ke JSON & CSV + tabel ringkasan lintas-skenario ──────────
    if (allResults.length === 0) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    try {
      mkdirSync(OUT_DIR, { recursive: true });

      writeFileSync(
        join(OUT_DIR, `load-results-${stamp}.json`),
        JSON.stringify(
          { generatedAt: new Date().toISOString(), api: API_BASE, results: allResults },
          null,
          2,
        ),
        "utf-8",
      );

      const cols = [
        "label",
        "total",
        "concurrency",
        "ok",
        "fail",
        "errorPct",
        "wallMs",
        "throughput",
        "min",
        "avg",
        "stdev",
        "p50",
        "p90",
        "p95",
        "p99",
        "max",
        "statusCounts",
      ] as const;
      const csv = [
        cols.join(","),
        ...allResults.map((m) =>
          cols
            .map((c) => {
              const v =
                c === "statusCounts"
                  ? JSON.stringify(m.statusCounts)
                  : (m as Record<string, unknown>)[c];
              const cell = String(v).replace(/"/g, '""');
              return /[",\n]/.test(cell) ? `"${cell}"` : cell;
            })
            .join(","),
        ),
      ].join("\n");
      writeFileSync(join(OUT_DIR, `load-results-${stamp}.csv`), csv, "utf-8");

      /* eslint-disable no-console */
      console.log(`\n════════ RINGKASAN LINTAS-SKENARIO ════════`);
      console.log("  Skenario".padEnd(48) + "| Konk | Thrpt | p95(ms) | Err% ");
      for (const m of allResults) {
        console.log(
          `  ${m.label.slice(0, 44).padEnd(46)}| ${String(m.concurrency).padStart(4)} | ` +
            `${String(m.throughput).padStart(5)} | ${String(m.p95).padStart(7)} | ${m.errorPct}`,
        );
      }
      console.log(`\n  Hasil lengkap disimpan di: ${OUT_DIR}\\load-results-${stamp}.json (+ .csv)`);
      /* eslint-enable no-console */
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("  (Gagal menulis berkas hasil load test:", (e as Error).message, ")");
    }
  });

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  // ── LT.1 Login endpoint di bawah beban login yang REALISTIS ─────────────────
  // Login bukan endpoint throughput; menembaknya belasan sekaligus menyerupai
  // serangan brute-force dan wajar diblokir (403/429). Karena itu skenario ini
  // memakai konkurensi rendah + think time agar meniru banyak pengguna yang
  // masuk pada laju manusiawi, bukan burst. Total dibatasi agar tidak spam auth.
  test("LT.1 Login endpoint under realistic login load", async () => {
    const metrics = await runWorkload({
      label: "LT.1 POST /auth/login (laju realistis)",
      total: Math.min(TOTAL, 80),
      concurrency: Math.min(CONCURRENCY, 8),
      pacingMs: 200,
      task: async () => {
        const res = await ctx.post("/auth/login", {
          data: { nik: credentials.superAdmin.NIK, password: credentials.superAdmin.password },
        });
        return { ok: res.ok(), status: res.status() };
      },
    });
    report(metrics);
    checkSoftThresholds(metrics);
  });

  // ── LT.2 Endpoint baca (GET) terproteksi di bawah beban ────────────────────
  test("LT.2 Read-heavy protected endpoints under load", async () => {
    test.skip(!token, "Token login kosong — lewati skenario endpoint terproteksi.");

    // Sebar beban ke beberapa endpoint baca yang nyata dipakai aplikasi.
    const readTargets = ["/opd", "/kader", "/admin/relawan", "/admin/logs?limit=50"];
    let i = 0;

    const metrics = await runWorkload({
      label: "LT.2 GET endpoint terproteksi (round-robin)",
      total: TOTAL,
      concurrency: CONCURRENCY,
      task: async () => {
        const path = readTargets[i++ % readTargets.length];
        const res = await ctx.get(path, { headers: authHeader() });
        return { ok: res.ok(), status: res.status() };
      },
    });
    report(metrics);
    checkSoftThresholds(metrics);
  });

  // ── LT.3 Ramp-up: latensi vs tingkat konkurensi ────────────────────────────
  // Mengukur bagaimana latensi & throughput berubah saat konkurensi dinaikkan
  // bertahap. Berguna untuk melihat titik jenuh (saturation) sistem.
  test("LT.3 Ramp-up concurrency profile", async () => {
    const levels = [5, 10, 20];
    const perLevel = Math.max(30, Math.floor(TOTAL / 4));
    const results: Metrics[] = [];

    for (const level of levels) {
      const metrics = await runWorkload({
        label: `LT.3 GET /opd @ konkurensi ${level}`,
        total: perLevel,
        concurrency: level,
        task: async () => {
          const res = await ctx.get("/opd", { headers: token ? authHeader() : undefined });
          return { ok: res.ok(), status: res.status() };
        },
      });
      report(metrics);
      results.push(metrics);
    }

    /* eslint-disable no-console */
    console.log("\n──────── LT.3 Ringkasan Ramp-up ────────");
    console.log("  Konkurensi | Throughput (req/s) | p95 (ms) | Error %");
    for (const r of results) {
      console.log(
        `  ${String(r.concurrency).padStart(10)} | ${String(r.throughput).padStart(18)} | ` +
          `${String(r.p95).padStart(8)} | ${r.errorPct}`,
      );
    }
    /* eslint-enable no-console */

    // Eksploratif: cukup pastikan pengujian berjalan (jangan abort suite serial).
    expect(results.length).toBe(levels.length);
  });

  // ── LT.4 Ketersediaan halaman frontend di bawah beban ──────────────────────
  test("LT.4 Frontend page availability under load", async () => {
    const feCtx = await playwrightRequest.newContext({ baseURL: FRONTEND_BASE });
    try {
      await warmUp(WARMUP, () => feCtx.get("/"));
      const metrics = await runWorkload({
        label: "LT.4 GET / (halaman frontend)",
        total: Math.min(TOTAL, 100),
        concurrency: Math.min(CONCURRENCY, 10),
        task: async () => {
          const res = await feCtx.get("/");
          return { ok: res.ok(), status: res.status() };
        },
      });
      report(metrics);
      checkSoftThresholds(metrics);
    } finally {
      await feCtx.dispose();
    }
  });

  // ── LT.5 Stress test: naikkan beban sampai mulai terdegradasi ──────────────
  // Menambah konkurensi bertahap dan mencatat titik ketika sistem mulai gagal
  // (error rate melewati ambang). Titik ini menjadi indikasi kapasitas kasar.
  test("LT.5 Stress test — find degradation point", async () => {
    test.skip(!token, "Token login kosong — lewati stress test endpoint terproteksi.");

    const perLevel = Math.max(40, Math.floor(TOTAL / 3));
    let breakpoint: number | null = null;
    const results: Metrics[] = [];

    for (const level of STRESS_LEVELS) {
      const metrics = await runWorkload({
        label: `LT.5 Stress GET /opd @ konkurensi ${level}`,
        total: perLevel,
        concurrency: level,
        task: async () => {
          const res = await ctx.get("/opd", { headers: authHeader() });
          return { ok: res.ok(), status: res.status() };
        },
      });
      report(metrics);
      results.push(metrics);
      if (breakpoint === null && metrics.errorPct > MAX_ERROR_PCT) breakpoint = level;
    }

    /* eslint-disable no-console */
    console.log("\n──────── LT.5 Ringkasan Stress ────────");
    for (const r of results) {
      console.log(
        `  konkurensi ${String(r.concurrency).padStart(3)} → thrpt ${r.throughput} req/s, ` +
          `p95 ${r.p95}ms, error ${r.errorPct}%`,
      );
    }
    console.log(
      breakpoint === null
        ? `  Tidak ditemukan titik degradasi hingga konkurensi ${Math.max(...STRESS_LEVELS)} (error <= ${MAX_ERROR_PCT}%).`
        : `  Degradasi mulai terlihat pada konkurensi ${breakpoint} (error > ${MAX_ERROR_PCT}%).`,
    );
    /* eslint-enable no-console */

    // Stress test bersifat eksploratif — hanya pastikan pengujian berjalan.
    expect(results.length).toBe(STRESS_LEVELS.length);
  });

  // ── LT.6 Spike test: lonjakan beban mendadak ───────────────────────────────
  // Beban rendah (baseline) lalu melonjak tajam, untuk melihat apakah sistem
  // tetap responsif dan pulih setelah lonjakan.
  test("LT.6 Spike test — sudden burst", async () => {
    test.skip(!token, "Token login kosong — lewati spike test endpoint terproteksi.");
    const burst = Math.max(60, Math.floor(TOTAL / 2));
    const getOpd = async () => {
      const res = await ctx.get("/opd", { headers: authHeader() });
      return { ok: res.ok(), status: res.status() };
    };

    const baseline = await runWorkload({
      label: "LT.6 Spike — baseline (konkurensi 3)",
      total: 30,
      concurrency: 3,
      task: getOpd,
    });
    report(baseline);

    const spike = await runWorkload({
      label: `LT.6 Spike — lonjakan (konkurensi ${SPIKE_CONCURRENCY})`,
      total: burst,
      concurrency: SPIKE_CONCURRENCY,
      task: getOpd,
    });
    report(spike);

    const recovery = await runWorkload({
      label: "LT.6 Spike — pemulihan (konkurensi 3)",
      total: 30,
      concurrency: 3,
      task: getOpd,
    });
    report(recovery);

    /* eslint-disable no-console */
    console.log("\n──────── LT.6 Ringkasan Spike ────────");
    console.log(`  Baseline  p95 ${baseline.p95}ms, error ${baseline.errorPct}%`);
    console.log(`  Lonjakan  p95 ${spike.p95}ms, error ${spike.errorPct}%`);
    console.log(`  Pemulihan p95 ${recovery.p95}ms, error ${recovery.errorPct}%`);
    /* eslint-enable no-console */

    // Eksploratif: catat pemulihan tanpa mengabort suite bila lingkungan
    // membatasi (mis. proteksi edge memblokir IR selama uji).
    if (recovery.ok === 0) {
      // eslint-disable-next-line no-console
      console.log(
        "  ⚠  Tidak ada permintaan berhasil saat pemulihan (kemungkinan diblokir edge).",
      );
    }
    expect(recovery.total).toBeGreaterThan(0);
  });

  // ── LT.7 Soak / endurance test: beban tetap dalam durasi tertentu ──────────
  // Menahan beban moderat selama beberapa detik untuk mendeteksi degradasi/
  // kebocoran memori dari waktu ke waktu. Dilewati bila LOAD_SOAK_SECONDS=0.
  test("LT.7 Soak / endurance test", async () => {
    test.skip(!token, "Token login kosong — lewati soak test endpoint terproteksi.");
    test.skip(SOAK_SECONDS <= 0, "LOAD_SOAK_SECONDS=0 — soak test dilewati.");

    const metrics = await runWorkload({
      label: `LT.7 Soak GET /opd selama ${SOAK_SECONDS}s (konkurensi 5)`,
      durationMs: SOAK_SECONDS * 1000,
      concurrency: 5,
      pacingMs: 100, // think time agar beban stabil, bukan sekeras mungkin
      task: async () => {
        const res = await ctx.get("/opd", { headers: authHeader() });
        return { ok: res.ok(), status: res.status() };
      },
    });
    report(metrics);
    checkSoftThresholds(metrics);
  });
});
