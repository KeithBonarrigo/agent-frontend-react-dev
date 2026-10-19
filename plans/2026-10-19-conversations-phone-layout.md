# Conversations tab on phones: readable messages, change and rollback log

Date: 2026-10-19. Keith asked for it: on phones, the messages under each user printed one letter per line.

| What | Where |
| --- | --- |
| Branch | `fix/conversations-phone-layout`, from `main` at `42081e8` |
| Backup tag | `backup/pre-conversations-phone-2026-10-19` → `42081e8` |

## Why

Each `.message-row` is a grid of `150px 1fr 80px 150px` with 12px gaps and 10px padding. That's 436px of fixed width before the message column (`1fr`) gets any room. On a phone the row is 170–280px wide, so the message column shrank to almost nothing, and `word-break: break-word` broke it after every letter.

The First / Last / Duration line and the agent and channel headers were cramped the same way: the "1 online" pill and "2 users" split over two lines.

## Change (`src/components/Tabs.css`, one new `@media (max-width: 600px)` block after `.message-time`)

| Element | Before (all widths) | After, at ≤600px only |
| --- | --- | --- |
| `.message-row` | 4 columns, `150px 1fr 80px 150px` | `1fr auto auto` with areas `"sender tokens time"` / `"content content content"`. The message gets the full width on the second line. Gap 4px 10px, baseline-aligned. |
| `.message-tokens`, `.message-time` | 13px / 12px | 11px |
| `.user-meta` (First / Last / Duration) | one row | one per line (`flex-direction: column`, 2px gap) |
| `.accordion-header`, `.channel-header` and their left `span` | single line | wrap, 4px row gap |
| `.badge-online`, the header counts (`> .text-xs`) | could split mid-phrase | `white-space: nowrap` |

Desktop and tablets wider than 600px are unchanged.

## Rollback

| Undo | How |
| --- | --- |
| After merge | `git revert -m 1 <merge-commit>` through a PR |
| From the tag | `git checkout backup/pre-conversations-phone-2026-10-19 -- src/components/Tabs.css` |
| By hand | Delete the media block that starts "Phones: the fixed columns above" in `Tabs.css` |

## Verification

Headless Chrome on the dev server, against a mock with two web visitors and short and long messages, at 1366, 430, 390, 360 and 320px:

| Width | Message column | Sample message lines | Other |
| --- | --- | --- | --- |
| 1366 | 636px (`150px 636px 80px 150px`, unchanged) | 1 | First / Last / Duration on one row, as before |
| 430 | 262px | 2 | The meta lines stack. The "online" pills (23px) and the counts (20px) stay on one line. |
| 390 | 222px | 2 | same |
| 360 | 192px | 3 | same |
| 320 | 152px | 3 | same. The time wraps onto 2 lines at this width. |

There's no sideways scroll at any width, and no console errors apart from the Facebook SDK's plain-http dev warning.

A production build into a scratch folder succeeds. No JavaScript changed.
