# Jacket configurator (Next.js)

Single-route Next.js wrapper around the legacy Hockerty **custom jackets personalize** flow. The canonical UI is the patched static page at `public/en-us/men/custom-jackets/personalize.html`, loaded in a full-viewport iframe from **`/men/custom-jackets/personalize`**.

**Branding / UI:** `public/css/atbs-theme.css` is appended at the end of that HTML (see `scripts/patch-personalize.mjs`) so it overrides inline legacy styles. It applies the **ATBS** monochrome shell, horizontal **Fabric · Style · Accents** tabs at the top of the left column, black primary buttons, and hides the default mega-menu / cart chrome in the top bar. Edit that file to tune spacing or typography; then bump the `?v=` query on the injected `<link>` if you need cache busting.

## Requirements

- Sibling folder **`../horkey`** (repo root layout: `addicte-be-spoken/horkey`, `addicte-be-spoken/jacket-configurator`).

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run sync:legacy` | Copy CSS, JS, 3D, fonts, feeds, conversion script from `horkey/` into `public/`, then patch personalize HTML paths. |
| `npm run dev` | Runs `sync:legacy` first (`predev`), then `next dev`. |
| `npm run build` | Runs `sync:legacy` first (`prebuild`), then `next build`. |

## Parity checklist (manual QA)

Run `npm run dev`, open `http://localhost:3000/men/custom-jackets/personalize`, then verify in the iframe:

1. **Fabric** — fabric grid loads from `/en-us/fabrics/feed/man_jacket/` (rewritten to static `index.html`).
2. **Fonts** — `loadFont('man_jacket')` resolves under `/en-us/font/man_jacket/`.
3. **Configure** — style/fit/lapel/pockets/vent options respond; disabled/required rules behave as on the static mirror.
4. **Accents / extras** — linings and accessories feeds (`/en-us/linings/feed/man_jacket/`, `/en-us/accessories/feed/panuelos/`).
5. **Preview** — stacked PNG layers under `/3d/new_man/...`; missing assets may hit CDN via `mirror_3d_fallback.js`.
6. **Price** — `.action_column div.price` updates when options change.
7. **Steps** — fabric → config → extra navigation matches legacy.

## Phase B

Incremental React port of state / `renderGetImages` is **out of scope** for this package until Phase A is stable in production.

## Legal

Assets are Hockerty IP; use only where you have rights to do so.
