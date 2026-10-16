# StoreConnect plan: sign-up, store connection panel, login fix — change and rollback log

Date: 2026-10-15. Frontend for the backend's "StoreConnect Store Assistant" plan
(`mercedes` `6a96df0`, live on chat.botwerx.ai). StoreConnect is a paid specialty
plan ($199/month, Stripe 30-day trial) chosen at sign-up, like EasyBroker and MLS;
the Salesforce store connection is part of that plan's agent setup, not an add-on. (The dashboard's Add-Ons tab was removed
in March 2026, `bb44cee`; `AddOnsTab.jsx` is unused and untouched here.)

| What | Where |
| --- | --- |
| Branch | `feat/storeconnect-plan-panel`, from `main` at `355b97a` |
| Backup tag | `backup/pre-storeconnect-2026-10-15` → `355b97a` |
| Panel | `src/components/StoreConnectSetup.jsx`, helpers in `src/utils/storeconnect.js` |
| Text | `storeconnect.*` in `src/locales/{en,es}/configurations.json`; `plans.storeconnect`, `plans.storeconnectHint` in `signup.json` |
| Logo | `public/img/add-ons/storeconnect-logo.webp` (the path the backend registry names) |

## Changes

### #1 Sign-up form (`src/components/SignupForm.jsx`)

| Before | After |
| --- | --- |
| Service Level options end at Calendar Assistant | New `<option value="storeconnect">` after it, guarded by `allowedLevels` like the others. Label `plans.storeconnect`: en "StoreConnect Store Assistant - $199/month", es "Asistente de Tienda StoreConnect - $199/mes". |
| `pricingMap` has no storeconnect | `storeconnect: { amount: 19900, name: "StoreConnect Store Assistant" }`: the paid path (`/api/create-subscription` → Stripe checkout with the backend's 30-day trial, card at sign-up), like EasyBroker and MLS. The backend must have `STRIPE_PRICE_STORECONNECT` set first, or sign-up answers "Invalid level: storeconnect. No price configured." |
| Free-plan checks repeated `level === "free" \|\| level === "calendar_assistant"` in three places | `FREE_PLANS = ["free", "calendar_assistant"]` and `isFreePlan`, used by the submit branch, the Start Free Trial / Let's Go! button label, and the branding notice (`isFreePlan \|\| level === 'basic'`). Same behaviour as before for every existing plan. |
| — | Hint under the select when storeconnect is chosen (`plans.storeconnectHint`): en "After signing up, connect your Salesforce org from your dashboard (takes about 10 minutes).", es "Después de registrarte, conecta tu org de Salesforce desde tu panel (unos 10 minutos)." Same `signup-branding-notice` style, store icon. |

No MLS/EasyBroker acknowledgment for this level; the domain field stays.

### #2 StoreConnect setup panel (new `src/components/StoreConnectSetup.jsx`)

Rendered at the top of the Configurations tab by `Dashboard.jsx` only when
`isStoreConnectAgent(selectedClient)` (level `storeconnect`). Every call uses
`credentials: 'include'`. Against `endpointRoutes/storeConnect.js`:

- `GET …/storeconnect/status` drives a 3-step stepper: `needs_app` → step 1;
  `not_connected` / `reconnect_required` → step 2; `choose_store` → step 3; `ready`
  → all done plus the ready block.
- **Step 1**: the four instructions, `callback_url` in a copy box, form with Consumer
  Key, Consumer Secret (password), Org type Production / Sandbox / Custom login URL →
  `PUT …/storeconnect/app` `{ client_id, client_secret, environment, login_url? }`
  (`login_url` only when Custom). Collapsed to "Saved app: hint · env · Edit" once
  configured; editing shows the hint as placeholder and a blank secret keeps the
  stored one for the same key. Backend error codes map to text; `reconnect_needed`
  shows "Your app changed — connect again."
- **Step 2**: `GET …/storeconnect/connect?returnTo=<origin>/dashboard` →
  `window.location.href = url`. The selected agent is saved in sessionStorage
  (`storeconnect_return`) first. `409 app_required` reopens step 1. Shows
  **Reconnect** when `reconnect_required`.
- **Back from Salesforce** (`?oauth=…&provider=storeconnect&storeconnect=…&reason=…`):
  banner (success, or the backend's `message`), status reload, step 3 opened for
  `choose_store`; the params are removed from the URL.
- **Step 3**: `GET …/storeconnect/stores`, radio list, storefront URL asked when the
  chosen store has no `url`, `POST …/storeconnect/store` `{ store_sfid, storefront_url? }`.
  "Change store" reopens it when ready.
- **Ready**: store link, "Connected as …", last sync (status · time), products
  (active · bookable), content sources, last sync error, **Sync now**
  (`POST …/storeconnect/sync`, then status polled every 10 s while running) and
  **Disconnect** (confirm, `DELETE …/storeconnect`; the app is kept so the stepper
  returns to step 2).

### #3 `src/Pages/Dashboard.jsx`

| Before | After |
| --- | --- |
| `activeTab` always starts at `configurations` | `?tab=<id>` opens that tab (the OAuth callback page already sends `tab=integrations`) |
| First subscription / first agent always selected after load | When the URL has `provider=storeconnect`, the agent saved before the Salesforce redirect is selected (sessionStorage `storeconnect_return`); a stale saved id falls back to the first |
| `getLevelColor` has no storeconnect | `storeconnect: '#2a9d9f'` (badge color) |
| Configurations tab: StylingTab, ConfigurationsTab | `StoreConnectSetup` first, for storeconnect agents only |

### #4 Login page (`src/Pages/LoginV3.jsx`)

The "Create Account" box posted to `/api/signup`, which the backend never had, so
every attempt showed "Server error". Removed the in-page form and its state;
"Create Account" now navigates to `/?tab=botwerx#hv3-signup`, the home page's
sign-up form. `HomeV3.jsx`: the sign-up wrapper got `id="hv3-signup"` and a
one-time hash scroll on mount. The unused `login.*` keys (signup fields, success
texts) stay in `homev3.json`.

## Rollback

- **Panel only:** in `Dashboard.jsx` remove the `StoreConnectSetup` line from the
  Configurations tab (and its import). The plan can still be signed up for.
- **Plan only:** remove the `storeconnect` option line in `SignupForm.jsx`. The
  backend still accepts the level.
- **Login fix only:** `git checkout backup/pre-storeconnect-2026-10-15 -- src/Pages/LoginV3.jsx`
  (brings back the broken box).
- **Everything:** revert the merge, or `git checkout backup/pre-storeconnect-2026-10-15 -- <path>`.

## Verification (2026-10-15)

- Lint: new files clean; `Dashboard.jsx` keeps its 28 pre-existing problems;
  `SignupForm.jsx`, `HomeV3.jsx`, `LoginV3.jsx` clean as on `main`. Scratch
  production build succeeds; `dist/` untouched.
- Headless Chrome against a local mock of the backend contract (fake data; the
  sign-up form was never submitted):
  - storeconnect agent: panel at the top of Configurations with the callback URL;
    missing secret → "Enter the Consumer Secret."; save (sandbox) → step 1 done,
    step 2 current; Connect → sent `returnTo=<origin>/dashboard`, came back with the
    outcome params, banner shown, params cleared, sessionStorage key consumed.
  - one storefront → auto-picked, ready, sync "Syncing…" then "completed · 17 active
    · 3 bookable · 6 pages · 3 articles"; Sync now; Edit shows the key hint;
    Disconnect → step 2 with the app kept.
  - three stores → "Choose your store to finish", chooser with three radios, store
    without URL asks for the storefront URL, saved, synced; Change store / Cancel.
  - pro agent: no panel, badge "pro".
  - sign-up form: option present with the price, hint, no branding notice, "Let's
    Go!" (paid path), no MLS acknowledgment; MLS still shows its acknowledgment.
  - login: no sign-up fields; Create Account lands on `/?tab=botwerx#hv3-signup`
    with the form in view.
- **Still to do by the user (live):** sign up a fresh account with the StoreConnect
  plan in a private window → log in → Configurations shows step 1 with the callback
  URL → paste the test app's key and secret → Connect → pick a store from
  `sc-gtm-banjaxed`. Real-estate plans and the Google Calendar card are unchanged.
