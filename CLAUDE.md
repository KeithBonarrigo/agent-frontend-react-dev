# BotWerx frontend

React 19 + Vite 6 single-page app. Deployed from GitHub to Railway: a merge to
`main` publishes to https://www.botwerx.ai within minutes (Railway runs
`npm run build` on deploy). Branch `main` is **not** branch-protected, so any merge
goes live; changes go through a pull request.

Run it: `npm install`, then `npm run dev -- --port 5174 --strictPort`, then open
http://localhost:5174/preview/home-v3

## Plans and handoffs

Plans, handoff notes and similar working documents go in `plans/`, named
`YYYY-MM-DD-short-topic.md`. Start with the newest handoff there.

## Status: V3 is going live (2026-09-13)

- On BotWerx domains, `/` serves `HomeV3` and `/login` serves `LoginV3`.
  AI Bridge (`aibridge.global` / `base`) and Propel domains keep their previous
  pages. The logic is `useV3` in `src/App.jsx`.
- The pre-V3 pages stay in the repo, unedited, at `/legacy/home` (`Home.jsx`) and
  `/legacy/login` (`Login.jsx`); `robots.txt` disallows `/legacy/`.
  `/preview/home-v3` and `/preview/login-v3` redirect to `/` and `/login`.
- Backup: git tag `backup/pre-v3-home-2026-09-13` = `main` before the switch.
- Rollback: in `src/App.jsx` point `/` back to `<Home />` and `/login` back to
  `<Login />` (or revert the merge commit).

The notes below describe how the V3 pages were built; "mock"/"preview"
wording in them predates going live.

## Home page redesign V3

Branch `homepage-v3` holds an isolated mock of the home page at the unlisted
route `/preview/home-v3`, for a graphics and styling overhaul. It has two tabs,
**BidConnect** (default) and **Botwerx Bot**, that switch everything from the
hero down to the FAQ. The contact form and footer are shared by both tabs.
The active tab is kept in `?tab=bidconnect|botwerx`.

- **Botwerx Bot tab:** the current live home page's content and functionality —
  hero benefits with the shared `SignupForm` component, slider, benefit cards,
  FAQ. Its text is copied into `homev3.json` under `botwerx`.
- **BidConnect tab:** content from https://bidconnect.app under `bidconnect`
  (English verbatim from that site, Spanish translated): hero with a live auction illustration, three features, the "remembers only
  the winner" section, a four-step "How it works" section (V2's layout; its
  copy was written for this page, not taken from bidconnect.app),
  create-organization / sign-in, and the FAQs. Sign In buttons link to
  `https://bidconnect.app/#signin` (logins happen on each org's subdomain there);
  "Create your organization" links to `https://bidconnect.app/signup/`.
  bidconnect.app's own "Talk to us" form posts to Salesforce Web-to-Lead; that
  is NOT wired here — both tabs share the BotWerx contact form.
- **Header, contact form, footer:** functional, matching the live `HomeHeader`,
  `Home.jsx` contact form and `HomeFooter` (log in / dashboard / log out,
  `/api/contact`, legal page links).

**The forms are live.** `SignupForm` and the contact form reach their API through
`getApiUrl()`: `VITE_API_URL` (http://localhost:3000) on localhost, and
`https://chat.botwerx.ai` on www.botwerx.ai — the same destinations as the live
home page. Do not submit them yourself; the user proofs submissions. Don't
change `.env.development` or `getApiUrl` without asking.

The page's styling and structure started from the V2 mock. **V2 is the visual
reference and must not change.** It lives in a separate checkout,
`~/Botwerx/FRONT-END-REDESIGN/agent-frontend-react-dev` (branch `mock-homepage`,
served at localhost:5173). Never write anything under `FRONT-END-REDESIGN/`.

Nothing on this branch is committed or pushed until the user says it's ready.
Going live later is a separate, deliberate change to the `/` route in
`src/App.jsx` and is not part of this work.

**Mock login page:** `src/Pages/LoginV3.jsx` at `/preview/login-v3`, styled with
`HomeV3.css` (section at the end of the file) and text under `login` in
`homev3.json`. Same behaviour as the live `Login.jsx` (UserContext login →
`/dashboard`, `/api/signup`, live password-reset link). The live `Login.jsx` and
`login.json` are not touched.

### Only these files may be changed

| File | Holds |
| --- | --- |
| `src/Pages/HomeV3.jsx` | The mock page's structure, including both tabs |
| `src/Pages/LoginV3.jsx` | The mock login page |
| `src/styles/HomeV3.css` | All of its styling |
| `src/locales/es/homev3.json` | Its Spanish text |
| `src/locales/en/homev3.json` | Its English text |

### Never change these

`src/Pages/Home.jsx`, `src/styles/Home.css`, `src/locales/en/home.json` and
`src/locales/es/home.json` are the **live** home page. Their names are one `V3`
away from the files above, so read paths carefully before editing. If a task
seems to require changing one of them, stop and ask instead.

Also leave `src/App.jsx`, `src/i18n.js`, `src/components/` and `public/` alone
unless explicitly asked. The route, the i18n namespace and `robots.txt` are
already wired up.

## Rules that keep the mock isolated

**Every CSS class on this page starts with `hv3-`.** CSS in this project is
global, not scoped or modular. Rules that touch `html`, `body` or `#root` must be
gated by `body:has(.hv3-page)` so they only apply on this route. Never write,
rename or edit a `home-` or `hv2-` class.

**Text lives in the `homev3` i18n namespace, never `home`.** BidConnect's text is
under the `bidconnect` key, the mock login's under `login`.

**Keep both languages in sync.** Any key added or removed in `es/homev3.json` must
match `en/homev3.json`. Write natural Spanish, not translated-sounding Spanish.

**Do not run `npm run build`.** `dist/` is tracked in git, so a build creates
noisy unrelated changes.

**Never commit to or push `main`.**

**Never submit the contact or signup forms yourself,** including while testing.
They create real records wherever `getApiUrl()` points.

**Shared components stay unchanged.** `SignupForm`, `UserContext`,
`DomainContext` and `getApiUrl` are used by the live site; this page imports them
but never edits them. `SignupForm` is light-themed, so the page's dark-theme
resets for headings, paragraphs and links skip anything inside `.hv3-bw-signup`.
Layout tweaks to the form on this page (compact domain row, checkbox row) are
CSS rules that start with `.hv3-bw-signup` and target the form's own
`signup-`/`home-form-` classes beneath it. That wrapper exists only here, so
those rules can't reach the live page; never write such a class without it.

**Favicon.** `DomainContext` sets the site favicon per domain. `useFavicon` in
`HomeV3.jsx` points the icon links at `/img/favicon-botwerx-blue-rounded.png` while this
page is mounted and restores them on unmount. `index.html` is not changed.

## Known quirks, not bugs

The header and footer styling is shared with the live page through `Home.css`,
which is why `HomeV3.jsx` imports it alongside `HomeV3.css`. Do not remove that
import.

The page renders fully with no backend running. Only form submission needs the
API, so a stopped or missing backend is not a problem to fix.
