// Runs after `vite build` (package.json "build"). Writes dist/sms-terms.html and
// dist/sms-privacy.html: the BidConnect texting policy pages, as plain HTML.
//
// Why static: carrier reviewers (Twilio toll-free verification) read these pages with tools
// that may not run JavaScript, and the rest of botwerx.ai is a React app whose HTML is an
// empty shell. These pages carry their full text in the HTML the server sends.
//
// They look like the other legal pages: the same markup as LegalV3 (header, .hv3-legal body,
// footer with the legal links) and the site's own built stylesheet, read from dist/index.html.
// No app JavaScript is loaded, so links here are ordinary page loads.
//
// Served at /sms-terms and /sms-privacy (with or without a trailing slash) because
// public/serve.json sends every other path to the React app instead. See
// plans/2026-11-26-sms-policy-pages.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SMS_PAGES, REQUIRED_PHRASES } from './sms-pages-content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The build output folder; dist/ unless another is given (for local test builds).
const DIST = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));
const SITE = 'https://www.botwerx.ai';

const fail = (message) => {
  console.error(`build-sms-pages: ${message}`);
  process.exit(1);
};

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Footer and header labels in English, from the same strings the React pages use.
const homev3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/locales/en/homev3.json'), 'utf8'));
const label = (key) => {
  const value = key.split('.').reduce((node, part) => node?.[part], homev3);
  if (typeof value !== 'string') fail(`missing string homev3.${key}`);
  return value;
};

// Same order as the footers in LegalV3.jsx, LoginV3.jsx, DashboardV3.jsx and HomeV3.jsx.
const LEGAL_LINKS = [
  { href: '/privacy', key: 'footer.privacy' },
  { href: '/terms-and-conditions', key: 'footer.terms' },
  { href: '/cookies', key: 'footer.cookies' },
  { href: '/data-deletion', key: 'footer.dataDeletion' },
  { href: '/sms-terms', key: 'footer.smsTerms' },
  { href: '/sms-privacy', key: 'footer.smsPrivacy' },
];

// The built app shell: its <head> holds the hashed stylesheet, fonts and favicon.
const shellPath = path.join(DIST, 'index.html');
if (!fs.existsSync(shellPath)) fail('dist/index.html not found; run vite build first');
const shell = fs.readFileSync(shellPath, 'utf8');
const headMatch = shell.match(/<head>([\s\S]*?)<\/head>/);
if (!headMatch) fail('no <head> in dist/index.html');
if (!/<link rel="stylesheet"[^>]*href="\/assets\/[^"]+\.css"/.test(headMatch[1])) {
  fail('no built stylesheet link in dist/index.html; the pages would be unstyled');
}

const buildHead = (page) => {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const url = `${SITE}/${page.path}`;
  let head = headMatch[1]
    // No app JavaScript on these pages.
    .replace(/\s*<script type="module"[^>]*><\/script>/g, '')
    .replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`);
  if (!head.includes(`<title>${title}</title>`)) fail(`could not set the title for ${page.path}`);
  head += `\n    <link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />\n  `;
  return head;
};

const buildBody = (page) => {
  const year = new Date().getFullYear();
  const sections = page.sections
    .map(
      ({ heading, paragraphs }) =>
        `          <div class="policy-section">\n            <h2>${escapeHtml(heading)}</h2>\n` +
        paragraphs.map((p) => `            <p>${p}</p>\n`).join('') +
        '          </div>\n',
    )
    .join('');
  const legal = LEGAL_LINKS.map(
    ({ href, key }) =>
      `<a href="${href}"${href === `/${page.path}` ? ' aria-current="page"' : ''}>${escapeHtml(label(key))}</a>`,
  ).join('');
  const back = escapeHtml(label('shell.backHome'));
  return `
    <div id="root">
    <div class="hv3-page hv3-auth-page hv3-legal-page">
      <div class="hv3-navbar">
        <div class="hv3-wrap hv3-nav-in hv3-auth-nav">
          <a href="/" class="hv3-logo-link" aria-label="${back}"><span class="hv3-logo" role="img" aria-label="BotWerx"></span></a>
          <div class="hv3-nav-right">
            <a href="/" class="hv3-nav-a hv3-auth-back">${back}</a>
          </div>
        </div>
      </div>

      <main class="hv3-legal">
      <div class="policy-page">
        <section class="policy-header">
          <div class="home-container">
            <h1>${escapeHtml(page.title)}</h1>
          </div>
        </section>
        <section class="policy-content-section">
          <div class="home-container">
          <div class="policy-intro">
            <p>${page.intro}</p>
          </div>
${sections}          <div class="policy-section">
            <p>${page.closing}</p>
          </div>
          </div>
        </section>
      </div>
      </main>

      <footer class="hv3-footer hv3-auth-footer">
        <div class="hv3-wrap">
          <div class="hv3-fbot">
            <span>&copy; ${year}. ${escapeHtml(label('footer.allRightsReserved'))}.</span>
            <span class="hv3-auth-legal">${legal}</span>
          </div>
        </div>
      </footer>
    </div>
    </div>
  `;
};

for (const page of SMS_PAGES) {
  const html = `<!doctype html>\n<html lang="en">\n  <head>${buildHead(page)}</head>\n  <body>${buildBody(page)}</body>\n</html>\n`;
  for (const phrase of REQUIRED_PHRASES[page.path] || []) {
    if (!html.includes(phrase)) fail(`${page.path}: missing "${phrase}"`);
  }
  if (/<script\b/i.test(html)) fail(`${page.path}: unexpected <script> tag`);
  const out = path.join(DIST, `${page.path}.html`);
  fs.writeFileSync(out, html);
  console.log(`build-sms-pages: wrote ${path.relative(ROOT, out)} (${html.length} bytes)`);
}
