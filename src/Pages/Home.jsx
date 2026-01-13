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
  const [isSignupFormOpen, setIsSignupFormOpen] = useState(false);
  const [activeServiceModal, setActiveServiceModal] = useState(null);

  // Service items with detailed descriptions
  const serviceItems = [
    {
      title: "24/7 Customer Support",
      icon: "fa-clock",
      description: "Never miss a customer inquiry again. Our AI agents work around the clock, providing instant responses to customer questions at any time of day or night. Whether it's 3 PM or 3 AM, your customers receive immediate, helpful assistance that keeps them engaged and satisfied. This continuous availability ensures you capture every opportunity and maintain customer trust, even outside business hours."
    },
    {
      title: "Instant Response Times",
      icon: "fa-bolt",
      description: "Say goodbye to long wait times. Our AI agents respond to customer inquiries in milliseconds, dramatically reducing response times from hours or days to seconds. This immediate engagement keeps customers interested, prevents them from bouncing to competitors, and creates a seamless experience that modern consumers expect. Fast responses lead to higher satisfaction rates and increased conversion."
    },
    {
      title: "Automated Lead Qualification",
      icon: "fa-filter",
      description: "Let AI handle the heavy lifting of lead qualification. Our intelligent agents ask the right questions, gather essential information, and automatically score and route leads based on their potential value. This ensures your sales team focuses only on high-quality prospects, saving time and increasing close rates. The system learns from every interaction, continuously improving its qualification accuracy."
    },
    {
      title: "Reduced Operational Costs",
      icon: "fa-piggy-bank",
      description: "Significantly lower your customer service expenses while improving quality. AI agents handle routine inquiries at a fraction of the cost of human agents, allowing you to scale support without proportionally scaling headcount. Reduce overhead costs including training, benefits, and infrastructure while maintaining or even improving service quality. The savings compound as your business grows."
    },
    {
      title: "Scalable Customer Engagement",
      icon: "fa-chart-line",
      description: "Handle thousands of simultaneous conversations without breaking a sweat. Unlike human teams that require hiring and training to scale, AI agents can instantly accommodate traffic spikes, seasonal surges, or rapid business growth. Whether you're handling 10 or 10,000 conversations, maintain the same high-quality experience for every customer without additional costs or delays."
    },
    {
      title: "Enhanced Customer Insights",
      icon: "fa-lightbulb",
      description: "Turn every conversation into valuable business intelligence. AI agents automatically capture, analyze, and categorize customer interactions, revealing patterns, pain points, and opportunities you might otherwise miss. Gain deep insights into customer needs, common questions, and emerging trends. Use this data to refine products, improve services, and make informed strategic decisions that drive growth."
    }
  ];

  // Auto-scroll carousel effect
  useEffect(() => {
    // Wait for DOM to be ready
    const initializeCarousel = () => {
      const slider = sliderRef.current;
      if (!slider) {
        console.log('Slider not found');
        return;
      }

      console.log('Initializing carousel...', {
        scrollWidth: slider.scrollWidth,
        clientWidth: slider.clientWidth,
        items: slider.querySelectorAll('.home-slider-item').length
      });

      let scrollInterval;
      let isUserInteracting = false;

      const startAutoScroll = () => {
        if (scrollInterval) clearInterval(scrollInterval);

        scrollInterval = setInterval(() => {
          if (!isUserInteracting && slider) {
            const maxScroll = slider.scrollWidth - slider.clientWidth;
            const currentScroll = slider.scrollLeft;
            const midPoint = slider.scrollWidth / 2;

            console.log('Auto-scrolling...', { currentScroll, maxScroll, midPoint });

            // Infinite loop: when we reach the midpoint (end of first set), jump back to start without animation
            if (currentScroll >= midPoint - 10) {
              slider.scrollTo({ left: 0, behavior: 'instant' });
            }

            // Scroll to next item
            const itemWidth = slider.querySelector('.home-slider-item')?.offsetWidth || 0;
            const gap = 32; // 2rem gap
            const scrollAmount = itemWidth + gap;

            console.log('Scrolling by:', scrollAmount);
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }, 3000); // Scroll every 3 seconds
      };

      const handleUserInteraction = () => {
        console.log('User interaction detected');
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
      question: "How can AI improve customer service in my business?",
      answer:
        "AI can significantly enhance customer service by implementing chatbots and virtual assistants. These AI-driven tools can handle a large volume of customer inquiries efficiently and provide instant responses 24/7. They can also analyze customer queries to offer personalized solutions, track customer behavior to anticipate needs, and free up human agents to deal with more complex issues. This leads to faster response times, improved customer satisfaction, and reduced operational costs.",
    },
    {
      question: "Can AI help in making better business decisions?",
      answer:
        "Yes, AI can assist in making better business decisions by analyzing large datasets to uncover patterns and insights that might be missed by human analysis. AI-driven analytics tools can predict market trends, optimize pricing strategies, and identify potential risks. For instance, predictive analytics can forecast future sales, helping businesses to adjust their strategies proactively. AI can also enhance decision-making by providing real-time data and automated reporting, ensuring that business leaders have up-to-date information to base their decisions on.",
    },
    {
      question: "How can AI streamline operations and increase efficiency?",
      answer:
        "AI can streamline operations by automating repetitive tasks and optimizing workflows. In manufacturing, AI can improve supply chain management by predicting demand and optimizing inventory levels. In administrative tasks, AI-powered tools can automate scheduling, data entry, and email management. This automation not only reduces human error but also allows employees to focus on higher-value tasks. AI can also optimize resource allocation and improve operational efficiency by analyzing process data to identify and eliminate bottlenecks.",
    },
    {
      question: "What role can AI play in marketing and sales?",
      answer:
        "AI can revolutionize marketing and sales by providing deep insights into customer behavior and preferences. AI algorithms can analyze customer data to create highly personalized marketing campaigns that resonate with individual customers. In sales, AI can identify high-value leads, predict customer churn, and suggest the best times and methods for engagement. AI-powered tools can also automate email marketing, social media management, and content generation, ensuring consistent and effective communication with customers.",
    },
    {
      question: "Is AI implementation cost-effective for small businesses?",
      answer:
        "AI implementation can be cost-effective for small businesses, especially with the availability of scalable and affordable AI solutions. Many AI tools offer tiered pricing models, allowing small businesses to start with basic features and expand as needed. The initial investment in AI can be offset by the long-term savings generated through increased efficiency, reduced labor costs, and improved customer retention. Additionally, cloud-based AI services reduce the need for extensive in-house infrastructure, making AI accessible even for businesses with limited budgets.",
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
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-container">
          <h1 className="home-hero-title">AI Agents Turning Engagement Into Growth</h1>
          <div className="home-video-container">
            <video
              id="autoplayVideo"
              width="100%"
              height="400"
              muted
              autoPlay
              loop
              playsInline
            >
              <source src="videos/hero-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <button
            type="button"
            className="home-btn home-btn-green"
            onClick={() => setIsSignupFormOpen((v) => !v)}
            style={{ marginTop: "2em", border: "none", outline: "none" }}
          >
            {isSignupFormOpen ? "Close Form" : "Build Your AI Agent Today"}
          </button>

          {/* Signup Form Component */}
          <SignupForm 
            isOpen={isSignupFormOpen} 
            onClose={() => setIsSignupFormOpen(false)} 
          />
        </div>
      </section>

      {/* Cards Section */}
      <section className="home-cards-section">
        <div className="home-container">
          <div className="home-cards-grid">
            <div className="home-card">
              <div className="home-black-bar"></div>
              <div className="home-card-body">
                <div className="home-card-upper">
                  <i className="fas fa-tasks home-card-icon"></i>
                  <h3 className="home-card-title">Always-On Productivity</h3>
                </div>
                <p className="home-card-text">
                  A dedicated AI agent that works 24/7—handling conversations,
                  capturing intent, and following up automatically—so your team
                  stays focused on high-value work while nothing slips through the
                  cracks.
                </p>
              </div>
            </div>

            <div className="home-card">
              <div className="home-black-bar"></div>
              <div className="home-card-body">
                <div className="home-card-upper">
                  <i className="fas fa-cogs home-card-icon"></i>
                  <h3 className="home-card-title">Smarter Engagement</h3>
                </div>
                <p className="home-card-text">
                  AI agents that connect every interaction to your CRM, remember context,
                  and route leads intelligently—creating smoother handoffs, faster responses,
                  and more meaningful engagement at scale.
                </p>
              </div>
            </div>

            <div className="home-card">
              <div className="home-black-bar"></div>
              <div className="home-card-body">
                <div className="home-card-upper">
                  <i className="fas fa-dollar-sign home-card-icon"></i>
                  <h3 className="home-card-title">Low Cost, High Impact</h3>
                </div>
                <p className="home-card-text">
                  Replace repetitive manual work with reliable and scalable AI agents,
                  reducing operational overhead, and delivering consistent results without
                  increasing headcount.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="home-services-section">
        <div className="home-container">
          <div className="home-services-grid">
            <ul className="home-services-list">
              {serviceItems.map((service, index) => (
                <li
                  key={index}
                  className="home-service-item"
                  onClick={() => setActiveServiceModal(index)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="home-checkmark">✓</span> {service.title}
                </li>
              ))}
            </ul>
            <div className="home-services-cta">
              <a href="#contact" className="home-btn" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Service Modal */}
      {activeServiceModal !== null && (
        <div className="home-modal-overlay" onClick={() => setActiveServiceModal(null)}>
          <div className="home-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="home-modal-close" onClick={() => setActiveServiceModal(null)}>
              ×
            </button>
            <h2 className="home-modal-title">
              <i className={`fa-solid ${serviceItems[activeServiceModal].icon} home-modal-icon`}></i>
              {serviceItems[activeServiceModal].title}
            </h2>
            <p className="home-modal-description">{serviceItems[activeServiceModal].description}</p>
          </div>
        </div>
      )}

      {/* Slider Section */}
      <section id="solutions" className="home-slider-section">
        <h2 className="home-section-title">What Can AI Agents Do For You?</h2>

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

      {/* FAQ Section */}
      {/*<section id="faq" className="home-faq-section">
        <div className="home-container">
          <div className="home-faq-header">
            <h2 className="home-faq-title">Frequently Asked Questions</h2>
            <span className="home-faq-subtitle">
              Common questions about AI solutions and how you can put them to use
            </span>
          </div>

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
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>*/}

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
                <label htmlFor="company" className="home-form-label">
                  Company:
                </label>
                <input
                  type="text"
                  id="company"
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
