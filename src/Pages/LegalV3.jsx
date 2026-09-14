import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/HomeV3.css";  // the V3 look; legal-page rules are at the end of the file

// V3 frame for the existing legal pages (Privacy, TermsAndConditions,
// CookiePolicy, DataDeletion). Those components render inside `children` unchanged — the legal
// text still lives only in them and legal.json — and HomeV3.css restyles their
// shared policy-* markup under .hv3-legal. Used from App.jsx on BotWerx domains.

const FAVICON = '/img/favicon-botwerx-blue-rounded.png?v=2';

const LANGUAGES = [
  { code: 'en', flagCode: 'us', fullName: 'English' },
  { code: 'es', flagCode: 'es', fullName: 'Español' },
];

const LEGAL_LINKS = [
  { to: '/privacy', label: 'footer.privacy' },
  { to: '/terms-and-conditions', label: 'footer.terms' },
  { to: '/cookies', label: 'footer.cookies' },
  { to: '/data-deletion', label: 'footer.dataDeletion' },
];

// Same approach as HomeV3/LoginV3: DomainContext rewrites the favicon after
// mount, so hold ours while this page is open and restore the links on unmount.
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

export default function LegalV3({ children }) {
  const { t, i18n } = useTranslation('homev3');
  const lang = i18n.language?.split('-')[0] || 'en';
  const { pathname } = useLocation();
  useFavicon(FAVICON);

  return (
    <div className="hv3-page hv3-auth-page hv3-legal-page">
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

      <main className="hv3-legal">{children}</main>

      {/* ---------------- Footer bar with the legal links ---------------- */}
      <footer className="hv3-footer hv3-auth-footer">
        <div className="hv3-wrap">
          <div className="hv3-fbot">
            <span>© {new Date().getFullYear()}. {t('footer.allRightsReserved')}.</span>
            <span className="hv3-auth-legal">
              {LEGAL_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} aria-current={pathname === to ? 'page' : undefined}>{t(label)}</Link>
              ))}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
