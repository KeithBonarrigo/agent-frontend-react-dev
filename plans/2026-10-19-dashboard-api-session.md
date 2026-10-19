# Dashboard API calls: session cookie on every call, sign-out when the session ends, change and rollback log

Date: 2026-10-19. Requested by the backend session (`mercedes`, `INSTRUCTIONS/security/API_AUTH.md`, step 3).

The backend is switching `AUTH_ENFORCE` from `log` to `on`, which Keith approved. After that it rejects dashboard calls without a valid session cookie (401) or for another account's data (403). This must be live before the switch.

| What | Where |
| --- | --- |
| Branch | `fix/dashboard-api-session`, from `main` at `2fac381` |
| Backup tag | `backup/pre-dashboard-api-session-2026-10-19` → `2fac381` |

## Changes

### #1 New `src/utils/apiFetch.js`

- `apiFetch(input, init)` calls `fetch` with `credentials: 'include'` always set.
- When our API (a URL starting with `getApiUrl()`) answers 401 while a user is stored, it fires `SESSION_EXPIRED_EVENT` (`botwerx:session-expired`).
- Exports `apiFetch` (named and default) and `SESSION_EXPIRED_EVENT`.

### #2 72 calls to our API now use `apiFetch`

| File | Calls | Before → after |
| --- | --- | --- |
| `src/Pages/Dashboard.jsx` | 15 | `fetch(` → `apiFetch(`. Two of them, `GET /api/leads/:clientId/collaborations` and `GET /api/leads?clientId=`, had no `credentials`. |
| `src/Pages/OAuthCallback.jsx` | 1 | same |
| `src/components/AudienceInsightsTab.jsx` | 2 | same |
| `src/components/ConfigurationsTab.tsx` | 16 | same |
| `src/components/ConversationsTab.jsx` | 5 | same |
| `src/components/IncomeReportTab.jsx` | 2 | same, and `apiBaseUrl` changes from `import.meta.env.VITE_API_URL \|\| 'http://localhost:3000'` to `getApiUrl()`, like every other tab |
| `src/components/IntegrationsTab.jsx` | 13 | same |
| `src/components/LeadsTab.jsx` | 7 | same. Five had no `credentials`. |
| `src/components/MetricsTab.jsx` | 4 | same. Two had no `credentials`. |
| `src/components/StoreConnectSetup.jsx` | 1 | its `api()` helper |
| `src/components/StylingTab.tsx` | 6 | same |

- Each file gets `import { apiFetch } from "../utils/apiFetch";` after its `getApiUrl` import.
- Existing `credentials: 'include'` options stay; they're redundant but harmless.
- The `Authorization: Bearer VITE_CREATE_USER_TOKEN` headers stay, as requested; the backend still checks them on a few routes.

**Left on plain `fetch`:**
- Public, pre-login calls: `/api/contact` (`Agent.jsx`, `Home.jsx`, `HomeV3.jsx`), sign-up (`SignupForm.jsx`, `Login.jsx`), password reset (`PasswordReset*.jsx`, `ResetPassword.jsx`).
- Other hosts: the five Google Drive downloads.
- `UserContext`'s own login, check-session, logout and select-client calls, which already send the cookie.
- Code nothing renders:
  - `AddOnsTab.jsx` and `ModelsTab.jsx`, which nothing imports.
  - The `/logout` buttons in `Banner.jsx` (not imported) and `Layout.jsx` (imported in `App.jsx`, but no route uses it). Those buttons never appear; the dashboard's Log Out uses `UserContext.logout()`, which posts `/api/logout` with the cookie.
- `Checkout.jsx` uses axios with `withCredentials = true` already.

### #3 `src/contexts/UserContext.jsx`

| Case | Before | After |
| --- | --- | --- |
| `GET /api/check-session` answers 200 `{ isAuthenticated: false }` | Kept the stored user ("they'll get a 401 later") | Clears it: state `null`, and localStorage `user` and `client_id` removed. The dashboard then redirects to `/login`. |
| `check-session` fails (network error, 5xx) | Kept the stored user | Unchanged: kept |
| `SESSION_EXPIRED_EVENT` (a 401 from `apiFetch`) | none | Clears the stored user, the same way |

The cleanup is a module-level `forgetStoredUser()`, so the existing `checkSession` effect raises no new hooks warning.

### #4 `src/App.jsx`

A new `SessionExpiredRedirect`, rendered inside `BrowserRouter`, listens for `SESSION_EXPIRED_EVENT` and calls `navigate('/login', { replace: true })`. `UserProvider` sits outside the router, so it can't navigate itself.

## Rollback

| Undo | How |
| --- | --- |
| Everything, after merge | `git revert -m 1 <merge-commit>` through a PR. Do it before the backend switches enforcement back to `log`, or reverting brings back the 401s on Leads and Metrics. |
| From the tag | `git checkout backup/pre-dashboard-api-session-2026-10-19 -- src/App.jsx src/contexts/UserContext.jsx src/Pages/Dashboard.jsx src/Pages/OAuthCallback.jsx src/components/AudienceInsightsTab.jsx src/components/ConfigurationsTab.tsx src/components/ConversationsTab.jsx src/components/IncomeReportTab.jsx src/components/IntegrationsTab.jsx src/components/LeadsTab.jsx src/components/MetricsTab.jsx src/components/StoreConnectSetup.jsx src/components/StylingTab.tsx`, then delete `src/utils/apiFetch.js` |
| Only the sign-out on a 401 | Remove `<SessionExpiredRedirect />` from `App.jsx` and the `SESSION_EXPIRED_EVENT` effect from `UserContext.jsx`. `apiFetch` keeps sending the cookie. |
| Only the `check-session` change | Put back the old `else` branch (`setUser(JSON.parse(storedUser))`) |

## Verification

Headless Chrome on the branch's dev server, against a local mock of the API (fake data). The mock records whether each request carries the session cookie, and can return 401 or a chosen `check-session` answer.

| Check | Result |
| --- | --- |
| Log in, then use every tab: Configurations (with the StoreConnect panel), Integrations, Conversations (with the Live Map), Leads, Audience, Income | 42 requests to the API across 16 routes, every one with the cookie. That includes `GET /api/leads`, which had none before. No console errors. |
| A 401 from `/api/leads` | The stored user is cleared and the app goes to `/login` |
| `check-session` → `{ isAuthenticated: false }` | Cleared, `/login` |
| `check-session` → 500 | The user is kept and the dashboard stays |
| Log Out | `/login`, user cleared, and `POST /api/logout` sent with the cookie |

ESLint: no new problems. The touched files have the same counts as on `main`, where some already had errors or warnings. A production build into a scratch folder succeeds.

## Seen while doing this, not changed here

- **`VITE_CREATE_USER_TOKEN` is public.** It is inlined into the public JavaScript bundle on www.botwerx.ai: one 30-character value, 12 times. Anyone can read it, so the backend must never treat it as proof of identity on its own, and it should be rotated when the Bearer headers are removed.
