# Home page: StoreConnect Bot tab hidden, BotWerx Bot renamed to BotWerx Agent, change and rollback log

Date: 2026-11-19. Keith asked to hide the StoreConnect Bot tab "for now" and to rename the "BotWerx Bot" tab to "BotWerx Agent".

| What | Where |
| --- | --- |
| Branch | `feat/hide-storeconnect-bot-tab`, from `main` at `6b2b2b3` |
| Backup tag | `backup/pre-hide-storeconnect-bot-tab-2026-11-19` → `6b2b2b3` |

## Changes

| # | File | Before | After |
| --- | --- | --- | --- |
| 1 | `src/Pages/HomeV3.jsx` | `TABS = ['bidconnect', 'storeconnect', 'storeconnect-bot', 'botwerx']` | New `SHOW_STORECONNECT_BOT_TAB = false`; `storeconnect-bot` is in `TABS` only when it's `true`. `StoreConnectBotContent` and its text stay in the code. |
| 2 | `src/Pages/HomeV3.jsx`, BotWerx tab | The "See the StoreConnect Bot →" banner after the carousel | Rendered only when `SHOW_STORECONNECT_BOT_TAB` is `true` |
| 3 | `src/Pages/HomeV3.jsx`, `?tab=` handling | `?tab=storeconnect-bot` opened that tab | While hidden, it opens the BotWerx Agent tab (whose sign-up form still offers the StoreConnect plan). Other unknown values still fall back to BidConnect. |
| 4 | `src/locales/{en,es}/homev3.json`, `tabs.botwerx` | "BotWerx Bot" / "BotWerx Bot" | "BotWerx Agent" / "Agente BotWerx" |
| 5 | `src/styles/HomeV3.css`, tab bar at ≤1000px | Always two rows of two (made for four tabs) | That rule applies only when the bar has four tabs (`:has(>.hv3-tab:nth-child(4))`), so three tabs stay on one row |
| 6 | `src/styles/HomeV3.css`, tab bar at ≤480px | none | Two rows: two tabs, then the third spanning the row. Three tabs need about 390px on one row; on a 390px phone "BotWerx Bot" was cut off at the bar's edge. |

Not changed: the StoreConnect plan in the BotWerx Agent sign-up form, the StoreConnect Services tab, and the internal `BotwerxBotContent` name and older code comments.

## Rollback

| Undo | How |
| --- | --- |
| Show the tab again | Set `SHOW_STORECONNECT_BOT_TAB = true` in `HomeV3.jsx`. The tab, its banner and its links come back; the CSS handles four tabs as before. |
| Old tab name | Set `tabs.botwerx` back to "BotWerx Bot" in both `homev3.json` files |
| Everything, after merge | `git revert -m 1 <merge-commit>` through a PR |
| From the tag | `git checkout backup/pre-hide-storeconnect-bot-tab-2026-11-19 -- src/Pages/HomeV3.jsx src/styles/HomeV3.css src/locales/en/homev3.json src/locales/es/homev3.json` |

## Verification

Headless Chrome on the dev server, at 1366, 1000, 800, 640, 481, 480, 430, 390, 360 and 320px:

| Width | Tabs | Rows | Labels cut off |
| --- | --- | --- | --- |
| 481 and wider | BidConnect · StoreConnect Services · BotWerx Agent | 1 | none |
| 360–480 | same | 2 (third tab spans the second row) | none |
| 320 | same | 3 | none |

- No sideways scroll at any width.
- `?tab=storeconnect-bot` opens BotWerx Agent; the StoreConnect Bot content doesn't render.
- The BotWerx Agent tab has no StoreConnect banner, and its sign-up form still lists the StoreConnect plan.
- Spanish: BidConnect · Servicios StoreConnect · Agente BotWerx.
- Arrow keys cycle through the three tabs (Left from BidConnect → BotWerx Agent).
- No console errors. ESLint clean on `HomeV3.jsx`; production build succeeds.
