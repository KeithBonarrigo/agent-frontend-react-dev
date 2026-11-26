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
| `railway.json` | Added in PR #38, **removed in the follow-up**: Railway never read it (see "What happened on deploy"). |
| `Procfile` | `web: serve -s dist -l $PORT` → `web: serve dist -l $PORT` (kept in step with the Railway setting; Railway doesn't read it). |
| `public/serve.json` | New: the two rewrites above. Note it is itself readable at `/serve.json` (serve has no way to hide a file); it holds only these rules. |
| `src/Pages/LegalV3.jsx`, `DashboardV3.jsx`, `LoginV3.jsx`, `HomeV3.jsx` | Footer legal links gain **SMS Terms** and **SMS Privacy** (plain `<a href>`, since the pages are outside the React app). |
| `src/locales/{en,es}/homev3.json` | New `footer.smsTerms` / `footer.smsPrivacy`: SMS Terms / SMS Privacy; Términos de SMS / Privacidad de SMS. |

The pages are English only (the supplied wording); the language toggle isn't on them.

## What happened on deploy (2026-11-26)

- PR #38 merged as `b5a7b19` and deployed, but Railway started it with the dashboard's `serve -s dist -l $PORT`. `railway config migrate status`: "No services in production read Config as Code", and the deployment's `fileServiceManifest` was empty. So `railway.json` had no effect, and `/sms-terms` still served the app shell (curl checks returned 0). Nothing else changed.
- With Keith's go-ahead, the production `web` service's **start command setting** was changed through the Railway CLI's API:

  | Setting | Before | After |
  | --- | --- | --- |
  | Project `agent-frontend-react`, service `web`, environment `production`: start command | `serve -s dist -l $PORT` | `serve dist -l $PORT` |

  ```
  railway api 'mutation($serviceId: String!, $environmentId: String, $input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input) }' \
    --variables '{"serviceId":"5490e0ca-a588-4121-891b-7a32da2d5c2d","environmentId":"ae54d484-8ba0-46a6-9c90-994f5c97d1d8","input":{"startCommand":"serve dist -l $PORT"}}'
  railway service redeploy --from-source -y     # run from ~/github/agent-frontend-react-dev (the linked folder)
  ```
  The PR preview environment (`agent-frontend-react-dev-pr-12`) kept `serve -s dist -l $PORT`.
- Redeployed (deployment created 17:41:40Z, SUCCESS). Live checks passed (below).
- Follow-up PR: removed the unused `railway.json` and corrected this log.

## Rollback

**Order matters.** The start command and `serve.json` work as a pair. `serve dist` with no `serve.json` 404s every deep link (`/login`, `/dashboard`, …), so put `-s` back **before** removing `serve.json`.

| Undo | How |
| --- | --- |
| Pages off, quickest | Set the start command back to `serve -s dist -l $PORT` (same `railway api` call with that value, or the service's settings in the Railway dashboard), then `railway service redeploy --from-source -y`. The SMS paths fall back to the app shell; everything else is as before. The files can stay. |
| Everything | First the step above. Then `git revert -m 1 b5a7b19` (and the follow-up) through a PR. |
| From the tag | First the step above. Then `git checkout backup/pre-sms-policy-pages-2026-11-26 -- package.json Procfile src/` and delete `public/serve.json`, `scripts/build-sms-pages.mjs`, `scripts/sms-pages-content.mjs`. |

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

## Verification on www.botwerx.ai (after the start command change)

| Check | Result |
| --- | --- |
| `curl -s https://www.botwerx.ai/sms-terms \| grep -c "Message and data rates may apply"` | 200, **1** (and 1 at `/sms-terms/`) |
| `curl -s https://www.botwerx.ai/sms-privacy \| grep -c "No mobile information will be shared"` | 200, **1** (and 1 at `/sms-privacy/`) |
| Control: the same greps on `/terms-and-conditions` | **0** and **0** |
| `/`, `/?tab=bidconnect`, `/login`, `/dashboard`, the four legal pages, `/payment`, `/agent`, password reset, OAuth callback, unknown and nested paths | 200, app shell, as before |
| `robots.txt`, `og-image.jpg`, the demo video, an image, the JS and CSS bundles | 200 with their own types |
| Headless Chrome | Same results as locally: styled pages, no scripts, footer links on home/login/legal pages click through both ways, full text with JavaScript off, no console errors or failed requests |
