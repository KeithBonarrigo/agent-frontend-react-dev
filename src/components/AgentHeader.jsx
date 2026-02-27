import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser } from "../contexts/UserContext";
import "../styles/Agent.css";

export default function AgentHeader() {
  const { t } = useTranslation('agent');
  const { isLoggedIn, logout } = useUser();
  const navigate = useNavigate();

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
    <header className="agent-header">
      <nav className="agent-header-nav">
        <div className="agent-header-logo">
          <Link to="/">
            <img src="/img/logos/propel-agent-white.png" alt="PropelAgent" />
          </Link>
          <span className="agent-header-byline">By <a href="https://aibridge.global" target="_blank" rel="noopener noreferrer">AI Bridge</a></span>
        </div>

        <div className="agent-header-actions">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="agent-header-link">
                {t('header.dashboard')}
              </Link>
              <a href="#" onClick={handleLogout} className="agent-header-link" style={{ color: "#dc3545" }}>
                {t('header.logOut')}
              </a>
            </>
          ) : (
            <Link to="/login" className="agent-header-link">
              {t('header.logIn')}
            </Link>
          )}

          <a href="#contact" className="agent-header-link">
            <i className="fa-regular fa-comment-dots"></i> {t('header.demo')}
          </a>
          <a href="#contact" className="agent-header-btn-outline">
            {t('header.expert')}
          </a>
          <a href="#pricing" className="agent-header-btn-green">
            {t('header.cta')}
          </a>
        </div>
      </nav>
    </header>
  );
}
