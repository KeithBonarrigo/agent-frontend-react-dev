# Handoff: home page V3 (BidConnect / Botwerx Bot tabs)

Date: 2026-09-13. Written at the end of a long session so the next one can pick
up without re-deriving anything. Read `CLAUDE.md` in the repo root first; it
holds the guardrails. This file is the state of the work and what is still open.

## Update — going live

The user approved going live on 2026-09-13. See "Status" in `CLAUDE.md` for the
routing (V3 at `/` and `/login` on BotWerx domains only), the `/legacy/` backups,
the backup tag `backup/pre-v3-home-2026-09-13`, and rollback steps. Shipped via a
pull request from `homepage-v3` for the user to merge. Preview-only settings
(noindex, "[MOCK]" titles, `/preview/` links) were removed for launch. The forms
were never submitted end to end locally (no backend on :3000), so the first real
submissions happen in production.

## Goal

A new home page for www.botwerx.ai with two product tabs, **BidConnect**
(default) and **Botwerx Bot**, built fully separate from the live home page so
it can be rolled back by deleting a branch. The overall plan is: first make the
content and functionality right, then do a graphics and styling overhaul, then
commit, then (separately and deliberately) make it the `/` route.

We are at the end of the content-and-functionality stage. The styling overhaul
has not started, apart from the adjustments listed under "Built so far".

## Where everything is

| What | Where |
| --- | --- |
| This work | `~/Botwerx/agent-frontend-react-dev`, local branch **`homepage-v3`** (from `main` at `1166e5f`) |
| New page | http://localhost:5174/preview/home-v3 (`?tab=bidconnect` or `?tab=botwerx`) |
| Visual reference (must not change) | `~/Botwerx/FRONT-END-REDESIGN/agent-frontend-react-dev`, branch `mock-homepage`, http://localhost:5173/preview/home-v2 |
| Live home page | `/` in both checkouts; `src/Pages/Home.jsx` — untouched |

**Nothing is committed or pushed.** The user will say when it is ready to commit.
Commits go to `homepage-v3` only, never `main` (`main` deploys to production).

### Run it

```
cd ~/Botwerx/agent-frontend-react-dev
npm run dev -- --port 5174 --strictPort
```

The reference runs from the FRONT-END-REDESIGN checkout with plain `npm run dev`
(port 5173). Do not run `npm run build` — `dist/` is tracked.

## Files

Changed or added in this checkout (everything else is untouched, including all
shared components and the live home page files):

| File | Status | Notes |
| --- | --- | --- |
| `src/Pages/HomeV3.jsx` | new | The whole page: header, tabs, both tab components, contact form, footer |
| `src/styles/HomeV3.css` | new | All styling; every class `hv3-`; page-level rules gated by `body:has(.hv3-page)` |
| `src/locales/en/homev3.json`, `src/locales/es/homev3.json` | new | All text, keys kept in parity (check with a flatten-and-compare script) |
| `src/App.jsx` | +4 lines | `import HomeV3` and `<Route path="/preview/home-v3">` |
| `src/i18n.js` | +5 lines | registers the `homev3` namespace |
| `public/robots.txt` | new | `Disallow: /preview/` |
| `public/img/favicon-botwerx-blue-rounded.png` | new | favicon in use |
| `CLAUDE.md` | new | guardrails and page notes — keep it current |
| `plans/` | new | this file; future plans go here |

Untracked leftovers to clean up before committing (not needed by the page):
`public/img/favicon-botwerx-blue.png` (superseded), and the two favicon PNGs the
user dropped into `dist/img/`.

## Built so far

### Page shell (both tabs)
- **Header**: logo, section links centred on the page (desktop), then the live
  `HomeHeader`'s account links inline — Log In, or Agent / My Dashboard / Log Out
  from `UserContext` — with Contact Us as the only button. Flat square flags on the
  EN/ES toggle (flag-icons, MIT, in `public/img/flags/`). Hamburger menu
  at 1000px and below.
- **"Our Products:"** centred above the tab strip. Tabs are wide, centred, letter-spaced,
  and the selected tab has a blue top-to-lighter-bottom gradient. Tab lives in
  `?tab=`; arrow keys switch tabs.
- **Contact form** (shared by both tabs, centred): the live home page's form,
  POST `getApiUrl()/api/contact`.
- **Footer**: V2's layout and styles (logo + address, Product / Company /
  Legal columns incl. `info@botwerx.ai`, bottom bar), with working links — the current tab's sections,
  `/dashboard`, `/login`, and the live legal pages. V2's Pricing link is omitted
  (no pricing section).
- **Favicon**: `useFavicon` swaps every icon link to
  `/img/favicon-botwerx-blue-rounded.png?v=2` while mounted and restores on unmount.
  Bump `?v=` whenever the image changes (browsers cache favicons hard).

### Botwerx Bot tab — live home page content
- Hero: "Capture More Leads with Advanced AI Agents *without writing any code*"
  (second part in the blue serif italic), four indented benefit headings, and the
  real shared `SignupForm` beside it (stacks below 1200px).
- Signup form compacted on this page only (domain label beside its field,
  WhatsApp and Terms checkboxes on one row, empty message gap collapsed) via CSS
  scoped under `.hv3-bw-signup`. `SignupForm.jsx` is not edited.
- Full-width "What Can AI Agents Do For Your Business?" band and edge-to-edge
  auto-scrolling carousel with the live page's item sizes (uses `icon2.png`, the
  transparent version, instead of the live page's `icon2.jpg`).
- Six benefit cards, 10-question FAQ. Text copied from `home.json`/`common.json`.

### BidConnect tab — content from https://bidconnect.app
Section order: hero → features → "remembers only the winner" → how it works →
create / sign in → FAQ. Header links on this tab: Home, How it works, FAQ.
- Hero: headline "Run a modern, real-time
  fundraising auction *with Salesforce and StoreConnect*", intro with a StoreConnect link, "Create Your
  Auction" (→ `https://bidconnect.app/signup/`, BotWerx icon) and Sign In (scrolls to the
  sign-in form). Live-auction illustration in the browser frame with an
  "Outbid alert sent" card.
- Three features, the "Most auction software remembers only the winner." section,
  21 FAQs (two link to storeconnect.com).
- **How it works — four steps**, numbered blue circles beside each headline: create your organization, connect your org
  (Salesforce + StoreConnect), add your items, share the link. Same layout and
  styles as V2's steps section; four across, 2×2 below 1200px, one column at
  1000px and below.
- Both Sign In buttons (hero and "Already have an account?" card) link to
  `https://bidconnect.app/#signin`; there is no org-name form on this page. bidconnect.app
  has no general login URL — logins happen on each organization's subdomain.
- English copy is verbatim from bidconnect.app (checked string by string),
  **except the How it works section, which was written for this page** from
  facts on that site. Spanish for everything is a translation made in-session.
- Removed the placeholder sections that bidconnect.app has no content for:
  problem cards, capabilities, pricing.

### Mock login page — /preview/login-v3
- `src/Pages/LoginV3.jsx` + a section at the end of `HomeV3.css`; text under
  `login` in `homev3.json` (copied from `login.json`).
- V3 nav (logo → `/preview/home-v3`, "Back to home", flag toggle), a centred
  card, V3 footer bar with the legal links.
- Same behaviour as live `Login.jsx`: log in via `UserContext` then `/dashboard`;
  "Create Account" toggle posting to `getApiUrl()/api/signup`; "Forgot password?"
  to the live `/password-reset/request`. Registered in `App.jsx`.
- The V3 home page's header "Log In" and footer "Sign in" still point at the live
  `/login`, not this mock.
- Known: the browser tab title shows DomainContext's title, not the page's
  Helmet title (same on the V3 home page).

## Open decisions for the user

1. **BidConnect contact form.** bidconnect.app's "Talk to us" form posts to
   Salesforce Web-to-Lead (`orgId 00Dhk000000MZig`, fields first/last name,
   email, organization, website, city, state, description). The V3 page shares
   the BotWerx `/api/contact` form across both tabs. Should the BidConnect tab
   send enquiries to Salesforce instead? It is a production endpoint — ask before
   wiring it.
2. **Header "Log In" on the BidConnect tab** still goes to the BotWerx `/login`.
   Should it jump to the BidConnect sign-in form instead?
3. **Copy review**: the four How-it-works steps (written in-session) and all
   Spanish text ("pujas" for bids, "simpatizantes" for supporters, "postores" for
   bidders) need a human read before going live.
4. **Favicon**: the current PNG has solid navy corners, so it shows as a square
   rather than rounded. It is also larger than a favicon needs (512×512, 186 KB);
   offered to make transparent-corner and small (64/180px) versions.
5. **BidConnect logo lockup**: bidconnect.app shows "BIDCONNECT by [BotWerx
   logo]"; only the BIDCONNECT mark is used here. Add the "by BotWerx" part?
6. Removed BidConnect placeholder sections (problem, capabilities, pricing) can
   come back when there is real content.

## Next steps

1. Get answers on the open decisions above.
2. Graphics and styling overhaul of `HomeV3.jsx` / `HomeV3.css` — the original
   goal of this page. Content and functionality are in place to build on.
3. Clean up the untracked leftovers listed under "Files".
4. Commit to `homepage-v3` when the user says so. Going live (changing the `/`
   route in `App.jsx`) is a separate, deliberate step.

## Things that bit us (read before editing)

- **Global CSS leaks in.** `src/index.css` and `src/css/app.css` style every
  `button`, `input`, `h1–h3` and `a` (margins, drop shadows, dark backgrounds,
  centred headings, `#root` padding on mobile). V3 overrides these per element;
  a new button or input usually needs `margin:0; box-shadow:none`.
- **`SignupForm` is light-themed.** The page's dark heading/paragraph/link resets
  use `:where(:not(.hv3-bw-signup *))` so they skip it without raising
  specificity. Keep that pattern for any new page-wide reset.
- **`DomainContext` rewrites the favicon, title and meta tags** once at app start,
  after the page mounts — that is why the favicon needs `useFavicon`.
- **The forms are live.** Locally, `getApiUrl()` returns `http://localhost:3000`
  (from `.env.development`), and nothing runs there at the moment, so
  submissions show an error until a backend is started. On www.botwerx.ai they go
  to `chat.botwerx.ai`. Never submit the forms while testing.
- **Verification approach used**: Playwright's cached headless Chromium
  (`~/Library/Caches/ms-playwright/chromium_headless_shell-1228/.../chrome-headless-shell`)
  driven over the DevTools protocol with small Node scripts, measuring layout
  and computed styles at 1440, 1024/1100 and 390px widths, and comparing against
  the V2 page on :5173. The scripts lived in the session scratchpad and are gone;
  full-page screenshots were often too large for the image viewer, so checks were
  done on DOM measurements.
