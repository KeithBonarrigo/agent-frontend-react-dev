# WhatsApp Embedded Signup: looser submit guard, verbatim errors, two-step PIN step, change and rollback log

Date: 2026-10-29. Meta approved BotWerx's WhatsApp permissions, and the backend session (mercedes) asked for these dashboard changes (`mercedes/INSTRUCTIONS/embedded-signup/FRONTEND_HANDOFF.md` tasks 2–4, plus the new PIN case). Keith approved the plan.

| What | Where |
| --- | --- |
| Branch | `feat/wa-embedded-signup-pin`, from `main` at `34a15ff` |
| Backup tag | `backup/pre-wa-embedded-signup-pin-2026-10-29` → `34a15ff` |

## Verified, no change needed

- The deployed bundle (`index-CHN7sloJ.js`) has `appId:"2332112080635302"` and `config_id:"791013887350652"`, so `VITE_FB_APP_ID` and `VITE_WA_CONFIG_ID` are set in Railway. `.env.development` has the same values.
- The backend's `whatsapp-register-pin` route wasn't on any mercedes branch when this was written; the backend session said it lands the same day. The dashboard's 409 path stays dormant until the backend sends it.

## Changes

### #1 `src/components/IntegrationsTab.jsx`, `handleWhatsAppEmbeddedSignup`

| | Before | After |
| --- | --- | --- |
| Submit guard | Refused to POST unless `code`, `sessionInfo.phone_number_id` and `sessionInfo.waba_id` were all present ("Embedded signup incomplete — missing session info") | POSTs as soon as `code` is present. `phone_number_id` and `waba_id` are added only when the popup's `WA_EMBEDDED_SIGNUP` message supplied them. The backend finds both from the code. |
| Missing code (popup closed) | same message | `whatsapp.connectError` ("Failed to connect WhatsApp. Please try again.") |
| Response parsing | `res.json()` threw on a non-JSON body | `readJson`: JSON when possible, else `data: null`; the error then reads `whatsapp.signupFailed` ("Failed to complete WhatsApp signup (HTTP 502).") |
| Backend errors | `data.error` shown | unchanged: 400 "Could not determine a WhatsApp Business Account…", 400 "No WhatsApp phone number found…", 502 "Failed to subscribe…" show verbatim |
| 409 `pin_required` | treated as an error | `wspPinNeeded = { phone_number }`; the card shows the PIN step (#3). No error. |
| Success | inline | `markWhatsAppConnected(phone)`: status active, number shown, success banner, `onClientUpdate`, localStorage |

### #2 New `handleRegisterPin`, `cancelPinStep`

- Local check: exactly 6 digits, else `whatsapp.pinRequiredInvalid`. No request.
- `apiFetch` `POST /api/clients/:id/whatsapp-register-pin` `{ pin }` (session cookie included).
- 200 `{ success, phone_number }` → `markWhatsAppConnected`. Any error → its `error` text verbatim, the PIN field stays for a retry.
- Start over clears the PIN state and shows Connect WhatsApp again.

### #3 PIN step markup (WhatsApp card, between the connected and not-connected branches)

Title "Almost done: this number has two-step verification", "Connected number: +…", a 6-digit password input (`inputMode="numeric"`, `autoComplete="one-time-code"`, digits only), the helper "Enter the two-step verification PIN set for this number in WhatsApp Manager.", a green "Register number" button with a spinner while saving, and a "Start over" link.

### #4 Strings (`src/locales/{en,es}/integrations.json`, under `whatsapp`, all new)

`pinRequiredTitle`, `pinRequiredNumber` ({{number}}), `pinRequiredLabel`, `pinRequiredHelper`, `pinRequiredInvalid`, `pinRegister`, `pinRegistering`, `pinStartOver`, `signupFailed` ({{status}}). English and Spanish; the existing `pinLabel`/`pinHelper` belong to the old manual flow and are untouched.

### Not changed

The old manual register/verify flow (commented-out code and its strings) stays until Embedded Signup has worked once in production, as the backend asked. `loadFacebookSdk.js`, `apiFetch.js`, the Messenger and Instagram cards.

## Rollback

| Undo | How |
| --- | --- |
| After merge | `git revert -m 1 <merge-commit>` through a PR |
| From the tag | `git checkout backup/pre-wa-embedded-signup-pin-2026-10-29 -- src/components/IntegrationsTab.jsx src/locales/en/integrations.json src/locales/es/integrations.json` |
| PIN step only | Remove the `wspPinNeeded ? (…)` branch, `handleRegisterPin`, `cancelPinStep` and the two state variables; make the 409 case throw like other errors |

Reverting this brings back the strict guard, which blocks a signup whenever the popup's session-info message is lost.

## Verification

Headless Chrome on the dev server (`VITE_API_URL=http://localhost:3999`) against a mock of the two routes (scratchpad `visual/mock-api-wa.mjs`). Meta's popup can't run headless, so a fake `window.FB` was injected before the page loaded (`loadFacebookSdk` reuses an existing `window.FB`); its `login` dispatches the `WA_EMBEDDED_SIGNUP` message (or not) and calls back with a code.

| Case | Result |
| --- | --- |
| Popup with session info | Body `{ code, phone_number_id, waba_id }` with the session cookie; `FB.login` called with `config_id 791013887350652`, `response_type: 'code'`, `sessionInfoVersion '3'`. Card: Connected, number shown, success banner. |
| Popup without session info | Body `{ code }` only; still submits and connects (the old guard refused). |
| Popup cancelled | No request; "Failed to connect WhatsApp. Please try again." |
| 400 no WABA / 400 no number / 502 subscribe failed | Each backend text shown verbatim; Connect WhatsApp stays available |
| 502 with an HTML body | "Failed to complete WhatsApp signup (HTTP 502)." |
| 409 `pin_required` | PIN step with "Connected number: +5216121234567" |
| 5-digit PIN | "Enter the 6-digit PIN.", no request |
| Wrong PIN | `{ pin: "000000" }` sent with the cookie; backend's "Incorrect PIN…" shown; field stays |
| Right PIN | `{ pin: "123456" }`; card Connected, success banner, `localStorage` `integrations_101` = active + number |
| Start over | Back to Connect WhatsApp |
| Spanish | "Registrar número", "Empezar de nuevo", Spanish helper |
| Phone (390px) | PIN step fits; no sideways scroll |
| Console | No errors |

ESLint on `IntegrationsTab.jsx`: 5 errors and 2 warnings, the same as on `main` (unused variables and hook deps that predate this). A production build into a scratch folder succeeds.

## Follow-up: resume after a reload (same day, second PR)

| What | Where |
| --- | --- |
| Branch | `feat/wa-signup-resume`, from `main` at `2bdd6f3` (after PR #31) |
| Backup tag | `backup/pre-wa-signup-resume-2026-10-29` → `2bdd6f3` |

The backend session confirmed that `GET /api/account/:id/clients` carries each agent's `wsp_status` during a signup: `registering` → `active`, or it stops at `pin_required` or `registration_failed`. The backend's PIN route has been live since 2026-10-29 19:01 UTC (`7d54e23`).

| # | Change | Detail |
| --- | --- | --- |
| 5 | Resume from `wsp_status` | A new effect on `user.wsp_status` / `user.office_wsp_phone`: `pin_required` → the PIN step with the number; `registration_failed` → the retry step; `active` + number → connected; anything else clears the PIN step. The server status wins over the localStorage copy. |
| 6 | Retry step | Title "Registration didn't finish", the number, helper text, **Retry registration** (POSTs `{}` to `whatsapp-register-pin`; the backend retries with the PIN it stored), **Enter the PIN instead** (switches to the PIN field) and **Start over**. If the retry fails, its error shows and the PIN field appears. |
| 7 | 409 keeps the agent list in step | After `pin_required`, `onClientUpdate({ wsp_status: 'pin_required', office_wsp_phone })`, so the Dashboard's copy of the agent matches and a tab switch comes back to the PIN step. |
| 8 | Strings (`whatsapp.*`, en/es) | `regFailedTitle`, `regFailedHelper`, `regRetry`, `regRetrying`, `regEnterPin` |

Rollback of the follow-up alone: `git checkout backup/pre-wa-signup-resume-2026-10-29 -- src/components/IntegrationsTab.jsx src/locales/en/integrations.json src/locales/es/integrations.json`.

Verification (mock-backed dev server, headless Chrome; the mock sets `wsp_status` on the agent row and answers an empty-body retry with success or the PIN-mismatch text):

| Case | Result |
| --- | --- |
| Load with `pin_required` | PIN step with "+5216121234567"; the right PIN → connected (`{ pin }` sent) |
| Load with `registration_failed`, retry succeeds | Retry step; `{}` sent; connected |
| Retry answers the mismatch text | Error shown, PIN field appears; the right PIN → connected |
| Enter the PIN instead / Start over | PIN field / Connect WhatsApp |
| No status, `active` | Connect WhatsApp / Connected, as before |
| Spanish | "El registro no terminó", "Reintentar registro", "Escribir el PIN", "Empezar de nuevo" |
| First PR's checks, rerun | All still pass |

ESLint unchanged from `main`; production build succeeds.

**Still to do, by Keith, with the real SIM:** Integrations → Connect WhatsApp → Meta's popup → either Connected or the PIN step → send a WhatsApp message to the number and get a reply. Then Disconnect and confirm the `wsp_*` columns clear.
