# BidConnect hero: no QR code and no links into the live demo, change and rollback log

Date: 2026-11-19. Keith doesn't want people signing into the BidConnect simulation (tryme.bidconnect.app) for now and asked to remove the QR code. He chose (1) the old 32-second walkthrough video back, and (2) removing the Try It! button and the video's link too.

| What | Where |
| --- | --- |
| Branch | `feat/bidconnect-no-simulation-links`, from `main` at `1ed58b4` |
| Backup tag | `backup/pre-bidconnect-no-simulation-2026-11-19` → `1ed58b4` |

## Why

The only QR codes on botwerx.ai were inside the hero video, the recording of the simulation's kiosk: a "Scan to bid" QR in the corner of every frame (and the poster), and the large QR in its "Bid From Your Phone" scene. The Try It! button and a link on the video also opened the simulation's kiosk page, which shows the same QR and the join link.

## Change (`src/Pages/HomeV3.jsx` only)

| | Before | After (`BIDCONNECT_SIMULATION_OPEN = false`) |
| --- | --- | --- |
| Hero video | `/media/bidconnect-kiosk-demo.mp4` (kiosk recording with QR codes), 1280 × 720 | `/media/bidconnect-demo.mp4`, the 32-second "Lakeside Animal Rescue" walkthrough the site used until 2026-10-18, 1920 × 1080. Checked frames at 0.5–28 s: no QR code. |
| Poster / reduced-motion still | `/img/bidconnect-kiosk-poster.jpg` | `/img/bidconnect-demo-poster.jpg` |
| Hero buttons | Create Your Auction · **Try It!** (tryme.bidconnect.app) · Sign In, narrowed (`hv3-bc-hero-cta`) to fit three | Create Your Auction · Sign In, normal width |
| Video link | The video opened tryme.bidconnect.app in a new tab | Plain video, no link |

- One switch, `BIDCONNECT_SIMULATION_OPEN`, near the BidConnect constants. `true` restores the kiosk recording, the Try It! button and the video link exactly as before.
- The video settings moved into one `BIDCONNECT_DEMO` object (video, poster, width, height) chosen by the switch.
- Both video files and posters stay in `public/`. The `hero.ctaTry` and `hero.tryLabel` strings stay in `homev3.json`, unused while closed.
- Unchanged: Create Your Auction (bidconnect.app/signup) and Sign In (bidconnect.app/#signin). The simulation site itself (tryme.bidconnect.app) isn't part of this repo, so people who already have its address can still reach it.

## Rollback

| Undo | How |
| --- | --- |
| Reopen the demo | `BIDCONNECT_SIMULATION_OPEN = true` in `HomeV3.jsx` |
| After merge | `git revert -m 1 <merge-commit>` through a PR |
| From the tag | `git checkout backup/pre-bidconnect-no-simulation-2026-11-19 -- src/Pages/HomeV3.jsx` |

## Verification

Headless Chrome on the dev server:

| Check | Result |
| --- | --- |
| 1366px | Video `/media/bidconnect-demo.mp4`, 1920 × 1080, 32 s, playing; poster `bidconnect-demo-poster.jpg`; no link around it; buttons Create Your Auction and Sign In on one line |
| 390px | Same video, playing once in view; the two buttons stacked; no sideways scroll |
| Reduced motion | The old poster as a still image |
| Spanish | Crea tu subasta · Iniciar sesión |
| Links to tryme / `/join` on the BidConnect, StoreConnect Services and BotWerx Agent tabs | 0, 0, 0 |
| Files the page requested | Only `bidconnect-demo.mp4` and `bidconnect-demo-poster.jpg`; the kiosk recording isn't loaded |
| Console | No errors |

ESLint clean on `HomeV3.jsx`; production build succeeds.
