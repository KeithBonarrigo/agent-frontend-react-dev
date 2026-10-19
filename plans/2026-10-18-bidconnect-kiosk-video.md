# BidConnect hero: the live demo's kiosk video, linked, plus a Try It! button, change and rollback log

Date: 2026-10-18. BidConnect tab, hero.

| What | Where |
| --- | --- |
| Branch | `feat/bidconnect-kiosk-video`, from `main` at `4562a56` |
| Backup tag | `backup/pre-bidconnect-kiosk-video-2026-10-18` → `4562a56` |

## Changes

| # | What | Before | After |
| --- | --- | --- | --- |
| 1 | Hero video (`BIDCONNECT_DEMO_VIDEO`) | `/media/bidconnect-demo.mp4` (2.6 MB) | `/media/bidconnect-kiosk-demo.mp4` (7.4 MB): a 2:53 loop of the tryme.bidconnect.app kiosk's first 11 scenes, "Live Auction" through "Bid From Your Phone". The 12th scene, "Trials & Promotions", is cut (#8). |
| 2 | Poster and reduced-motion still (`BIDCONNECT_DEMO_POSTER`) | `/img/bidconnect-demo-poster.jpg` | `/img/bidconnect-kiosk-poster.jpg` (the loop's first second) |
| 3 | Video size attributes | 1920 × 1080 | 1280 × 720, the recording's size (same 16:9) |
| 4 | Video link | none | Wrapped in a link to https://tryme.bidconnect.app/ (new tab). Its name for screen readers is `bidconnect.hero.tryLabel`. |
| 5 | Hero buttons | Create Your Auction · Sign In | Create Your Auction · **Try It!** (https://tryme.bidconnect.app/, new tab, outline style) · Sign In. Spanish: "¡Pruébalo!" (`bidconnect.hero.ctaTry`). |
| 6 | Hero button padding (`.hv3-bc-hero-cta .hv3-btn-lg`) | 32px sides | 20px sides, the same as on phones, so all three fit on one line (502px needed vs 496px available) |
| 7 | `.hv3-hero-vis-link` | none | `display:block` and a focus outline |

The old video and poster stay in `public/` for rollback.

### #8 Promotions scene cut (same PR, second commit)

The kiosk's last scene reads "Trials and promotions available for attendees of the Habitat for
Humanity International 2026 Convention". At the user's request it's cut from the video.

| | Length | Scenes | File size |
| --- | --- | --- | --- |
| Before (the PR's first commit, `ef20dde`) | 180 s | All 12; the video ended 6.6 s into "Trials & Promotions" | 7,619,796 bytes |
| After | 173.35 s (2:53) | The first 11; the loop runs from "Bid From Your Phone" straight back into "Live Auction" | 7,380,271 bytes |

Only the video file changes. The poster comes from the first second ("Live Auction") and stays
as it is.

## How the video was made

Everything ran in headless Chrome on this Mac; there's no ffmpeg here. The scripts are kept in `~/Botwerx/temp/bidconnect-kiosk-video/`.

1. **Record.** Load https://tryme.bidconnect.app/ at 1280 × 720 and screencast it for 181 seconds: 3,324 frames, about 18 per second. The kiosk's operator hint ("Click anywhere for full screen") was hidden during recording, in the recording browser only.
2. **Encode.** WebCodecs H.264 Main (`avc1.4D401F`) at a constant 20 fps and constant quality (quantizer 34), with a keyframe every 6 seconds. Muxed with mp4-muxer 5.1.3, with the index at the front so playback starts before the file finishes downloading.
3. **Cut.** The encode stops at 173.35 seconds: `node kiosk-encode.mjs <out.mp4> q:34 173.35 6`.
   - The last recorded frame used is f03043 (173.31 s), a clean "Bid From Your Phone" frame.
   - By f03045 (173.41 s) the caption has switched to "Trials & Promotions".
   - The kiosk's config adds up to 180 seconds, but each scene change takes about half a second longer. So in the recording, "Trials & Promotions" starts at 173.4 s, not 168 s.
   - The scene boundaries were found by reading which progress dot is orange in every frame (`kiosk-scenes.mjs`).

## Rollback

| Undo | How |
| --- | --- |
| After merge | `git revert -m 1 <merge-commit>` through a PR. |
| Old video only | Point `BIDCONNECT_DEMO_VIDEO` and `BIDCONNECT_DEMO_POSTER` back at the old files, and the size attributes back to 1920 × 1080. |
| Put the promotions scene back (#8) | `git checkout ef20dde -- public/media/bidconnect-kiosk-demo.mp4` restores the 12-scene, 180 s file. |
| Link and button only | Remove the `.hv3-hero-vis-link` wrapper and the Try It! anchor. |

## Verification

Dev server, headless Chrome:
- **Video:** loads the new file, muted and looping, and plays (`currentTime` advances). 1280 × 720. The first commit's file was 180 s.
- **Cut (#8):** the new file is 173.35 s. Its first frame is "Live Auction" and its last is "Bid From Your Phone" (11th dot). The encode used recorded frames f00000–f03043 only, all from before "Trials & Promotions" begins.
- **Links:** the video and Try It! both point at https://tryme.bidconnect.app/ (`_blank`, `noopener noreferrer`).
- **Button layout:** the three buttons share one line at 1100, 1366 and 1785px, and stack on phones. No sideways scroll.
- **Reduced motion:** visitors with motion turned off see the poster image inside the same link.
- **Spanish:** Crea tu subasta · ¡Pruébalo! · Iniciar sesión.
- **Errors:** no console errors.
- **Build:** ESLint is clean, and the production build includes the new files.
