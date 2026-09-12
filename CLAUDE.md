# BotWerx frontend

React 19 + Vite 6 single-page app. Deployed from GitHub to Railway: a merge to
`main` publishes to https://www.botwerx.ai within minutes. Branch `main` is
protected and requires an approved pull request.

Run it: `npm install`, then `npm run dev`, then open http://localhost:5173

## Current work: the home page redesign

Branch `mock-homepage` holds an isolated mock of the home page at the unlisted
route `/preview/home-v2`. It exists so the redesign can be built and reviewed
without touching the home page that the public sees. Going live later is a
one-line change to the `/` route in `src/App.jsx`, made deliberately after
approval. It is not part of this work.

### Only these four files may be changed

| File | Holds |
| --- | --- |
| `src/Pages/HomeV2.jsx` | The mock page's structure |
| `src/styles/HomeV2.css` | All of its styling |
| `src/locales/es/homev2.json` | Its Spanish text |
| `src/locales/en/homev2.json` | Its English text |

### Never change these

`src/Pages/Home.jsx`, `src/styles/Home.css`, `src/locales/en/home.json` and
`src/locales/es/home.json` are the **live** home page. Their names are one `V2`
away from the files above, so read paths carefully before editing. If a task
seems to require changing one of them, stop and ask instead.

Also leave `src/App.jsx`, `src/i18n.js`, `src/components/` and `public/` alone
unless explicitly asked. The route, the i18n namespace and `robots.txt` are
already wired up correctly.

## Rules that keep the mock isolated

**Every CSS class on this page starts with `hv2-`.** CSS in this project is
global, not scoped or modular. `HomeV2.css` is a renamed copy of `Home.css`, so
a class named `home-something` in either file would restyle the live home page.
Never write, rename or edit a `home-` class. New elements get new `hv2-` classes.

**Text lives in the `homev2` i18n namespace, never `home`.** The page calls
`useTranslation('homev2')`. Editing `home.json` would change the live page's
words.

**Keep both languages in sync.** Any key added or removed in
`es/homev2.json` must match `en/homev2.json`. Spanish is the primary language for
this work; write natural Spanish, not translated-sounding Spanish.

**Do not run `npm run build`.** `dist/` is tracked in git, so a build creates
noisy unrelated changes. `npm run dev` is enough to see your work.

**Never commit to or push `main`.** All commits go to `mock-homepage`.

**Never submit the contact or signup forms** from the mock page, including while
testing. They post to the production API and create real records. Styling them is
fine; submitting them is not.

## Known quirks, not bugs

The header and footer are shared with the live page and styled by `Home.css`,
which is why `HomeV2.jsx` imports it alongside `HomeV2.css`. Do not try to
"clean up" that import.

Header nav links navigate to `/` rather than scrolling within the mock page,
because `HomeHeader` hardcodes the home route. Leave it as is.

The page renders fully with no backend running. Only form submission needs the
API, so a stopped or missing backend is not a problem to fix.
