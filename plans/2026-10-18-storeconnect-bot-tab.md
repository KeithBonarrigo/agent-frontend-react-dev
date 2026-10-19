# StoreConnect Bot tab, change and rollback log

Date: 2026-10-18. Home page (`/`). The StoreConnect Store Assistant moves from a section on the
Botwerx tab to its own tab, and two tabs are renamed.

| What | Where |
| --- | --- |
| Branch | `feat/storeconnect-bot-tab`, from `main` at `a9ae1ae` |
| Backup tag | `backup/pre-storeconnect-bot-tab-2026-10-18` → `a9ae1ae` |

## Changes

### #1 Tabs (`TABS` in `src/Pages/HomeV3.jsx`; `tabs` in `src/locales/{en,es}/homev3.json`)

| Tab (URL) | Before | After (en) | After (es) |
| --- | --- | --- | --- |
| `?tab=bidconnect` | BidConnect | BidConnect | BidConnect |
| `?tab=storeconnect` | StoreConnect | StoreConnect Services | Servicios StoreConnect |
| `?tab=storeconnect-bot` | (new) | StoreConnect Bot | StoreConnect Bot |
| `?tab=botwerx` | BotwerxBot | BotWerx Bot | BotWerx Bot |

The existing tabs keep their URLs, so old links still work.

### #2 The StoreConnect Bot tab (`StoreConnectBotContent` in `HomeV3.jsx`)

- **Hero**, left side, top to bottom:
  - The StoreConnect logo on a white chip, with a "Store Assistant" label. The logo's dark "store" disappears on navy, hence the chip.
  - The headline "Your StoreConnect store, answered 24/7."
  - The intro.
  - A checklist of the nine features.
- **Hero**, right side: the live SignupForm with `allowedLevels={['storeconnect']}`, so it offers only the StoreConnect plan. The MLS agent page limits the form the same way.
- **What it does** (`#hv3-scb-features`): the nine feature cards and the full-width setup card. Get started scrolls to the form.
- **`#hv3-scb-customers`**, on a band: "For your customers", "It understands your store" and Coming soon.
- **Header and footer links:** Home, What it does, For your customers.

### #3 BotWerx Bot tab

- A one-line banner replaces the Store Assistant section, in the same place (after the carousel,
  above Additional Benefits).
  - It shows the logo, "Store Assistant", "Your StoreConnect store, answered 24/7." and "See the
    StoreConnect Bot →".
  - Clicking it switches to the new tab and scrolls to the top.
- StoreConnect stays in this tab's sign-up plan list.
- Removed: `StoreAssistantSection`, `STORE_ASSISTANT_FEATURES` and `chooseSignupPlan`. The new
  tab's form offers only StoreConnect, so nothing needs to pick the plan.

### #4 Text (`homev3.json`, en and es)

- `botwerx.storeAssistant` moves to a new top-level `storeconnectBot` block, containing:
  - `hero`: label, title, titleEm, intro.
  - `features`: title, cta, items.
  - `customers`, `storeAware`, `comingSoon` and `promo.link`.
- The section's copy is unchanged. Its old lead line is now the hero headline (`title` + `titleEm`).
- New keys: `nav.whatItDoes`, `nav.forCustomers` and `tabs.storeconnect-bot`. The en and es keys match.

### #5 Styles (`src/styles/HomeV3.css`)

| Rule | Before | After |
| --- | --- | --- |
| `.hv3-tabs` max-width | 760px | 1000px |
| `.hv3-tab` | `flex:1`, padding 18px 28px | `flex:1 1 auto` (sized to the label), padding 18px 22px |
| Tab bar media rules | none | 1000px and below: two rows of two. 640px and below: labels may wrap inside their tab |
| `.hv3-sa-head`, `.hv3-sa-lead` | The old section's heading block | Removed |
| `.hv3-sa-cols` | margin-top 18px | No margin (first item in its section) |
| `.hv3-sa-panel` | `--hv3-bg-2` background, `--hv3-line` border | `--hv3-bg-card` background, `--hv3-line-2` border (they now sit on the band) |
| New `hv3-scb-*` rules | none | Logo chip, hero brand row and checklist, and the BotWerx Bot banner |

### #6 and #7 Sign-up heading and checklist indent (follow-up PR)

| What | Where |
| --- | --- |
| Branch | `feat/storeconnect-signup-title`, from `main` at `5de1682` |
| Backup tag | `backup/pre-storeconnect-signup-title-2026-10-18` → `5de1682` |

| # | Change | Before | After |
| --- | --- | --- | --- |
| 6 | Sign-up form heading on the StoreConnect Bot tab | "Start an Account and Build Your AI Agent in 30 Seconds" (es: "Crea una Cuenta y Construye tu Agente de IA en 30 Segundos") | "Start an Account and Build Your StoreConnect Agent in 30 Seconds" (es: "Crea una Cuenta y Construye tu Agente StoreConnect en 30 Segundos") |
| 7 | Hero checklist (`.hv3-sa-list.hv3-scb-checks`) | Flush with the intro | `padding-left:16px` |

How #6 works:
- `SignupForm` takes an optional `title` prop: `<h2>{title || t('title')}</h2>`.
- Only the StoreConnect Bot tab passes one, from `storeconnectBot.hero.signupTitle`.
- Every other sign-up form, the BotWerx Bot tab's included, keeps `signup.json`'s title.

## Rollback

| Undo | How |
| --- | --- |
| #6 and #7 only | Revert the follow-up PR's merge. Or remove the `title` prop in `StoreConnectBotContent` and the `padding-left`. |
| Everything, after merge | `git revert -m 1 <merge-commit>` through a PR. Railway redeploys. |
| Everything, from the tag | `git checkout backup/pre-storeconnect-bot-tab-2026-10-18 -- src/Pages/HomeV3.jsx src/styles/HomeV3.css src/locales/en/homev3.json src/locales/es/homev3.json` |
| Tab names only | Edit `tabs` in both `homev3.json` files |

## Verification

Headless Chrome on the branch's dev server:

- **Tab bar:** one row at 1001px and wider, two rows of two at 1000px and below and on phones.
  Checked at 1366, 1100, 1024, 1001, 1000 and 800px and phone width. No label is cut off, and
  nothing scrolls sideways.
- **StoreConnect Bot tab**, at 1366px and phone width:
  - The logo loads, and the checklist has 9 items.
  - The plan list has only `storeconnect`, and the StoreConnect hint shows.
  - 10 cards: 3 columns with the setup card full width on desktop, 1 column on phones.
  - Both panels and Coming soon are present, and every icon renders.
  - Get started scrolls to the form.
- **BotWerx Bot tab:**
  - The order is hero, carousel, banner, Additional Benefits, FAQ.
  - The old section is gone, and StoreConnect is still in the plan list.
  - The banner opens the new tab at the top (`?tab=storeconnect-bot`).
- **StoreConnect Services tab:** new label, content unchanged.
- **Spanish:** the tab names, hero, headings, button and nav links all switch. No tab label is cut off.
- **Errors:** no console errors.
- **Build:** ESLint is clean, and a production build into a scratch folder succeeds.
