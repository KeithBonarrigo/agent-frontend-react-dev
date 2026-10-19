# Conversations tab: "StoreConnect customer" label, change and rollback log

Date: 2026-10-19. Keith asked for it.
- **The backend change (backend session):** `POST /admin/session-contacts` now merges the agent's verified StoreConnect customers into its response, keyed `web:web:<ip>`. Each comes with name, email, phone, `location`, and `storeconnect: true`.
- **This change:** marks those visitors in the Conversations list.

| What | Where |
| --- | --- |
| Branch | `feat/storeconnect-customer-badge`, from `main` at `1494af1` |
| Backup tag | `backup/pre-storeconnect-customer-badge-2026-10-19` → `1494af1` |

## Changes

| # | File | Before | After |
| --- | --- | --- | --- |
| 1 | `src/components/ConversationsTab.jsx`, user row header | `User: <id> — <name>` and the online dot | Adds a `.contact-sc-badge` label after the name when the matched contact has `storeconnect: true`. Its tooltip is `storeconnectCustomerHint`. |
| 2 | `src/components/Tabs.css` | none | `.contact-sc-badge`: a pill in the StoreConnect level's teal (`#1f7a7c` text on `#e6f4f4`), 11px, bold, no wrap |
| 3 | `src/components/Tabs.css`, at ≤600px | The user row header stayed on one line, so on phones the label was cut off ("StoreCo…") | `.user-header` wraps (4px row gap), and so do its left side and `.user-stats` |
| 4 | `src/locales/{en,es}/conversations.json`, after `user` | none | `storeconnectCustomer`: "StoreConnect customer" / "Cliente StoreConnect". `storeconnectCustomerHint`: "Verified in the chat as a customer of this StoreConnect store" / "Verificado en el chat como cliente de esta tienda StoreConnect". |

Rows without `storeconnect` look exactly as before.

## Rollback

| Undo | How |
| --- | --- |
| After merge | `git revert -m 1 <merge-commit>` through a PR |
| From the tag | `git checkout backup/pre-storeconnect-customer-badge-2026-10-19 -- src/components/ConversationsTab.jsx src/components/Tabs.css src/locales/en/conversations.json src/locales/es/conversations.json` |
| Label only | Remove the `{contact?.storeconnect && …}` line. The phone wrap rule can stay. |

## Verification

Headless Chrome on the dev server, against a mock of the backend. It serves two web visitors:
- one with `storeconnect: true`, located in La Paz, MX, and online;
- one ordinary named visitor, in San Diego.

Results:
- **Desktop:** the StoreConnect visitor's row reads "User: 203.0.113.29 — Keith", then the teal "StoreConnect customer" label (with tooltip) and the online dot. The other row has no label.
- **Spanish:** "Cliente StoreConnect", with the Spanish tooltip.
- **Phone (390px):** the row wraps onto lines for the ID and name, then the label and dot, then email and location, then the counts. The label sits fully inside the row, and nothing scrolls sideways.
- **Live Map:** both visitors are plotted, and the StoreConnect one shows as online.
- **Console:** no errors apart from the Facebook SDK's "can't run on http pages" message, which only appears on the plain-http dev server.

ESLint on `ConversationsTab.jsx` shows the same 2 warnings as on `main`. A production build into a scratch folder succeeds.

Seen on phones, not changed here: the message rows under each user are squeezed so narrow that messages print one character per line. That predates this change.
