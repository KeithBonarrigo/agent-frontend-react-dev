# BidConnect hero: free first auction on a trial, and live support, change and rollback log

Date: 2026-11-24. Keith asked for the opening text of the BidConnect section to highlight that people can ask for a trial and run their first auction for free, and that we offer live support throughout the auction.

| What | Where |
| --- | --- |
| Branch | `feat/bidconnect-hero-trial-support`, from `main` at `dc79d0d` |
| Backup tag | `backup/pre-bidconnect-hero-trial-support-2026-11-24` → `dc79d0d` |

## Change

### Hero offer box (`src/Pages/HomeV3.jsx`, `src/styles/HomeV3.css`)

A highlighted box (teal tint and border, `.hv3-bc-perks`) between the hero paragraph and the Create Your Auction / Sign In buttons, indented like the paragraph:

| Line | English | Spanish |
| --- | --- | --- |
| 1 (gift icon) | **Run your first auction free.** Just ask us for a trial. [Request a trial →] | **Tu primera subasta, gratis.** Solo pídenos una prueba. [Solicitar una prueba →] |
| 2 (headset icon) | **Live support throughout your auction.** Our team is on hand from the opening bid to the final bell. | **Soporte en vivo durante toda tu subasta.** Nuestro equipo te acompaña desde la primera puja hasta el cierre. |

"Request a trial" scrolls to the contact form, the same place the Pricing section's Trial plan button sends people (we reply with a trial code).

New keys under `bidconnect.hero` in `src/locales/{en,es}/homev3.json`: `trialTitle`, `trialText`, `trialLink`, `supportTitle`, `supportText`.

### Pricing text aligned (same files)

The Pricing section described the trial as a way to try BidConnect before your event, which contradicted "run your first auction free":

| Key | Before | After |
| --- | --- | --- |
| en `pricing.intro` | You only pay for BidConnect when you need it. Start with a free trial, go Active when your event comes around, and switch to Dormant between events to keep everything for a fraction of the cost. | You only pay for BidConnect when you need it. Run your first auction free on a trial, go Active for the events after that, and switch to Dormant between events to keep everything for a fraction of the cost. |
| en `pricing.plans[0].desc` (Trial) | Try BidConnect before your event. Tell us about your auction and we'll send you a trial code. | Run your first auction free. Tell us about your auction and we'll send you a trial code. |
| es `pricing.intro` | Solo pagas por BidConnect cuando lo necesitas. Empieza con una prueba gratis, pasa a Activo cuando llegue tu evento y cambia a Inactivo entre eventos para conservar todo por una fracción del costo. | Solo pagas por BidConnect cuando lo necesitas. Organiza tu primera subasta gratis con una prueba, pasa a Activo para los eventos siguientes y cambia a Inactivo entre eventos para conservar todo por una fracción del costo. |
| es `pricing.plans[0].desc` | Prueba BidConnect antes de tu evento. Cuéntanos sobre tu subasta y te enviaremos un código de prueba. | Organiza tu primera subasta gratis. Cuéntanos sobre tu subasta y te enviaremos un código de prueba. |

Unchanged: the hero headline and paragraph, the buttons, the Trial card's features and button, the FAQ, and the other tabs.

## Rollback

| Undo | How |
| --- | --- |
| After merge | `git revert -m 1 <merge-commit>` through a PR |
| From the tag | `git checkout backup/pre-bidconnect-hero-trial-support-2026-11-24 -- src/Pages/HomeV3.jsx src/styles/HomeV3.css src/locales/en/homev3.json src/locales/es/homev3.json` |
| Pricing text only | Put back the "Before" values above |

## Verification

Headless Chrome on the dev server:

| Check | Result |
| --- | --- |
| 1366 / 1100 / 1000 / 640 px | Box 440–470 px wide, lined up with the paragraph, 24 px below it and 26 px above the buttons; both icons render; no bullets; no sideways scroll |
| 390 / 320 px | Box fills the column (318 / 248 px), text wraps, nothing past the edge |
| "Request a trial" | Scrolls to the contact form, same as the Trial plan button |
| Spanish | Both lines and the pricing text in Spanish |
| Pricing section | New intro and Trial description in both languages |
| StoreConnect Services and BotWerx Agent tabs | No box |
| Console | No errors |

ESLint clean on `HomeV3.jsx`; production build succeeds.
