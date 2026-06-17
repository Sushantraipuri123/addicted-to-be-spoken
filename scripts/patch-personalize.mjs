/**
 * Idempotent post-processor for the vendored personalize shell in public/.
 * Run manually after replacing personalize.html from an upstream mirror.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(
  root,
  "public/en-us/men/custom-jackets/personalize.html",
);

const ATBS_THEME =
  '  <link rel="stylesheet" href="/css/atbs-theme.css?v=11" />';
const ATBS_DEMO = '  <script defer src="/js/atbs-demo.js?v=8"></script>';
const MIRROR_3D =
  '    <script type="text/javascript" defer src="/js/1780997280/mirror_3d_fallback.js?v=51" charset="utf-8"></script>';

let html = readFileSync(htmlPath, "utf8");

// HTTrack relative paths -> absolute site-root paths for Next.js static serving.
html = html.replaceAll(
  /(\.\.\/)+d1fufvy4xao6k9\.cloudfront\.net\//g,
  "https://d1fufvy4xao6k9.cloudfront.net/",
);
html = html.replaceAll(
  /href="\.\.\/\.\.\/\.\.\/d1fufvy4xao6k9\.cloudfront\.net\/index\.xml"/g,
  'href="https://d1fufvy4xao6k9.cloudfront.net/index.xml"',
);
html = html.replaceAll(
  /(\.\.\/)+njoevqi1nx\.hockerty\.com\//g,
  "/njoevqi1nx.hockerty.com/",
);
html = html.replaceAll(/href="\.\.\/\.\.\/\.\.\/css\//g, 'href="/css/');
html = html.replaceAll(/src="\.\.\/\.\.\/\.\.\/js\//g, 'src="/js/');
html = html.replaceAll(/src="\.\.\/\.\.\/\.\.\/css\//g, 'src="/css/');

// ATBS branding.
html = html.replaceAll(
  /logo_hockerty\.svg/g,
  "/logoADTB.png",
);
html = html.replaceAll(/alt="Hockerty"/g, 'alt="ADTB"');

if (!html.includes("mirror_3d_fallback.js")) {
  html = html.replace(
    /(<script type="text\/javascript" defer src="\/js\/1780997280\/perfect-scrollbar\.jquery\.min\.js[^"]*"[^>]*><\/script>)/,
    `$1\n${MIRROR_3D}`,
  );
}

if (!html.includes("atbs-theme.css")) {
  html = html.replace("</body>", `${ATBS_THEME}\n${ATBS_DEMO}\n</body>`);
}

writeFileSync(htmlPath, html);
console.log("[patch-personalize] updated", htmlPath);
