// Menggabungkan hasil run penuh GitHub Actions dengan hasil retest menjadi laporan
// terbaru: hasil test yang ikut di-retest menggantikan hasil lamanya, test lain
// memakai hasil run penuh.
// Pemakaian: node scripts/gabung-retest-ci.mjs <folder-run-penuh> <folder-retest> <folder-keluaran>
//   contoh : node scripts/gabung-retest-ci.mjs results-ci/run-41236813261 results-ci/run-41294715153 results-ci/laporan-terbaru
// Tiap folder berisi report-1w/results-1w.json dan report-10w/results-10w.json.
import fs from "node:fs";
import path from "node:path";

import { ROOT } from "./pseudocode-lib.mjs";

const WORKERS = [1, 10];

// Urutan modul pada laporan
const MODUL = [
  "TCL", "TCBP", "TCD", "TCMO", "TCDK", "TCDR", "TCSK", "TCLA",
  "TCS", "TCDO", "TCSH", "TCP", "TCHR", "TCSQL", "TCSQLA",
];

const [dirPenuh, dirRetest, dirOut] = process.argv.slice(2).map((d) => d && path.resolve(ROOT, d));
if (!dirOut) {
  console.error(
    "Pemakaian: node scripts/gabung-retest-ci.mjs <folder-run-penuh> <folder-retest> <folder-keluaran>",
  );
  process.exit(1);
}

const idRun = (dir) => path.basename(dir).replace(/^run-/, "");
const relatif = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

const fmtDurasi = (ms) => {
  const s = Math.round(ms / 1000);
  const j = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${j ? `${j}h` : ""}${m}m${String(s % 60).padStart(2, "0")}s`;
};

const STATUS = { expected: "Lulus", flaky: "Flaky", skipped: "Skip", unexpected: "Gagal" };

const bacaJson = (dir, n) =>
  JSON.parse(fs.readFileSync(path.join(dir, `report-${n}w`, `results-${n}w.json`), "utf8"));

/** Memanggil fn(spec, jalurJudul) untuk setiap spec di laporan JSON Playwright. */
const tiapSpec = (json, fn) => {
  const walk = (suite, jalur) => {
    for (const spec of suite.specs ?? []) fn(spec, [...jalur, spec.title]);
    for (const s of suite.suites ?? []) walk(s, [...jalur, s.title]);
  };
  // Judul suite teratas = nama berkas, sudah terwakili oleh spec.file
  json.suites.forEach((s) => walk(s, []));
};

const kunci = (spec, jalur) => [spec.file, ...jalur].join(" › ");

const pesanError = (test) =>
  (test.results.at(-1)?.errors ?? [])
    .map((e) => (e.message ?? "").replace(/\u001b\[[0-9;]*m/g, ""))
    .join("\n");

const ringkasPesan = (p) =>
  p
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^at |^\d+ \||^\s*\||^>|^Call log:|^- /.test(l))
    .slice(0, 3)
    .join(" ")
    .slice(0, 220);

const sel = (s) => s.replace(/\|/g, "\\|").replace(/`/g, "'");

/** Gabungkan satu pasang laporan; kembalikan JSON gabungan dan daftar eksekusi rata. */
const gabung = (penuh, retest, n) => {
  const pengganti = new Map();
  tiapSpec(retest, (spec, jalur) => pengganti.set(kunci(spec, jalur), spec));

  const hasil = structuredClone(penuh);
  const tests = [];
  const dipakai = new Set();
  tiapSpec(hasil, (spec, jalur) => {
    const k = kunci(spec, jalur);
    const lama = spec.tests.map((t) => t.status);
    const baru = pengganti.get(k);
    if (baru) {
      dipakai.add(k);
      spec.tests = structuredClone(baru.tests).map((t) => ({
        ...t,
        annotations: [
          ...(t.annotations ?? []),
          { type: "retest", description: `Hasil retest run #${idRun(dirRetest)}` },
        ],
      }));
      spec.ok = baru.ok;
    }
    for (const t of spec.tests) {
      tests.push({
        diretest: Boolean(baru),
        file: spec.file,
        jalur,
        kunci: k,
        pesan: pesanError(t),
        status: STATUS[t.status] ?? t.status,
        statusLama: baru ? STATUS[lama[0]] ?? lama[0] : null,
      });
    }
  });

  const hilang = [...pengganti.keys()].filter((k) => !dipakai.has(k));
  if (hilang.length) {
    console.error(`[${n} worker] Test retest tidak ada di run penuh:\n  ${hilang.join("\n  ")}`);
    process.exit(1);
  }

  const hitung = (s) => tests.filter((t) => t.status === s).length;
  hasil.stats = {
    ...penuh.stats,
    expected: hitung("Lulus"),
    flaky: hitung("Flaky"),
    skipped: hitung("Skip"),
    unexpected: hitung("Gagal"),
  };
  hasil.gabungan = {
    catatan:
      "Hasil run penuh dengan hasil test yang di-retest menggantikan hasil lamanya. " +
      "startTime dan duration tetap milik run penuh.",
    runPenuh: idRun(dirPenuh),
    retest: idRun(dirRetest),
    testDiretest: dipakai.size,
  };
  return { hasil, tests };
};

// ── Gabungkan ────────────────────────────────────────────────────────────
const data = {};
for (const n of WORKERS) {
  const penuh = bacaJson(dirPenuh, n);
  const retest = bacaJson(dirRetest, n);
  const { hasil, tests } = gabung(penuh, retest, n);
  const out = path.join(dirOut, `results-${n}w.json`);
  fs.mkdirSync(dirOut, { recursive: true });
  fs.writeFileSync(out, JSON.stringify(hasil, null, 2), "utf8");
  data[n] = { penuh, retest, stats: hasil.stats, tests };
  console.log(`Ditulis: ${relatif(out)} ${JSON.stringify(hasil.stats)}`);
}

// ── Laporan ──────────────────────────────────────────────────────────────
const L = [];
const tgl = (s) => new Date(s.startTime).toISOString().slice(0, 10);
const [a, b] = WORKERS.map((n) => data[n]);
const percepatan = a.penuh.stats.duration / b.penuh.stats.duration;

L.push("# Laporan Regresi Terbaru (GitHub Actions)", "");
L.push(
  `Gabungan run penuh [#${idRun(dirPenuh)}](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/${idRun(dirPenuh)}) ` +
    `(${tgl(a.penuh.stats)}) dengan retest ` +
    `[#${idRun(dirRetest)}](https://github.com/jonathanwijayaa/frontend_bappeda/actions/runs/${idRun(dirRetest)}) ` +
    `(${tgl(a.retest.stats)}). Hasil test yang di-retest menggantikan hasil lamanya; test lain ` +
    "memakai hasil run penuh. Durasi dan percepatan diambil dari run penuh, karena retest " +
    "hanya menjalankan sebagian kecil test.",
  "",
  "Konfigurasi: proyek `chromium`, GitHub-hosted runner `ubuntu-latest` (ubuntu-24.04), " +
    "THINK_TIME 1,2 s, LOAD_TIME 10 s, `retries 0`. Run 1 worker dan 10 worker berjalan " +
    "berurutan.",
  "",
  `Dibangkitkan oleh \`scripts/gabung-retest-ci.mjs\`. JSON gabungan: \`results-1w.json\`, ` +
    "`results-10w.json` (test hasil retest ditandai anotasi `retest`). Laporan HTML tidak " +
    "dapat digabung; lihat `playwright-report/` di folder masing-masing run:",
  "",
  `- Run penuh: \`${relatif(dirPenuh)}/report-<n>w/playwright-report/\``,
  `- Retest: \`${relatif(dirRetest)}/report-<n>w/playwright-report/\``,
  "",
);

L.push("## a. Ringkasan", "");
L.push("| Run | Total | Passed | Failed | Skipped | Flaky | Durasi run penuh |");
L.push("|---|---:|---:|---:|---:|---:|---:|");
for (const n of WORKERS) {
  const { stats, tests } = data[n];
  L.push(
    `| ${n} worker | ${tests.length} | ${stats.expected} | ${stats.unexpected} | ` +
      `${stats.skipped} | ${stats.flaky} | ${fmtDurasi(data[n].penuh.stats.duration)} |`,
  );
}
L.push("");
const desimal = (x, d) => x.toFixed(d).replace(".", ",");
L.push(
  `**Percepatan 10 worker terhadap 1 worker:** ${desimal(a.penuh.stats.duration / 1000, 1)} s / ` +
    `${desimal(b.penuh.stats.duration / 1000, 1)} s = **${desimal(percepatan, 2)}×** ` +
    `(efisiensi paralel ${Math.round((percepatan / 10) * 100)} %).`,
  "",
);

L.push("## b. Ringkasan per modul", "");
L.push("| Modul | Total | 1w Lulus | 1w Gagal | 1w Skip | 10w Lulus | 10w Gagal | 10w Skip |");
L.push("|---|---:|---:|---:|---:|---:|---:|---:|");
const modulDari = (t) => t.jalur.at(-1).match(/^(TC[A-Z]+)\./)?.[1] ?? "Lainnya";
const perModul = (tests) => {
  const m = new Map();
  for (const t of tests) m.set(modulDari(t), [...(m.get(modulDari(t)) ?? []), t]);
  return m;
};
const modulA = perModul(a.tests);
const modulB = perModul(b.tests);
const urutModul = [...modulA.keys()].sort(
  (x, y) => (MODUL.indexOf(x) + 1 || 99) - (MODUL.indexOf(y) + 1 || 99),
);
const n = (list, s) => (list ?? []).filter((t) => t.status === s).length;
for (const m of urutModul) {
  const la = modulA.get(m);
  const lb = modulB.get(m);
  L.push(
    `| ${m} | ${la.length} | ${n(la, "Lulus")} | ${n(la, "Gagal")} | ${n(la, "Skip")} | ` +
      `${n(lb, "Lulus")} | ${n(lb, "Gagal")} | ${n(lb, "Skip")} |`,
  );
}
L.push("");

L.push("## c. Kegagalan", "");
const gagal = new Map();
for (const w of WORKERS) {
  for (const t of data[w].tests.filter((t) => t.status === "Gagal")) {
    gagal.set(t.kunci, { ...(gagal.get(t.kunci) ?? { t }), [w]: true });
  }
}
if (!gagal.size) L.push("Tidak ada.", "");
else {
  L.push("| Test | 1 worker | 10 worker | Pesan error (ringkas) |");
  L.push("|---|---|---|---|");
  for (const g of gagal.values()) {
    L.push(
      `| ${sel(g.t.jalur.join(" › "))} | ${g[1] ? "Gagal" : "Lulus"} | ${g[10] ? "Gagal" : "Lulus"} | ` +
        `\`${sel(ringkasPesan(g.t.pesan)) || "-"}\` |`,
    );
  }
  L.push("");
}

L.push("## d. Test yang di-retest", "");
L.push("| Test | 1w sebelum → sesudah | 10w sebelum → sesudah |");
L.push("|---|---|---|");
const retestB = new Map(b.tests.filter((t) => t.diretest).map((t) => [t.kunci, t]));
for (const t of a.tests.filter((t) => t.diretest)) {
  const u = retestB.get(t.kunci);
  L.push(
    `| ${sel(t.jalur.join(" › "))} | ${t.statusLama} → ${t.status} | ` +
      `${u ? `${u.statusLama} → ${u.status}` : "-"} |`,
  );
}
L.push("");

L.push("## e. Test yang di-skip", "");
const skip = a.tests.filter((t) => t.status === "Skip").map((t) => sel(t.jalur.at(-1)));
L.push(`${skip.length} test (sama di kedua run): ${skip.join("; ")}.`, "");

L.push("## Analisis", "", "<!-- ANALISIS -->", "");

const out = path.join(dirOut, "LAPORAN.md");
const lama = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
// Pertahankan analisis manual bila laporan dibangkitkan ulang
const analisisLama = lama.split("<!-- ANALISIS -->")[1];
let isi = L.join("\n");
if (analisisLama) isi = isi.replace("<!-- ANALISIS -->\n", "<!-- ANALISIS -->" + analisisLama);
fs.writeFileSync(out, isi, "utf8");
console.log(`Ditulis: ${relatif(out)}`);
