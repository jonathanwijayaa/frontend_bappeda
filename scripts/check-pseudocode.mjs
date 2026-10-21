// Cek otomatis pseudocode skripsi.
//  1. Gagal bila ada baris pseudocode > 72 karakter (dihitung per code point).
//  2. Gagal bila ada karakter non-ASCII selain ← ≠ × –.
//  3. Gagal bila pseudocode.json tidak sama dengan isi file .md (jalankan build).
//  4. Mencocokkan tc_ids tiap modul dengan TC-ID pada judul test di spec-nya
//     (diambil dari `playwright test --list --reporter=json`), lalu melaporkan
//     TC-ID yang hilang (ada di spec, tidak ada di pseudocode) atau berlebih.
// Pemakaian: node scripts/check-pseudocode.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";

import {
  JSON_PATH,
  MAX_LINE,
  moduleFiles,
  normalizeIds,
  parseModule,
  ROOT,
} from "./pseudocode-lib.mjs";

const ALLOWED_NON_ASCII = new Set(["←", "≠", "×", "–"]);
let gagal = 0;
const lapor = (msg) => {
  gagal++;
  console.log(`  ✗ ${msg}`);
};

const files = moduleFiles();
const modules = files.map(parseModule);

// ── 1 & 2. Panjang baris dan karakter ─────────────────────────────────────
console.log("1. Panjang baris (maks 72) & karakter yang diizinkan");
modules.forEach((m, i) => {
  m.code.split("\n").forEach((line, n) => {
    const len = [...line].length;
    if (len > MAX_LINE) lapor(`${files[i]} baris ${n + 1}: ${len} karakter`);
    const terlarang = [...new Set([...line])].filter(
      (ch) => ch.charCodeAt(0) > 127 && !ALLOWED_NON_ASCII.has(ch),
    );
    if (terlarang.length) {
      lapor(`${files[i]} baris ${n + 1}: karakter tidak diizinkan ${terlarang.join(" ")}`);
    }
    if (/\t/.test(line)) lapor(`${files[i]} baris ${n + 1}: memakai tab, bukan spasi`);
  });
});

// ── 3. Sinkron dengan pseudocode.json ─────────────────────────────────────
console.log("2. pseudocode.json sinkron dengan file .md");
if (!fs.existsSync(JSON_PATH)) {
  lapor("pseudocode.json belum ada (jalankan node scripts/build-pseudocode.mjs)");
} else {
  const json = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  if (JSON.stringify(json) !== JSON.stringify(modules)) {
    lapor("pseudocode.json berbeda dari file .md (jalankan node scripts/build-pseudocode.mjs)");
  }
}

// ── 4. Cakupan TC-ID ──────────────────────────────────────────────────────
console.log("3. Cakupan TC-ID terhadap judul test di spec");
const list = spawnSync("npx playwright test --list --project=chromium --reporter=json", {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  shell: true,
});
const report = JSON.parse(list.stdout);

// file spec (relatif ke testDir) -> Set TC-ID dari judul test
const idsPerFile = new Map();
const walk = (suite) => {
  for (const spec of suite.specs ?? []) {
    const id = spec.title.match(/^(TC[A-Z]+\.[\d.-]+)/)?.[1];
    if (!id) continue;
    const set = idsPerFile.get(spec.file) ?? new Set();
    normalizeIds(id.replace(/[.-]$/, "")).forEach((x) => set.add(x));
    idsPerFile.set(spec.file, set);
  }
  (suite.suites ?? []).forEach(walk);
};
report.suites.forEach(walk);

const urut = (a, b) => Number(a.split(".")[1]) - Number(b.split(".")[1]);

for (const m of modules) {
  if (!m.prefix) continue; // 00_umum: pola umum, bukan modul
  const rel = m.berkas.replace(/^src\/tests\//, "");
  const dariSpec = idsPerFile.get(rel);
  if (!dariSpec) {
    lapor(`${m.modul}: berkas "${m.berkas}" tidak ditemukan pada daftar test`);
    continue;
  }
  const dariPseudo = new Set(m.tc_ids.flatMap(normalizeIds));

  const hilang = [...dariSpec].filter((x) => !dariPseudo.has(x)).sort(urut);
  const lebih = [...dariPseudo].filter((x) => !dariSpec.has(x)).sort(urut);
  const salahPrefix = m.tc_ids.filter((x) => !x.startsWith(`${m.prefix}.`));

  if (hilang.length) lapor(`${m.modul}: hilang dari pseudocode → ${hilang.join(", ")}`);
  if (lebih.length) lapor(`${m.modul}: berlebih (tidak ada di spec) → ${lebih.join(", ")}`);
  if (salahPrefix.length) lapor(`${m.modul}: prefix tidak cocok → ${salahPrefix.join(", ")}`);
  if (!hilang.length && !lebih.length && !salahPrefix.length) {
    console.log(`  ✓ ${m.modul}: ${dariSpec.size} TC-ID cocok`);
  }
}

console.log(gagal ? `\nGAGAL: ${gagal} masalah` : "\nBERSIH: semua cek lulus");
process.exit(gagal ? 1 : 0);
