import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import SignupForm from "../components/SignupForm";
import { getApiUrl } from "../utils/getApiUrl";
import { useUser } from "../contexts/UserContext";
import "../styles/Home.css";   // shared header/footer styling, and the SignupForm's form classes
import "../styles/HomeV3.css";  // this page's own styles - edit this one

// Forms and links on this page are live and use the same destinations as the
// current home page: SignupForm and the contact form resolve their API through
// getApiUrl() (http://localhost:3000 locally via VITE_API_URL, chat.botwerx.ai
// on www.botwerx.ai), and site links are the app's own routes.

const TABS = ['bidconnect', 'botwerx'];

const LANGUAGES = [
  { code: 'en', flagCode: 'us', fullName: 'English' },
  { code: 'es', flagCode: 'es', fullName: 'Español' },
];

// The site-wide favicon lives in index.html, and DomainContext rewrites that
// link per domain once the app starts - after this page has mounted. So while
// this page is open, point every icon link at our favicon and re-apply it if
// anything changes it; on unmount put back whatever the links held.
// ?v= busts the browser's favicon cache; bump it whenever the image file changes.
const FAVICON = '/img/favicon-botwerx-blue-rounded.png?v=2';

function useFavicon(href) {
  useEffect(() => {
    const originals = new Map();
    const apply = () => {
      document.querySelectorAll('link[rel~="icon"]').forEach((link) => {
        const current = link.getAttribute('href');
        if (current === href) return;
        originals.set(link, current); // latest value set by anyone else
        link.setAttribute('href', href);
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, attributes: true, attributeFilter: ['href'] });
    return () => {
      observer.disconnect();
      originals.forEach((original, link) => link.setAttribute('href', original));
    };
  }, [href]);
}

// Section ids the header links jump to, per tab.
const NAV_ITEMS = {
  bidconnect: [
    { id: 'hv3-top', label: 'nav.home' },
    { id: 'hv3-how', label: 'nav.how' },
    { id: 'hv3-pricing', label: 'nav.pricing' },
    { id: 'hv3-faq', label: 'nav.faq' },
  ],
  botwerx: [
    { id: 'hv3-top', label: 'nav.home' },
    { id: 'hv3-services', label: 'nav.benefits' },
    { id: 'hv3-solutions', label: 'nav.solutions' },
    { id: 'hv3-faq', label: 'nav.faq' },
  ],
};

// In-page link that smooth-scrolls like the live header, without adding a hash
// to the URL.
function ScrollLink({ to, className, onNavigate, children }) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        document.getElementById(to)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Header: the live HomeHeader's links and auth states, in this page's nav.
// ---------------------------------------------------------------------------
function SiteHeader({ t, i18n, lang, tab }) {
  const { isLoggedIn, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const handleLogout = async () => {
    close();
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Section links, then the account links inline (My Dashboard / Log Out, or
  // Log In), with Contact Us as the only button.
  const authLinks = isLoggedIn ? (
    <>
      <Link to="/dashboard" className="hv3-nav-a" onClick={close}>{t('nav.myDashboard')}</Link>
      <button type="button" className="hv3-nav-a hv3-nav-logout" onClick={handleLogout}>{t('nav.logOut')}</button>
    </>
  ) : (
    <Link to="/login" className="hv3-nav-a" onClick={close}>{t('nav.logIn')}</Link>
  );

  const contactBtn = (
    <ScrollLink to="hv3-contact" className="hv3-btn hv3-btn-p hv3-btn-sm" onNavigate={close}>
      {t('nav.contactUs')}
    </ScrollLink>
  );

  return (
    <div className={`hv3-navbar${menuOpen ? ' hv3-nav-open' : ''}`}>
      <div className="hv3-wrap hv3-nav-in">
        <ScrollLink to="hv3-top" className="hv3-logo-link" onNavigate={close}>
          <span className="hv3-logo" role="img" aria-label="BotWerx"></span>
        </ScrollLink>
        <nav className="hv3-nav-links">
          {NAV_ITEMS[tab].map(({ id, label }) => (
            <ScrollLink key={id} to={id}>{t(label)}</ScrollLink>
          ))}
          {authLinks}
        </nav>
        <div className="hv3-nav-right">
          <div className="hv3-nav-desktop">
            {contactBtn}
          </div>
          {/* The shared LanguageSelector floats as a white pill over this dark nav
              and is hidden on this route, so the page carries its own toggle. */}
          <div className="hv3-lang">
            {LANGUAGES.map(({ code, flagCode, fullName }) => (
              <button
                key={code}
                type="button"
                aria-pressed={lang === code}
                aria-label={fullName}
                title={fullName}
                onClick={() => i18n.changeLanguage(code)}
              >
                {/* Flat square flags (flag-icons, MIT), served from public/img/flags */}
                <img src={`/img/flags/${flagCode}.svg`} alt="" width="16" height="16" />
                <span className="hv3-lang-code">{code.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="hv3-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="hv3-mnav"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <div className="hv3-wrap hv3-mnav" id="hv3-mnav">
        {NAV_ITEMS[tab].map(({ id, label }) => (
          <ScrollLink key={id} to={id} onNavigate={close}>{t(label)}</ScrollLink>
        ))}
        {authLinks}
        {contactBtn}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Botwerx Bot tab: the current home page's content and signup form.
// ---------------------------------------------------------------------------
const HERO_BENEFITS = [
  { key: 'zeroCode', icon: 'fa-wand-magic-sparkles' },
  { key: 'multiChannel', icon: 'fa-comments' },
  { key: 'insights', icon: 'fa-chart-line' },
  { key: 'secure', icon: 'fa-shield-halved' },
];

const SERVICE_ITEMS = [
  { key: 'analytics', icon: 'fa-chart-pie' },
  { key: 'support', icon: 'fa-clock' },
  { key: 'instant', icon: 'fa-bolt' },
  { key: 'qualification', icon: 'fa-filter' },
  { key: 'costs', icon: 'fa-piggy-bank' },
  { key: 'scalable', icon: 'fa-chart-line' },
];

const SLIDER_ITEMS = [
  { img: '/img/icon1.png', key: 'automate' },
  // The live page uses icon2.jpg (white box, invisible on its white band);
  // icon2.png is the same icon with a transparent background.
  { img: '/img/icon2.png', key: 'qualify' },
  { img: '/img/icon3.png', key: 'handle' },
  { img: '/img/icon4.png', key: 'scale' },
  { img: '/img/icon5.png', key: 'personalize' },
  { img: '/img/icon6.png', key: 'freeUp' },
];

// Same behaviour as the live carousel: advance one item every 3s, loop back
// at the halfway point of the duplicated list, pause 5s after user input.
function useAutoScroll(sliderRef) {
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let scrollInterval;
    let resumeTimeout;
    let isUserInteracting = false;

    const step = () => {
      if (isUserInteracting) return;
      if (slider.scrollLeft >= slider.scrollWidth / 2 - 10) {
        slider.scrollTo({ left: 0, behavior: 'instant' });
      }
      const item = slider.querySelector('.hv3-slide');
      const gap = parseFloat(getComputedStyle(slider).columnGap) || 0;
      slider.scrollBy({ left: (item?.offsetWidth || 0) + gap, behavior: 'smooth' });
    };

    const start = () => {
      clearInterval(scrollInterval);
      scrollInterval = setInterval(step, 3000);
    };

    const handleUserInteraction = () => {
      isUserInteracting = true;
      clearInterval(scrollInterval);
      clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        isUserInteracting = false;
        start();
      }, 5000);
    };

    const events = ['touchstart', 'mousedown', 'wheel'];
    events.forEach((ev) => slider.addEventListener(ev, handleUserInteraction, { passive: true }));
    start();

    return () => {
      clearInterval(scrollInterval);
      clearTimeout(resumeTimeout);
      events.forEach((ev) => slider.removeEventListener(ev, handleUserInteraction));
    };
  }, [sliderRef]);
}

function BotwerxBotContent({ t }) {
  const b = (key, opts) => t(`botwerx.${key}`, opts);
  const sliderRef = useRef(null);
  useAutoScroll(sliderRef);

  const faqs = b('faq.items', { returnObjects: true });

  return (
    <>
      {/* ---------------- Hero: benefits + signup form ---------------- */}
      <section className="hv3-bw-hero">
        <div className="hv3-wrap hv3-bw-hero-grid">
          <div>
            <h1>
              {b('hero.title')} <em>{b('hero.titleEm')}</em>
            </h1>
            <div className="hv3-bw-benefits">
              {HERO_BENEFITS.map(({ key, icon }) => (
                <div className="hv3-bw-benefit" key={key}>
                  <h3>{b(`hero.benefits.${key}.title`)}</h3>
                  <div className="hv3-bw-benefit-row">
                    <i className={`fas ${icon} hv3-bw-icon`} aria-hidden="true"></i>
                    <p dangerouslySetInnerHTML={{ __html: b(`hero.benefits.${key}.description`) }}></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The live signup component, unchanged: email check, account
              creation and Stripe checkout all run against getApiUrl(). */}
          <div className="hv3-bw-signup">
            <SignupForm isOpen={true} onClose={() => {}} />
          </div>
        </div>
      </section>

      {/* ---------------- Slider ---------------- */}
      {/* Full-bleed like the live page: a full-width title band over an
          edge-to-edge carousel, with the live page's item sizes. */}
      <section className="hv3-bw-slider-sec" id="hv3-solutions">
        <h2 className="hv3-bw-band">{b('slider.title')}</h2>
        <div ref={sliderRef} className="hv3-slider">
          {/* Listed twice so the auto-scroll can loop seamlessly */}
          {[...SLIDER_ITEMS, ...SLIDER_ITEMS].map(({ img, key }, i) => (
            <div className="hv3-slide" key={i} aria-hidden={i >= SLIDER_ITEMS.length || undefined}>
              <img src={img} alt={b(`slider.items.${key}`)} />
              <p>{b(`slider.items.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Services ---------------- */}
      <section className="hv3-sec hv3-pricing" id="hv3-services">
        <div className="hv3-wrap">
          <div className="hv3-sec-head">
            <h2>{b('services.title')}</h2>
          </div>
          <div className="hv3-bw-cards">
            {SERVICE_ITEMS.map(({ key, icon }) => (
              <div className="hv3-bw-card" key={key}>
                <div className="hv3-bw-card-head">
                  <i className={`fa-solid ${icon} hv3-bw-icon`} aria-hidden="true"></i>
                  <h3>{b(`services.items.${key}.title`)}</h3>
                </div>
                <p dangerouslySetInnerHTML={{ __html: b(`services.items.${key}.description`) }}></p>
              </div>
            ))}
          </div>
          <div className="hv3-bw-cta">
            <ScrollLink to="hv3-contact" className="hv3-btn hv3-btn-p hv3-btn-lg">
              <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
              {b('services.learnMore')}
            </ScrollLink>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="hv3-sec" id="hv3-faq">
        <div className="hv3-wrap hv3-faqg">
          <div>
            <h2>{b('faq.title')}</h2>
          </div>
          <div>
            {(Array.isArray(faqs) ? faqs : []).map((faq, i) => (
              // name= makes these an exclusive accordion, like the live page.
              <details className="hv3-fitem" key={i} name="hv3-faq-bw">
                <summary>{faq.question}</summary>
                <p dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// BidConnect tab: content from bidconnect.app, under the `bidconnect` keys.
// ---------------------------------------------------------------------------
const BIDCONNECT_SIGNUP_URL = 'https://bidconnect.app/signup/';

// Font Awesome (loaded site-wide in index.html): bidding, Salesforce, own web address.
const BIDCONNECT_FEATURE_ICONS = ['fa-solid fa-gavel', 'fa-brands fa-salesforce', 'fa-solid fa-globe'];

// BidConnect logins happen on each organization's own subdomain; Sign In sends
// people to the sign-in box on bidconnect.app's home page, which asks for it.
const BIDCONNECT_SIGNIN_URL = 'https://bidconnect.app/#signin';

const BIDCONNECT_DEMO_VIDEO = '/media/bidconnect-demo.mp4';
const BIDCONNECT_DEMO_POSTER = '/img/bidconnect-demo-poster.jpg';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Tracks the OS/browser "reduce motion" setting, including changes while open.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Silent looping product demo. Reduced-motion users get the poster frame as a
// still image instead of a playing video.
function BidConnectDemoVideo({ label }) {
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) {
    return <img src={BIDCONNECT_DEMO_POSTER} alt={label} width="1920" height="1080" className="hv3-bc-demo" />;
  }

  return (
    <video
      className="hv3-bc-demo"
      src={BIDCONNECT_DEMO_VIDEO}
      poster={BIDCONNECT_DEMO_POSTER}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      width="1920"
      height="1080"
      aria-label={label}
      // React does not always write the muted attribute, and Safari will not
      // autoplay without it. defaultMuted adds the attribute; muted sets the property.
      ref={(v) => { if (v) { v.defaultMuted = true; v.muted = true; } }}
    />
  );
}

function BidConnectContent({ t }) {
  const b = (key, opts) => t(`bidconnect.${key}`, opts);

  const faqs = b('faq.items', { returnObjects: true });
  const plans = b('pricing.plans', { returnObjects: true });

  return (
    <>
      {/* ---------------- Hero + live auction illustration ---------------- */}
      <section className="hv3-hero">
        <div className="hv3-wrap hv3-hero-grid">
          <div>
            <h1>
              {b('hero.titleLead')} <em>{b('hero.titleEm')}</em>
            </h1>
            <p className="hv3-hero-sub">
              {b('hero.subtitle')}{' '}
              {b('hero.storePre')}
              <a href="https://storeconnect.com/" target="_blank" rel="noopener noreferrer">{b('hero.storeLink')}</a>
              {b('hero.storePost')}
            </p>
            <div className="hv3-hero-cta">
              <a href={BIDCONNECT_SIGNUP_URL} className="hv3-btn hv3-btn-p hv3-btn-lg">
                <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
                {b('hero.ctaPrimary')}
              </a>
              <a href={BIDCONNECT_SIGNIN_URL} className="hv3-btn hv3-btn-s hv3-btn-lg">{b('hero.ctaSecondary')}</a>
            </div>
          </div>

          {/* Animated product demo (muted loop); poster only for reduced motion */}
          <div className="hv3-hero-vis">
            <BidConnectDemoVideo label={b('demoVideoLabel')} />
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="hv3-sec hv3-bc-features" id="hv3-product">
        <div className="hv3-wrap">
          <div className="hv3-p3 hv3-bc-p3">
            {BIDCONNECT_FEATURE_ICONS.map((icon, i) => (
              <div key={icon}>
                <i className={`${icon} hv3-bc-ficon`} aria-hidden="true"></i>
                <h3>{b(`features.f${i + 1}Title`)}</h3>
                <p>{b(`features.f${i + 1}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Every participant, not just the winner ---------------- */}
      <section className="hv3-sec hv3-product-sec">
        <div className="hv3-wrap">
          <div className="hv3-sec-head hv3-bc-record">
            <h2>{b('record.title')}</h2>
            <p>{b('record.text')}</p>
          </div>
        </div>
      </section>

      {/* ---------------- How it works ----------------
          Same layout as the V2 mock's steps section. The copy is written for
          this page from facts on bidconnect.app, not taken from that site. */}
      <section className="hv3-sec" id="hv3-how">
        <div className="hv3-wrap">
          <div className="hv3-sec-head hv3-bc-how-head">
            <h2>{b('how.title')}</h2>
            <p>{b('how.intro')}</p>
          </div>
          <div className="hv3-steps hv3-steps-4">
            {[1, 2, 3, 4].map((n) => (
              <div className="hv3-step" key={n}>
                {/* Numbered circle; "Step 01" stays available to screen readers */}
                <div className="hv3-step-head">
                  <div className="hv3-step-circle" aria-hidden="true">{n}</div>
                  <span className="hv3-sr-only">{b(`how.s${n}Num`)}</span>
                  <h3>{b(`how.s${n}Title`)}</h3>
                </div>
                <p>{b(`how.s${n}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Pricing ----------------
          V2's plan cards, three across with no featured tier. Trial goes to the
          contact form (we issue a trial code); Active and Dormant go to
          bidconnect.app's signup. Prices are placeholders from the user. */}
      <section className="hv3-sec hv3-pricing" id="hv3-pricing">
        <div className="hv3-wrap">
          <div className="hv3-sec-head hv3-bc-pricing-head">
            <h2>{b('pricing.title')}</h2>
            <p>{b('pricing.intro')}</p>
          </div>
          <div className="hv3-plans hv3-plans-3">
            {(Array.isArray(plans) ? plans : []).map((plan, i) => (
              <div className="hv3-pl" key={plan.name}>
                <div className="hv3-pl-name">{plan.name}</div>
                <div className="hv3-pl-price">
                  {plan.price}{plan.period && <small>{plan.period}</small>}
                </div>
                <div className="hv3-pl-desc">{plan.desc}</div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6">
                        <path d="M4 10.5l4 4 8-9" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                {i === 0 ? (
                  <ScrollLink to="hv3-contact" className="hv3-btn hv3-btn-p hv3-btn-lg">
                    <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
                    {plan.cta}
                  </ScrollLink>
                ) : (
                  <a href={BIDCONNECT_SIGNUP_URL} className="hv3-btn hv3-btn-p hv3-btn-lg">
                    <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
                    {plan.cta}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Create an organization / sign in ---------------- */}
      <section className="hv3-sec hv3-start-sec" id="hv3-bc-access">
        <div className="hv3-wrap hv3-start-in">
          <div>
            <h2>{b('access.newTitle')}</h2>
            <div className="hv3-hero-cta">
              <a href={BIDCONNECT_SIGNUP_URL} className="hv3-btn hv3-btn-p hv3-btn-lg">
                <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
                {b('access.newCta')}
              </a>
            </div>
          </div>
          <div className="hv3-start-cta">
            <h2>{b('access.signinTitle')}</h2>
            <a href={BIDCONNECT_SIGNIN_URL} className="hv3-btn hv3-btn-p hv3-btn-lg hv3-bc-signin-btn">
              <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
              {b('access.signinCta')}
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="hv3-sec" id="hv3-faq">
        <div className="hv3-wrap hv3-faqg">
          <div>
            <h2>{b('faq.title')}</h2>
          </div>
          <div>
            {(Array.isArray(faqs) ? faqs : []).map((faq, i) => (
              <details className="hv3-fitem" key={i} name="hv3-faq-bc">
                <summary>{faq.question}</summary>
                <p dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Contact form, shared by both tabs: the live home page's form and endpoint.
// ---------------------------------------------------------------------------
const EMPTY_CONTACT = { name: "", email: "", phone: "", company: "", website: "", comments: "" };

function ContactSection({ t }) {
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const handleFormChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    try {
      const apiUrl = `${getApiUrl()}/api/contact`;
      console.log("📡 Calling contact API:", apiUrl);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to send message");
        return;
      }

      setFormSuccess(true);
      setContactForm(EMPTY_CONTACT);
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      console.error("Contact form error:", err);
      setFormError(`❌ ${t('contact.error')}`);
    }
  };

  const field = (name, type, { required = false, textarea = false } = {}) => {
    const id = `hv3-contact-${name}`;
    const props = { id, name, required, value: contactForm[name], onChange: handleFormChange };
    return (
      <div className="hv3-cfield">
        <label htmlFor={id}>{t(`contact.form.${name}`)}:</label>
        {textarea ? <textarea {...props} /> : <input type={type} {...props} />}
      </div>
    );
  };

  return (
    <section className="hv3-contact" id="hv3-contact">
      <div className="hv3-wrap">
        <h2>{t('contact.title')}</h2>
        <form onSubmit={handleContactSubmit} className="hv3-cform">
          <div className="hv3-cform-row">
            {field('name', 'text', { required: true })}
            {field('email', 'email', { required: true })}
          </div>
          <div className="hv3-cform-row">
            {field('phone', 'tel')}
            {field('company', 'text')}
          </div>
          {field('website', 'url')}
          {field('comments', null, { required: true, textarea: true })}

          {formError && <p className="hv3-cform-msg hv3-cform-err" role="alert">{formError}</p>}
          {formSuccess && <p className="hv3-cform-msg hv3-cform-ok" role="status">✅ {t('contact.success')}</p>}

          <button type="submit" className="hv3-btn hv3-btn-p">
            <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
            {t('contact.form.submit')}
          </button>
        </form>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer: the V2 mock's layout (logo + blurb, three link columns, bottom bar)
// with working destinations — this tab's sections, the live app routes, and
// the live footer's legal pages.
// ---------------------------------------------------------------------------
function SiteFooter({ t, tab }) {
  const year = new Date().getFullYear();
  const link = ({ to, route, href, label, text }) => (
    <li key={to || route || href}>
      {href ? <a href={href}>{text}</a>
        : route ? <Link to={route}>{t(label)}</Link>
        : <ScrollLink to={to}>{t(label)}</ScrollLink>}
    </li>
  );
  const columns = [
    { title: 'footer.col1Title', links: [
      ...NAV_ITEMS[tab].filter(({ id }) => id !== 'hv3-top').map(({ id, label }) => ({ to: id, label })),
      { route: '/dashboard', label: 'footer.dashboard' },
    ] },
    { title: 'footer.col3Title', links: [
      { route: '/privacy', label: 'footer.privacy' },
      { route: '/terms-and-conditions', label: 'footer.terms' },
      { route: '/cookies', label: 'footer.cookies' },
      { route: '/data-deletion', label: 'footer.dataDeletion' },
    ] },
    { title: 'footer.col2Title', links: [
      { to: 'hv3-contact', label: 'footer.contact' },
      { href: 'mailto:info@botwerx.ai', text: 'info@botwerx.ai' },
    ] },
  ];

  return (
    <footer className="hv3-footer">
      <div className="hv3-wrap">
        <div className="hv3-fgrid">
          <div>
            <span className="hv3-logo" role="img" aria-label="BotWerx"></span>
            <p className="hv3-fblurb hv3-faddr">{t('footer.address')}</p>
          </div>
          {columns.map(({ title, links }) => (
            <div key={title}>
              <h4>{t(title)}</h4>
              <ul>{links.map(link)}</ul>
            </div>
          ))}
        </div>
        <div className="hv3-fbot">
          <span>© {year}. {t('footer.allRightsReserved')}.</span>
          <span>
            {t('footer.poweredByPre')}{' '}
            <a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer">{t('footer.poweredByLink')}</a>.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function HomeV3() {
  const { t, i18n } = useTranslation('homev3');
  const lang = i18n.language?.split('-')[0] || 'en';
  useFavicon(FAVICON);

  // The active tab lives in ?tab= so a refresh or a shared link keeps it.
  // BidConnect is the default; anything unrecognised falls back to it.
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : TABS[0];
  const tabRefs = useRef({});

  const selectTab = (next) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', next);
      return params;
    }, { replace: true });
  };

  // Left/Right arrows move between tabs, per the WAI-ARIA tabs pattern.
  const onTabKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length];
    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div id="hv3-top" className="hv3-page">
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Helmet>

      <SiteHeader t={t} i18n={i18n} lang={lang} tab={tab} />

      {/* ---------------- Product tabs ----------------
          Switches everything from the hero down to the FAQ. The contact form
          and footer below are shared by both tabs. */}
      <div className="hv3-tabbar">
        <div className="hv3-wrap">
          <p className="hv3-tabs-heading" id="hv3-tabs-heading">{t('tabs.heading')}</p>
          <div className="hv3-tabs" role="tablist" aria-labelledby="hv3-tabs-heading">
            {TABS.map((id) => (
              <button
                key={id}
                ref={(el) => { tabRefs.current[id] = el; }}
                type="button"
                role="tab"
                id={`hv3-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="hv3-tabpanel"
                tabIndex={tab === id ? 0 : -1}
                className="hv3-tab"
                onClick={() => selectTab(id)}
                onKeyDown={onTabKeyDown}
              >
                {t(`tabs.${id}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="hv3-tabpanel" role="tabpanel" aria-labelledby={`hv3-tab-${tab}`}>
        {tab === 'bidconnect' ? <BidConnectContent t={t} /> : <BotwerxBotContent t={t} />}
      </div>

      <ContactSection t={t} />
      <SiteFooter t={t} tab={tab} />
    </div>
  );
}
