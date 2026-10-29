// Utilitas bersama untuk build-pseudocode.mjs dan check-pseudocode.mjs.
// Sumber kebenaran adalah docs/pseudocode/NN_*.md; pseudocode.json dibangkitkan darinya.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DIR = path.join(ROOT, "docs", "pseudocode");
export const JSON_PATH = path.join(DIR, "pseudocode.json");
export const MAX_LINE = 72;

/** Daftar file modul berurutan (00_umum.md, 01_login.md, ...). */
export const moduleFiles = () =>
  fs
    .readdirSync(DIR)
    .filter((f) => /^\d{2}_.+\.md$/.test(f))
    .sort();

/**
 * Format tiap file:
 *   # <judul modul>
 *   <!-- prefix: TCL -->
 *   ```text
 *   // Berkas: <path spec>
 *   ...pseudocode...
 *   ```
 *   **TC-ID yang dicakup (n):** TCL.0, TCL.1, ...
 */
export const parseModule = (file) => {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8").replace(/\r\n/g, "\n");

  const modul = raw.match(/^# (.+)$/m)?.[1].trim();
  const prefix = raw.match(/<!-- prefix: *([A-Z]*) *-->/)?.[1] ?? "";
  const code = raw.match(/```text\n([\s\S]*?)\n```/)?.[1];
  const tcLine = raw.match(/\*\*TC-ID yang dicakup[^*]*:\*\*(.*)$/m)?.[1] ?? "";
  const berkas = code?.match(/^\/\/ Berkas: (.+)$/m)?.[1].trim() ?? "";

  if (!modul || code === undefined) {
    throw new Error(`${file}: judul (# ...) atau blok \`\`\`text tidak ditemukan`);
  }

  const tc_ids = tcLine
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { modul, prefix, berkas, tc_ids, code };
};

/** "TCSH.1-2" -> [TCSH.1, TCSH.2]; "TCSK.3.1" -> [TCSK.3]; "TCLT.01" -> [TCLT.1] */
export const normalizeIds = (id) => {
  const m = id.match(/^(TC[A-Z]+)\.(\d+)(?:-(\d+))?(?:\.\d+)?$/);
  if (!m) return [];
  const [, pfx, a, b] = m;
  const from = Number(a);
  const to = b ? Number(b) : from;
  const out = [];
  for (let n = from; n <= to; n++) out.push(`${pfx}.${n}`);
  return out;
};
