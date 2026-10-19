# Home page: "Why work with us?" gap and BotWerx Bot icons, change and rollback log

Date: 2026-10-18. Every change is in `src/styles/HomeV3.css`; no other file changes.

| What | Where |
| --- | --- |
| Branch | `feat/home-gap-and-icons`, from `main` at `61d2c91` |
| Backup tag | `backup/pre-sc-why-gap-2026-10-18` → `61d2c91` |

## Changes

| # | Where | Before | After |
| --- | --- | --- | --- |
| 1 | StoreConnect Services tab, "Why work with us?" (`#hv3-sc-why`) | 133px above the heading: 112px section padding plus the h2's 20px top margin, which is meant for a label this section doesn't have. 97px on phones. | 65px (`padding-top:64px`, h2 `margin-top:0`). 49px on phones (`padding-top:48px`). |
| 2 | BotWerx Bot tab, hero benefits (`.hv3-bw-benefit-row`) | Each icon starts 12px left of its heading. | `padding-left:12px`: the icon starts under the heading's first letter, and the text moves with it. |
| 3 | BotWerx Bot tab icons (`.hv3-bw-hero .hv3-bw-icon`, `#hv3-services .hv3-bw-icon`) | Blue `#5A8CFF` on a blue tint | Teal `--hv3-accent` (#2DD4BF, the colour of the StoreConnect Bot check marks) on the teal tint `--hv3-accent-soft` |

Not changed:
- The icons on the StoreConnect Services and StoreConnect Bot tabs, which stay blue.
- The arrow in the BotWerx Bot tab's StoreConnect banner, which takes the link's blue.
- The icons inside the white sign-up form.

## Rollback

| Undo | How |
| --- | --- |
| Everything | `git revert -m 1 <merge-commit>` through a PR. Railway redeploys. |
| One change | Delete its rule: the `#hv3-sc-why` block (#1), `padding-left:12px` on `.hv3-bw-benefit-row` (#2), or the teal icon rule after `.hv3-page .hv3-bw-icon` (#3). |

## Verification

Headless Chrome at 1366px and phone width, comparing the live site (before) with the branch's dev server (after):

| Check | Before | After |
| --- | --- | --- |
| Gap above "Why work with us?" (desktop / phone) | 133px / 97px | 65px / 49px |
| BotWerx Bot hero and Additional Benefits icons | Blue on a blue tint | `rgb(45, 212, 191)` on `rgba(45, 212, 191, 0.13)`, the same teal as the check marks |
| Hero icon left edge vs heading text (desktop / phone) | 12px left of the heading | Level with it: 113 = 113px / 40 = 40px |

- The other tabs' icons are unchanged.
- No sideways scroll and no console errors.
- ESLint is clean and the production build succeeds.
