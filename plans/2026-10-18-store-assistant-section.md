# Botwerx Bot tab: StoreConnect Store Assistant section, change and rollback log

Date: 2026-10-18. Home page, Botwerx Bot tab (`/?tab=botwerx`). The section first went between
"Additional Benefits" and the FAQ (PR #17). #4 below moved it above "Additional Benefits".

| What | Where |
| --- | --- |
| Branch | `feat/store-assistant-section`, from `main` at `4227080` |
| Backup tag | `backup/pre-store-assistant-2026-10-18` → `4227080` |

## Changes

### #1 The section (`src/Pages/HomeV3.jsx`)

- `StoreAssistantSection`, with `STORE_ASSISTANT_FEATURES` (card keys and icons) and
  `chooseSignupPlan`. `BotwerxBotContent` renders it after the Services section, with section
  id `hv3-store-assistant`.
- It contains:
  - Label, title, lead line and intro.
  - Nine feature cards in the page's existing `.hv3-bw-card` style.
  - A full-width "Set up in about 10 minutes" card with a **Get started** button.
  - "For your customers" and "It understands your store" panels.
  - A "Coming soon" strip.
- **Get started** selects "StoreConnect Store Assistant" in the hero's sign-up form, then
  scrolls to the form.
  - `SignupForm.jsx` is not edited. The plan dropdown gets its value through the same change
    event a visitor's choice fires.
  - If the form is past the plan step, the button only scrolls.
- No header nav link. "Store Assistant" wrapped onto two lines at 1001–1150px, and the Spanish
  label is longer still.

### #2 Styles (`src/styles/HomeV3.css`)

New `hv3-sa-*` rules, placed after `.hv3-bw-cta`.

| Rule | What it does |
| --- | --- |
| `.hv3-sa-head`, `.hv3-sa-lead` | Wider heading block (760px). The lead line is larger and white. |
| `.hv3-sa-setup` | The setup card spans the whole grid, with the button on the right. Blue border and gradient. At 1000px and narrower it is a normal card with the button below. |
| `.hv3-sa-cols`, `.hv3-sa-panel`, `.hv3-sa-list` | Two panels side by side (stacked at 1000px and narrower). The lists use teal check marks. |
| `.hv3-sa-soon` | Dashed box, muted text and an amber "Coming soon" tag, so these never read as available today. |

### #3 Text (`src/locales/en/homev3.json`, `src/locales/es/homev3.json`)

A new `botwerx.storeAssistant` block between `botwerx.services` and `botwerx.faq`.

- English is the supplied copy, word for word.
- Spanish is a translation. It reuses the sign-up form's terms: "Asistente de Tienda
  StoreConnect", "org de Salesforce", "panel".
- The en and es keys match.

### #4 Moved above "Additional Benefits" (follow-up PR)

| What | Where |
| --- | --- |
| Branch | `feat/store-assistant-above-benefits`, from `main` at `5e2cd87` |
| Backup tag | `backup/pre-store-assistant-move-2026-10-18` → `5e2cd87` |

One line moved in `BotwerxBotContent` (`src/Pages/HomeV3.jsx`). Nothing else changed.

| | Order of the Botwerx tab's sections |
| --- | --- |
| Before | Hero and sign-up, carousel, Additional Benefits, **Store Assistant**, FAQ |
| After | Hero and sign-up, carousel, **Store Assistant**, Additional Benefits, FAQ |

## Rollback

| Undo | How |
| --- | --- |
| Only the move (#4) | Put `<StoreAssistantSection t={t} />` back after the Services section, or revert #4's merge. |
| Hide the section | Delete `<StoreAssistantSection t={t} />` in `BotwerxBotContent`. The rest goes unused. |
| Everything, after merge | `git revert -m 1 <merge-commit>` through a PR. Railway redeploys. |
| Everything, from the tag | `git checkout backup/pre-store-assistant-2026-10-18 -- src/Pages/HomeV3.jsx src/styles/HomeV3.css src/locales/en/homev3.json src/locales/es/homev3.json` |

Use the revert, not the tag checkout, once PR #16 (white carousel) has merged. The tag predates
#16, so checking files out from it would also undo #16's changes in `HomeV3.css` and `homev3.json`.

## Verification

Headless Chrome on the branch's dev server:

- **Layout:** 10 cards at 1366, 1100, 1001, 1000 and 800px and phone width.
  - From 1001px: 3 columns, setup card full width.
  - 1000 and 800px: 2 columns.
  - Phones: 1 column.
- **Content:** every icon renders, and the lists hold 5, 4 and 3 items.
- **Clean:** no sideways scroll and no console errors.
- **Get started:** the plan changes from Basic to StoreConnect, the StoreConnect hint appears,
  and the page scrolls to the top of the form.
  - The site-wide `scroll-padding-top: 170px` on `<html>` leaves room above the form, the same
    as the login page's "Create Account" link (`#hv3-signup`).
- **Spanish:** the EN/ES toggle switches every string in the section.
- **Build:** ESLint is clean, and a production build into a scratch folder succeeds.
- **Merging:** the branch merges with PR #16 without conflicts. Neither PR edits lines the other
  touches.
