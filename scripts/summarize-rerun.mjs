// Menyusun results/RINGKASAN_RERUN.md dari results.json eksekusi ulang (1 worker)
// beserta hasil uji ulang test yang gagal karena gangguan lingkungan.
// Pemakaian: node scripts/summarize-rerun.mjs <folder-run> [<folder-uji-ulang>]
//   contoh : node scripts/summarize-rerun.mjs results/2026-10-27-1-worker results/2026-10-27-1-worker/ulang
import fs from "node:fs";
import path from "node:path";

import { normalizeIds, ROOT } from "./pseudocode-lib.mjs";

const BASELINE = {
  durasi: "28m57s",
  eksekusi: 527,
  gagal: ["TCDR.6", "TCDR.8", "TCDR.11", "TCDR.17", "TCDR.32", "TCDR.35", "TCSH.1"],
  tanggal: "30 Sep 2026",
};

// Urutan modul pada laporan
const MODUL = [
  "TCL", "TCBP", "TCD", "TCMO", "TCDK", "TCDR", "TCSK", "TCLA",
  "TCS", "TCDO", "TCSH", "TCP", "TCHR", "TCSQL", "TCSQLA",
];

const [dirRun, dirUlang] = process.argv.slice(2).map((d) => d && path.resolve(ROOT, d));
if (!dirRun) {
  console.error("Pemakaian: node scripts/summarize-rerun.mjs <folder-run> [<folder-uji-ulang>]");
  process.exit(1);
}

const fmtDurasi = (ms) => {
  const s = Math.round(ms / 1000);
  const j = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${j ? `${j}h` : ""}${m}m${String(s % 60).padStart(2, "0")}s`;
};

// Status satu eksekusi dalam bahasa laporan
const STATUS = { expected: "Lulus", flaky: "Flaky", skipped: "Skip", unexpected: "Gagal" };

/** Membaca results.json dan meratakan menjadi daftar eksekusi test. */
const baca = (dir) => {
  const file = dir && path.join(dir, "results.json");
  if (!file || !fs.existsSync(file)) return { stats: null, tests: [] };
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
          // Kunci unik eksekusi: berkas + jalur judul lengkap
          kunci: [spec.file, ...judulInduk.slice(1), spec.title].join(" › "),
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
        });
      }
    }
    for (const s of suite.suites ?? []) walk(s, [...judulInduk, s.title]);
  };
  json.suites.forEach((s) => walk(s, []));
  return { stats: json.stats, tests };
};

const run = baca(dirRun);
const ulang = baca(dirUlang);
const hasilUlang = new Map(ulang.tests.map((t) => [t.kunci, t]));

const idDari = (judul) => {
  const id = judul.match(/^(TC[A-Z]+\.[\d.-]+)/)?.[1];
  return id ? normalizeIds(id.replace(/[.-]$/, "")) : [];
};

/** Klasifikasi penyebab kegagalan dari pesan error Playwright. */
const klasifikasi = (t) => {
  const p = t.pesan;
  if (/ERR_INTERNET_DISCONNECTED|ERR_NETWORK_CHANGED|ERR_NAME_NOT_RESOLVED/.test(p)) {
    return "Gangguan jaringan (lingkungan)";
  }
  if (/page\.goto: Timeout/.test(p)) return "Gangguan jaringan (lingkungan)";
  if (/Expected pattern: \/dashboard\/[\s\S]*Received string:\s+"[^"]*\/login"/.test(p)) {
    return "Login tidak sampai ke backend (lingkungan)";
  }
  if (/ENOENT/.test(p)) return "Berkas uji tidak ada (lingkungan)";
  if (/Test timeout of \d+ms exceeded/.test(p)) return "Melebihi batas waktu test";
  if (/Melebihi LOAD_TIME/.test(p)) return "Melebihi LOAD_TIME";
  if (/Timeout \d+ms|element\(s\) not found|waiting for/.test(p)) {
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
    .slice(0, 300);

const sel = (s) => s.replace(/\|/g, "\\|").replace(/`/g, "'");
const judulPenuh = (t) => [...t.konteks.slice(1), t.judul].join(" › ");

// ── Rekap per TC-ID ──────────────────────────────────────────────────────
const perTC = new Map();
for (const t of run.tests) {
  for (const id of idDari(t.judul)) {
    perTC.set(id, [...(perTC.get(id) ?? []), t]);
  }
}

const n = (list, s) => list.filter((t) => t.status === s).length;
/** Status akhir TC: hasil run, dengan eksekusi yang gagal/tidak jalan diganti hasil uji ulangnya. */
const statusAkhir = (list) => {
  const akhir = list.map((t) => hasilUlang.get(t.kunci)?.status ?? t.status);
  const diulang = list.some((t) => hasilUlang.has(t.kunci));
  let s;
  if (akhir.some((x) => x === "Gagal")) s = "Gagal";
  else if (akhir.every((x) => x === "Skip" || x === "Tidak jalan")) s = "Skip";
  else s = "Lulus";
  return diulang ? `${s} (setelah uji ulang)` : s;
};

const urutId = (a, b) => {
  const [pa, na] = a.split(".");
  const [pb, nb] = b.split(".");
  const ma = MODUL.indexOf(pa);
  const mb = MODUL.indexOf(pb);
  if (pa !== pb) return (ma < 0 ? 99 : ma) - (mb < 0 ? 99 : mb) || pa.localeCompare(pb);
  return Number(na) - Number(nb);
};
const ids = [...perTC.keys()].sort(urutId);

// ── Tulis laporan ───────────────────────────────────────────────────────
const L = [];
const s = run.stats;
const tanggalRun = new Date(s.startTime).toISOString().slice(0, 10);
const jumlah = (st) => run.tests.filter((t) => t.status === st).length;

L.push("# Ringkasan Eksekusi Ulang (Think Time & Load Time)", "");
L.push(
  `Tanggal eksekusi: ${tanggalRun}. Proyek: chromium, 1 worker. THINK_TIME 1,2 s, LOAD_TIME 10 s, ` +
    "retries 0, timeout per test 120 s (blok serial TCDR.32–35: 180 s). Perangkat: laptop " +
    "pengganti Intel i7-5600U (2 core / 4 thread), RAM 16 GB, berbeda dari perangkat baseline.",
  "",
  "Cakupan: 527 test, sama dengan baseline (tanpa `performance/*`, `screenshot-ui`, " +
    "`accessControl`, `xss`). Hasil mentah di `results/" + path.basename(dirRun) + "/`: " +
    "`results.json`, laporan HTML (`html-report/`), log terminal (`log.txt`), dan `summary.png`.",
  "",
);
if (ulang.stats) {
  L.push(
    "Test yang gagal karena gangguan lingkungan (jaringan putus, berkas uji tidak ada) " +
      "dijalankan ulang **sekali**, terpisah, dengan konfigurasi yang sama (1 worker, retries 0). " +
      "Hasilnya di `ulang/`. Angka di tabel a adalah hasil run asli; hasil uji ulang hanya " +
      "dipakai untuk status akhir di tabel b.",
    "",
  );
}

L.push("## a. Ringkasan per run", "");
L.push("| Run | Total test | Passed | Failed | Skipped | Flaky | Durasi |");
L.push("|---|---:|---:|---:|---:|---:|---:|");
L.push(
  `| 1 worker | ${run.tests.length} | ${jumlah("Lulus")} | ${jumlah("Gagal")} | ` +
    `${jumlah("Skip") + jumlah("Tidak jalan")} (${jumlah("Skip")} skip + ${jumlah("Tidak jalan")} tidak jalan) | ` +
    `${jumlah("Flaky")} | ${fmtDurasi(s.duration)} |`,
);
if (ulang.stats) {
  const u = (st) => ulang.tests.filter((t) => t.status === st).length;
  L.push(
    `| Uji ulang (1 worker) | ${ulang.tests.length} | ${u("Lulus")} | ${u("Gagal")} | ` +
      `${u("Skip") + u("Tidak jalan")} | ${u("Flaky")} | ${fmtDurasi(ulang.stats.duration)} |`,
  );
}
L.push(`| Baseline ${BASELINE.tanggal} (1 worker) | ${BASELINE.eksekusi} | – | – | – | – | ${BASELINE.durasi} |`);
L.push("");

L.push("## b. Status per TC-ID", "");
L.push(
  "Satu TC-ID bisa dieksekusi beberapa kali (multi-peran dan variasi data). Kolom eksekusi, " +
    "lulus, gagal, dan skip dihitung dari run asli; skip termasuk test yang tidak dijalankan " +
    "karena test sebelumnya di blok serial gagal. Status akhir = Gagal bila masih ada eksekusi " +
    "gagal setelah uji ulang; Skip bila seluruh eksekusi dilewati.",
  "",
);
let modulAktif = "";
for (const id of ids) {
  const modul = id.split(".")[0];
  if (modul !== modulAktif) {
    modulAktif = modul;
    L.push("", `**${modul}**`, "");
    L.push("| TC-ID | Jumlah eksekusi | Lulus | Gagal | Skip | Status akhir |");
    L.push("|---|---:|---:|---:|---:|---|");
  }
  const list = perTC.get(id);
  L.push(
    `| ${id} | ${list.length} | ${n(list, "Lulus")} | ${n(list, "Gagal")} | ` +
      `${n(list, "Skip") + n(list, "Tidak jalan")} | ${statusAkhir(list)} |`,
  );
}
L.push("");

L.push(`## c. Perbandingan dengan baseline ${BASELINE.tanggal}`, "");
L.push(
  `Baseline: ${BASELINE.eksekusi} eksekusi, ${BASELINE.durasi} (1 worker). ` +
    `TC gagal di baseline: ${BASELINE.gagal.join(", ")}.`,
  "",
);
const sAsli = (id) => {
  const list = perTC.get(id) ?? [];
  if (!list.length) return "-";
  if (n(list, "Gagal")) return "Gagal";
  if (list.every((t) => t.status === "Skip" || t.status === "Tidak jalan")) return "Skip";
  return "Lulus";
};
const gagalSekarang = ids.filter((id) => sAsli(id) === "Gagal" || statusAkhir(perTC.get(id)).startsWith("Gagal"));
L.push("| TC-ID | Baseline | Run asli | Status akhir | Perubahan terhadap baseline |");
L.push("|---|---|---|---|---|");
for (const id of [...new Set([...BASELINE.gagal, ...gagalSekarang])].sort(urutId)) {
  // Baseline hanya mencatat TC yang gagal; selebihnya "Tidak gagal" (lulus atau skip)
  const b = BASELINE.gagal.includes(id) ? "Gagal" : "Tidak gagal";
  const akhir = perTC.has(id) ? statusAkhir(perTC.get(id)) : "-";
  const a = akhir.split(" ")[0];
  const ubah =
    b === "Gagal"
      ? a === "Gagal" ? "tetap" : `berubah: kini ${a.toLowerCase()}`
      : a === "Gagal" ? "berubah: kini gagal" : "tetap";
  L.push(`| ${id} | ${b} | ${sAsli(id)} | ${akhir} | ${ubah} |`);
}
L.push("");

L.push("### Rincian kegagalan run asli", "");
const gagal = run.tests.filter((t) => t.status === "Gagal" || t.status === "Tidak jalan");
L.push("| Test | Klasifikasi otomatis | Pesan error (ringkas) | Uji ulang |");
L.push("|---|---|---|---|");
for (const t of gagal) {
  const u = hasilUlang.get(t.kunci);
  L.push(
    `| ${sel(judulPenuh(t))} | ${t.status === "Tidak jalan" ? "Tidak jalan (blok serial)" : klasifikasi(t)} | ` +
      `\`${sel(ringkasPesan(t.pesan)) || "-"}\` | ${u ? u.status : "-"} |`,
  );
}
L.push("");

if (ulang.stats) {
  const gagalUlang = ulang.tests.filter((t) => t.status === "Gagal");
  L.push("### Kegagalan yang tersisa setelah uji ulang", "");
  if (!gagalUlang.length) L.push("Tidak ada.", "");
  else {
    L.push("| Test | Klasifikasi otomatis | Pesan error (ringkas) |");
    L.push("|---|---|---|");
    for (const t of gagalUlang) {
      L.push(`| ${sel(judulPenuh(t))} | ${klasifikasi(t)} | \`${sel(ringkasPesan(t.pesan))}\` |`);
    }
    L.push("");
  }
}

L.push("## Analisis", "", "<!-- ANALISIS -->", "");

const out = path.join(ROOT, "results", "RINGKASAN_RERUN.md");
const lama = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
// Pertahankan analisis manual bila laporan dibangkitkan ulang
const analisisLama = lama.split("<!-- ANALISIS -->")[1];
let isi = L.join("\n");
if (analisisLama) isi = isi.replace("<!-- ANALISIS -->\n", "<!-- ANALISIS -->" + analisisLama);
fs.writeFileSync(out, isi, "utf8");
console.log(`Ditulis: ${path.relative(ROOT, out)}`);
console.log(`Run      : ${JSON.stringify(run.stats)}`);
console.log(`Uji ulang: ${JSON.stringify(ulang.stats)}`);
