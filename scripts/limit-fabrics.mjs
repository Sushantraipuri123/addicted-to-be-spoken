// Trims the man_jacket fabric feed to the first N fabrics.
//
// The Fabric panel on the personalize page is populated from this static feed,
// and the legacy engine derives the "X / Y" counter, search and filters from it.
// Limiting the feed is therefore the single source of truth for how many
// swatches are shown.
//
// The original (full) feed is preserved next to the served file as
// `index.full.html` so this is fully reversible: re-run with N = 190 (or copy
// the backup back) to restore every fabric.
//
// Usage: node scripts/limit-fabrics.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const N = 25;

const __dirname = dirname(fileURLToPath(import.meta.url));
const feedDir = join(
  __dirname,
  "..",
  "public",
  "en-us",
  "fabrics",
  "feed",
  "man_jacket"
);
const servedFile = join(feedDir, "index.html");
const backupFile = join(feedDir, "index.full.html");

const BOX_MARKER = '<div class="fabric_box';
const WRAPPER_CLOSE = "\n    </div>\n";

// Preserve the full feed once, before any trimming happens.
if (!existsSync(backupFile)) {
  writeFileSync(backupFile, readFileSync(servedFile));
  console.log(`Backed up full feed -> ${backupFile}`);
}

// Always source the full data from the backup so re-runs are idempotent.
const full = readFileSync(backupFile, "utf8");

const totalBoxes = full.split(BOX_MARKER).length - 1;

// Find the start index of the (N+1)-th fabric box; everything from there on is dropped.
let cut = -1;
let from = 0;
for (let i = 0; i <= N; i++) {
  const idx = full.indexOf(BOX_MARKER, from);
  if (idx === -1) {
    cut = -1; // fewer than N+1 boxes -> keep everything
    break;
  }
  if (i === N) {
    cut = idx;
    break;
  }
  from = idx + BOX_MARKER.length;
}

let output;
if (cut === -1) {
  output = full; // nothing to trim
} else {
  output = full.slice(0, cut).replace(/\s+$/, "") + WRAPPER_CLOSE;
}

writeFileSync(servedFile, output, "utf8");

const keptBoxes = output.split(BOX_MARKER).length - 1;
console.log(
  `Trimmed feed: ${totalBoxes} -> ${keptBoxes} fabrics (target ${N}) written to ${servedFile}`
);
