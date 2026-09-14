import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { useUser } from "../contexts/UserContext";
import { getApiUrl } from "../utils/getApiUrl";
import "../styles/HomeV3.css";  // shares the V3 home page's styles

// Login page in the V3 home page's style, served at /login on BotWerx domains
// (the pre-V3 Login.jsx stays at /legacy/login). Same behaviour as Login.jsx:
// UserContext.login() then /dashboard, /api/signup for new accounts, and the
// live password-reset route. Text lives under `login` in the homev3 namespace.

const FAVICON = '/img/favicon-botwerx-blue-rounded.png?v=2';

const LANGUAGES = [
  { code: 'en', flagCode: 'us', fullName: 'English' },
  { code: 'es', flagCode: 'es', fullName: 'Español' },
];

const EMPTY_SIGNUP = { email: "", password: "", confirmPassword: "", firstName: "", lastName: "" };

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
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState(EMPTY_SIGNUP);
  const [signupSuccess, setSignupSuccess] = useState(false);

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

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (signupData.password !== signupData.confirmPassword) {
      setError(l('errors.passwordMismatch'));
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
          first_name: signupData.firstName,
          last_name: signupData.lastName,
        }),
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || l('errors.signupFailed'));
        return;
      }

      setSignupSuccess(true);
      setTimeout(() => {
        setShowSignup(false);
        setSignupSuccess(false);
        setSignupData(EMPTY_SIGNUP);
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(l('errors.serverError'));
    }
  };

  const toggleSignup = () => {
    setShowSignup(!showSignup);
    setError("");
    setSignupSuccess(false);
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
          <h1>{showSignup ? l('pageTitle.createAccount') : l('pageTitle.login')}</h1>

          {!showSignup && (
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
          )}

          {showSignup && (signupSuccess ? (
            <div className="hv3-auth-success" role="status">
              <h2>{l('success.accountCreated')}</h2>
              <p>{l('success.switchingToLogin')}</p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="hv3-auth-form">
              <div className="hv3-cform-row">
                <Field id="hv3-signup-first" label={l('placeholders.firstName')} type="text" name="firstName"
                  autoComplete="given-name" required value={signupData.firstName} onChange={handleSignupChange} />
                <Field id="hv3-signup-last" label={l('placeholders.lastName')} type="text" name="lastName"
                  autoComplete="family-name" required value={signupData.lastName} onChange={handleSignupChange} />
              </div>
              <Field id="hv3-signup-email" label={l('placeholders.email')} type="email" name="email"
                autoComplete="email" required value={signupData.email} onChange={handleSignupChange} />
              <Field id="hv3-signup-password" label={l('placeholders.password')} type="password" name="password"
                autoComplete="new-password" required value={signupData.password} onChange={handleSignupChange} />
              <Field id="hv3-signup-confirm" label={l('placeholders.confirmPassword')} type="password" name="confirmPassword"
                autoComplete="new-password" required value={signupData.confirmPassword} onChange={handleSignupChange} />

              {error && <p className="hv3-cform-msg hv3-cform-err" role="alert">{error}</p>}

              <button type="submit" className="hv3-btn hv3-btn-p hv3-btn-lg hv3-auth-submit">
                <img src="/img/botwerx-icon.png" alt="" className="hv3-btn-icon" />
                {l('buttons.createAccount')}
              </button>
            </form>
          ))}

          <p className="hv3-auth-toggle">
            {showSignup ? l('prompts.hasAccount') : l('prompts.noAccount')}{' '}
            <button type="button" onClick={toggleSignup}>
              {showSignup ? l('buttons.logIn') : l('buttons.createAccount')}
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
