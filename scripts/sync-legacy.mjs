/**
 * Copies legacy static assets from ../horkey into ./public for the personalize shell.
 * Run from package.json: `node scripts/sync-legacy.mjs`
 */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const horkey = join(root, "..", "horkey");
const pub = join(root, "public");

function cpDir(relFromHorkey, relToPublic) {
  const src = join(horkey, relFromHorkey);
  const dest = join(pub, relToPublic);
  if (!existsSync(src)) {
    console.warn(`[sync-legacy] skip missing: ${src}`);
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[sync-legacy] ${relFromHorkey} -> ${relToPublic}`);
}

if (!existsSync(horkey)) {
  console.error(`[sync-legacy] horkey not found at ${horkey}`);
  process.exit(1);
}

mkdirSync(pub, { recursive: true });

cpDir("css/1780997280", "css/1780997280");
cpDir("js/1780997280", "js/1780997280");
cpDir("3d", "3d");
cpDir("en-us/font", "en-us/font");
cpDir("en-us/fabrics/feed/man_jacket", "en-us/fabrics/feed/man_jacket");
cpDir("en-us/linings/feed/man_jacket", "en-us/linings/feed/man_jacket");
cpDir("en-us/accessories/feed/panuelos", "en-us/accessories/feed/panuelos");
cpDir("njoevqi1nx.hockerty.com", "njoevqi1nx.hockerty.com");

console.log("[sync-legacy] done");
