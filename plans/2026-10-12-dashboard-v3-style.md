# Dashboard V3 restyle: change and rollback log

Date: 2026-10-12. Phase 1 of making the logged-in dashboard match www.botwerx.ai
(colors, tones and the new BotWerx logo) ahead of a Meta app review. Every change
is listed below with its before → after values and how to undo it on its own.

## Where everything is

| What | Where |
| --- | --- |
| This work | Worktree `~/Botwerx/agent-frontend-react-dev-dashboard`, branch **`dashboard-v3-style`**, from `origin/main` at `a0ddcf5` |
| Backup tag | `backup/pre-dashboard-v3-2026-10-12` → `a0ddcf5b487a86a2afad9f2b8e85b8c6b8c8740e` (`main` as deployed before this work). Local until pushed: `git push origin backup/pre-dashboard-v3-2026-10-12` |
| Wrapper | `src/Pages/DashboardV3.jsx` |
| Styles | `src/styles/DashboardV3.css` (sections A–F below) |
| Applies to | `/dashboard`, `/oauth/callback` and `/oauth/:provider/callback` on BotWerx domains only (`useV3` in `src/App.jsx`). AI Bridge (`aibridge.global` / `base`) and Propel domains keep the old pages. Exception: the Agent Settings phone-layout fix (#8) is a bug fix and applies on every domain. |
| Run it | `npm run dev -- --port 5175 --strictPort` in the worktree, then http://localhost:5175/dashboard (log in first) |

The approach copies `LegalV3.jsx`: a wrapper draws the site's V3 header and footer
around the unchanged `Dashboard` component, and one scoped stylesheet restyles the
dashboard's own classes. The wrapper's root is `.dv3-page`, **not** `.hv3-page`,
because `.hv3-page` turns headings white and resets text, which would wash out
the light cards. `HomeV3.css` and `Home.css` are not edited.

## Rollback

1. **Instant switch-off (one line).** In `src/App.jsx`, set the route back to
   `<Route path="/dashboard" element={<Dashboard />} />`. Every visual change
   below only applies inside the wrapper, so the dashboard returns to exactly its
   previous look. Changes #4 and #5 are visually neutral and can stay.
   *Tested on 2026-10-12:* with that line the page measured identical to before
   (old header, footer and language pill showing, `#f4f4f4` page, Segoe UI, 8px
   cards, gray tab strip).
   The OAuth callback works the same way: set both `/oauth/...` routes back to
   `element={<OAuthCallback />}` (#9). *Tested:* the old page returned, with the old
   header, the `#007bff` spinner and the 60vh layout.
2. **Undo one piece.** Delete that rule group from `src/styles/DashboardV3.css`.
   Its section letters and comments match the tables below.
3. **Full revert.** Before merge: delete the branch. After merge: open a PR with
   `git revert -m 1 <merge commit>`, since `main` is protected. Railway redeploys
   on merge. Any single file can also be restored from the tag:
   `git checkout backup/pre-dashboard-v3-2026-10-12 -- <path>`.

## Changes

### #1 `src/Pages/DashboardV3.jsx` (new)

Wrapper used only by the `/dashboard` route, modeled on `src/Pages/LegalV3.jsx`.

| Piece | Before (old dashboard) | After |
| --- | --- | --- |
| Header | Shared `HomeHeader`: white bar, cartoon-robot logo (`/img/logo-botwerx.jpeg`), Home/Benefits/Solutions/FAQ/Agent/My Dashboard/Log Out links, Contact Us button | Site's V3 header (`.hv3-navbar`): new BotWerx wordmark linking to `/`, "Back to home", EN/ES flag toggle (same markup as `LegalV3`) |
| Footer | Shared `HomeFooter`: `#2c3e50`, robot logo in a white circle, legal links, address, Claude line | Site's V3 footer bar (`.hv3-footer.hv3-auth-footer`): © year and the four legal links, then a second row with the address (`footer.address`, still Pacific Beach) and "This application is powered by Anthropic's Claude API". All text comes from existing `homev3.json` keys (en + es). |
| Favicon | Robot (`/favicon-botwerx.png`, set by `DomainContext`) | `/img/favicon-botwerx-blue-rounded.png?v=2` (the site's), held by the same `useFavicon` hook the V3 pages use and restored on leaving the page |
| Content | `Dashboard` directly in `HomeLayout`'s `<main>` | `Dashboard` inside `<div class="dv3-main">` (a div, because `HomeLayout` already provides `<main>`) |

Undo: delete the file, and the import and route change from #3.

### #2 `src/styles/DashboardV3.css` (new)

Every rule is scoped to `.dv3-page` or `body:has(.dv3-page)`.

**A. Tokens and base**

| Item | Before | After |
| --- | --- | --- |
| Color tokens | n/a | The site's `--hv3-*` values (copied from `.hv3-page`), defined on `.dv3-page` |
| Page background | `#f4f4f4` | `#0F1621` |
| Font | `'Segoe UI', sans-serif` (falls back to Helvetica on a Mac) | `'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif`. Already loaded on every page by HomeV3.css's Google Fonts import. |
| Inputs, selects, textareas | Browser default UI font | `font-family: inherit` (Instrument Sans) |
| Card text color | Inherited from `index.css`: `#213547` in OS light mode, `rgba(255,255,255,.87)` in OS dark mode | `#213547` in both |
| `color-scheme` inside the content | `light dark` (dark native controls in OS dark mode) | `light` |

**B. Page gates**

| Item | Before | After |
| --- | --- | --- |
| Shared `HomeHeader` / `HomeFooter` (`#root > header`, `#root > footer`) | Shown | `display: none` (the wrapper has its own) |
| Floating white language pill (`#root > div[style*="fixed"]`) | Shown, top right | Hidden (the header has the EN/ES toggle) |
| `body` | `display: flex`, background `#f4f4f4`, `height: 100%` | `display: block`, `#0F1621`, `height: auto` |
| `html` | background `#fff` (OS light) / `#242424` (OS dark) from `index.css`, `height: 100%` | `#0F1621` (navy overscroll bounce on a Mac), `height: auto` |
| `#root` | Full-height flex scroll container, 1rem padding at ≤768px | `display: block`, normal page scroll, no padding (same as the V3 pages) |

**C. Header and footer**

| Item | Before | After |
| --- | --- | --- |
| Header and footer type | n/a | As on the site: 16.5px / 1.62, text `#E8EBF0`, left-aligned, `box-sizing: border-box` |
| Header position | `.hv3-navbar` is `sticky` in HomeV3.css | `relative`. This matches the live site, where `.hv3-page`'s `overflow-x: hidden` already stops it sticking. |
| Footer second row (`.dv3-fbot-sub`) | n/a | No divider, 6px top padding, muted text `#848C9B` |

**D. Dashboard surfaces**

| Element (selector) | Before | After |
| --- | --- | --- |
| Dashboard column (`.dashboard-container`) | max-width 1200px, padding 2em | max-width 1220px, left/right padding 28px. This lines it up with the header logo; top/bottom are unchanged. |
| "Loading..." (`.dashboard-loading`) | Inherited dark text | `#9CA3B0` (it sits on the navy page) |
| The two top-level cards (`.dashboard-container > .card`) | radius 8px, border `#dee2e6`, shadow `0 2px 8px rgba(0,0,0,.08)` | radius 11px, border `rgba(255,255,255,.12)`, shadow `0 26px 60px -26px rgba(0,0,0,.6), 0 2px 6px rgba(0,0,0,.2)`. Cards inside the tabs are unchanged. |
| The four bars: title, subscription, Agent Settings, agent details (`.subscription-header`) | `linear-gradient(135deg, #34495e 0%, #2c3e50 50%, #1a252f 100%)` | `#1A2332`, 1px `rgba(255,255,255,.08)` bottom border. The title bar keeps its inline `rgb(44,62,80)` border, which looks almost the same. |
| Welcome line (`.subscription-welcome`) | `#bdc3c7` | `#9CA3B0` |
| Title-bar Log Out (`.subscription-header .btn-danger`) | Solid red `#dc3545` (hover `#c82333`), shadow | Site outline button: transparent, 1px `rgba(255,255,255,.12)`, text `#E8EBF0`, radius 7px, no shadow. Hover: `rgba(255,255,255,.04)`, border `rgba(255,255,255,.24)`. |
| Tab strip (`.dashboard-tabbar`) | `#e9ecef`, 2px `#ddd` bottom | `#161E2C`, 1px `rgba(255,255,255,.08)` bottom, padding 6px, gap 6px |
| Tabs (`.dashboard-tab`) | White, `#333`, radius 4px 4px 0 0, margins 0 4px −2px 0, shadow. Hover: `#e9ecef`, `#007bff`. | Transparent, `#9CA3B0`, weight 500, radius 10px, no margin, no shadow. Hover: `rgba(255,255,255,.05)`, `#fff`. |
| Active tab (`.dashboard-tab-active`) | `#007bff`, white, bold | The site's product-tab pill: `linear-gradient(180deg, #2F6BFF 0%, #4F86FF 100%)`, white, weight 600 |
| Tab keyboard focus | `outline: none` | 2px `#5A8CFF` ring on `:focus-visible` |
| Blue count badge (`.tab-badge-blue`) | `#007bff` | `#2F6BFF`; on the active pill `rgba(255,255,255,.25)` so it stays visible |
| Button corners (`.btn`) | 4px | 7px |
| Primary buttons (`.btn-primary`, not disabled) | `#007bff`, hover `#0056b3` (Dashboard.css) / `#0069d9` (Tabs.css) | `#2F6BFF`, hover `#1A4ED6`. Disabled buttons keep their gray. |
| Modal headers `.modal-header-primary` / `.modal-header-success` | `#007bff→#0056b3` / `#1e3a8a→#3b82f6` | `linear-gradient(135deg, #2F6BFF, #1A4ED6)` for both |
| Modal header `.modal-header-dark` | Slate gradient as the bars | `linear-gradient(135deg, #1A2332, #0F1621)` |
| Info boxes (`.alert-info`, `.box-blue`) | bg `#e7f3ff`, border `#b3d7ff` / `#b8daff`, text `#0056b3` / `#004085` | bg `#EEF3FF`, border `#C9D8FF`, text `#1A4ED6` |

Unchanged: success / danger / warning colors (they carry meaning) and the red
**Cancel Subscription** button.

**E. Tabs.css blues** (`#007bff → #2F6BFF`, hovers `#0056b3 → #1A4ED6`):
`.btn-link`, `.table-link`, `.metric-label-link`, `.metric-value-blue`,
`.btn-text-link` (+ hover), `.embedding-icon-url`, `.model-name`,
`.btn-repeat-search` (+ hover), `.btn-move:not(:disabled)`, and `.input:focus`
(border `#007bff → #2F6BFF`, ring `rgba(0,123,255,.25) → rgba(47,107,255,.25)`).

Undo: delete the file and its import in #1, or one rule group (rollback level 2).

### #3 `src/App.jsx`

- Added `import DashboardV3 from "./Pages/DashboardV3";` after the `LegalV3` import.
- Before: `<Route path="/dashboard" element={<Dashboard />} />`
- After: a comment, then
  `<Route path="/dashboard" element={useV3 ? <DashboardV3><Dashboard /></DashboardV3> : <Dashboard />} />`

Undo: restore the "Before" line (rollback level 1) and remove the import.

### #4 `src/Pages/Dashboard.jsx` (tab strip only)

- Before: `<div className="flex flex-center flex-wrap" style={{ borderBottom: '2px solid #ddd', backgroundColor: '#e9ecef' }}>`
- After: `<div className="dashboard-tabbar flex flex-center flex-wrap">`

The inline style moved into a class (#5) because CSS can't override inline styles.
Same values, so there's no visual change anywhere. Undo: restore the "Before" line.

### #5 `src/styles/Dashboard.css`

Added after the `.dashboard-tab:hover` rule:
`.dashboard-tabbar { border-bottom: 2px solid #ddd; background-color: #e9ecef; }`

These are the old inline values. Undo: remove the rule, together with #4.

### #6 This file

### #7 `CLAUDE.md`

New section "Dashboard V3 frame" pointing here. Undo: remove the section.

### #8 Agent Settings grids: phone layout fix (all domains)

The bug: at phone width the Agent Settings read-only cards ran 146px past the
right edge of the card, and the Edit form 135px (measured at 390px). The section's
`overflow: hidden` clipped them, which cut off the Email card. The grid columns were
inline styles, so they couldn't respond to screen width.

`src/Pages/Dashboard.jsx`: seven inline layouts in the Agent Settings section now use classes.

| Line (approx.) | Before | After |
| --- | --- | --- |
| Edit form, Agent & Company | `style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75em' }}` | `className="agent-grid agent-grid-3"` |
| Edit form, Contact | `style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75em', alignItems: 'end' }}` | `className="agent-grid agent-grid-4" style={{ alignItems: 'end' }}` |
| Edit form, Lat / Long / Timezone | same as Agent & Company | `className="agent-grid agent-grid-3"` |
| Edit form, API tokens | `style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75em' }}` | `className="agent-grid agent-grid-2"` |
| Edit form, Office ID | `style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75em', marginTop: '0.75em' }}` | `className="agent-grid agent-grid-2" style={{ marginTop: '0.75em' }}` |
| Read-only, outer row | `style={{ display: 'flex', gap: '0.75em', marginTop: '0.25em' }}` | Same style, plus `className="agent-summary"` |
| Read-only, contact cards | `style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75em' }}` | `className="agent-grid agent-grid-2"` |

`src/styles/Dashboard.css`: new "AGENT SETTINGS GRIDS" block after `.grid-3`.

- `.agent-grid` is `display: grid; gap: 0.75em`, and its children get `min-width: 0`.
- `.agent-grid-2/-3/-4` are `repeat(2|3|4, 1fr)`, the same as the old inline values.
- `.agent-summary` has `overflow-wrap: anywhere`, and its children get `min-width: 0`.
- At ≤768px: `.agent-summary` stacks (`flex-direction: column`), and `-3`/`-4` drop to 2 columns.
- At ≤480px: all `.agent-grid-*` become one column.

Desktop is unchanged: same columns and gaps, and the screenshots match.

Undo: restore the seven "Before" lines in `Dashboard.jsx` and delete the CSS
block. Or restore both files from the tag; that also undoes #4/#5, which is harmless.

### #9 OAuth callback page in the V3 frame

`/oauth/callback` and `/oauth/:provider/callback` showed the old robot header.
They are used by **Google Calendar and other redirect-based connects** (Google add-ons).
WhatsApp, Messenger and Instagram connect through Facebook's `FB.login` popup and
never open this page.

| File | Before | After |
| --- | --- | --- |
| `src/App.jsx` | `<Route path="/oauth/callback" element={<OAuthCallback />} />` and the same for `/oauth/:provider/callback` | A comment, then `element={useV3 ? <DashboardV3><OAuthCallback /></DashboardV3> : <OAuthCallback />}` on both routes |
| `src/Pages/OAuthCallback.jsx` | Root `<div style={{ … minHeight: '60vh' … }}>` | Same, plus `className="oauth-callback"` (no style outside the frame) |
| `src/Pages/OAuthCallback.jsx` | Spinner `color: '#007bff'` | `color: 'var(--hv3-brand, #007bff)'`: site blue `#2F6BFF` inside the frame, `#007bff` everywhere else |
| `src/styles/DashboardV3.css` | n/a | Section F: `.dv3-main:has(> .oauth-callback)` centers the content (flex, padding 56px 20px). `.dv3-page .oauth-callback` is a white card: max-width 480px, radius 11px, border `rgba(255,255,255,.12)`, dashboard card shadow, `min-height: 0 !important` to override the inline 60vh. |

The page gets the frame's header with the new logo, the footer, the blue-rounded
favicon and the navy page. The processing, success and error messages, and the
redirects back to `/dashboard`, are unchanged.

Undo: rollback level 1 (the two routes). Then optionally remove the className,
the `var()` and section F; without the frame they have no visible effect.

## Verification (2026-10-12)

- `npx eslint` on `DashboardV3.jsx` and `App.jsx`: clean. `Dashboard.jsx` has the
  same 28 existing problems as on `main`; the edit adds none.
- Production build into a scratch folder (`--outDir`), so the tracked `dist/` is
  untouched: builds. The font `@import` sits at the top of the CSS bundle.
- Headless Chrome against a throwaway local mock API (fake data, no real backend),
  `/dashboard` at 1366px and 390px, all 6 tabs, OS light and dark mode. Measured:
  favicon is the blue-rounded one, old header/footer/pill hidden, body
  `rgb(15,22,33)`, Instrument Sans loaded, cards 11px, bars `rgb(26,35,50)`, tab
  strip `rgb(22,30,44)`, active tab gradient. The only console errors were
  Facebook's SDK refusing `http://` pages, which is expected on localhost.
- Rollback drill (level 1) done, then restored.
- #8: overflow past the card's right edge in the Agent Settings section was measured
  at 1366px, 768px and 390px, in the read-only view and the Edit form (opened, then
  closed with Cancel). Without the fix: 146px and 135px at 390px. With it: 0 at
  every width. The Edit form was never saved.
- #9: `/oauth/google-calendar/callback` with the mock was captured in its
  processing and success states, and `/oauth/callback` with no parameters in its
  error state. The error redirect to `/dashboard?oauth=error…` still works. The
  rollback drill for the callback routes was done, then restored.
- Lint for #8/#9: `App.jsx` and `DashboardV3.jsx` are clean. `OAuthCallback.jsx`
  (2) and `Dashboard.jsx` (28) have the same existing problems as on `main`.
- **Still to do by the user:** log in for real on the dev server and click
  through, opening (not submitting) the Change Plan and Cancel modals.

## Known and existing (not caused by this change)

- Inline-styled blues still use `#007bff`: the Integrations tab's Copy / Connect /
  Connect with Facebook / Connect Instagram buttons, and the agent-level badge
  (`getLevelColor` in `Dashboard.jsx`).

## Next-phase candidates

- Inline `#007bff` → site blue. Use `var(--hv3-brand, #007bff)` in the inline
  styles, as the OAuth spinner now does (#9). The token is only defined under
  `.dv3-page`, so AI Bridge and Propel keep their blue.
- Dark tab content (the inline styles in the 11 tab components).
- The same frame for `/payment` and `/password-reset/*`, which still show the
  robot logo.
