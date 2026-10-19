# BidConnect pricing: every feature in the Active tile, change and rollback log

Date: 2026-10-18. BidConnect tab, pricing section. This is a text-only change (`bidconnect.pricing.plans[1].features` in `src/locales/{en,es}/homev3.json`).

| What | Where |
| --- | --- |
| Branch | `feat/bidconnect-active-features`, from `main` at `4562a56` |
| Backup tag | `backup/pre-bidconnect-active-features-2026-10-18` → `4562a56` |

## Change

The Active tile goes from 4 bullets to 12: one for each feature the tryme.bidconnect.app demo shows, worded from its scene captions. The four existing bullets keep their wording.

| # | English | Source |
| --- | --- | --- |
| 1 | Real-time and proxy bidding | existing |
| 2 | Guests bid from their own phones | "Live Auction" scene |
| 3 | Instant outbid alerts by email (text optional) | existing |
| 4 | A leader board for the big screen at your event | "Leader Board" |
| 5 | Organizer dashboard: money raised, busiest items, top bidders | "Admin Back-end" |
| 6 | AI summaries of how the auction is going | "AI Insights" |
| 7 | Every bid kept, not just the winners | "Every Bid Kept" |
| 8 | Contacts, items and bids synced to Salesforce | existing (also the "Item Detail" and "Salesforce, Live" scenes) |
| 9 | One click opens a bidder's record in Salesforce | "Contact in Salesforce" |
| 10 | Salesforce reports and dashboards on every bid | "Salesforce Reports" |
| 11 | Share any item to Facebook, Instagram and X | "Social Media" |
| 12 | One cart and payment link per winner via StoreConnect | existing |

Spanish carries the same 12, with the four existing Spanish bullets unchanged. The demo's "Bid From Your Phone" and "Trials & Promotions" scenes are calls to action, not features, so they aren't listed.

## Rollback

| Undo | How |
| --- | --- |
| After merge | `git revert -m 1 <merge-commit>` through a PR. |
| By hand | Put back the four existing bullets (rows 1, 3, 8, 12) in both files. |

## Verification

Dev server, headless Chrome, at 1366px and phone width:
- The Active tile lists 12 items; Trial and Dormant are unchanged at 3 each.
- The three buttons line up on desktop.
- No sideways scroll and no console errors.
- In Spanish the Activo tile lists 12 items.
