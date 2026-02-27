import { useState } from "react";
import { useTranslation } from "react-i18next";
import SignupForm from "../components/SignupForm";
import { getApiUrl } from "../utils/getApiUrl";
import "../styles/Agent.css";

export default function Agent() {
  const { t } = useTranslation('agent');

  // Contact form
  const [contactForm, setContactForm] = useState({
    firstName: "", lastName: "", email: "",
    company: "", role: "", phone: "", country: ""
  });
  const [contactSending, setContactSending] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactIsError, setContactIsError] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSending(true);
    setContactMessage("");
    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${contactForm.firstName} ${contactForm.lastName}`,
          email: contactForm.email,
          company: contactForm.company,
          phone: contactForm.phone,
          comments: `${t('contact.form.role')}: ${contactForm.role} | ${t('contact.form.country')}: ${contactForm.country}`
        }),
      });
      if (!res.ok) throw new Error();
      setContactIsError(false);
      setContactMessage(t('contact.form.success'));
      setContactForm({ firstName: "", lastName: "", email: "", company: "", role: "", phone: "", country: "" });
      setTimeout(() => setContactMessage(""), 5000);
    } catch {
      setContactIsError(true);
      setContactMessage(t('contact.form.error'));
    } finally {
      setContactSending(false);
    }
  };

  const starterFeatures = t('pricing.starter.features', { returnObjects: true });
  const premiumFeatures = t('pricing.premium.features', { returnObjects: true });
  const contactBullets = t('contact.bullets', { returnObjects: true });
  const countries = ['MX', 'US', 'CO', 'AR', 'ES', 'CL', 'PE', 'OTHER'];

  const handleLaunchChat = () => {
    if (document.getElementById('botwerx-demo-chat')) return;
    const script = document.createElement('script');
    script.id = 'botwerx-demo-chat';
    script.src = 'https://chat.botwerx.ai/chatbot.js?id=72';
    document.head.appendChild(script);
  };

  return (
    <div className="agent-page">

      {/* ===== HERO ===== */}
      <section className="agent-hero">
        <div className="agent-container">
          <div className="agent-hero-content">
            <h1>{t('hero.title')}</h1>
            <p>{t('hero.subtitle')}</p>
            <div className="agent-hero-badges">
              <span className="badge">
                <i className="fa-solid fa-bolt"></i> {t('hero.badgeReady')}
              </span>
              <span className="badge">
                <i className="fa-solid fa-shield-halved"></i> {t('hero.badgeSecurity')}
              </span>
              <span className="badge">
                <i className="fa-solid fa-clock"></i> {t('hero.badge247')}
              </span>
            </div>
            <a href="#pricing" className="btn-green">{t('hero.cta')}</a>
          </div>

          {/* Chat mockup */}
          <div className="agent-hero-chat">
            <div className="agent-chat-window" onClick={handleLaunchChat} style={{ cursor: "pointer" }}>
              <div className="agent-chat-header">
                <div className="agent-chat-avatar">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className="agent-chat-header-info">
                  <h4>{t('chat.name')}</h4>
                  <span><i className="fa-solid fa-circle" style={{ color: "#22c55e", fontSize: "0.5rem", marginRight: "0.3em" }}></i>{t('chat.online')}</span>
                </div>
              </div>
              <div className="agent-chat-body">
                <div className="chat-bubble bot">{t('chat.bubble1')}</div>
                <div className="chat-bubble user">{t('chat.bubble2')}</div>
                <div className="chat-bubble bot">{t('chat.bubble3')}</div>
                <div className="chat-bubble user">{t('chat.bubble4')}</div>
                <div className="chat-bubble bot">{t('chat.bubble5')}</div>
              </div>
              <div className="agent-chat-input">
                <span>{t('chat.inputPlaceholder')}</span>
                <i className="fa-solid fa-paper-plane"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="agent-features">
        <div className="agent-container">
          <h2 className="agent-section-title">{t('features.title')}</h2>
          <p className="agent-section-subtitle">{t('features.subtitle')}</p>
          <div className="agent-features-grid">
            <div className="agent-feature-card">
              <div className="agent-feature-icon blue">
                <i className="fa-solid fa-rocket"></i>
              </div>
              <h3>{t('features.install.title')}</h3>
              <p>{t('features.install.description')}</p>
            </div>
            <div className="agent-feature-card">
              <div className="agent-feature-icon amber">
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <h3>{t('features.leads.title')}</h3>
              <p>{t('features.leads.description')}</p>
            </div>
            <div className="agent-feature-card">
              <div className="agent-feature-icon green">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <h3>{t('features.calendar.title')}</h3>
              <p>{t('features.calendar.description')}</p>
            </div>
            <div className="agent-feature-card">
              <div className="agent-feature-icon blue">
                <i className="fa-solid fa-clock"></i>
              </div>
              <h3>{t('features.always.title')}</h3>
              <p>{t('features.always.description')}</p>
            </div>
            <div className="agent-feature-card">
              <div className="agent-feature-icon amber">
                <i className="fa-solid fa-comments"></i>
              </div>
              <h3>{t('features.channels.title')}</h3>
              <p>{t('features.channels.description')}</p>
            </div>
            <div className="agent-feature-card">
              <div className="agent-feature-icon green">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <h3>{t('features.dashboard.title')}</h3>
              <p>{t('features.dashboard.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECURITY ===== */}
      <section className="agent-security">
        <div className="agent-container">
          <h2 className="agent-section-title">{t('security.title')}</h2>
          <p className="agent-section-subtitle">{t('security.subtitle')}</p>
          <div className="agent-security-content">
            <div className="agent-security-list">
              <div className="agent-security-item">
                <div className="agent-security-item-icon">
                  <i className="fa-solid fa-lock"></i>
                </div>
                <div>
                  <h4>{t('security.encryption.title')}</h4>
                  <p>{t('security.encryption.description')}</p>
                </div>
              </div>
              <div className="agent-security-item">
                <div className="agent-security-item-icon">
                  <i className="fa-solid fa-user-check"></i>
                </div>
                <div>
                  <h4>{t('security.validation.title')}</h4>
                  <p>{t('security.validation.description')}</p>
                </div>
              </div>
              <div className="agent-security-item">
                <div className="agent-security-item-icon">
                  <i className="fa-solid fa-clipboard-list"></i>
                </div>
                <div>
                  <h4>{t('security.audit.title')}</h4>
                  <p>{t('security.audit.description')}</p>
                </div>
              </div>
              <div className="agent-security-item">
                <div className="agent-security-item-icon">
                  <i className="fa-solid fa-eye-slash"></i>
                </div>
                <div>
                  <h4>{t('security.zeroAccess.title')}</h4>
                  <p>{t('security.zeroAccess.description')}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="agent-pricing" id="pricing">
        <div className="agent-container">
          <h2 className="agent-section-title">{t('pricing.title')}</h2>
          <p className="agent-section-subtitle">{t('pricing.subtitle')}</p>
          <div className="agent-pricing-layout">
            <div className="agent-pricing-plans">
              {/* Starter */}
              <div className="agent-plan-card">
                <h3>{t('pricing.starter.name')}</h3>
                <div className="agent-plan-price">{t('pricing.starter.price')} <span>{t('pricing.starter.currency')}</span></div>
                <div className="agent-plan-period">{t('pricing.starter.period')}</div>
                <ul className="agent-plan-features">
                  {Array.isArray(starterFeatures) && starterFeatures.map((feat, i) => (
                    <li key={i}><i className="fa-solid fa-check"></i> {feat}</li>
                  ))}
                </ul>
                <button className="btn-green">{t('pricing.starter.cta')}</button>
              </div>

              {/* Premium */}
              <div className="agent-plan-card popular">
                <span className="agent-plan-badge">{t('pricing.premium.badge')}</span>
                <h3>{t('pricing.premium.name')}</h3>
                <div className="agent-plan-price">{t('pricing.premium.price')} <span>{t('pricing.premium.currency')}</span></div>
                <div className="agent-plan-period">{t('pricing.premium.period')}</div>
                <ul className="agent-plan-features">
                  {Array.isArray(premiumFeatures) && premiumFeatures.map((feat, i) => (
                    <li key={i}><i className="fa-solid fa-check"></i> {feat}</li>
                  ))}
                </ul>
                <button className="btn-green">{t('pricing.premium.cta')}</button>
              </div>
            </div>
          </div>

          {/* Signup form — reuses the same component from the homepage */}
          <div className="agent-pricing-signup">
            <SignupForm isOpen={true} onClose={() => {}} allowedLevels={['mls']} />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="agent-cta">
        <div className="agent-container">
          <h2>{t('cta.title')}</h2>
          <div className="agent-cta-buttons">
            <a href="#pricing" className="btn-green">{t('cta.primary')}</a>
            <a href="#contact" className="btn-outline">{t('cta.secondary')}</a>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="agent-contact" id="contact">
        <div className="agent-container">
          <div className="agent-contact-layout">
            <div className="agent-contact-info">
              <h2>{t('contact.title')}</h2>
              <p>{t('contact.subtitle')}</p>
              <ul className="agent-contact-bullets">
                {Array.isArray(contactBullets) && contactBullets.map((bullet, i) => (
                  <li key={i}>
                    <i className="fa-solid fa-circle-check"></i>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <form className="agent-contact-form" onSubmit={handleContactSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('contact.form.firstName')}</label>
                  <input
                    type="text"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    placeholder={t('contact.form.firstNamePlaceholder')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('contact.form.lastName')}</label>
                  <input
                    type="text"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    placeholder={t('contact.form.lastNamePlaceholder')}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('contact.form.email')}</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder={t('contact.form.emailPlaceholder')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('contact.form.company')}</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder={t('contact.form.companyPlaceholder')}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('contact.form.role')}</label>
                  <input
                    type="text"
                    value={contactForm.role}
                    onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                    placeholder={t('contact.form.rolePlaceholder')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('contact.form.phone')}</label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder={t('contact.form.phonePlaceholder')}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "1em" }}>
                <label>{t('contact.form.country')}</label>
                <select
                  value={contactForm.country}
                  onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                >
                  <option value="">{t('contact.form.countryPlaceholder')}</option>
                  {countries.map((code) => (
                    <option key={code} value={code}>{t(`contact.countries.${code}`)}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-green" disabled={contactSending}>
                {contactSending ? t('contact.form.sending') : t('contact.form.submit')}
              </button>
              {contactMessage && (
                <p style={{
                  textAlign: "center",
                  marginTop: "0.75em",
                  fontSize: "0.9rem",
                  color: contactIsError ? "#dc3545" : "#22c55e",
                  fontWeight: 600
                }}>
                  {contactMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="agent-footer">
        <div className="agent-container">
          <div className="agent-footer-content">
            <div className="agent-footer-brand">
              <h3><i className="fa-solid fa-robot" style={{ marginRight: "0.4em" }}></i>{t('footer.brand')}</h3>
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
    </div>
  );
}
