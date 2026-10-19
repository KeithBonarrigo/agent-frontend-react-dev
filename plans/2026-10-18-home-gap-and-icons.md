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

### #4 Teal icons on the StoreConnect Bot tab too (follow-up PR)

| What | Where |
| --- | --- |
| Branch | `feat/scbot-teal-icons`, from `main` at `eda2216` |
| Backup tag | `backup/pre-scbot-teal-icons-2026-10-18` → `eda2216` |

- The teal icon rule (#3) now also covers `#hv3-scb-features .hv3-bw-icon`: the nine "What it does" icons and the setup card's plug.
- The StoreConnect Services tab's icons stay blue, and the "Coming soon" clock stays amber.
- The same PR changes the StoreConnect Bot sign-up heading; see #8 in `plans/2026-10-18-storeconnect-bot-tab.md`.

### #5–#7 Hero indents, Services logo, lighter tabs heading (same follow-up PR as #4)

| # | Where | Before | After |
| --- | --- | --- | --- |
| 5 | StoreConnect Services hero | No logo. "Let's Talk" flush with the text. | StoreConnect logo chip and "Services" label above the headline (`storeconnect.hero.label`: en "Services", es "Servicios"). The button is indented 16px, except on phones, where it is full width. |
| 6 | BidConnect hero | Paragraph and buttons flush with the headline | Both indented 16px. On phones the paragraph keeps the indent and the full-width buttons drop it. |
| 7 | "Our Products and Services:" (`.hv3-tabs-heading`) | `--hv3-txt-2` (#9CA3B0) | `--hv3-txt` (#E8EBF0), lighter |

The indent is one shared class, `.hv3-indent` (`margin-left:16px`). At 640px and below, `.hv3-hero-cta.hv3-indent` drops it. It's on the BidConnect paragraph and buttons and on the Services button.

## Rollback

| Undo | How |
| --- | --- |
| #5–#7 only | In `HomeV3.jsx`, remove the Services brand row and the `hv3-indent` classes. In `HomeV3.css`, remove the `.hv3-indent` rules and set `.hv3-tabs-heading` back to `--hv3-txt-2`. Remove `storeconnect.hero.label` from both `homev3.json` files. |
| #4 only | Remove `.hv3-page #hv3-scb-features .hv3-bw-icon` from the teal icon rule. |
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
