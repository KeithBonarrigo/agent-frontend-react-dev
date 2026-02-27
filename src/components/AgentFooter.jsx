import { useTranslation } from "react-i18next";
import "../styles/Agent.css";

export default function AgentFooter() {
  const { t } = useTranslation('agent');

  return (
    <footer className="agent-footer">
      <div className="agent-container">
        <div className="agent-footer-content">
          <div className="agent-footer-brand">
            <img src="/img/logos/propel-agent-black.png" alt="PropelAgent" className="agent-footer-logo" />
            <p>{t('footer.tagline')}</p>
          </div>
          <div className="agent-footer-links">
            <div className="agent-footer-col">
              <h4>{t('footer.product')}</h4>
              <ul>
                <li><a href="#pricing">{t('footer.productLinks.pricing')}</a></li>
                <li><a href="#contact">{t('footer.productLinks.demo')}</a></li>
                <li><a href="#pricing">{t('footer.productLinks.signup')}</a></li>
              </ul>
            </div>
            <div className="agent-footer-col">
              <h4>{t('footer.legal')}</h4>
              <ul>
                <li><a href="/privacy">{t('footer.legalLinks.privacy')}</a></li>
                <li><a href="/terms-and-conditions">{t('footer.legalLinks.terms')}</a></li>
                <li><a href="/cookies">{t('footer.legalLinks.cookies')}</a></li>
              </ul>
            </div>
            <div className="agent-footer-col">
              <h4>{t('footer.contactTitle')}</h4>
              <ul>
                <li><a href="mailto:info@aibridge.mx">{t('footer.contactLinks.email')}</a></li>
                <li><a href="#contact">{t('footer.contactLinks.expert')}</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="agent-footer-bottom">
          &copy; {new Date().getFullYear()} PropelAgent by <a href="https://aibridge.global" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>AI Bridge</a>. {t('footer.allRightsReserved')}
        </div>
      </div>
    </footer>
  );
}
