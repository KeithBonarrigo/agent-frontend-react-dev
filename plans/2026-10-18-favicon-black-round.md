# BotWerx favicon: black round icon, change and rollback log

Date: 2026-10-18.

| What | Where |
| --- | --- |
| Branch | `feat/favicon-black-round`, from `main` at `4562a56` |
| Backup tag | `backup/pre-favicon-black-round-2026-10-18` → `4562a56` |
| New file | `public/img/favicon-botwerx-black-round.png`, a copy of `~/Botwerx/logos/botwerx-icon-round.png` (140 × 140, transparent corners) |

## Changes

| File | Before | After |
| --- | --- | --- |
| `src/Pages/HomeV3.jsx`, `LoginV3.jsx`, `LegalV3.jsx`, `DashboardV3.jsx` (`FAVICON`) | `/img/favicon-botwerx-blue-rounded.png?v=2` | `/img/favicon-botwerx-black-round.png?v=1` |
| `src/contexts/DomainContext.jsx` (BotWerx domains, every other page) | `/favicon-botwerx.png` (the old robot) | `/img/favicon-botwerx-black-round.png?v=1` |
| `index.html` (default until the app starts) | `/favicon-botwerx.png` | `/img/favicon-botwerx-black-round.png?v=1` |
| `CLAUDE.md` (favicon note) | Blue-rounded path; "`index.html` is not changed" | New path; `index.html` uses the same icon |

AI Bridge and Propel keep `/favicon-ai-fav.png`. The old files stay in `public/` for rollback.

## Rollback

| Undo | How |
| --- | --- |
| After merge | `git revert -m 1 <merge-commit>` through a PR. |
| From the tag | `git checkout backup/pre-favicon-black-round-2026-10-18 -- index.html CLAUDE.md src/Pages/HomeV3.jsx src/Pages/LoginV3.jsx src/Pages/LegalV3.jsx src/Pages/DashboardV3.jsx src/contexts/DomainContext.jsx` |

## Verification

Dev server, headless Chrome:
- `/?tab=bidconnect`, `/login` and `/privacy` all point their icon links at the new file.
- The file serves as `image/png`, 10,046 bytes.

On `localhost`, DomainContext uses the AI Bridge icon (domain type "local"), so its BotWerx branch can only be checked on www.botwerx.ai after deploy, for example on `/payment`.
