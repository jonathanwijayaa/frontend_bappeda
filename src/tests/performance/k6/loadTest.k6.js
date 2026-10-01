/*
 * Load Testing dengan k6 per Test Case TCLT.01–TCLT.23 (REFERENSI)
 * ─────────────────────────────────────────────────────────────────────────────
 * Setiap skenario k6 di file ini mengikuti satu baris sheet "Load Testing Test
 * Case" (Test Case Bappeda.xlsx): jumlah VU, ramp-up, durasi, step stress, dan
 * fase spike ditulis persis seperti rancangan di kolom F–H. Kriteria kolom
 * Expected Result dipasang sebagai threshold per skenario (tag `scenario`).
 * Pendamping loadTestCases.spec.ts (versi Playwright dengan TC yang sama).
 *
 * k6 adalah alat load testing khusus (VU multi-thread di Go), jadi hasilnya jauh
 * lebih akurat untuk beban tinggi dibanding Playwright yang terikat satu event loop.
 *
 * PRASYARAT: pasang k6 (https://grafana.com/docs/k6/latest/set-up/install-k6/).
 *   Windows (winget) : winget install k6.k6
 *   Windows (choco)  : choco install k6
 *
 * MENJALANKAN:
 *   # satu test case (disarankan: jalankan per TC)
 *   k6 run -e TC=TCLT.03 src/tests/performance/k6/loadTest.k6.js
 *   # beberapa TC berurutan
 *   k6 run -e TC=TCLT.01,TCLT.03,TCLT.22 src/tests/performance/k6/loadTest.k6.js
 *   # semua TC yang bisa dijalankan, berurutan
 *   k6 run src/tests/performance/k6/loadTest.k6.js
 *   # sesuai rancangan penuh (disarankan ke backend lokal)
 *   k6 run -e VU_SCALE=1 -e TIME_SCALE=1 -e VITE_API_URL=http://localhost:3000/api \
 *          -e TC=TCLT.02 src/tests/performance/k6/loadTest.k6.js
 *
 * SKALA: rancangan asli (mis. 800 VU, soak 2 jam) akan diblokir proteksi edge
 * Vercel (HTTP 403) bila ditembakkan ke deployment produksi dari satu IP, jadi
 * beban DISKALAKAN secara default:
 *   VU_SCALE   — pengali jumlah VU        (default 0.05 → 100 VU jadi 5 VU)
 *   TIME_SCALE — pengali ramp-up & durasi (default 0.05 → 5 menit jadi 15 detik)
 *
 * Env lain: VITE_API_URL, LOAD_BASE_URL, THINK_S (think time, default 1),
 *   SA_NIK/SA_PASS, OPD_NIK/OPD_PASS, REL_NIK/REL_PASS (kredensial akun uji),
 *   OUT (berkas ringkasan JSON, default test-results/load-testing/k6-tclt-summary.json).
 *
 * Hanya endpoint baca (GET) dan login yang ditembak; tidak ada data yang ditulis.
 * TC yang menuntut fitur yang tidak ada di aplikasi (Sign Up, unggah foto profil)
 * tidak dibuatkan skenario — lihat SKIPPED di bawah.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

const API = (__ENV.VITE_API_URL || "https://backend-skripsi-relawan.vercel.app/api").replace(/\/$/, "");
const FRONTEND = (__ENV.LOAD_BASE_URL || "https://frontend-bappeda.vercel.app").replace(/\/$/, "");
const VU_SCALE = Number(__ENV.VU_SCALE || 0.05);
const TIME_SCALE = Number(__ENV.TIME_SCALE || 0.05);
const THINK_S = Number(__ENV.THINK_S || 1);

const CREDS = {
  opd: { nik: __ENV.OPD_NIK || "0000000000000000", password: __ENV.OPD_PASS || "0000000000000000" },
  relawan: { nik: __ENV.REL_NIK || "2222222222222222", password: __ENV.REL_PASS || "2222222222222222" },
  superAdmin: { nik: __ENV.SA_NIK || "1234567890100011", password: __ENV.SA_PASS || "1234567890100011" },
};

// ── Profil beban (stages k6) ────────────────────────────────────────────────
const vu = (n) => Math.max(1, Math.round(n * VU_SCALE));
const dur = (s) => `${Math.max(1, Math.round(s * TIME_SCALE))}s`;
const secOf = (d) => Number(d.replace("s", ""));

/** Ramp-up lalu tahan: "N VU, ramp X, durasi Y". */
const rampHold = (n, rampS, holdS) => [
  { duration: dur(rampS), target: vu(n) },
  { duration: dur(holdS), target: vu(n) },
];

/** Stress bertahap: from → to dengan kenaikan step, tiap step ditahan holdS. */
const steps = (from, to, step, holdS) => {
  const out = [];
  for (let n = from; n <= to; n += step) {
    out.push({ duration: "1s", target: vu(n) });
    out.push({ duration: dur(holdS), target: vu(n) });
  }
  return out;
};

/** Spike: baseline → lonjakan dalam ≤15 dtk → tahan → kembali ke baseline → pemulihan. */
const spike = (base, peak, peakS, recoverS) => [
  { duration: dur(60), target: vu(base) },
  { duration: dur(15), target: vu(peak) },
  { duration: dur(peakS), target: vu(peak) },
  { duration: dur(15), target: vu(base) },
  { duration: dur(recoverS), target: vu(base) },
];

// Kriteria Expected Result yang dipakai berulang
const STANDARD = { err: 0.01, p90: 3000 }; // 90% < 3 dtk, error < 1%

/*
 * Katalog test case. `exec` = nama fungsi flow yang diekspor di bawah.
 * `abort` = stress "sampai titik gagal": run dihentikan bila threshold dilanggar.
 * Karena k6 menghentikan SELURUH run, ini hanya aktif bila TC tersebut dijalankan
 * sendirian (mis. -e TC=TCLT.02).
 */
const CASES = {
  "TCLT.01": { exec: "homepage", stages: rampHold(100, 30, 300), ...STANDARD },
  "TCLT.02": { abort: true, exec: "homepage", stages: steps(100, 800, 100, 60), ...STANDARD },
  "TCLT.03": { exec: "loginRelawan", stages: rampHold(80, 30, 300), ...STANDARD },
  "TCLT.04": { err: 0.05, exec: "loginRelawan", p90: 3000, stages: spike(30, 250, 300, 120) },
  "TCLT.05": { exec: "loginOpd", stages: rampHold(20, 30, 300), ...STANDARD },
  "TCLT.08": { exec: "search", stages: rampHold(100, 60, 600), ...STANDARD },
  "TCLT.09": { exec: "relawanDashboard", stages: rampHold(80, 30, 600), ...STANDARD },
  "TCLT.10": { exec: "opdDashboard", stages: rampHold(20, 30, 600), ...STANDARD },
  "TCLT.11": { exec: "manajemenOPD", stages: rampHold(10, 30, 600), ...STANDARD },
  "TCLT.12": { exec: "dataRelawanOPD", stages: rampHold(20, 30, 600), ...STANDARD },
  "TCLT.13": { exec: "dataRelawanFull", max: 5000, stages: rampHold(10, 30, 600), ...STANDARD },
  "TCLT.14": { abort: true, err: 0.05, exec: "suratKeputusan", p90: 8000, stages: steps(5, 40, 5, 60) },
  "TCLT.15": { exec: "logs", stages: rampHold(15, 30, 600), ...STANDARD },
  "TCLT.16": { exec: "statistikMix", stages: rampHold(85, 60, 600), ...STANDARD },
  "TCLT.17": { abort: true, err: 0.05, exec: "statistikSA", p90: 3000, stages: steps(5, 30, 5, 60) },
  "TCLT.19": { exec: "mixedRoles", stages: rampHold(103, 60, 7200), ...STANDARD },
  "TCLT.20": { err: 0.05, exec: "mixedRoles", p90: 3000, stages: spike(100, 300, 300, 180) },
  "TCLT.21": {
    err: 0.05,
    exec: "mixedRoles",
    p90: 3000,
    stages: [100, 300, 500, 1000].flatMap((n) => [
      { duration: "1s", target: vu(n) },
      { duration: dur(120), target: vu(n) },
    ]),
  },
  "TCLT.22": { err: 0.01, exec: "apiMix", p90: 1000, stages: rampHold(150, 30, 600) },
  "TCLT.23": { exec: "download", stages: rampHold(20, 30, 600), ...STANDARD },
};

// TC tanpa skenario, beserta alasannya (dicetak di ringkasan)
const SKIPPED = {
  "TCLT.06": "Fitur Sign Up tidak ada di aplikasi (sejalan dengan TCL.7)",
  "TCLT.07": "Fitur Sign Up tidak ada di aplikasi (sejalan dengan TCL.7)",
  "TCLT.18": "Tidak ada endpoint unggah foto profil",
};

// ── Susun skenario: TC yang dipilih dijalankan berurutan (startTime berantai) ─
const requested = __ENV.TC ? __ENV.TC.split(",").map((s) => s.trim()) : Object.keys(CASES);
const selected = requested.filter((id) => CASES[id]);
const notRun = requested.filter((id) => !CASES[id]);

const scenarios = {};
const thresholds = {};
let offset = 0;
for (const id of selected) {
  const c = CASES[id];
  const name = id.replace(".", "_"); // tag scenario tidak boleh mengandung titik
  scenarios[name] = {
    exec: c.exec,
    executor: "ramping-vus",
    gracefulRampDown: "5s",
    stages: c.stages,
    startTime: `${offset}s`,
    startVUs: 0,
    tags: { tc: id },
  };
  offset += c.stages.reduce((a, s) => a + secOf(s.duration), 0) + 10;

  // abortOnFail menghentikan seluruh run, jadi hanya aktif bila TC stress dijalankan sendirian
  const abort = c.abort && selected.length === 1 ? { abortOnFail: true, delayAbortEval: "30s" } : {};
  thresholds[`http_req_duration{scenario:${name}}`] = [{ threshold: `p(90)<${c.p90}`, ...abort }];
  thresholds[`http_req_failed{scenario:${name}}`] = [{ threshold: `rate<${c.err}`, ...abort }];
  thresholds[`checks{scenario:${name}}`] = ["rate>0.99"]; // isi respons benar (struktur/scoping)
  if (c.max) thresholds[`http_req_duration{scenario:${name}}`].push(`max<${c.max}`);
}

export const options = { scenarios, summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "max"], thresholds };

// ── Sesi ────────────────────────────────────────────────────────────────────
function login(role, tags) {
  return http.post(`${API}/auth/login`, JSON.stringify(CREDS[role]), {
    headers: { "Content-Type": "application/json" },
    tags: Object.assign({ name: `login ${role}` }, tags),
  });
}

// Setup sekali: token tiap peran + daftar SK berkas PDF (untuk TC unduh/SK)
export function setup() {
  const tokens = {};
  for (const role of Object.keys(CREDS)) {
    const res = login(role, { name: "setup login" });
    tokens[role] = res.status === 200 ? res.json("token") : "";
  }
  const sk = http.get(`${API}/admin/sk`, { headers: { Authorization: `Bearer ${tokens.superAdmin}` } });
  const skIds = sk.status === 200 ? (sk.json("data") || []).filter((r) => r.has_file).map((r) => r.sk_id).slice(0, 10) : [];
  return { skIds, tokens };
}

/** GET terautentikasi + validasi isi respons. */
function get(data, role, path, validate) {
  const res = http.get(`${API}${path}`, {
    headers: { Authorization: `Bearer ${data.tokens[role]}` },
    tags: { name: `${role} GET ${path.split("?")[0]}` },
  });
  let body = null;
  try {
    body = res.json();
  } catch (_) {
    body = null;
  }
  check(res, {
    "status 2xx": (r) => r.status >= 200 && r.status < 300,
    "isi respons benar": () => !!body && (validate ? validate(body) : body.success === true),
  });
  return res;
}

const isArray = (b) => b.success === true && Array.isArray(b.data);
const pick = (arr) => arr[(__VU + __ITER) % arr.length];

// ── Flow (dipanggil tiap iterasi VU) ───────────────────────────────────────
export function homepage() {
  const res = http.get(`${FRONTEND}/`, { tags: { name: "GET /" } });
  check(res, {
    "status 2xx": (r) => r.status >= 200 && r.status < 300,
    "isi respons benar": (r) => typeof r.body === "string" && r.body.includes('<div id="root"'),
  });
  sleep(THINK_S);
}

function loginFlow(role) {
  const res = login(role);
  let token = null;
  try {
    token = res.json("token");
  } catch (_) {
    token = null;
  }
  check(res, { "status 2xx": (r) => r.status === 200, "isi respons benar": () => typeof token === "string" });
  sleep(THINK_S);
}

export function loginRelawan() {
  loginFlow("relawan");
}

export function loginOpd() {
  loginFlow("opd");
}

// Pencarian di aplikasi bersifat client-side: beban server = daftar yang dicari
export function search(data) {
  const [role, path] = pick([
    ["superAdmin", "/admin/relawan"],
    ["superAdmin", "/opd"],
    ["opd", "/opd-admin/relawan"],
    ["opd", "/opd-admin/kader"],
  ]);
  get(data, role, path, isArray);
  sleep(THINK_S);
}

// Dashboard Relawan = halaman profil; scoping: NIK sama dengan akun login
export function relawanDashboard(data) {
  get(data, "relawan", "/relawan/profile", (b) => b.data && b.data.nik === CREDS.relawan.nik);
  get(data, "relawan", "/relawan/penugasan", isArray);
  sleep(THINK_S);
}

export function opdDashboard(data) {
  get(data, "opd", "/opd-admin/dashboard", (b) => b.success === true && typeof b.data.nama_opd === "string");
  sleep(THINK_S);
}

export function manajemenOPD(data) {
  get(data, "superAdmin", "/opd", isArray);
  sleep(THINK_S);
}

// Scoping: SK yang terlihat oleh OPD berasal dari satu OPD saja
export function dataRelawanOPD(data) {
  get(data, "opd", "/opd-admin/relawan", isArray);
  get(data, "opd", "/admin/sk", (b) => isArray(b) && new Set(b.data.map((r) => r.opd_id)).size <= 1);
  sleep(THINK_S);
}

export function dataRelawanFull(data) {
  get(data, "superAdmin", "/admin/relawan", isArray);
  sleep(THINK_S);
}

export function suratKeputusan(data) {
  get(data, __VU % 2 ? "opd" : "superAdmin", "/admin/sk", isArray);
  if (data.skIds.length) {
    get(data, "superAdmin", `/admin/sk/${pick(data.skIds)}/pdf`, (b) => b.success === true && !!b.data.file_path);
  }
  sleep(THINK_S);
}

// Log Aktivitas hanya dapat diakses Super Admin (OPD mendapat 403)
export function logs(data) {
  get(data, "superAdmin", "/admin/logs?limit=50", isArray);
  sleep(THINK_S);
}

export function statistikSA(data) {
  get(data, "superAdmin", "/admin/dashboard", (b) => b.success === true && !!b.data.ringkasan);
  get(data, "superAdmin", "/statistik/gender", isArray);
  get(data, "superAdmin", "/statistik/kader-per-opd", isArray);
  sleep(THINK_S);
}

function statistikOPD(data) {
  get(data, "opd", "/statistik/kelurahan", isArray);
  get(data, "opd", "/statistik/relawan-per-kader", isArray);
  sleep(THINK_S);
}

// Relawan tidak punya halaman Statistik; statistik personalnya = riwayat pribadi
function statistikRelawan(data) {
  get(data, "relawan", "/relawan/history", (b) => b.success === true && !!b.data.riwayat_penugasan);
  sleep(THINK_S);
}

// TCLT.16: 60 Relawan + 20 OPD Admin + 5 Super Admin
export function statistikMix(data) {
  const slot = __VU % 85;
  if (slot < 60) statistikRelawan(data);
  else if (slot < 80) statistikOPD(data);
  else statistikSA(data);
}

// TCLT.19–21: 80 Relawan + 20 OPD Admin + 3 Super Admin; iterasi pertama = login
export function mixedRoles(data) {
  const slot = __VU % 103;
  if (slot < 80) return __ITER === 0 ? loginFlow("relawan") : relawanDashboard(data);
  if (slot < 100) {
    if (__ITER === 0) return loginFlow("opd");
    return __ITER % 2 ? opdDashboard(data) : dataRelawanOPD(data);
  }
  if (__ITER === 0) return loginFlow("superAdmin");
  return __ITER % 2 ? statistikSA(data) : search(data);
}

// TCLT.22: API kunci (login, search, Data Relawan, Statistik) bergiliran
export function apiMix(data) {
  const flows = [() => loginFlow("superAdmin"), () => search(data), () => dataRelawanOPD(data), () => statistikSA(data)];
  pick(flows)();
}

export function download(data) {
  if (data.skIds.length) {
    get(data, __VU % 2 ? "opd" : "superAdmin", `/admin/sk/${pick(data.skIds)}/pdf`, (b) => b.success === true && !!b.data.file_path);
  }
  sleep(THINK_S);
}

// ── Ringkasan: konsol + JSON ───────────────────────────────────────────────
export function handleSummary(data) {
  const lines = [`\nTCLT dijalankan: ${selected.join(", ") || "-"} (VU x${VU_SCALE}, waktu x${TIME_SCALE})`];
  for (const id of __ENV.TC ? notRun : Object.keys(SKIPPED)) {
    lines.push(`  ${id} tidak dijalankan: ${SKIPPED[id] || "ID tidak dikenal"}`);
  }
  return {
    [__ENV.OUT || "test-results/load-testing/k6-tclt-summary.json"]: JSON.stringify(data, null, 2),
    stdout: lines.join("\n") + "\n" + textSummary(data, { enableColors: true, indent: " " }),
  };
}
