// Menyusun results/RINGKASAN_RERUN.md dari results.json eksekusi ulang.
// Pemakaian: node scripts/summarize-rerun.mjs <folder-1-worker> <folder-10-worker>
//   contoh : node scripts/summarize-rerun.mjs results/2026-10-21-1-worker results/2026-10-21-10-worker
import fs from "node:fs";
import path from "node:path";

import { normalizeIds, ROOT } from "./pseudocode-lib.mjs";

const BASELINE = {
  durasi: { 1: "28m57s", 10: "10m17s" },
  eksekusi: 527,
  gagal: ["TCDR.6", "TCDR.8", "TCDR.11", "TCDR.17", "TCDR.32", "TCDR.35", "TCSH.1"],
  tanggal: "30 Sep 2026",
};

const [dir1, dir10] = process.argv.slice(2).map((d) => path.resolve(ROOT, d));
if (!dir1 || !dir10) {
  console.error("Pemakaian: node scripts/summarize-rerun.mjs <dir-1-worker> <dir-10-worker>");
  process.exit(1);
}

const fmtDurasi = (ms) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;
};

// Status akhir satu test dalam bahasa laporan
const STATUS = { expected: "Lulus", flaky: "Flaky", skipped: "Skip", unexpected: "Gagal" };

/** Membaca results.json dan meratakan menjadi daftar eksekusi test. */
const baca = (dir) => {
  const file = path.join(dir, "results.json");
  // Run yang belum/tidak selesai dijalankan: tampil sebagai "belum dijalankan"
  if (!fs.existsSync(file)) return { stats: null, tests: [] };
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const tests = [];
  const walk = (suite, judulInduk) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) {
        const hasil = t.results.at(-1) ?? {};
        const pesan = (hasil.errors ?? [])
          .map((e) => e.message ?? "")
          .join("\n")
          .replace(/\u001b\[[0-9;]*m/g, "");
        tests.push({
          durasi: hasil.duration ?? 0,
          file: spec.file,
          judul: spec.title,
          konteks: judulInduk,
          pesan,
          // "skipped" tanpa anotasi skip = tidak dijalankan (test serial setelah
          // test sebelumnya gagal); test.skip() yang disengaja punya anotasi "skip"
          status:
            !t.results.length ||
            (t.status === "skipped" && !(t.annotations ?? []).some((a) => a.type === "skip"))
              ? "Tidak jalan"
              : (STATUS[t.status] ?? t.status),
          statusMentah: hasil.status,
        });
      }
    }
    for (const s of suite.suites ?? []) walk(s, [...judulInduk, s.title]);
  };
  json.suites.forEach((s) => walk(s, []));
  return { stats: json.stats, tests };
};

const run = { 1: baca(dir1), 10: baca(dir10) };

const idDari = (judul) => {
  const id = judul.match(/^(TC[A-Z]+\.[\d.-]+)/)?.[1];
  return id ? normalizeIds(id.replace(/[.-]$/, "")) : [];
};

/** Klasifikasi penyebab kegagalan dari pesan error Playwright. */
const klasifikasi = (t) => {
  const p = t.pesan;
  if (/Test timeout of \d+ms exceeded/.test(p)) return "Melebihi batas waktu test";
  if (/Melebihi LOAD_TIME/.test(p)) return "Melebihi LOAD_TIME";
  if (/Timed out \d+ms waiting for expect|Timeout \d+ms exceeded|waiting for/.test(p)) {
    return "Kondisi tidak terpenuhi dalam LOAD_TIME";
  }
  if (/Expected|Received/.test(p)) return "Hasil aktual ≠ hasil yang diharapkan";
  return "Lainnya";
};

const ringkasPesan = (p) =>
  p
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^at |^\d+ \||^\s*\||^>|^Call log:|^- /.test(l))
    .slice(0, 4)
    .join(" ")
    .slice(0, 400);

// ── Rekap per TC-ID ──────────────────────────────────────────────────────
const perTC = new Map();
for (const w of [1, 10]) {
  for (const t of run[w].tests) {
    for (const id of idDari(t.judul)) {
      const r = perTC.get(id) ?? { 1: [], 10: [] };
      r[w].push(t);
      perTC.set(id, r);
    }
  }
}

const statusTC = (list) => {
  if (!list.length) return "-";
  if (list.some((t) => t.status === "Gagal")) return "Gagal";
  if (list.some((t) => t.status === "Flaky")) return "Flaky";
  if (list.every((t) => t.status === "Tidak jalan")) return "Tidak jalan";
  if (list.every((t) => t.status === "Skip" || t.status === "Tidak jalan")) return "Skip";
  return "Lulus";
};
const hitung = (list) => {
  if (!list.length) return "-";
  const n = (s) => list.filter((t) => t.status === s).length;
  const tj = n("Tidak jalan") ? ` / TJ ${n("Tidak jalan")}` : "";
  return `${list.length} (L ${n("Lulus")} / G ${n("Gagal")} / S ${n("Skip")}${tj})`;
};

const urutId = (a, b) => {
  const [pa, na] = a.split(".");
  const [pb, nb] = b.split(".");
  return pa === pb ? Number(na) - Number(nb) : pa.localeCompare(pb);
};
const ids = [...perTC.keys()].sort(urutId);

// ── Tulis laporan ───────────────────────────────────────────────────────
const L = [];
const tanggalRun = new Date(run[1].stats.startTime).toISOString().slice(0, 10);

L.push("# Ringkasan Eksekusi Ulang (Think Time & Load Time)", "");
L.push(
  `Tanggal eksekusi: ${tanggalRun}. Proyek: chromium. THINK_TIME 1,2 s, LOAD_TIME 10 s, ` +
    "retries 0, timeout per test 120 s (blok serial TCDR.32–35: 180 s).",
  "",
  "Cakupan: 527 test, sama dengan baseline (tanpa `performance/*`, `screenshot-ui`, " +
    "`accessControl`, `xss`). Hasil mentah: `results.json`, laporan HTML (`html-report/`), " +
    "dan log terminal (`log.txt`) pada folder masing-masing.",
  "",
);

L.push("## 1. Statistik", "");
L.push("| Metrik | 1 worker | 10 worker | Baseline 1 worker | Baseline 10 worker |");
L.push("|---|---:|---:|---:|---:|");
const BELUM = "belum dijalankan";
const nilai = (w, f) => (run[w].stats ? f(run[w].stats) : BELUM);
const total = (w) => (run[w].stats ? run[w].tests.length : BELUM);
L.push(`| Total test | ${total(1)} | ${total(10)} | ${BASELINE.eksekusi} | ${BASELINE.eksekusi} |`);
L.push(`| Passed | ${nilai(1, (s) => s.expected)} | ${nilai(10, (s) => s.expected)} | – | – |`);
L.push(`| Failed | ${nilai(1, (s) => s.unexpected)} | ${nilai(10, (s) => s.unexpected)} | – | – |`);
L.push(
  `| Skipped (termasuk "did not run") | ${nilai(1, (s) => s.skipped)} | ` +
    `${nilai(10, (s) => s.skipped)} | – | – |`,
);
L.push(`| Flaky | ${nilai(1, (s) => s.flaky)} | ${nilai(10, (s) => s.flaky)} | – | – |`);
L.push(
  `| Durasi | ${nilai(1, (s) => fmtDurasi(s.duration))} | ${nilai(10, (s) => fmtDurasi(s.duration))} | ` +
    `${BASELINE.durasi[1]} | ${BASELINE.durasi[10]} |`,
);
L.push("");

L.push("## 2. Status per TC-ID", "");
L.push(
  "Kolom eksekusi: jumlah eksekusi (L = lulus, G = gagal, S = skip, TJ = tidak " +
    "dijalankan karena test sebelumnya di blok serial gagal). Satu TC-ID bisa " +
    "dieksekusi beberapa kali karena multi-peran dan variasi data. Status TC = Gagal bila " +
    "ada satu eksekusi gagal; Skip bila seluruhnya dilewati.",
  "",
);
L.push("| TC-ID | Status 1 worker | Eksekusi 1 worker | Status 10 worker | Eksekusi 10 worker |");
L.push("|---|---|---|---|---|");
for (const id of ids) {
  const r = perTC.get(id);
  L.push(`| ${id} | ${statusTC(r[1])} | ${hitung(r[1])} | ${statusTC(r[10])} | ${hitung(r[10])} |`);
}
L.push("");

L.push(`## 3. Perbandingan dengan baseline ${BASELINE.tanggal}`, "");
L.push(`TC gagal di baseline: ${BASELINE.gagal.join(", ")}.`, "");
const gagalSekarang = (w) => ids.filter((id) => statusTC(perTC.get(id)[w]) === "Gagal");
L.push("| TC-ID | Baseline | 1 worker | 10 worker | Perubahan |");
L.push("|---|---|---|---|---|");
const gabung = [...new Set([...BASELINE.gagal, ...gagalSekarang(1), ...gagalSekarang(10)])].sort(
  urutId,
);
for (const id of gabung) {
  const r = perTC.get(id) ?? { 1: [], 10: [] };
  const b = BASELINE.gagal.includes(id) ? "Gagal" : "Lulus";
  const s1 = statusTC(r[1]);
  const s10 = statusTC(r[10]);
  // Hanya run yang benar-benar ada yang dibandingkan
  const ada = [s1, s10].filter((s) => s !== "-");
  const ubah = !ada.length
    ? "belum ada data"
    : ada.every((s) => s === b)
      ? "tetap"
      : b === "Gagal" && ada.every((s) => s !== "Gagal")
        ? `berubah: kini ${ada.join("/")}`
        : b === "Lulus" && ada.some((s) => s === "Gagal")
          ? "berubah: kini gagal"
          : "berubah sebagian";
  L.push(`| ${id} | ${b} | ${s1} | ${s10} | ${ubah} |`);
}
L.push("");

L.push("## 4. Rincian kegagalan", "");
L.push(
  "Klasifikasi otomatis dari pesan error: *Hasil aktual ≠ hasil yang diharapkan* " +
    "(assertion nilai/teks), *Kondisi tidak terpenuhi dalam LOAD_TIME* (penantian " +
    "eksplisit 10 s habis), *Melebihi LOAD_TIME* (pesan dari timing.helper), atau " +
    "*Melebihi batas waktu test*. Analisis per TC ada di bagian 5.",
  "",
);
for (const w of [1, 10]) {
  if (!run[w].stats) {
    L.push(`### ${w} worker`, "", "Belum dijalankan.", "");
    continue;
  }
  const gagal = run[w].tests.filter((t) => t.status === "Gagal" || t.status === "Flaky");
  L.push(`### ${w} worker (${gagal.length} eksekusi gagal)`, "");
  if (!gagal.length) {
    L.push("Tidak ada.", "");
    continue;
  }
  L.push("| Test | Klasifikasi | Pesan error (ringkas) |");
  L.push("|---|---|---|");
  for (const t of gagal) {
    const judul = [...t.konteks.slice(1), t.judul].join(" › ");
    L.push(
      `| ${judul.replace(/\|/g, "\\|")} | ${klasifikasi(t)} | ` +
        `\`${ringkasPesan(t.pesan).replace(/\|/g, "\\|").replace(/`/g, "'")}\` |`,
    );
  }
  L.push("");
}

L.push("## 5. Analisis TC yang gagal", "", "<!-- ANALISIS -->", "");

const out = path.join(ROOT, "results", "RINGKASAN_RERUN.md");
let lama = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
// Pertahankan analisis manual (bagian 5) bila laporan dibangkitkan ulang
const analisisLama = lama.split("<!-- ANALISIS -->")[1];
let isi = L.join("\n");
if (analisisLama) isi = isi.replace("<!-- ANALISIS -->\n", "<!-- ANALISIS -->" + analisisLama);
fs.writeFileSync(out, isi, "utf8");
console.log(`Ditulis: ${path.relative(ROOT, out)}`);
console.log(`1 worker : ${JSON.stringify(run[1].stats)}`); // null = belum dijalankan
console.log(`10 worker: ${JSON.stringify(run[10].stats)}`);
