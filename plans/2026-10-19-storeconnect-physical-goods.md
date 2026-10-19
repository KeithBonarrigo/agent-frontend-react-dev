# StoreConnect panel: assistant settings, Sync now on phones, chat sign-up point, change and rollback log

Date: 2026-10-19.
- **Requests:**
  - The physical-goods switch and the plan-page point were requested by the backend session (`mercedes`).
  - Keith approved the API-key field and the coupon switch, and asked for Sync now to be fixed on phones.
- **Backend:** live, in `endpointRoutes/storeConnect.js`.
  - Settings and API-key routes, plus the status fields.
  - Base-URL auto-detection and `api_base_url` in the responses, deploying on 2026-10-19 per the backend session.
  - Chat sign-up in commit `07e0bfc`.

| What | Where |
| --- | --- |
| Branch | `feat/storeconnect-physical-goods`, from `main` at `2fac381` (PR #26) |
| Backup tag | `backup/pre-storeconnect-physical-toggle-2026-10-19` → `2fac381` |

## Changes

### #1 Assistant settings box (`src/components/StoreConnectSetup.jsx`, ready state)

| Before | After |
| --- | --- |
| One white box: store, last sync, products, content, then Sync now and Disconnect | The same box, plus a second one below it, "Assistant settings": the coupon switch (#2), then "In-chat ordering" (#3) with the physical-goods switch (#4) |

- **Switches:** both use a shared `SettingSwitch` component.
  - Styles: the existing `.toggle-switch` and `.toggle-knob` in `Tabs.css`, unused since the Add-Ons tab was removed.
  - Screen readers: `role="switch"`, `aria-checked`, a `<label for>`, and the help text through `aria-describedby`.
  - On phones the text drops below the switch.
- **Saving:** one handler, `saveSetting`, sends `PUT /api/clients/:id/storeconnect/settings` with one key at a time.
  - The request goes through the panel's `api()` helper, so it uses `credentials: 'include'`.
  - While saving, the switch is disabled and shows a spinner.
  - On success it takes the `settings` from the response and shows a banner. On failure it shows the backend's error and stays as it was.
- **Header comment:** lists the settings and API-key routes and the new status fields.

### #2 "Share coupon codes in chat"

- Bound to `status.share_coupon_codes` and saved as `{ share_coupon_codes }`. It defaults to off.
- Help text: "Off: the assistant mentions automatic deals only. On: it may quote coupon codes from your promotions."
- It shows for every connected store; it doesn't need an API key.

### #3 In-chat ordering (the store's Commerce API key)

- **Status pill:** On or Off, from `status.in_chat_payment`.
- **Help text:** the merchant creates the key themselves. In Salesforce, they add a Store Variable named `api.auth_key`, with a long random value, to the Store record, then paste that value here. No StoreConnect support is needed.
- **Off:** an "Add API key" button opens the form:
  - API key: a password field.
  - API base URL: optional and blank. Its placeholder reads "Detected automatically. Fill in only if your store's API lives elsewhere."
- **Save:** sends `PUT /api/clients/:id/storeconnect/api-key` with `{ api_key }`, plus `api_base_url` only when filled in.
  - An empty key is caught in the browser and never sent, because an empty key would remove the saved one.
  - Success: the banner names the store the API answered for ("API key saved for Acme Outdoors. In-chat ordering is on."). The detected `api_base_url` is shown.
  - Errors: `invalid_key`, `api_unreachable` and `choose_store_first` have their own messages, followed by "Tried: <urls>" from the response.
- **On:** "Store API: <api_base_url>" from the status, with two links:
  - Replace key: the form, with an "In use now: <url>" hint.
  - Remove key: after a confirm, sends `{ api_key: "" }`.
- The key is never shown or stored by the dashboard.

### #4 "Allow physical goods in chat orders" (first commit; moved in #1)

- Bound to `status.api_checkout_physical` and saved as `{ api_checkout_physical }`.
- It shows only while in-chat ordering is on, so it now sits inside the In-chat ordering section.
- Help text: the backend session's wording.

### #5 Sync now on phones (`StoreConnectSetup.jsx`, `src/components/Tabs.css`)

- **Before:** the dashboard's nested padding left the panel's white box only about 166px of content width on a 390px phone (136px at 360, 100px at 320). As a result:
  - "Sync now", and in Spanish "Sincronizar ahora" at 375px and narrower, wrapped onto two lines inside the button.
  - At 320px both buttons stuck out of the box.
  - The info grid's 220px minimum column overflowed the box at every phone width.
  - The panel heading ran past the card.
- **After:**

| Rule | Before | After |
| --- | --- | --- |
| Info grid (`gridStyle`) | `minmax(220px, 1fr)` | `minmax(min(220px, 100%), 1fr)`: one column that fits the box on phones. The step 1 form uses the same grid. |
| White boxes | inline `padding: 1em` | class `.sc-box`, `padding: 1em`. 0.75em at ≤600px. |
| Panel (`.sc-setup.section`) at ≤600px | 2em padding | 1em |
| Action rows (`.sc-actions`) at ≤600px | buttons side by side, wrapping | stacked at full width, label centred |
| Panel heading (`.sc-setup .section-title`) at ≤600px | logo and title on one line, which ran past the card | wraps |

All of these rules are scoped to the StoreConnect panel (`.sc-setup`). The other dashboard tabs are unchanged.

### #6 Text (`src/locales/{en,es}/configurations.json`)

All keys are new; no existing key changes. The en and es keys match (119 under `storeconnect`).

| Group | Keys | en |
| --- | --- | --- |
| `storeconnect.ready` | `physical`, `physicalHelp`, `physicalOn`, `physicalOff` | Allow physical goods in chat orders / The store's API doesn't price shipping, … / Saved. Chat orders can now include physical goods. / Saved. Chat orders cover digital and virtual products only. |
| `storeconnect.ready` | `settings`, `coupons`, `couponsHelp`, `couponsOn`, `couponsOff` | Assistant settings / Share coupon codes in chat / Off: the assistant mentions automatic deals only. On: … / Saved. The assistant may quote coupon codes … / Saved. The assistant mentions automatic deals only. |
| `storeconnect.ordering` (new group, after `ready`) | `title`, `on`, `off`, `help`, `add`, `key`, `baseUrl`, `baseUrlPlaceholder`, `inUse`, `save`, `saving`, `cancel`, `apiUrl`, `replace`, `remove`, `removing`, `confirmRemove`, `saved`, `savedFor`, `removed`, `tried` | In-chat ordering / On / Off / … / Add API key / … / Tried: {{urls}} |
| `storeconnect.errors` | `api_key_required`, `invalid_key`, `api_unreachable`, `choose_store_first` | Enter the API key. / The store didn't accept that key. … / Couldn't reach your store's API. … / Choose your store first. |

The full values are in the two files. The Spanish uses the panel's informal tú and its existing terms ("clave de API", "variable de tienda").

### #7 StoreConnect Bot tab, "For your customers" (`storeconnectBot.customers.items` in `src/locales/{en,es}/homev3.json`)

The list goes from 5 points to 6. The new point sits between "Balances" and "Secure by design", next to the verification point.

| | Title | Text |
| --- | --- | --- |
| en | New customers can sign up in the chat: | verify an email, give a name, and the account exists in StoreConnect (for stores with an API key). |
| es | Los clientes nuevos pueden registrarse en el chat: | verifican un correo electrónico, dan su nombre y la cuenta queda creada en StoreConnect (para tiendas con clave de API). |

The wording is the backend session's. The dash became a colon to match the list's "Title: text" style. The API-key qualifier comes from its note.

## Rollback

| Undo | How |
| --- | --- |
| Everything, after merge | `git revert -m 1 <merge-commit>` through a PR. Railway redeploys. |
| From the tag | `git checkout backup/pre-storeconnect-physical-toggle-2026-10-19 -- src/components/StoreConnectSetup.jsx src/components/Tabs.css src/locales/en/configurations.json src/locales/es/configurations.json src/locales/en/homev3.json src/locales/es/homev3.json` |
| The settings box only | In `StoreConnectSetup.jsx`, remove the "Ready: assistant settings" box and its state and handlers. The new keys can stay unused. |
| The phone layout only | Delete the "StoreConnect panel" block in `Tabs.css` and set `gridStyle` back to `minmax(220px, 1fr)`. Then put `padding: '1em'` back in the sync box's inline style, since `.sc-box` would no longer pad it. |
| The plan-page point only | Remove the new item from `storeconnectBot.customers.items` in both `homev3.json` files. |

The settings live in the backend. Reverting the frontend doesn't change any merchant's saved coupon setting, physical-goods setting or API key.

## Verification

Headless Chrome on the branch's dev server, against a local mock of the backend contract (fake data, nothing real called). The mock validates like `endpointRoutes/storeConnect.js` and returns `api_base_url` and `tried` like the new backend.

| Check | Result |
| --- | --- |
| Ready, no key | Assistant settings with the coupon switch off, In-chat ordering "Off", "Add API key". No physical-goods switch. |
| Coupon switch (by the switch, then by its label) | `PUT …/settings` `{"share_coupon_codes":true}` then `false`, sent with the session cookie, with the right banners |
| Empty key | "Enter the API key." No request sent. |
| Rejected key | `PUT …/api-key` `{"api_key":"bad-key"}` with no base URL, so the backend detects it. Shows the `invalid_key` message plus "Tried: https://api.shop.acme.example/v1". The form stays open. |
| Unreachable, explicit URL | The body includes `api_base_url`. Shows the `api_unreachable` message plus that URL. |
| Good key, blank URL | Pill "On", "API key saved for Acme Outdoors. In-chat ordering is on.", "Store API: https://api.shop.acme.example/v1", Replace key and Remove key on one row, the physical-goods switch shown |
| Reload | Everything restored from the status |
| Replace key, then Cancel | Form with "In use now: …", then back |
| Physical-goods switch | `{"api_checkout_physical":true}`, saved |
| Remove key | Confirm dialog, then `{"api_key":""}`. Pill "Off", banner, physical-goods switch hidden. |
| Physical-goods checks (first commit), run again | Hidden without a key. On, reload and off by its label all work. A 500 shows the error. Phone and Spanish work. |
| Spanish | Every new string switches |
| Phones: 430, 390, 375, 360 and 320px; English and Spanish; idle and syncing | Sync now, Syncing… and Disconnect fill the box width on one line (40px tall) and stay inside it. The info grid doesn't overflow. The heading stays inside the card. No sideways scroll. |
| Plan page | 6 points, the new one 5th, in English and Spanish |
| Console | No errors |

The one exception on phones: at 320px in Spanish, while a sync runs, "Sincronizando..." is a single word 11px wider than the box (147px vs 136px). "Sincronizar ahora" wraps onto two centred lines at that width.

ESLint is clean on `StoreConnectSetup.jsx`, and a production build into a scratch folder succeeds.
