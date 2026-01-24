import { useState, useEffect, useRef } from "react";
import SignupForm from "../components/SignupForm";
import { useDomain } from "../contexts/DomainContext";
import "../styles/Home.css";

export default function Home() {
  const { domainInfo } = useDomain();
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
      title: "Zero-Code Implementation",
      icon: "fa-wand-magic-sparkles",
      description: "Launch your AI agent <strong>in minutes</strong>—no developers needed. Our intuitive interface lets anyone build <strong>powerful automation</strong> with simple point-and-click setup."
    },
    {
      title: "Multi-Channel Communication",
      icon: "fa-comments",
      description: "Your AI agent works <strong>24/7</strong> across web, WhatsApp, Messenger, and Instagram—engaging customers <strong>wherever they are</strong>, whenever they need you. More channels coming soon."
    },
    {
      title: "AI-Driven Insights",
      icon: "fa-chart-line",
      description: "Know <strong>who's contacting you</strong>, where they're coming from, and what interests them. AI-powered metrics give you <strong>visibility into your leads</strong> to sharpen marketing outreach and segmentation."
    },
    {
      title: "Secure & PCI Compliant",
      icon: "fa-shield-halved",
      description: "Your data is protected with <strong>enterprise-grade security</strong>. We never store your credit card information, and all personal data is <strong>highly encrypted</strong> to keep your business and customers safe."
    }
  ];

  // Service items with detailed descriptions
  // Each item represents a key benefit/feature displayed in the Services section
  // Contains: title (heading), icon (FontAwesome class), description (HTML with <strong> tags for emphasis)
  // Rendered as expandable cards in a 2-column grid layout - hover reveals full description
  // AI-Driven Analytics added first, followed by 24/7 Support and Instant Response styled as cards
  const serviceItems = [
    {
      title: "AI-Driven Analytics",
      icon: "fa-chart-pie",
      description: "<strong>Unlock powerful insights into your customer behavior.</strong> Access custom AI-driven metrics that help you understand your users, track engagement patterns, and <strong>improve your audience segmentation.</strong> Our intelligent analytics dashboard surfaces actionable data, helping you identify high-value customers, optimize conversion funnels, and <strong>make data-backed decisions</strong> that drive growth."
    },
    {
      title: "24/7 Customer Support",
      icon: "fa-clock",
      description: "<strong>Never miss a customer inquiry again.</strong> Our AI agents work around the clock, providing instant responses to customer questions at any time of day or night. Whether it's 3 PM or 3 AM, your customers receive <strong>immediate, helpful assistance</strong> that keeps them engaged and satisfied. This continuous availability ensures you <strong>capture every opportunity</strong> and maintain customer trust, even outside business hours."
    },
    {
      title: "Instant Response Times",
      icon: "fa-bolt",
      description: "<strong>Say goodbye to long wait times.</strong> Our AI agents respond to customer inquiries in milliseconds, <strong>dramatically reducing response times from hours or days to seconds.</strong> This immediate engagement keeps customers interested, prevents them from bouncing to competitors, and creates a seamless experience that modern consumers expect. <strong>Fast responses lead to higher satisfaction rates and increased conversion.</strong>"
    },
    {
      title: "Automated Lead Qualification",
      icon: "fa-filter",
      description: "<strong>Let AI handle the heavy lifting of lead qualification.</strong> Our intelligent agents ask the right questions, gather essential information, and <strong>automatically score and route leads</strong> based on their potential value. This ensures your sales team <strong>focuses only on high-quality prospects,</strong> saving time and increasing close rates. The system learns from every interaction, continuously improving its qualification accuracy."
    },
    {
      title: "Reduced Operational Costs",
      icon: "fa-piggy-bank",
      description: "<strong>Significantly lower your customer service expenses while improving quality.</strong> AI agents handle routine inquiries at <strong>a fraction of the cost of human agents,</strong> allowing you to scale support without proportionally scaling headcount. <strong>Reduce overhead costs</strong> including training, benefits, and infrastructure while maintaining or even improving service quality. The savings compound as your business grows."
    },
    {
      title: "Scalable Customer Engagement",
      icon: "fa-chart-line",
      description: "<strong>Handle thousands of simultaneous conversations without breaking a sweat.</strong> Unlike human teams that require hiring and training to scale, AI agents can <strong>instantly accommodate traffic spikes, seasonal surges, or rapid business growth.</strong> Whether you're handling 10 or 10,000 conversations, <strong>maintain the same high-quality experience for every customer</strong> without additional costs or delays."
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

  const faqs = [
    {
      question: "Can I try it before committing to a paid plan?",
      answer:
        "Absolutely. We offer a <strong>free trial</strong> so you can experience exactly how an AI agent works for your business <strong>before making any financial commitment</strong>. Set up your agent, test it with real scenarios, and see the results for yourself. We're confident that once you see the <strong>time saved and leads captured</strong>, you'll understand the value immediately.",
    },
    {
      question: "Will AI agents make my customer interactions feel impersonal?",
      answer:
        "<strong>Not at all</strong>. Modern AI agents are designed to provide <strong>warm, conversational experiences</strong> that feel natural and helpful. They can remember customer preferences, use friendly language, and <strong>seamlessly hand off to human agents</strong> when a personal touch is needed. Many customers actually prefer the <strong>instant, judgment-free assistance</strong> AI provides for routine questions, while your team remains available for complex situations.",
    },
    {
      question: "What if the AI gives wrong information to my customers?",
      answer:
        "AI agents are <strong>trained specifically on your business information</strong> and configured with guardrails to stay within their knowledge boundaries. When they encounter questions outside their scope, they're designed to <strong>acknowledge limitations and escalate to human support</strong> rather than guess. You maintain <strong>full control</strong> over the information they share, and continuous monitoring helps identify and correct any issues quickly.",
    },
    {
      question: "Is my business too small to benefit from AI agents?",
      answer:
        "<strong>AI agents are particularly valuable for small businesses</strong> because they let you compete with larger companies without hiring additional staff. A solo entrepreneur can offer <strong>24/7 support</strong>, and a small team can handle inquiry volumes that would otherwise require multiple employees. Our <strong>tiered pricing</strong> means you only pay for what you need, making AI accessible regardless of your business size.",
    },
    {
      question: "How long does it take to set up an AI agent?",
      answer:
        "Most businesses have their AI agent <strong>live within minutes, not weeks</strong>. Our no-code platform lets you configure your agent by simply providing your business information and preferences. <strong>No technical expertise required</strong>, no developers to hire, and no complex integrations to manage. You can start capturing leads and answering customer questions <strong>the same day you sign up</strong>.",
    },
    {
      question: "Will I lose control over my customer relationships?",
      answer:
        "You gain <strong>more control, not less</strong>. AI agents capture detailed information about every interaction, giving you insights into what customers are asking, what they need, and where they're coming from. <strong>You set the rules</strong> for how the AI responds, when it escalates, and what information it collects. <strong>Every conversation is logged and accessible</strong>, so you're always informed about what's happening with your customers.",
    },
    {
      question: "What happens when the AI can't answer a question?",
      answer:
        "<strong>Smart escalation is built into every AI agent.</strong> When a question falls outside the AI's knowledge or a customer requests human assistance, the conversation is <strong>seamlessly handed off to your team with full context</strong>. The AI can collect contact information and schedule callbacks, ensuring <strong>no inquiry falls through the cracks</strong> even outside business hours.",
    },
    {
      question: "Are AI agents secure? What about my customers' data?",
      answer:
        "Security is foundational to our platform. All data is <strong>encrypted in transit and at rest</strong>, we never store payment card information, and we maintain strict compliance with privacy regulations. <strong>Your customer data belongs to you</strong> and is never used to train models or shared with third parties. We undergo <strong>regular security audits</strong> to ensure your information stays protected.",
    },
    {
      question: "Will my customers know they're talking to an AI?",
      answer:
        "<strong>Transparency builds trust.</strong> Our AI agents can introduce themselves honestly while still providing excellent service. Research shows customers appreciate knowing they're interacting with AI when it means <strong>faster responses and 24/7 availability</strong>. The key is delivering genuine value—customers care far more about <strong>getting their questions answered quickly</strong> than whether a human or AI is helping them.",
    },
    {
      question: "What if AI technology changes and my investment becomes obsolete?",
      answer:
        "Our platform <strong>continuously evolves with AI advancements</strong>, and your subscription includes all updates automatically. As the technology improves, your AI agent gets smarter <strong>without any additional effort or cost</strong> on your part. You're not locked into outdated technology—you're partnering with a platform committed to keeping you <strong>at the forefront of AI capabilities</strong>.",
    },
  ];

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
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
      setFormError("❌ Server error. Please try again later.");
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
          <h1 className="home-hero-title">Capture More Leads with Advanced AI Agents</h1>

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
        <h2 className="home-section-title">What Can AI Agents Do For Your Business?</h2>
        <div className="home-container">
          <div ref={sliderRef} className="home-slider-container">
            {[
              { img: "/img/icon1.png", text: "Automate Conversations" },
              { img: "/img/icon2.jpg", text: "Qualify Leads Instantly" },
              { img: "/img/icon3.png", text: "Handle Inquiries" },
              { img: "/img/icon4.png", text: "Scale Support Seamlessly" },
              { img: "/img/icon5.png", text: "Personalize Interactions" },
              { img: "/img/icon6.png", text: "Free Up Your Team" },
              // Duplicate items for infinite loop effect
              { img: "/img/icon1.png", text: "Automate Conversations" },
              { img: "/img/icon2.jpg", text: "Qualify Leads Instantly" },
              { img: "/img/icon3.png", text: "Handle Inquiries" },
              { img: "/img/icon4.png", text: "Scale Support Seamlessly" },
              { img: "/img/icon5.png", text: "Personalize Interactions" },
              { img: "/img/icon6.png", text: "Free Up Your Team" },
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
        <h2 className="home-section-title inverted">Additional Benefits</h2>
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
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="home-faq-section">
        <h2 className="home-section-title">Frequently Asked Questions</h2>
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
            <h2>Contact Us</h2>

            <div className="home-form-row">
              <div className="home-form-group">
                <label htmlFor="name" className="home-form-label">
                  Name:
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
                  Email:
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
                  Phone:
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
                  Company:
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
                  Website:
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
                Comments:
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
            {formSuccess && <p className="home-form-success">✅ Message sent successfully!</p>}

            <button type="submit">Submit</button>
          </form>
        </div>
      </section>
    </div>
  );
}
