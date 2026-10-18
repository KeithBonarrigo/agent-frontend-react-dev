# Botwerx Bot tab: white carousel, "Organization" heading, centred tile icons — change and rollback log

Dates: 2026-10-15 (carousel), 2026-10-18 (heading, icons). Home page, Botwerx Bot tab
(`/?tab=botwerx`). All three ship in one PR.

| What | Where |
| --- | --- |
| Branch | `feat/carousel-white-bg`, from `main` at `4227080` |
| Backup tag | `backup/pre-carousel-white-2026-10-15` → `4227080` |

## Changes

### #1 Carousel on a white band (`src/styles/HomeV3.css`, slider rules)

Same change as the uncommitted one on the `botwerx-carousel-white` checkout, applied to `main`.

| Rule | Before | After |
| --- | --- | --- |
| `.hv3-bw-slider-sec` padding | `0 0 60px` (dark gap under the carousel) | `0` |
| `.hv3-slider` | transparent on the navy page, padding `calc(60px + 2rem) 20px 2rem` | `background:#fff`, padding `calc(60px + 2rem) 20px` |
| `.hv3-slide p` (captions) | `#fff` | `var(--hv3-bg)` (`#0F1621`) |

### #2 Carousel heading (`botwerx.slider.title`)

| File | Before | After |
| --- | --- | --- |
| `src/locales/en/homev3.json` | What Can AI Agents Do For Your Business? | What Can AI Agents Do For Your Organization? |
| `src/locales/es/homev3.json` | ¿Qué Pueden Hacer los Agentes de IA por Tu Negocio? | ¿Qué Pueden Hacer los Agentes de IA por Tu Organización? |

The legacy home page (`home.json`, `/legacy/home`) keeps its own text.

### #3 Tile icons centred in their square (`src/styles/HomeV3.css`, `.hv3-bw-icon`)

The benefit tiles ("AI-Driven Analytics" etc.) showed the glyph in the top-left corner
of its square in some browsers, out of line with the headline. Font Awesome's
`.fa-solid{display:inline-block}` has the same specificity as `.hv3-bw-icon`, so the
stylesheet that loads last decides; when Font Awesome wins, the glyph sits top-left.

| Before | After |
| --- | --- |
| `.hv3-bw-icon{… display:grid; place-items:center; …}` | `.hv3-page .hv3-bw-icon{… display:grid; place-items:center; text-align:center; line-height:34px; …}`: wins over Font Awesome's rule, and stays centred even if `inline-block` applies |

The same class is used by the hero benefit rows and the StoreConnect tab's cards; they
are centred the same way.

## Rollback

Revert the merge, or `git checkout backup/pre-carousel-white-2026-10-15 -- src/styles/HomeV3.css src/locales/en/homev3.json src/locales/es/homev3.json`.

## Verification

Headless Chrome on the branch:
- Slider background `rgb(255,255,255)` (was transparent), captions `rgb(15,22,33)`, 12 slides, at 1366px and 390px.
- Heading reads "What Can AI Agents Do For Your Organization?". en/es keys are in sync.
- Tile glyphs centred and level with the headline. Also with Font Awesome's `display:inline-block` forced to win; on the live site, forcing it reproduces the reported top-left glyph.
- No page errors. A production build into a scratch folder succeeds.
