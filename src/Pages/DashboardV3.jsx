import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/HomeV3.css";        // the shared V3 header and footer classes (hv3-navbar, hv3-logo, hv3-footer)
import "../styles/DashboardV3.css";   // the dashboard's own V3 frame; every rule is scoped to .dv3-page

// V3 frame for the logged-in dashboard: the site's header (new BotWerx logo,
// EN/ES toggle), footer and navy page around Dashboard.jsx, which renders inside
// `children` unchanged. DashboardV3.css restyles its cards, bars and tabs.
//
// The root is .dv3-page, not .hv3-page: .hv3-page turns headings white and
// resets text for the dark marketing pages, which would wash out the
// dashboard's light cards. Used from App.jsx on BotWerx domains.
// Rollback: point the /dashboard route back at <Dashboard />
// (see plans/2026-10-12-dashboard-v3-style.md).

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

// Same approach as HomeV3/LoginV3/LegalV3: DomainContext rewrites the favicon
// after mount, so hold ours while this page is open and restore the links on unmount.
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

export default function DashboardV3({ children }) {
  const { t, i18n } = useTranslation('homev3');
  const lang = i18n.language?.split('-')[0] || 'en';
  useFavicon(FAVICON);

  return (
    <div className="dv3-page">
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

      {/* A div, not <main>: HomeLayout already wraps every route in <main>. */}
      <div className="dv3-main">{children}</div>

      {/* ---------------- Footer: legal links, then the address and Claude notice the old footer showed ---------------- */}
      <footer className="hv3-footer hv3-auth-footer">
        <div className="hv3-wrap">
          <div className="hv3-fbot">
            <span>© {new Date().getFullYear()}. {t('footer.allRightsReserved')}.</span>
            <span className="hv3-auth-legal">
              {LEGAL_LINKS.map(({ to, label }) => (
                <Link key={to} to={to}>{t(label)}</Link>
              ))}
            </span>
          </div>
          <div className="hv3-fbot dv3-fbot-sub">
            <span>{t('footer.address')}</span>
            <span>
              {t('footer.poweredByPre')}{' '}
              <a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer">{t('footer.poweredByLink')}</a>.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
