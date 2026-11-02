// Memulihkan penugasan relawan uji yang digandakan TCDR.29–30 selama regresi.
// TCDR.29 (edit penugasan) menyisipkan ulang seluruh penugasan tanpa penugasan_id,
// dan TCDR.30 (hapus penugasan) membuat ulang penugasan yang sudah dihapus. Skrip ini
// mencatat penugasan seluruh relawan sebelum run, lalu sesudah run mengembalikan
// relawan yang sudah ada ke kumpulan penugasan semula.
//
// Pemakaian:
//   node scripts/pulihkan-penugasan.mjs catat <snapshot.json>
//   node scripts/pulihkan-penugasan.mjs pulihkan <snapshot.json> [--terapkan]
// Tanpa --terapkan, pulihkan hanya menampilkan rencana (tidak mengubah data).
// Relawan yang dibuat selama run tidak disentuh, hanya dilaporkan.
import fs from "node:fs";

import { credentials } from "../src/helpers/credentials.helper.ts";

const API = process.env.VITE_API_URL ?? "https://backend-skripsi-relawan.vercel.app/api";
const [mode, fileSnapshot, ...opsi] = process.argv.slice(2);
const TERAPKAN = opsi.includes("--terapkan");

if (!["catat", "pulihkan"].includes(mode) || !fileSnapshot) {
  console.error("Pemakaian: node scripts/pulihkan-penugasan.mjs catat|pulihkan <snapshot.json> [--terapkan]");
  process.exit(1);
}

const login = async ({ NIK, password }) => {
  const res = await fetch(`${API}/auth/login`, {
    body: JSON.stringify({ nik: NIK, password }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Login gagal (HTTP ${res.status})`);
  return body.token;
};

const token = await login(credentials.superAdmin);
const headers = { Authorization: `Bearer ${token}` };

const ambilRelawan = async () => {
  const body = await (await fetch(`${API}/admin/relawan`, { headers })).json();
  if (!body.success) throw new Error(body.message ?? "Gagal memuat relawan");
  return body.data;
};

// Isi penugasan untuk mencocokkan penugasan yang dibuat ulang dengan aslinya
const isi = (a) =>
  [a.opd_id, a.kader_id, a.penugasan, a.jabatan, a.detail_jabatan, a.sk_id, a.status_penugasan].join("|");

const ringkas = (r) => ({
  nama: r.nama_lengkap,
  penugasan: (r.assignments ?? []).map((a) => ({ id: a.penugasan_id, isi: isi(a) })),
});

if (mode === "catat") {
  const rows = await ambilRelawan();
  const snapshot = {
    dicatat: new Date().toISOString(),
    relawan: Object.fromEntries(rows.map((r) => [r.nik, ringkas(r)])),
  };
  fs.writeFileSync(fileSnapshot, JSON.stringify(snapshot, null, 1));
  const total = rows.reduce((n, r) => n + (r.assignments?.length ?? 0), 0);
  console.log(`Dicatat: ${rows.length} relawan, ${total} penugasan -> ${fileSnapshot}`);
  process.exit(0);
}

// ── pulihkan ────────────────────────────────────────────────────────────
const snapshot = JSON.parse(fs.readFileSync(fileSnapshot, "utf8"));
const rows = await ambilRelawan();
let totalHapus = 0;
let gagal = 0;
const baru = [];

for (const r of rows) {
  const awal = snapshot.relawan[r.nik];
  const sekarang = ringkas(r).penugasan;
  if (!awal) {
    if (sekarang.length) baru.push(`${r.nik} ${r.nama_lengkap} (${sekarang.length} penugasan)`);
    continue;
  }
  const idAwal = new Set(awal.penugasan.map((a) => a.id));
  const tambahan = sekarang.filter((a) => !idAwal.has(a.id));
  if (!tambahan.length) continue;

  // Penugasan asli yang hilang (dihapus TCDR.30) diganti satu salinan berisi sama
  const idSekarang = new Set(sekarang.map((a) => a.id));
  const pengganti = new Set();
  for (const hilang of awal.penugasan.filter((a) => !idSekarang.has(a.id))) {
    const cocok = tambahan.find((a) => a.isi === hilang.isi && !pengganti.has(a.id));
    if (cocok) pengganti.add(cocok.id);
  }
  const hapus = tambahan.filter((a) => !pengganti.has(a.id));
  const sisa = sekarang.length - hapus.length;
  console.log(
    `${r.nik} ${r.nama_lengkap}: awal ${awal.penugasan.length}, sekarang ${sekarang.length}, ` +
      `hapus ${hapus.length}${pengganti.size ? ` (pertahankan pengganti ${[...pengganti].join(", ")})` : ""} -> ${sisa}` +
      (sisa === awal.penugasan.length ? "" : "  [JUMLAH BELUM SAMA DENGAN AWAL]"),
  );
  if (!TERAPKAN) continue;
  for (const a of hapus) {
    const res = await fetch(`${API}/admin/relawan/penugasan/${a.id}`, { headers, method: "DELETE" });
    if (res.ok) totalHapus++;
    else {
      gagal++;
      console.log(`  GAGAL hapus #${a.id}: HTTP ${res.status}`);
    }
  }
}

if (baru.length) {
  console.log(`Relawan baru selama run (tidak disentuh): ${baru.length}`);
  baru.forEach((b) => console.log(`  ${b}`));
}
console.log(TERAPKAN ? `Dihapus: ${totalHapus}, gagal: ${gagal}` : "Simulasi saja; tambahkan --terapkan untuk menghapus.");
