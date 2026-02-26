import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser } from "../contexts/UserContext";
import { useDomain } from "../contexts/DomainContext";

export default function HomeHeader() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUser();
  const { domainInfo, companyName } = useDomain();

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // If you're not currently on "/", navigate home first, then scroll
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      navigate("/");

      // wait for Home to render, then scroll
      setTimeout(() => scrollToSection(sectionId), 50);
      return;
    }

    scrollToSection(sectionId);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Determine which logo to display based on domain
  const getLogoConfig = () => {
    const hostname = domainInfo?.hostname || window.location.hostname;

    if (hostname === 'localhost' || hostname?.includes('propel')) {
      return {
        src: '/img/logos/propel-agent-white.png',
        alt: 'PropelAgent',
        className: 'propel-logo'
      };
    }

    if (hostname?.includes('aibridge.global') || hostname?.includes('base')) {
      return {
        src: '/img/AI-Bridge-Logo-Med2.png',
        alt: companyName
      };
    }

    // Default logo (BotWerx) for all other domains
    return {
      src: '/img/logo-botwerx.jpeg',
      alt: companyName
    };
  };

  const logoConfig = getLogoConfig();
  const isPropel = logoConfig.className === 'propel-logo';

  return (
    <header className="home-header">
      <nav className="home-nav">
        <div className="home-logo">
          <Link to="/">
            <img src={logoConfig.src} alt={logoConfig.alt} className={logoConfig.className || ''} />
          </Link>
          {isPropel && (
            <span className="propel-byline">By <a href="https://aibridge.global" target="_blank" rel="noopener noreferrer">AI Bridge</a></span>
          )}
        </div>

        <ul className="home-nav-links">
          <li>
            <a href="/" onClick={(e) => handleNavClick(e, "home-hero")}>
              {t('navigation.home')}
            </a>
          </li>
          {!isPropel && (
            <>
              {/* Changed link text from "Services" to "Benefits" to better describe the section content
                  The section showcases benefits of AI agents rather than listing services offered */}
              <li>
                <a href="#services" onClick={(e) => handleNavClick(e, "services")}>
                  {t('navigation.benefits')}
                </a>
              </li>
              <li>
                <a href="#solutions" onClick={(e) => handleNavClick(e, "solutions")}>
                  {t('navigation.solutions')}
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => handleNavClick(e, "faq")}>
                  {t('navigation.faq')}
                </a>
              </li>
            </>
          )}

          {/* Auth Links */}
          {isLoggedIn ? (
            <>
              {!isPropel && (
                <li>
                  <Link to="/agent">Agent</Link>
                </li>
              )}
              <li>
                <Link to="/dashboard">{t('navigation.myDashboard')}</Link>
              </li>
              <li>
                <a href="#" onClick={handleLogout} style={{ color: "#dc3545" }}>
                  {t('navigation.logOut')}
                </a>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login">{t('navigation.logIn')}</Link>
            </li>
          )}
        </ul>

        <a href="#contact" className="home-btn" onClick={(e) => handleNavClick(e, "contact")}>
          {t('navigation.contactUs')}
        </a>
      </nav>
    </header>
  );
}