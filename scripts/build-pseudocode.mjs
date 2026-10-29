// Membangkitkan docs/pseudocode/pseudocode.json dari file NN_*.md.
// Pemakaian: node scripts/build-pseudocode.mjs
import fs from "node:fs";

import { JSON_PATH, moduleFiles, parseModule } from "./pseudocode-lib.mjs";

const data = moduleFiles().map(parseModule);
fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`pseudocode.json ditulis: ${data.length} modul`);
