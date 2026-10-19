# Conversations tab, Live Map: OpenStreetMap tiles instead of CARTO, change and rollback log

Date: 2026-10-19. Reported by Keith: the Live Map showed only "API KEY REQUIRED carto.com/basemaps/apikey" tiles.

| What | Where |
| --- | --- |
| Branch | `fix/live-map-tiles`, from `main` at `2fac381` |
| Backup tag | `backup/pre-live-map-tiles-2026-10-19` → `2fac381` |

## Why

CARTO's basemaps now need an API key. Without one, every tile is a watermark reading "API KEY REQUIRED carto.com/basemaps/apikey" (HTTP 200, ETag `wm-…-light`).

Per carto.com/basemaps/apikey:
- A key is free with no account. For commercial use it's free up to 1M tile requests a month; above that, $500 a month for up to 10M.
- The key goes in as `?key=…`.
- Keys registered before 23 September 2026 keep working until 30 November 2026.

OpenStreetMap's own tiles need no key. The Income Report tab's small maps already use them and still load.

## Change

### `src/components/LiveMap.jsx`, the `TileLayer`

| | Before | After |
| --- | --- | --- |
| `url` | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (no subdomains, as OpenStreetMap now recommends) |
| `attribution` | `© OpenStreetMap, © CartoDB` (links) | `© OpenStreetMap contributors` (link to openstreetmap.org/copyright), as OpenStreetMap's tile policy requires |
| `className` | none | `live-map-tiles` |

A comment above the layer explains the switch.

### `src/components/LiveMap.css`

New rule: `.live-map-tiles { filter: grayscale(1) brightness(1.08) contrast(0.85); }`. It greys and lightens the OpenStreetMap tiles to stay close to CARTO's light map. The markers sit in another Leaflet pane, so they keep their green and blue.

## OpenStreetMap's tile policy

The policy is at https://operations.osmfoundation.org/policies/tiles/. It allows light use like this dashboard map:
- The attribution is shown.
- Browsers send a Referer.
- Nothing is bulk-downloaded.

Heavy use isn't allowed. If the dashboard's map traffic ever grows a lot, switch to a keyed provider. The simplest is CARTO with a free key: request it at carto.com/basemaps/apikey, then put the old URL back with `?key=` and the CARTO attribution.

## Rollback

| Undo | How |
| --- | --- |
| After merge | `git revert -m 1 <merge-commit>` through a PR. Note that this brings back the "API KEY REQUIRED" tiles. |
| From the tag | `git checkout backup/pre-live-map-tiles-2026-10-19 -- src/components/LiveMap.jsx src/components/LiveMap.css` |
| Back to CARTO, with a key | In `LiveMap.jsx`, set `url` to CARTO's raster URL with `?key=<key>` and the attribution to `© OpenStreetMap contributors, © CARTO`, and remove `className`. |

## Verification

Headless Chrome on the branch's dev server, with a local mock of the dashboard API serving three visitors with locations (one online), at 1366px and 390px:

- **Tiles:** every tile comes from `tile.openstreetmap.org` (22 requests), and every visible tile loads (10 of 10 on desktop, 4 of 4 on a phone).
- **CARTO:** no requests at all.
- **Filter:** applied to the tile layer.
- **Attribution:** reads "Leaflet | © OpenStreetMap contributors".
- **Markers:** 1 online (green) and 2 offline (blue), visible on the grey map.
- **Layout:** no sideways scroll, and no console errors.

ESLint on `LiveMap.jsx` reports one error, an unused `_` at line 51. It already exists on `main` and isn't touched here. A production build into a scratch folder succeeds.
