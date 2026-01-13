import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useDomain } from "../contexts/DomainContext";

export default function HomeHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUser();
  const { domainInfo, companyName } = useDomain();

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
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
    const hostname = domainInfo?.hostname;

    if (hostname === 'botwerx.ai' || hostname?.includes('botwerx.ai')) {
      console.log("🎨 Using BotWerx logo for domain:", hostname);
      return {
        src: '/img/logo-botwerx.jpeg',
        alt: companyName
      };
    }

    // Default logo for all other domains
    console.log("🎨 Using default AI Bridge logo for domain:", hostname);
    return {
      src: '/img/AI-Bridge-Logo-Med2.png',
      alt: companyName
    };
  };

  const logoConfig = getLogoConfig();

  return (
    <header className="home-header">
      <nav className="home-nav">
        <div className="home-logo">
          <Link to="/">
            <img src={logoConfig.src} alt={logoConfig.alt} />
          </Link>
        </div>

        <ul className="home-nav-links">
          <li>
            <a href="/" onClick={(e) => handleNavClick(e, "home-hero")}>
              Home
            </a>
          </li>
          <li>
            <a href="#services" onClick={(e) => handleNavClick(e, "services")}>
              Services
            </a>
          </li>
          <li>
            <a href="#solutions" onClick={(e) => handleNavClick(e, "solutions")}>
              Solutions
            </a>
          </li>
          <li>
            <a href="#faq" onClick={(e) => handleNavClick(e, "faq")}>
              FAQ
            </a>
          </li>
          <li>
            <a href="#contact" onClick={(e) => handleNavClick(e, "contact")}>
              Contact
            </a>
          </li>
          
          {/* Auth Links */}
          {isLoggedIn ? (
            <>
              <li>
                <Link to="/dashboard">My Dashboard</Link>
              </li>
              <li>
                <a href="#" onClick={handleLogout} style={{ color: "#dc3545" }}>
                  Log Out
                </a>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login">Log In</Link>
            </li>
          )}
        </ul>

        <a href="#contact" className="home-btn" onClick={(e) => handleNavClick(e, "contact")}>
          Contact Us
        </a>
      </nav>
    </header>
  );
}