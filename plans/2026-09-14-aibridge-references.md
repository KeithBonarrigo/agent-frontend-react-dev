# To do: update all AI Bridge references on the site

Date: 2026-09-14. Requested by the user when the V3 legal pages shipped: "we
need to update all references to AIBridge on the site". Nothing here has been
changed yet. This is the inventory to work from.

Inventory command (excludes `node_modules`, `dist`, `.git`, `plans/`, `CLAUDE.md`):

```
grep -rniE "ai ?bridge|aibridge" --exclude-dir=node_modules --exclude-dir=dist \
  --exclude-dir=.git --exclude-dir=plans --exclude=CLAUDE.md .
```

It found **67 lines in 17 files**, plus 3 logo files.

## Decide first

1. **Is AI Bridge being retired, or renamed?** That decides whether the
   domain-detection code below is removed, or kept with new names and values.
2. **Do the AI Bridge domains still need to work?** `www.aibridge.global` returned a
   Heroku **503 "Application Error"** on 2026-09-14 (it is hosted separately from
   botwerx.ai on Railway). `base.aibridge.global` did not resolve.
3. **PropelAgent** is branded "PropelAgent by AI Bridge" and links to
   `propelagent.aibridge.global`. Does Propel change too?
4. **Legal/contract text** in `configurations.json` names "AiBridge" as a party in
   the MLS BCS integration terms (governed by Mexican law). Changing the company
   name in contract terms should go past whoever owns those agreements.

## Where the references are

### Domain detection and behaviour (changes what visitors get)
- `src/contexts/DomainContext.jsx` (16): treats `aibridge.global` / `base` as the
  AI Bridge domain type, and returns AI Bridge values for **every non-botwerx.ai
  domain**, including localhost: page title "AIBridge - Agent Driven
  Engagement", meta description, site name, `companyName` "AI Bridge",
  `info@/admin@/support@aibridge.global`, `https://aibridge.global`. The legal
  pages print `companyName` / `infoEmail` / `websiteUrl` from here, so they show
  AI Bridge details on any non-botwerx domain.
- `src/utils/getApiUrl.js` (3): API `https://chat.aibridge.global` for AI Bridge domains.
- `src/App.jsx` (4): `isAIBridge` keeps AI Bridge domains on the pre-V3 pages.
- `src/components/SignupForm.jsx` (1): returns `base.aibridge.global` as a domain.
- `src/components/IntegrationsTab.jsx` (2): web-embed domain `chat.aibridge.global`.

### Branding in shared components
- `src/components/HomeHeader.jsx` (2): AI Bridge logo on AI Bridge domains; "By AI Bridge" byline (Propel).
- `src/components/HomeFooter.jsx` (1): "AI Bridge - 45 S 3rd St. Pacific Beach…" address on non-botwerx domains.
- `src/components/AgentHeader.jsx` (1), `src/components/AgentFooter.jsx` (6): PropelAgent "By AI Bridge", links to `propelagent.aibridge.global`, `info@aibridge.global`.
- `src/components/Layout.jsx` (1): imports `src/assets/aibridge-logo-transparent.png` as the footer logo.
- Logo files: `public/img/AI-Bridge-Logo-Med2.png`, `src/assets/aibridge-logo.png`, `src/assets/aibridge-logo-transparent.png`.

### Text (both languages)
- `src/locales/{en,es}/agent.json` (2 each): `info@aibridge.global`, "PropelAgent by AI Bridge".
- `src/locales/{en,es}/configurations.json` (6 each): "AiBridge" in the MLS BCS terms (see decision 4).

### Comments, docs and leftovers (no visitor impact)
- `src/styles/Home.css` (1): header comment "AI BRIDGE HOME PAGE".
- `DOMAIN_CONTEXT_USAGE.md` (12): developer docs for the domain logic.
- `src/Pages/Home.jsx.1.5.25` (1): an old backup copy of Home.jsx; candidate for deletion.
- `dist/` also contains AI Bridge assets, but it is rebuilt on deploy.

## Notes for whoever picks this up
- `DomainContext`, `getApiUrl`, `HomeHeader`, `HomeFooter` and `SignupForm` are
  shared by every page. Test botwerx.ai, localhost and any remaining AI Bridge /
  Propel domain after changing them.
- The V3 pages (`HomeV3`, `LoginV3`, `LegalV3`) are BotWerx-branded already and
  contain no AI Bridge references.
