# BotWerx Agent tab back in the home page tab bar, change and rollback log

Date: 2026-11-24. Keith asked to enable the BotWerx Agent tab again. It had been out of the tab bar since 2026-11-19 (PR #35, `plans/2026-11-19-hide-botwerx-agent-tab.md`), with its page still reachable by link for sign-ups.

| What | Where |
| --- | --- |
| Branch | `feat/show-botwerx-agent-tab`, from `main` at `1bca1c5` |
| Backup tag | `backup/pre-show-botwerx-agent-tab-2026-11-24` → `1bca1c5` |

## Change (`src/Pages/HomeV3.jsx` only)

| | Before (`SHOW_BOTWERX_AGENT_TAB = false`) | After (`true`) |
| --- | --- | --- |
| Tab bar on the home page | BidConnect · StoreConnect Services (BotWerx Agent added only while its page is open) | BidConnect · StoreConnect Services · BotWerx Agent, always |
| Leaving the BotWerx Agent page | Its tab left the bar | Its tab stays |
| Login page's Create Account, `?tab=botwerx`, old `?tab=storeconnect-bot` links | BotWerx Agent page | Unchanged: BotWerx Agent page |

Only the switch and its comment changed. The unlisted-tab code (`LINKABLE_TABS`, `barTabs`) stays, so `false` takes the tab out of the bar again exactly as on 2026-11-19. The StoreConnect Bot tab (`SHOW_STORECONNECT_BOT_TAB`) and the BidConnect demo (`BIDCONNECT_SIMULATION_OPEN`) stay off.

## Rollback

| Undo | How |
| --- | --- |
| Hide the tab again | `SHOW_BOTWERX_AGENT_TAB = false` in `HomeV3.jsx` |
| After merge | `git revert -m 1 <merge-commit>` through a PR |
| From the tag | `git checkout backup/pre-show-botwerx-agent-tab-2026-11-24 -- src/Pages/HomeV3.jsx` |

## Verification

Headless Chrome on the dev server:

| Check | Result |
| --- | --- |
| Home page tab bar, 1366 / 1000 / 640 / 481 px | Three tabs, one row, nothing clipped, no sideways scroll |
| 480 / 390 px | Two rows; 320 px: three rows; nothing clipped |
| Clicking BotWerx Agent, then StoreConnect Services | Sign-up form shows with all eight plans; the BotWerx Agent tab stays in the bar after leaving |
| Login page → Create Account | `/?tab=botwerx#hv3-signup`, sign-up form in view |
| `?tab=storeconnect-bot` / `?tab=nope` | BotWerx Agent / BidConnect |
| Arrow keys | Left from BidConnect → BotWerx Agent; Right from BotWerx Agent → BidConnect |
| Spanish | BidConnect · Servicios StoreConnect · Agente BotWerx |
| Console | No errors |

ESLint clean on `HomeV3.jsx`; production build succeeds.
