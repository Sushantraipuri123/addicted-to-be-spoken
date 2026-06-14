/**
 * Writes public/en-us/men/custom-jackets/personalize.html from horkey source
 * with root-absolute paths so it works when served from Next public/.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const horkey = join(root, "..", "horkey");
const src = join(horkey, "en-us/men/custom-jackets/personalize.html");
const dest = join(root, "public/en-us/men/custom-jackets/personalize.html");

let html = readFileSync(src, "utf8");

const replacements = [
  ["../../../css/1780997280", "/css/1780997280"],
  ["../../../js/1780997280", "/js/1780997280"],
  ["../../../../d1fufvy4xao6k9.cloudfront.net", "https://d1fufvy4xao6k9.cloudfront.net"],
  ["../../../../njoevqi1nx.hockerty.com", "/njoevqi1nx.hockerty.com"],
];

for (const [from, to] of replacements) {
  html = html.split(from).join(to);
}

/* ATBS brand mark (served from Next public/) */
html = html.replace(
  /https:\/\/d1fufvy4xao6k9\.cloudfront\.net\/images\/logos\/logo_hockerty\.svg/g,
  "/logoADTB.png",
);
html = html.replace(
  /https:\/\/d1fufvy4xao6k9\.cloudfront\.net\/images\/logos\/logo_hockerty_gold\.svg/g,
  "/logoADTB.png",
);
html = html.replace(/alt="Hockerty"/g, 'alt="ADTB"');

/* Load after all inline <style> blocks so ATBS overrides legacy layout/colors */
html = html.replace(
  "</body>",
  [
    '  <link rel="stylesheet" href="/css/atbs-theme.css?v=10" />',
    '  <script defer src="/js/atbs-demo.js?v=3"></script>',
    "</body>",
  ].join("\n"),
);

mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, html, "utf8");
console.log(`[patch-personalize] wrote ${dest}`);
