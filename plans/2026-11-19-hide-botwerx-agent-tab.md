# BotWerx Agent tab out of the home page tab bar, change and rollback log

Date: 2026-11-19. Keith asked to hide the BotWerx Agent tab for now. Its page holds the only BotWerx account sign-up form (sign-up and Stripe checkout), and the login page's "Create Account" button opens it, so he chose to keep sign-ups working: the tab leaves the bar, but its page stays reachable by link.

| What | Where |
| --- | --- |
| Branch | `feat/hide-botwerx-agent-tab`, from `main` at `d0c72d5` |
| Backup tag | `backup/pre-hide-botwerx-agent-tab-2026-11-19` → `d0c72d5` |

## Change (`src/Pages/HomeV3.jsx` only)

| | Before | After (`SHOW_BOTWERX_AGENT_TAB = false`) |
| --- | --- | --- |
| Tab bar on the home page | BidConnect · StoreConnect Services · BotWerx Agent | BidConnect · StoreConnect Services |
| `/?tab=botwerx` (login page's Create Account goes to `/?tab=botwerx#hv3-signup`) | BotWerx Agent page, its tab selected | Same page and sign-up form; the BotWerx Agent tab is added at the end of the bar while that page is open |
| Leaving the BotWerx Agent page (clicking another tab, or arrow keys) | Three tabs stay | The bar goes back to two tabs |
| Old `/?tab=storeconnect-bot` links | BotWerx Agent page | Unchanged: BotWerx Agent page (StoreConnect Bot tab is still hidden) |
| Unknown `?tab=` | BidConnect | Unchanged: BidConnect |

- `TABS` now lists only the tabs shown in the bar. A new `LINKABLE_TABS` adds `botwerx` for links, and `barTabs` adds the open tab to the bar when it isn't listed. Arrow keys move through `barTabs`.
- Nothing else changed: the BotWerx Agent content, its sign-up form (all plans, including StoreConnect), `LoginV3.jsx`, the CSS and the text strings are untouched. The tab bar CSS already handles two and three tabs.

## Rollback

| Undo | How |
| --- | --- |
| List the tab again | `SHOW_BOTWERX_AGENT_TAB = true` in `HomeV3.jsx` |
| After merge | `git revert -m 1 <merge-commit>` through a PR |
| From the tag | `git checkout backup/pre-hide-botwerx-agent-tab-2026-11-19 -- src/Pages/HomeV3.jsx` |

## Verification

Headless Chrome on the dev server:

| Check | Result |
| --- | --- |
| Home page tab bar, 1366 / 1000 / 640 / 481 / 480 / 390 px | BidConnect · StoreConnect Services, one row, nothing clipped, no sideways scroll |
| 320 px | The two tabs stacked, nothing clipped |
| `/?tab=botwerx` at 1366 / 390 / 320 px | Three tabs with BotWerx Agent selected (one row, two rows, three rows); sign-up form present with all eight plans |
| Login page → Create Account | Lands on `/?tab=botwerx#hv3-signup` with the sign-up form scrolled into view |
| Clicking BidConnect from there | Bar back to two tabs |
| `?tab=storeconnect-bot` | BotWerx Agent page |
| `?tab=nope` | BidConnect |
| Arrow keys | Left from BidConnect → StoreConnect Services, Right → BidConnect; from BotWerx Agent, Right → BidConnect (bar back to two), Left → StoreConnect Services |
| Spanish | BidConnect · Servicios StoreConnect; Agente BotWerx when open |
| Console | No errors |

ESLint clean on `HomeV3.jsx`; production build succeeds.
