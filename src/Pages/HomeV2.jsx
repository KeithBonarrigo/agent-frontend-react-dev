import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import "../styles/Home.css";   // shared header/footer styling only
import "../styles/HomeV2.css";  // this page's own styles - edit this one

// ---------------------------------------------------------------------------
// Every outbound destination this page has, in one place.
//
// PREVIEW_MODE keeps them inert while the mock is under review: a click must
// never leave /preview/home-v2 or land on the live signup form, which writes
// real records. The URLs themselves stay here, correct and complete, so going
// live is a single change: set PREVIEW_MODE to false and all of them reconnect.
// ---------------------------------------------------------------------------
const PREVIEW_MODE = true;

const URLS = {
  register:     "https://www.botwerx.ai/register",
  login:        "https://www.botwerx.ai/login",
  contact:      "mailto:hello@botwerx.ai",
  dashboard:    "https://www.botwerx.ai/dashboard",
  privacy:      "https://www.botwerx.ai/privacy",
  terms:        "https://www.botwerx.ai/terms-and-conditions",
  cookies:      "https://www.botwerx.ai/cookies",
  dataDeletion: "https://www.botwerx.ai/data-deletion",
};

// Renders a real link when live, an inert element while under review.
// In-page anchors stay clickable either way.
function Out({ to, className = "", inertClassName = "", children }) {
  const internal = typeof to === "string" && to.startsWith("#");
  if (internal || !PREVIEW_MODE) {
    return <a href={to} className={className}>{children}</a>;
  }
  return (
    <span className={`${className} ${inertClassName}`.trim()} data-href={to}>
      {children}
    </span>
  );
}

// Capability icons, copied from the approved design.
const CAP_ICONS = [
  <path d="M21 11.5a8.4 8.4 0 01-9 8.4 9 9 0 01-3.9-.9L3 20.5l1.5-4.4A8.3 8.3 0 013 11.5C3 6.8 7 3 12 3s9 3.8 9 8.5z" />,
  <path d="M3 5h18M6 12h12M10 19h4" />,
  <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  <><path d="M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9.5" cy="7" r="3.5" /><path d="M22 20v-2a4 4 0 00-3-3.9" /></>,
  <path d="M3 20V10M9.5 20V4M16 20v-7M22.5 20V8" />,
  <><path d="M12 2l8 4v6c0 4.6-3.3 8.6-8 10-4.7-1.4-8-5.4-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" /></>,
];

// Footer columns: in-page anchors stay live, the rest carry their real
// destination and go inert while PREVIEW_MODE is on.
const FOOTER_COLS = [
  { col: 1, links: [
    { n: 1, to: "#hv2-product" },
    { n: 2, to: "#hv2-how" },
    { n: 3, to: "#hv2-pricing" },
    { n: 4, to: URLS.dashboard },
  ] },
  { col: 2, links: [
    { n: 1, to: "#hv2-faq" },
    { n: 2, to: "#hv2-contact" },
    { n: 3, to: URLS.login },
  ] },
  { col: 3, links: [
    { n: 1, to: URLS.privacy },
    { n: 2, to: URLS.terms },
    { n: 3, to: URLS.cookies },
    { n: 4, to: URLS.dataDeletion },
  ] },
];

export default function HomeV2() {
  const { t, i18n } = useTranslation('homev2');
  const lang = i18n.language?.split('-')[0] || 'en';

  return (
    <div id="hv2-hero" className="hv2-page">
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content={t('meta.description')} />
      </Helmet>

      {/* ---------------- Preview-only header ----------------
          The shared HomeHeader still renders above this. Hiding it would
          need a .home- selector, which CLAUDE.md forbids, so both show.
          This one exists so the proposed nav and the new logo can be
          reviewed without touching the live site. */}
      <div className="hv2-navbar">
        <div className="hv2-wrap hv2-nav-in">
          <span className="hv2-logo" role="img" aria-label="BotWerx"></span>
          <nav className="hv2-nav-links">
            <a href="#hv2-product">{t('nav.l1')}</a>
            <a href="#hv2-how">{t('nav.l2')}</a>
            <a href="#hv2-pricing">{t('nav.l3')}</a>
            <a href="#hv2-faq">{t('nav.l4')}</a>
          </nav>
          <div className="hv2-nav-right">
            <Out to={URLS.login} className="hv2-btn hv2-btn-s hv2-btn-sm" inertClassName="hv2-btn-inert">{t('nav.signin')}</Out>
            <Out to={URLS.register} className="hv2-btn hv2-btn-p hv2-btn-sm" inertClassName="hv2-btn-inert">{t('nav.cta')}</Out>
            {/* The shared LanguageSelector floats as a white pill over this dark nav
                and is hidden on this route, so the mock carries its own toggle. */}
            <div className="hv2-lang">
              {['en', 'es'].map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={lang === code}
                  onClick={() => i18n.changeLanguage(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Hero ---------------- */}
      <section className="hv2-hero">
        <div className="hv2-wrap hv2-hero-grid">
          <div>
            <span className="hv2-lab">{t('hero.label')}</span>
            <h1>
              {t('hero.titleLead')} <em>{t('hero.titleEm')}</em>
            </h1>
            <p className="hv2-hero-sub">{t('hero.subtitle')}</p>
            <div className="hv2-hero-cta">
              <Out to={URLS.register} className="hv2-btn hv2-btn-p" inertClassName="hv2-btn-inert">{t('hero.ctaPrimary')}</Out>
              <a href="#hv2-product" className="hv2-btn hv2-btn-s">{t('hero.ctaSecondary')}</a>
            </div>
            <p className="hv2-hero-fine">{t('hero.fine')}</p>
          </div>

          {/* Illustration: a fictional customer's site with the agent answering on it */}
          <div className="hv2-hero-vis">
            <div className="hv2-frame">
              <div className="hv2-fbar">
                <i></i><i></i><i></i>
                <div className="hv2-furl">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 1v6M5 4l3-3 3 3M2.5 8A5.5 5.5 0 0013.5 8" />
                  </svg>
                  {t('demo.url')}
                </div>
              </div>

              <div className="hv2-fbody">
                <div className="hv2-rsite">
                  <div className="hv2-rsite-nav">
                    <span className="hv2-rsite-logo">{t('demo.brand')}</span>
                    <div className="hv2-rsite-links">
                      <span>{t('demo.navServices')}</span>
                      <span>{t('demo.navPricing')}</span>
                      <span>{t('demo.navBook')}</span>
                      <span>{t('demo.navAbout')}</span>
                    </div>
                  </div>

                  <div className="hv2-rsite-hero">
                    <h2>{t('demo.heroTitle')}</h2>
                    <p>{t('demo.heroText')}</p>
                    <span className="hv2-rbtn">{t('demo.heroBtn')}</span>
                  </div>

                  <div className="hv2-rsite-cards">
                    <div className="hv2-rsite-card">
                      <div className="hv2-rc-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                      </div>
                      <h4>{t('demo.card1Title')}</h4>
                      <p>{t('demo.card1Text')}</p>
                    </div>
                    <div className="hv2-rsite-card">
                      <div className="hv2-rc-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                        </svg>
                      </div>
                      <h4>{t('demo.card2Title')}</h4>
                      <p>{t('demo.card2Text')}</p>
                    </div>
                    <div className="hv2-rsite-card">
                      <div className="hv2-rc-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <h4>{t('demo.card3Title')}</h4>
                      <p>{t('demo.card3Text')}</p>
                    </div>
                  </div>
                </div>

                <div className="hv2-widget">
                  <div className="hv2-whead">
                    <div className="hv2-wav">
                      <svg width="18" height="18" viewBox="0 0 76 76">
                        <circle cx="38" cy="38" r="11" fill="#fff" />
                        <circle cx="38" cy="10" r="7" fill="rgba(255,255,255,.55)" />
                        <circle cx="62" cy="52" r="7" fill="rgba(255,255,255,.55)" />
                        <circle cx="14" cy="52" r="7" fill="rgba(255,255,255,.55)" />
                        <line x1="38" y1="27" x2="38" y2="17" stroke="#fff" strokeWidth="4" />
                        <line x1="47" y1="44" x2="56" y2="49" stroke="#fff" strokeWidth="4" />
                        <line x1="29" y1="44" x2="20" y2="49" stroke="#fff" strokeWidth="4" />
                      </svg>
                    </div>
                    <div>
                      <div className="hv2-wnm">{t('demo.agentName')}</div>
                      <div className="hv2-won"><i></i>{t('demo.agentStatus')}</div>
                    </div>
                  </div>
                  <div className="hv2-wbody">
                    <div className="hv2-msg hv2-msg-them">{t('demo.msgThem1')}</div>
                    <div className="hv2-msg hv2-msg-me">{t('demo.msgMe1')}</div>
                    <div className="hv2-msg hv2-msg-them">{t('demo.msgThem2')}</div>
                    <div className="hv2-dots"><i></i><i></i><i></i></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hv2-pill">
              <div className="hv2-pill-t">
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M4 10.5l4 4 8-9" />
                </svg>
                {t('demo.pillLabel')}
              </div>
              <div className="hv2-pill-n">{t('demo.pillTitle')}</div>
              <div className="hv2-pill-s">{t('demo.pillSub')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Channel bar ---------------- */}
      <div className="hv2-chbar">
        <div className="hv2-wrap hv2-chbar-in">
          <span className="hv2-chbar-t">{t('channels.title')}</span>
          <div className="hv2-chs">
            <span className="hv2-ch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
              </svg>
              {t('channels.web')}
            </span>
            <span className="hv2-ch">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5.1-1.3A10 10 0 1012 2zm0 2a8 8 0 11-4.1 14.9l-.4-.2-2.6.7.7-2.5-.2-.4A8 8 0 0112 4zm-3.3 4.3c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.5.7 3 .6.5-.1 1.6-.6 1.8-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.5l.4-.5.3-.5v-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5z" />
              </svg>
              {t('channels.whatsapp')}
            </span>
            <span className="hv2-ch">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.3 2 2 6.2 2 11.7c0 3.1 1.4 5.9 3.7 7.7v3.8l3.4-1.9c.9.3 1.9.4 2.9.4 5.7 0 10-4.2 10-9.7S17.7 2 12 2zm1 13.1l-2.6-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.4 5.8z" />
              </svg>
              {t('channels.messenger')}
            </span>
            <span className="hv2-ch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="3.6" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
              </svg>
              {t('channels.instagram')}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- The problem ---------------- */}
      <section className="hv2-sec">
        <div className="hv2-wrap">
          <div className="hv2-sec-head">
            <span className="hv2-lab">{t('problem.label')}</span>
            <h2>
              {t('problem.titleLine1')}<br />{t('problem.titleLine2')}
            </h2>
            <p>{t('problem.intro')}</p>
          </div>

          <div className="hv2-p3">
            <div>
              <div className="hv2-p3-tag">{t('problem.c1Tag')}</div>
              <h3>{t('problem.c1Title')}</h3>
              <p>{t('problem.c1Text')}</p>
            </div>
            <div>
              <div className="hv2-p3-tag">{t('problem.c2Tag')}</div>
              <h3>{t('problem.c2Title')}</h3>
              <p>{t('problem.c2Text')}</p>
            </div>
            <div>
              <div className="hv2-p3-tag">{t('problem.c3Tag')}</div>
              <h3>{t('problem.c3Title')}</h3>
              <p>{t('problem.c3Text')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- The product ---------------- */}
      <section className="hv2-sec hv2-product-sec" id="hv2-product">
        <div className="hv2-wrap">
          <div className="hv2-sec-head">
            <span className="hv2-lab">{t('product.label')}</span>
            <h2>
              {t('product.titleLine1')}<br />{t('product.titleLine2')}
            </h2>
            <p>{t('product.intro')}</p>
          </div>

          <div className="hv2-inbox-grid">
            <div className="hv2-feat-list">
              {[1, 2, 3, 4].map((n) => (
                <div className="hv2-feat" key={n}>
                  <span className="hv2-feat-n">{String(n).padStart(2, '0')}</span>
                  <div>
                    <h3>{t(`product.f${n}Title`)}</h3>
                    <p>{t(`product.f${n}Text`)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hv2-inbox">
              <div className="hv2-ib-head">
                <span className="hv2-ib-head-t">{t('product.inboxTitle')}</span>
                <span className="hv2-ib-head-c">{t('product.inboxMeta')}</span>
              </div>
              {[
                { n: 1, dot: 'hv2-ib-dot-g', tag: 'hv2-tagx-hot' },
                { n: 2, dot: 'hv2-ib-dot-g', tag: 'hv2-tagx-hot' },
                { n: 3, dot: 'hv2-ib-dot-o', tag: 'hv2-tagx-warm' },
                { n: 4, dot: '', tag: 'hv2-tagx-new' },
                { n: 5, dot: 'hv2-ib-dot-o', tag: 'hv2-tagx-warm' },
                { n: 6, dot: 'hv2-ib-dot-g', tag: 'hv2-tagx-hot' },
              ].map(({ n, dot, tag }) => (
                <div className="hv2-ib-row" key={n}>
                  <span className="hv2-ib-who">
                    <i className={`hv2-ib-dot ${dot}`}></i>{t(`product.r${n}Name`)}
                  </span>
                  <span>{t(`product.r${n}Detail`)}</span>
                  <span className={`hv2-tagx ${tag}`}>{t(`product.r${n}Tag`)}</span>
                  <span>{t(`product.r${n}Channel`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="hv2-sec" id="hv2-how">
        <div className="hv2-wrap">
          <div className="hv2-sec-head">
            <span className="hv2-lab">{t('how.label')}</span>
            <h2>{t('how.title')}</h2>
            <p>{t('how.intro')}</p>
          </div>

          <div className="hv2-steps">
            {[1, 2, 3].map((n) => (
              <div className="hv2-step" key={n}>
                <div className="hv2-step-n">{t(`how.s${n}Num`)}</div>
                <h3>{t(`how.s${n}Title`)}</h3>
                <p>{t(`how.s${n}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Capabilities ---------------- */}
      <section className="hv2-sec" id="hv2-caps" style={{ paddingTop: 0 }}>
        <div className="hv2-wrap">
          <div className="hv2-sec-head">
            <span className="hv2-lab">{t('caps.label')}</span>
            <h2>{t('caps.title')}</h2>
            {/* NOT in the approved HTML: the design jumps straight from the H2 to
                the grid. Added to match the rhythm of the other sections. Needs
                the client's sign-off like any new copy. */}
            <p>{t('caps.intro')}</p>
          </div>

          <div className="hv2-caps">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div className="hv2-cap" key={n}>
                <div className="hv2-cap-i">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    {CAP_ICONS[n - 1]}
                  </svg>
                </div>
                <div>
                  <h3>{t(`caps.c${n}Title`)}</h3>
                  <p>{t(`caps.c${n}Text`)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hv2-vbar">
            {/* PENDING CLIENT CONFIRMATION: "Running today for:" states BotWerx
                already operates in all seven verticals. If that is not true, this
                becomes "Built for:" or the list gets trimmed. Not our call. */}
            <span className="hv2-vbar-l">{t('caps.industriesLabel')}</span>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <span className="hv2-vchip" key={n}>{t(`caps.i${n}`)}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Pricing ----------------
          Prices are the product's real ones: they match pricingMap in
          SignupForm.jsx (free 0, basic 2900, pro 7900, enterprise 19900,
          mls/easybroker 7900, calendar_assistant 0). Do not invent tiers. */}
      <section className="hv2-sec hv2-pricing" id="hv2-pricing">
        <div className="hv2-wrap">
          <div className="hv2-sec-head">
            <span className="hv2-lab">{t('pricing.label')}</span>
            <h2>{t('pricing.title')}</h2>
            <p>{t('pricing.intro')}</p>
          </div>

          <div className="hv2-plans">
            {[1, 2, 3, 4].map((n) => {
              const featured = n === 3;
              return (
                <div className={`hv2-pl${featured ? ' hv2-pl-hi' : ''}`} key={n}>
                  {featured && <div className="hv2-pl-bar"></div>}
                  <div className="hv2-pl-tag">{t(`pricing.p${n}Tag`)}</div>
                  <div className="hv2-pl-name">{t(`pricing.p${n}Name`)}</div>
                  <div className="hv2-pl-price">
                    {t(`pricing.p${n}Price`)}<small>{t(`pricing.p${n}Period`)}</small>
                  </div>
                  <div className="hv2-pl-desc">{t(`pricing.p${n}Desc`)}</div>
                  <ul>
                    {[1, 2, 3, 4].map((f) => (
                      <li key={f}>
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6">
                          <path d="M4 10.5l4 4 8-9" />
                        </svg>
                        {t(`pricing.p${n}F${f}`)}
                      </li>
                    ))}
                  </ul>
                  <Out
                    to={URLS.register}
                    className={`hv2-btn ${featured ? 'hv2-btn-p' : 'hv2-btn-s'}`}
                    inertClassName="hv2-btn-inert"
                  >
                    {t(`pricing.p${n}Cta`)}
                  </Out>
                </div>
              );
            })}
          </div>

          <div className="hv2-pnote">
            <p><strong>{t('pricing.specTitleStrong')}</strong> {t('pricing.specTitleRest')}</p>
            <div className="hv2-spec">
              {[1, 2, 3].map((n) => (
                <span className="hv2-sp" key={n}>
                  <b>{t(`pricing.spec${n}Name`)}</b>
                  <i>{t(`pricing.spec${n}Price`)}</i>
                </span>
              ))}
            </div>
            {/* The design links this to hello@botwerx.ai; kept inert so reviewing
                the mock never opens a mail client. */}
            <p className="hv2-pnote-tail">
              {t('pricing.noteText')} <Out to={URLS.contact} inertClassName="hv2-finert">{t('pricing.noteLink')}</Out>
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Get started ----------------
          The approved design puts a card and a button here, not the signup form.
          SignupForm is a shared component that posts to the production API, so it
          is deliberately NOT mounted in this mock: one click would create a real
          record. It gets wired up when this goes live. */}
      <section className="hv2-sec hv2-start-sec" id="hv2-start">
        <div className="hv2-wrap hv2-start-in">
          <div>
            <span className="hv2-lab">{t('start.label')}</span>
            <h2>{t('start.titleLine1')}<br />{t('start.titleLine2')}</h2>
            <p className="hv2-start-lead">{t('start.lead')}</p>
            <div className="hv2-slist">
              {[1, 2, 3].map((n) => (
                <div className="hv2-sli" key={n}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                  <span>{t(`start.li${n}`)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hv2-start-cta">
            <h3>{t('start.cardTitle')}</h3>
            <p>{t('start.cardText')}</p>
            <Out to={URLS.register} className="hv2-btn hv2-btn-p" inertClassName="hv2-btn-inert">{t('start.cardCta')}</Out>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="hv2-sec" id="hv2-faq">
        <div className="hv2-wrap hv2-faqg">
          <div>
            <span className="hv2-lab">{t('faq.label')}</span>
            <h2>{t('faq.title')}</h2>
            {/* The design links this to hello@botwerx.ai; inert while under review. */}
            <p className="hv2-faq-lead">
              {t('faq.leadPre')} <Out to={URLS.contact} inertClassName="hv2-finert">{t('faq.leadLink')}</Out> {t('faq.leadPost')}
            </p>
          </div>
          <div>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              // name= makes these an exclusive accordion natively, which is what
              // the design's inline script does by hand.
              <details className="hv2-fitem" key={n} name="hv2-faq" open={n === 1}>
                <summary>{t(`faq.q${n}`)}</summary>
                <p>{t(`faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Contact band ----------------
          No form here in the approved design, just two buttons. The first is a
          mailto: in the original; kept inert so reviewing the mock never opens a
          mail client or sends anything. */}
      <section className="hv2-ctab" id="hv2-contact">
        <div className="hv2-wrap hv2-ctab-in">
          <div>
            <span className="hv2-lab">{t('contact.label')}</span>
            <h2>{t('contact.title')}</h2>
            <p className="hv2-ctab-text">{t('contact.text')}</p>
          </div>
          <div className="hv2-ctab-acts">
            <Out to={URLS.contact} className="hv2-btn hv2-btn-p" inertClassName="hv2-btn-inert">{t('contact.cta1')}</Out>
            <Out to={URLS.register} className="hv2-btn hv2-btn-s" inertClassName="hv2-btn-inert">{t('contact.cta2')}</Out>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ----------------
          The shared HomeFooter is hidden on this route only (see HomeV2.css);
          it carries the AI Bridge logo, which this replaces with the new mark. */}
      <footer className="hv2-footer">
        <div className="hv2-wrap">
          <div className="hv2-fgrid">
            <div>
              <span className="hv2-logo" role="img" aria-label="BotWerx"></span>
              <p className="hv2-fblurb">{t('footer.blurb')}</p>
            </div>
            {FOOTER_COLS.map(({ col, links }) => (
              <div key={col}>
                <h4>{t(`footer.col${col}Title`)}</h4>
                <ul>
                  {links.map(({ n, to }) => (
                    <li key={n}>
                      <Out to={to} inertClassName="hv2-finert">
                        {t(`footer.col${col}L${n}`)}
                      </Out>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="hv2-fbot">
            <span>{t('footer.copyright')}</span>
            <span>{t('footer.claude')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
