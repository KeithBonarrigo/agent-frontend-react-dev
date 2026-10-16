# Botwerx Bot tab: white carousel background — change and rollback log

Date: 2026-10-15. Home page, Botwerx Bot tab (`/?tab=botwerx`): the "What Can AI
Agents Do For Your Business?" carousel now sits on a white band under the dark
title band. Same change as the uncommitted one on the `botwerx-carousel-white`
checkout, applied to current `main`.

| What | Where |
| --- | --- |
| Branch | `feat/carousel-white-bg`, from `main` at `4227080` |
| Backup tag | `backup/pre-carousel-white-2026-10-15` → `4227080` |

## Changes (`src/styles/HomeV3.css`, slider section only)

| Rule | Before | After |
| --- | --- | --- |
| `.hv3-bw-slider-sec` padding | `0 0 60px` (dark gap under the carousel) | `0` |
| `.hv3-slider` | transparent on the navy page, padding `calc(60px + 2rem) 20px 2rem` | `background:#fff`, padding `calc(60px + 2rem) 20px` |
| `.hv3-slide p` (captions) | `#fff` | `var(--hv3-bg)` (`#0F1621`) |

The dark title band, slide sizes, icons and auto-scroll are unchanged.

## Rollback

Revert the merge, or `git checkout backup/pre-carousel-white-2026-10-15 -- src/styles/HomeV3.css`.

## Verification

Headless Chrome, live site vs. this branch, desktop 1366px and phone 390px: slider
background `rgb(255,255,255)` (was transparent), captions `rgb(15,22,33)` (were
white), 12 slides, no page errors. Production build into a scratch folder succeeds.
