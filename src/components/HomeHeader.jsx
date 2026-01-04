import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function HomeHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUser();

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

  return (
    <header className="home-header">
      <nav className="home-nav">
        <div className="home-logo">
          <Link to="/">
            <img src="/img/AI-Bridge-Logo-Med2.png" alt="AI Bridge" />
          </Link>
        </div>

        <ul className="home-nav-links">
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