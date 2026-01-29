import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import SignupForm from "../components/SignupForm";
import { getApiUrl } from "../utils/getApiUrl";
import "../styles/Home.css";

export default function Home() {
  const { t } = useTranslation('home');
  const sliderRef = useRef(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    website: "",
    comments: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  // const [isSignupFormOpen, setIsSignupFormOpen] = useState(false); // Commented out - form always visible

  // Hero benefit items - displayed in the left column of the hero section
  // These are the key value propositions shown alongside the signup form
  const heroBenefits = [
    {
      title: t('hero.benefits.zeroCode.title'),
      icon: "fa-wand-magic-sparkles",
      description: t('hero.benefits.zeroCode.description')
    },
    {
      title: t('hero.benefits.multiChannel.title'),
      icon: "fa-comments",
      description: t('hero.benefits.multiChannel.description')
    },
    {
      title: t('hero.benefits.insights.title'),
      icon: "fa-chart-line",
      description: t('hero.benefits.insights.description')
    },
    {
      title: t('hero.benefits.secure.title'),
      icon: "fa-shield-halved",
      description: t('hero.benefits.secure.description')
    }
  ];

  // Service items with detailed descriptions
  // Each item represents a key benefit/feature displayed in the Services section
  // Contains: title (heading), icon (FontAwesome class), description (HTML with <strong> tags for emphasis)
  // Rendered as expandable cards in a 2-column grid layout - hover reveals full description
  // AI-Driven Analytics added first, followed by 24/7 Support and Instant Response styled as cards
  const serviceItems = [
    {
      title: t('services.items.analytics.title'),
      icon: "fa-chart-pie",
      description: t('services.items.analytics.description')
    },
    {
      title: t('services.items.support.title'),
      icon: "fa-clock",
      description: t('services.items.support.description')
    },
    {
      title: t('services.items.instant.title'),
      icon: "fa-bolt",
      description: t('services.items.instant.description')
    },
    {
      title: t('services.items.qualification.title'),
      icon: "fa-filter",
      description: t('services.items.qualification.description')
    },
    {
      title: t('services.items.costs.title'),
      icon: "fa-piggy-bank",
      description: t('services.items.costs.description')
    },
    {
      title: t('services.items.scalable.title'),
      icon: "fa-chart-line",
      description: t('services.items.scalable.description')
    }
  ];

  // Auto-scroll carousel effect
  useEffect(() => {
    // Wait for DOM to be ready
    const initializeCarousel = () => {
      const slider = sliderRef.current;
      if (!slider) return;

      let scrollInterval;
      let isUserInteracting = false;

      const startAutoScroll = () => {
        if (scrollInterval) clearInterval(scrollInterval);

        scrollInterval = setInterval(() => {
          if (!isUserInteracting && slider) {
            const midPoint = slider.scrollWidth / 2;
            const currentScroll = slider.scrollLeft;

            // Infinite loop: when we reach the midpoint (end of first set), jump back to start without animation
            if (currentScroll >= midPoint - 10) {
              slider.scrollTo({ left: 0, behavior: 'instant' });
            }

            // Scroll to next item
            const itemWidth = slider.querySelector('.home-slider-item')?.offsetWidth || 0;
            const gap = 32; // 2rem gap
            const scrollAmount = itemWidth + gap;

            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }, 3000); // Scroll every 3 seconds
      };

      const handleUserInteraction = () => {
        isUserInteracting = true;
        clearInterval(scrollInterval);

        // Resume auto-scroll after 5 seconds of no interaction
        setTimeout(() => {
          isUserInteracting = false;
          startAutoScroll();
        }, 5000);
      };

      slider.addEventListener('touchstart', handleUserInteraction);
      slider.addEventListener('mousedown', handleUserInteraction);
      slider.addEventListener('wheel', handleUserInteraction);

      startAutoScroll();

      return () => {
        clearInterval(scrollInterval);
        if (slider) {
          slider.removeEventListener('touchstart', handleUserInteraction);
          slider.removeEventListener('mousedown', handleUserInteraction);
          slider.removeEventListener('wheel', handleUserInteraction);
        }
      };
    };

    // Give the DOM time to render
    const timeout = setTimeout(initializeCarousel, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  // FAQs loaded from translations
  const faqs = t('faq.items', { returnObjects: true });

  const handleFormChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    try {
      const apiBaseUrl = getApiUrl();
      const apiUrl = `${apiBaseUrl}/api/contact`;
      
      console.log("📡 Calling contact API:", apiUrl);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to send message");
        return;
      }

      setFormSuccess(true);
      setContactForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        website: "",
        comments: "",
      });

      setTimeout(() => {
        setFormSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Contact form error:", err);
      setFormError(`❌ ${t('contact.error')}`);
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  return (
    <div id="home-hero" className="home-page">
      {/* Hero Section - Redesigned with left/right layout */}
      <section className="home-hero">
        <div className="home-container">
          <h1 className="home-hero-title">{t('hero.title')}</h1>

          {/* Two-column layout: Benefits on left, Form on right */}
          <div className="home-hero-content">
            {/* Left column - Benefits */}
            <div className="home-hero-benefits">
              {heroBenefits.map((benefit, index) => (
                <div key={index} className="home-hero-benefit-item">
                  <h3 className="home-hero-benefit-title">{benefit.title}</h3>
                  <div className="home-hero-benefit-row">
                    <i className={`fas ${benefit.icon} home-hero-benefit-icon`}></i>
                    <p className="home-hero-benefit-description" dangerouslySetInnerHTML={{ __html: benefit.description }}></p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right column - Signup Form */}
            <div className="home-hero-form-container">
              {/* Button commented out - form always visible
              <button
                type="button"
                className="home-btn home-btn-green"
                onClick={() => setIsSignupFormOpen((v) => !v)}
                style={{ marginBottom: "1.5em", border: "none", outline: "none", width: "100%" }}
              >
                {isSignupFormOpen ? "Close Form" : "Build Your Agent Now"}
              </button>
              */}

              {/* Signup Form Component - always open */}
              <SignupForm
                isOpen={true}
                onClose={() => {}}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Slider Section */}
      <section id="solutions" className="home-slider-section">
        <h2 className="home-section-title">{t('slider.title')}</h2>
        <div className="home-container">
          <div ref={sliderRef} className="home-slider-container">
            {[
              { img: "/img/icon1.png", text: t('slider.items.automate') },
              { img: "/img/icon2.jpg", text: t('slider.items.qualify') },
              { img: "/img/icon3.png", text: t('slider.items.handle') },
              { img: "/img/icon4.png", text: t('slider.items.scale') },
              { img: "/img/icon5.png", text: t('slider.items.personalize') },
              { img: "/img/icon6.png", text: t('slider.items.freeUp') },
              // Duplicate items for infinite loop effect
              { img: "/img/icon1.png", text: t('slider.items.automate') },
              { img: "/img/icon2.jpg", text: t('slider.items.qualify') },
              { img: "/img/icon3.png", text: t('slider.items.handle') },
              { img: "/img/icon4.png", text: t('slider.items.scale') },
              { img: "/img/icon5.png", text: t('slider.items.personalize') },
              { img: "/img/icon6.png", text: t('slider.items.freeUp') },
            ].map((item, index) => (
              <div key={index} className="home-slider-item">
                <img src={item.img} alt={item.text} className="home-slider-image" />
                <p className="home-slider-text">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - Card-based layout matching the hero benefits style */}
      <section id="services" className="home-cards-section">
        <h2 className="home-section-title inverted">{t('services.title')}</h2>
        <div className="home-container">
          <div className="home-cards-grid">
            {serviceItems.map((service, index) => (
              <div key={index} className="home-card">
                <div className="home-card-body">
                  <div className="home-black-bar"></div>
                  <div className="home-card-upper">
                    <div className="home-card-icon">
                      <i className={`fa-solid ${service.icon}`}></i>
                    </div>
                    <h3 className="home-card-title">{service.title}</h3>
                  </div>
                  <p className="home-card-text" dangerouslySetInnerHTML={{ __html: service.description }}></p>
                </div>
              </div>
            ))}
          </div>
          <div className="home-services-cta">
            <a href="#contact" className="home-btn" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>
              {t('services.learnMore')}
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="home-faq-section">
        <h2 className="home-section-title">{t('faq.title')}</h2>
        <div className="home-container">
          <div className="home-faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`home-faq-item ${activeFaqIndex === index ? "active" : ""}`}
              >
                <div className="home-faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.question}</span>
                  <span className="home-faq-icon">+</span>
                </div>
                <div className="home-faq-answer">
                  <p dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="home-contact-section">
        <div className="home-container">
          <form onSubmit={handleContactSubmit} className="home-form" id="contact-form">
            <h2>{t('contact.title')}</h2>

            <div className="home-form-row">
              <div className="home-form-group">
                <label htmlFor="name" className="home-form-label">
                  {t('contact.form.name')}:
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={contactForm.name}
                  onChange={handleFormChange}
                  className="home-form-input"
                />
              </div>

              <div className="home-form-group">
                <label htmlFor="email" className="home-form-label">
                  {t('contact.form.email')}:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={contactForm.email}
                  onChange={handleFormChange}
                  className="home-form-input"
                />
              </div>
            </div>

            <div className="home-form-row">
              <div className="home-form-group">
                <label htmlFor="phone" className="home-form-label">
                  {t('contact.form.phone')}:
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={contactForm.phone}
                  onChange={handleFormChange}
                  className="home-form-input"
                />
              </div>

              <div className="home-form-group">
                <label htmlFor="contact-company" className="home-form-label">
                  {t('contact.form.company')}:
                </label>
                <input
                  type="text"
                  id="contact-company"
                  name="company"
                  value={contactForm.company}
                  onChange={handleFormChange}
                  className="home-form-input"
                />
              </div>
            </div>

            <div className="home-form-row">
              <div className="home-form-group">
                <label htmlFor="website" className="home-form-label">
                  {t('contact.form.website')}:
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={contactForm.website}
                  onChange={handleFormChange}
                  className="home-form-input"
                />
              </div>
            </div>

            <div className="home-form-group">
              <label htmlFor="comments" className="home-form-label">
                {t('contact.form.comments')}:
              </label>
              <textarea
                id="comments"
                name="comments"
                required
                value={contactForm.comments}
                onChange={handleFormChange}
                className="home-form-input home-form-textarea"
              />
            </div>

            {formError && <p className="home-form-error">{formError}</p>}
            {formSuccess && <p className="home-form-success">✅ {t('contact.success')}</p>}

            <button type="submit">{t('contact.form.submit')}</button>
          </form>
        </div>
      </section>
    </div>
  );
}
