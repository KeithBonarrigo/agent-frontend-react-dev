# StoreConnect: physical goods toggle and chat sign-up point, change and rollback log

Date: 2026-10-19. Requested by the backend session (`mercedes`), which says Keith approved it. The backend is already live:
- the settings route and status fields in `endpointRoutes/storeConnect.js`;
- chat sign-up in commit `07e0bfc`, on `origin/master`.

| What | Where |
| --- | --- |
| Branch | `feat/storeconnect-physical-goods`, from `main` at `2fac381` |
| Backup tag | `backup/pre-storeconnect-physical-toggle-2026-10-19` → `2fac381` |

## Changes

### #1 Dashboard switch (`src/components/StoreConnectSetup.jsx`)

| Before | After |
| --- | --- |
| Ready block: store, last sync, products, content, then Sync now and Disconnect | The same, plus a switch below the buttons, after a divider, when `status.in_chat_payment` is true: "Allow physical goods in chat orders", with helper text |

- **What it shows:** the switch reflects `status.api_checkout_physical`. Clicking the switch or its label sends `PUT /api/clients/:id/storeconnect/settings` with `{ api_checkout_physical: true|false }`. The request goes through the panel's shared `api()` helper, so it uses `credentials: 'include'`.
- **While saving:** the switch is disabled and shows a spinner.
- **On success:** it takes the `settings` from the response and shows a banner.
- **On failure:** it shows the backend's error and stays as it was.
- **Styles:** the existing `.toggle-switch` and `.toggle-knob` classes in `Tabs.css`. Nothing used them since the Add-Ons tab was removed.
- **Phones:** the row wraps (the text has a 220px flex basis). The dashboard's nested padding leaves the panel only 166px of content width on a 390px phone, so the text drops below the switch instead of squeezing into a 92px column.
- **Screen readers:** `role="switch"` with `aria-checked`, a `<label for>`, and the helper text through `aria-describedby`.
- **Header comment:** now lists the settings route and the new status fields.

### #2 Dashboard text (`src/locales/{en,es}/configurations.json`, under `storeconnect.ready`)

| Key | en | es |
| --- | --- | --- |
| `physical` | Allow physical goods in chat orders | Permitir productos físicos en los pedidos por chat |
| `physicalHelp` | The store's API doesn't price shipping, so chat orders normally cover digital/virtual products only. Turn this on if shipping is free, flat-rate or pickup. | La API de la tienda no calcula el envío, así que los pedidos por chat normalmente solo incluyen productos digitales o virtuales. Actívalo si el envío es gratis, de tarifa fija o con recogida en tienda. |
| `physicalOn` | Saved. Chat orders can now include physical goods. | Guardado. Los pedidos por chat ahora pueden incluir productos físicos. |
| `physicalOff` | Saved. Chat orders cover digital and virtual products only. | Guardado. Los pedidos por chat solo incluyen productos digitales o virtuales. |

All four keys are new; no existing key changes.

### #3 StoreConnect Bot tab, "For your customers" (`storeconnectBot.customers.items` in `src/locales/{en,es}/homev3.json`)

The list goes from 5 points to 6. The new point sits between "Balances" and "Secure by design", next to the verification point.

| | Title | Text |
| --- | --- | --- |
| en | New customers can sign up in the chat: | verify an email, give a name, and the account exists in StoreConnect (for stores with an API key). |
| es | Los clientes nuevos pueden registrarse en el chat: | verifican un correo electrónico, dan su nombre y la cuenta queda creada en StoreConnect (para tiendas con clave de API). |

The wording is the backend session's. The dash became a colon to match the list's "Title: text" style. The API-key qualifier comes from its note that the feature applies to stores with an API key.

## Not in the dashboard yet

- **API key:** there's no field for the store's API key (`PUT …/storeconnect/api-key`). Only that key makes `in_chat_payment` true, so the new switch appears only for agents whose key was saved some other way.
- **Coupon toggle:** there's no coupon-code switch (`share_coupon_codes`) either. The request called the settings route "the same route as the coupon toggle", but the backend has that route and the frontend never had a coupon switch.

## Rollback

| Undo | How |
| --- | --- |
| Everything, after merge | `git revert -m 1 <merge-commit>` through a PR. Railway redeploys. |
| The switch only | In `StoreConnectSetup.jsx`, remove the `{status.in_chat_payment && (…)}` block, `savePhysical` and `physicalSaving`. The `ready.physical*` keys can stay unused. |
| The plan-page point only | Remove the new item from `storeconnectBot.customers.items` in both `homev3.json` files. |
| From the tag | `git checkout backup/pre-storeconnect-physical-toggle-2026-10-19 -- src/components/StoreConnectSetup.jsx src/locales/en/configurations.json src/locales/es/configurations.json src/locales/en/homev3.json src/locales/es/homev3.json` |

The setting itself lives in the backend and defaults to off. Turning the switch off stores `api_checkout_physical: false`. Reverting the frontend doesn't change a merchant's saved setting.

## Verification

Headless Chrome on the branch's dev server, against a local mock of the backend contract (fake data, nothing real called). The mock's settings route validates like `endpointRoutes/storeConnect.js`.

| Check | Result |
| --- | --- |
| Ready, no API key (`in_chat_payment: false`) | No switch |
| Ready, API key saved | Switch shown, off. Its label and description come from the new strings, so screen readers announce both. |
| Click the switch | `PUT /api/clients/101/storeconnect/settings` with `{"api_checkout_physical":true}`, sent as JSON with the session cookie (so `credentials: 'include'` works). The switch turns on, and the banner reads "Saved. Chat orders can now include physical goods." |
| Reload | Still on (from the status) |
| Click the label | Sends `false`. The switch turns off, and the "digital and virtual products only" banner shows. |
| Save fails (500) | The banner shows the backend's error, and the switch stays as it was |
| Phone (390px) | Switch, then label and help text at full width. No sideways scroll. |
| Spanish | Label, help text and saved banner switch |
| StoreConnect Bot tab | "For your customers" has 6 points, with the new one 5th, in English and Spanish. No sideways scroll. |
| Console | No errors |

ESLint is clean on `StoreConnectSetup.jsx`, and a production build into a scratch folder succeeds.

Seen on phones but not changed (it was already like this): the panel's heading, "Connect your StoreConnect store", runs past the right edge of the card.
