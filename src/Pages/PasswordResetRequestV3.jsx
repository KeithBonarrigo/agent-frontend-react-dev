import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { getApiUrl } from "../utils/getApiUrl";
import "../styles/HomeV3.css";  // shares the V3 home page's styles

// "Forgot password?" page in the V3 style, served at /password-reset/request on
// BotWerx domains (other domains keep PasswordResetRequest.jsx). Same behaviour
// as that page: POST the email to /api/password-reset/request, then show the
// "check your email" message. Text lives under `login.reset` in homev3.

const FAVICON = '/img/favicon-botwerx-blue-rounded.png?v=2';

const LANGUAGES = [
  { code: 'en', flagCode: 'us', fullName: 'English' },
  { code: 'es', flagCode: 'es', fullName: 'Español' },
];

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

export default function PasswordResetRequestV3() {
  const { t, i18n } = useTranslation('homev3');
  const l = (key) => t(`login.${key}`);
  const lang = i18n.language?.split('-')[0] || 'en';
  useFavicon(FAVICON);

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${getApiUrl()}/api/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || l('errors.resetFailed'));
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(l('errors.serverErrorRetry'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hv3-page hv3-auth-page">
      <Helmet>
        <title>{l('reset.meta.title')}</title>
      </Helmet>

      {/* ---------------- Header: logo back to the home page, language toggle ---------------- */}
      <div className="hv3-navbar">
        <div className="hv3-wrap hv3-nav-in hv3-auth-nav">
          <Link to="/" className="hv3-logo-link" aria-label={t('shell.backHome')}>
            <span className="hv3-logo" role="img" aria-label="BotWerx"></span>
          </Link>
          <div className="hv3-nav-right">
            <Link to="/" className="hv3-nav-a hv3-auth-back">{t('shell.backHome')}</Link>
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

      {/* ---------------- Request form, then the "check your email" message ---------------- */}
      <main className="hv3-auth">
        <div className="hv3-auth-card">
          {submitted ? (
            <div role="status">
              <h1>{l('reset.checkEmailTitle')}</h1>
              <p className="hv3-auth-lede">
                <Trans
                  t={t}
                  i18nKey="login.reset.checkEmailMessage"
                  values={{ email }}
                  components={{ strong: <strong /> }}
                />
              </p>
              <p className="hv3-auth-note">{l('reset.checkSpam')}</p>
            </div>
          ) : (
            <>
              <h1>{l('reset.title')}</h1>
              <p className="hv3-auth-lede">{l('reset.description')}</p>

              <form onSubmit={handleSubmit} className="hv3-auth-form">
                <div className="hv3-cfield">
                  <label htmlFor="hv3-reset-email">{l('placeholders.email')}</label>
                  <input id="hv3-reset-email" type="email" name="email" autoComplete="email"
                    required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                {error && <p className="hv3-cform-msg hv3-cform-err" role="alert">{error}</p>}

                <button type="submit" className="hv3-btn hv3-btn-p hv3-btn-lg hv3-auth-submit" disabled={loading}>
                  <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
                  {loading ? l('reset.sending') : l('reset.send')}
                </button>
              </form>
            </>
          )}

          <p className="hv3-auth-toggle">
            <Link to="/login">{l('reset.backToLogin')}</Link>
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
