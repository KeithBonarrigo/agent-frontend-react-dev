import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { useUser } from "../contexts/UserContext";
import "../styles/HomeV3.css";  // shares the V3 home page's styles

// Login page in the V3 home page's style, served at /login on BotWerx domains
// (the pre-V3 Login.jsx stays at /legacy/login). UserContext.login() then
// /dashboard, and the live password-reset route. "Create Account" goes to the
// home page's sign-up form, where accounts are created with a plan (the old
// in-page box posted to /api/signup, which the backend never had). Text lives
// under `login` in the homev3 namespace.

const FAVICON = '/img/favicon-botwerx-blue-rounded.png?v=2';

const LANGUAGES = [
  { code: 'en', flagCode: 'us', fullName: 'English' },
  { code: 'es', flagCode: 'es', fullName: 'Español' },
];

// The home page's sign-up form (Botwerx Bot tab); HomeV3 scrolls to the hash.
const SIGNUP_URL = '/?tab=botwerx#hv3-signup';

// Same approach as HomeV3: DomainContext rewrites the favicon after mount, so
// hold our icon while this page is open and restore the links on unmount.
function useFavicon(href) {
  useEffect(() => {
    const originals = new Map();
    const apply = () => {
      document.querySelectorAll('link[rel~="icon"]').forEach((link) => {
        const current = link.getAttribute('href');
        if (current === href) return;
        originals.set(link, current);
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

function Field({ id, label, ...inputProps }) {
  return (
    <div className="hv3-cfield">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...inputProps} />
    </div>
  );
}

export default function LoginV3() {
  const { t, i18n } = useTranslation('homev3');
  const l = (key) => t(`login.${key}`);
  const lang = i18n.language?.split('-')[0] || 'en';
  useFavicon(FAVICON);

  const navigate = useNavigate();
  const { login } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || l('errors.serverError'));
    }
  };

  return (
    <div className="hv3-page hv3-auth-page">
      <Helmet>
        <title>{l('meta.title')}</title>
      </Helmet>

      {/* ---------------- Header: logo back to the home page, language toggle ---------------- */}
      <div className="hv3-navbar">
        <div className="hv3-wrap hv3-nav-in hv3-auth-nav">
          <Link to="/" className="hv3-logo-link" aria-label={l('backHome')}>
            <span className="hv3-logo" role="img" aria-label="BotWerx"></span>
          </Link>
          <div className="hv3-nav-right">
            <Link to="/" className="hv3-nav-a hv3-auth-back">{l('backHome')}</Link>
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
                  <img src={`/img/flags/${flagCode}.svg`} alt="" width="16" height="16" />
                  <span className="hv3-lang-code">{code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Login / create account card ---------------- */}
      <main className="hv3-auth">
        <div className="hv3-auth-card">
          <h1>{l('pageTitle.login')}</h1>

          <form onSubmit={handleLogin} className="hv3-auth-form">
            <Field id="hv3-login-email" label={l('placeholders.email')} type="email" name="email"
              autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field id="hv3-login-password" label={l('placeholders.password')} type="password" name="password"
              autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />

            <div className="hv3-auth-forgot">
              <a href="/password-reset/request">{l('links.forgotPassword')}</a>
            </div>

            {error && <p className="hv3-cform-msg hv3-cform-err" role="alert">{error}</p>}

            <button type="submit" className="hv3-btn hv3-btn-p hv3-btn-lg hv3-auth-submit">
              <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
              {l('buttons.logIn')}
            </button>
          </form>

          {/* Accounts are created on the home page's sign-up form, with a plan */}
          <p className="hv3-auth-toggle">
            {l('prompts.noAccount')}{' '}
            <button type="button" onClick={() => navigate(SIGNUP_URL)}>
              {l('buttons.createAccount')}
            </button>
          </p>
        </div>
      </main>

      {/* ---------------- Footer bar, same style as the V3 home page ---------------- */}
      <footer className="hv3-footer hv3-auth-footer">
        <div className="hv3-wrap">
          <div className="hv3-fbot">
            <span>© {new Date().getFullYear()}. {t('footer.allRightsReserved')}.</span>
            <span className="hv3-auth-legal">
              <Link to="/privacy">{t('footer.privacy')}</Link>
              <Link to="/terms-and-conditions">{t('footer.terms')}</Link>
              <Link to="/cookies">{t('footer.cookies')}</Link>
              <Link to="/data-deletion">{t('footer.dataDeletion')}</Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
