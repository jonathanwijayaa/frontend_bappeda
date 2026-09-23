/*
 * Load Testing dengan k6 (REFERENSI SAJA — DI LUAR SCOPE SKRIPSI)
 * ─────────────────────────────────────────────────────────────────────────────
 * Pendamping loadTesting.spec.ts (Playwright). k6 adalah alat load testing
 * khusus: multi-thread (VU / virtual users) di Go, jadi hasilnya jauh lebih
 * akurat untuk beban tinggi dibanding Playwright yang terikat satu event loop.
 *
 * File ini BUKAN bagian laporan skripsi — hanya referensi metodologis pembanding.
 *
 * PRASYARAT: pasang k6 (https://k6.io/docs/get-started/installation/).
 *   Windows (winget) : winget install k6.k6
 *   Windows (choco)  : choco install k6
 *
 * MENJALANKAN:
 *   k6 run src/tests/performance/k6/loadTest.k6.js
 *   # atur target & beban lewat env:
 *   k6 run -e VITE_API_URL=https://backend-skripsi-relawan.vercel.app/api \
 *          -e SA_NIK=1234567890100011 -e SA_PASS=1234567890100011 \
 *          src/tests/performance/k6/loadTest.k6.js
 *   # ekspor hasil ringkas ke JSON:
 *   k6 run --summary-export=test-results/load-testing/k6-summary.json \
 *          src/tests/performance/k6/loadTest.k6.js
 *
 * Beban default dijaga WAJAR terhadap deployment Vercel milik sendiri (bukan DoS)
 * dan hanya menembak endpoint baca (GET) + login, tidak menulis/mengubah data.
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const API = (__ENV.VITE_API_URL || "https://backend-skripsi-relawan.vercel.app/api").replace(
  /\/$/,
  "",
);
const SA_NIK = __ENV.SA_NIK || "1234567890100011";
const SA_PASS = __ENV.SA_PASS || "1234567890100011";

// Metrik kustom untuk memisahkan latensi per jenis permintaan.
const loginTrend = new Trend("login_duration", true);
const readTrend = new Trend("read_duration", true);
const bizErrors = new Rate("business_errors"); // gagal di luar http (mis. tak ada token)

/*
 * SKENARIO (executor k6):
 *   • login_load  — beban konstan pada endpoint login (constant VUs).
 *   • read_ramp   — ramp-up VU bertahap pada endpoint baca terproteksi.
 *   • spike       — lonjakan mendadak lalu turun.
 * Soak/endurance bisa diaktifkan dengan menaikkan durasi read_ramp.
 */
export const options = {
  scenarios: {
    login_load: {
      executor: "constant-vus",
      exec: "loginScenario",
      vus: Number(__ENV.LOGIN_VUS || 5),
      duration: __ENV.LOGIN_DURATION || "30s",
      tags: { scenario: "login_load" },
    },
    read_ramp: {
      executor: "ramping-vus",
      exec: "readScenario",
      startVUs: 0,
      stages: [
        { duration: "15s", target: Number(__ENV.READ_VUS || 10) },
        { duration: "30s", target: Number(__ENV.READ_VUS || 10) },
        { duration: "10s", target: 0 },
      ],
      startTime: "31s", // jalan setelah login_load selesai
      tags: { scenario: "read_ramp" },
    },
    spike: {
      executor: "ramping-vus",
      exec: "readScenario",
      startVUs: 0,
      stages: [
        { duration: "5s", target: 3 }, // baseline
        { duration: "3s", target: Number(__ENV.SPIKE_VUS || 40) }, // lonjakan
        { duration: "10s", target: Number(__ENV.SPIKE_VUS || 40) },
        { duration: "5s", target: 3 }, // pemulihan
      ],
      startTime: "97s",
      tags: { scenario: "spike" },
    },
  },
  // Ambang LUNAK (longgar) karena serverless cold-start; sesuaikan sesuai target.
  thresholds: {
    http_req_failed: ["rate<0.25"], // < 25% permintaan gagal
    http_req_duration: ["p(95)<3000"], // p95 < 3 detik
    login_duration: ["p(95)<3000"],
    read_duration: ["p(95)<3000"],
  },
};

/** Login sekali dan kembalikan token (untuk skenario baca terproteksi). */
function login() {
  const res = http.post(`${API}/auth/login`, JSON.stringify({ nik: SA_NIK, password: SA_PASS }), {
    headers: { "Content-Type": "application/json" },
  });
  const token = res.status === 200 ? res.json("token") : "";
  return { res, token };
}

// Setup dijalankan sekali; hasilnya dibagikan ke semua VU (mis. token).
export function setup() {
  const { token } = login();
  return { token };
}

// Skenario 1 — beban pada endpoint login.
export function loginScenario() {
  group("login", () => {
    const { res } = login();
    loginTrend.add(res.timings.duration);
    check(res, { "login 200/401 (bukan 5xx)": (r) => r.status < 500 });
  });
  sleep(1); // think time
}

// Skenario 2 & 3 — beban baca pada endpoint terproteksi (round-robin).
const READ_PATHS = ["/opd", "/kader", "/admin/relawan", "/admin/logs?limit=50"];

export function readScenario(data) {
  const token = data && data.token;
  if (!token) {
    bizErrors.add(true); // tidak ada token → tandai error bisnis, jangan tembak
    sleep(1);
    return;
  }
  const path = READ_PATHS[Math.floor(Math.random() * READ_PATHS.length)];
  const res = http.get(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: path.split("?")[0] }, // agregasi metrik per endpoint
  });
  readTrend.add(res.timings.duration);
  check(res, {
    "baca 2xx": (r) => r.status >= 200 && r.status < 300,
    "bukan 5xx": (r) => r.status < 500,
  });
  bizErrors.add(res.status >= 400);
  sleep(0.5); // think time
}
