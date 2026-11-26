# SMS Terms and SMS Privacy pages on botwerx.ai, change and rollback log

Date: 2026-11-26. Botwerx, LLC is submitting Twilio toll-free verification for (888) 905-7832, BidConnect's auction text-alert number. Keith wants the texting terms and privacy pages under botwerx.ai, beside the other legal pages, for the Twilio form. The wording was supplied with the request and is used exactly (`scripts/sms-pages-content.mjs`).

| What | Where |
| --- | --- |
| Branch | `feat/sms-policy-pages`, from `main` at `a4a3b80` |
| Backup tag | `backup/pre-sms-policy-pages-2026-11-26` → `a4a3b80` |

## Why static HTML, and why the start command changes

Carrier reviewers' tools may not run JavaScript, and every botwerx.ai page is a React app whose HTML holds no text (measured: `/terms-and-conditions` has about 37 characters of text in its HTML). So these two pages are plain HTML files built after `vite build`, with the full text in what the server sends.

The site was started with `serve -s dist`. `-s` puts a catch-all rewrite to `index.html` *before* any `serve.json` rules (serve 14.2.6, `build/main.js`), so no file at an extensionless path could ever be served. The start command is now `serve dist`, and `public/serve.json` (copied to `dist/`) holds the same catch-all minus the two pages:

```json
{ "source": "/!(sms-terms|sms-privacy)",    "destination": "/index.html" }
{ "source": "/!(sms-terms|sms-privacy)/**", "destination": "/index.html" }
```

The leading `/` matters: serve-handler reads a source starting with `!` as a negated glob and mangles the rest, which rewrote every path (measured before the fix).

## Change

| File | Change |
| --- | --- |
| `scripts/sms-pages-content.mjs` | New: the two pages' text (exact wording from the request). |
| `scripts/build-sms-pages.mjs` | New: writes `dist/sms-terms.html` and `dist/sms-privacy.html` from the built `dist/index.html` head (the site's stylesheet, fonts and favicon; no app JavaScript), with the same frame as `LegalV3` (logo, Back to home, footer with the legal links). Fails the build if the stylesheet link or a required phrase is missing. |
| `package.json` | `build`: `vite build --mode production` → `vite build --mode production && node scripts/build-sms-pages.mjs`. `start`: `serve -s dist` → `serve dist`. |
| `railway.json` | New: `deploy.startCommand` `serve dist -l $PORT`. Config in code overrides the dashboard value, which was `serve -s dist -l $PORT` (read with `railway status --json` on 2026-11-26). |
| `Procfile` | `web: serve -s dist -l $PORT` → `web: serve dist -l $PORT` (kept in step; Railway uses `railway.json`). |
| `public/serve.json` | New: the two rewrites above. Note it is itself readable at `/serve.json` (serve has no way to hide a file); it holds only these rules. |
| `src/Pages/LegalV3.jsx`, `DashboardV3.jsx`, `LoginV3.jsx`, `HomeV3.jsx` | Footer legal links gain **SMS Terms** and **SMS Privacy** (plain `<a href>`, since the pages are outside the React app). |
| `src/locales/{en,es}/homev3.json` | New `footer.smsTerms` / `footer.smsPrivacy`: SMS Terms / SMS Privacy; Términos de SMS / Privacidad de SMS. |

The pages are English only (the supplied wording); the language toggle isn't on them.

## Rollback

| Undo | How |
| --- | --- |
| Everything | `git revert -m 1 <merge-commit>` through a PR. Removing `railway.json` puts the dashboard start command (`serve -s dist -l $PORT`) back in force. |
| Routing only, keep the files | Delete `railway.json` (and restore `-s` in `Procfile` / `package.json`); the pages then fall back to the React app shell. |
| From the tag | `git checkout backup/pre-sms-policy-pages-2026-11-26 -- package.json Procfile src/` and delete `railway.json`, `public/serve.json`, `scripts/build-sms-pages.mjs`, `scripts/sms-pages-content.mjs`. |

## Verification (local, production build served by the same `serve` 14.2.6)

| Check | Result |
| --- | --- |
| 36 paths, new setup vs old `serve -s` (same build without the new files) | Identical status, type and body for every app route (`/`, `/login`, `/dashboard`, the four legal pages, `/payment`, `/agent`, password reset, both OAuth callbacks, `/legacy/home`, unknown and nested paths), static files, missing files and `/index.html`. Differences only where intended: `/sms-terms`, `/sms-privacy` (with and without `/`, and with a query string) now serve the pages; `/sms-terms/x` now 404 instead of the app shell; `/serve.json` readable. |
| `curl … /sms-terms \| grep -c "Message and data rates may apply"` | 1 (and 1 with a trailing slash) |
| `curl … /sms-privacy \| grep -c "No mobile information will be shared"` | 1 (and 1 with a trailing slash) |
| Control: same greps on `/terms-and-conditions` | 0 and 0 |
| Headless Chrome, 1366 and 390 px | Same fonts, colours, logo and frame as `/privacy`; no scripts; no sideways scroll; current page marked in the footer |
| JavaScript disabled | Full text shown |
| Footer links | SMS Terms and SMS Privacy on the home, login and legal pages; clicking through from `/privacy` loads the static page, and back again |
| Console / failed requests | None |

ESLint clean on the changed files; production build succeeds.
