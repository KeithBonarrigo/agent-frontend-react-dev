import { useEffect, useRef, useState } from "react";
import "../styles/Home.css";

export default function Home() {
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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Read 'service' URL parameter and set item value
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    
    if (serviceParam) {
      const itemValue = parseInt(serviceParam, 10);
      if (!isNaN(itemValue)) {
        setAgentForm(prev => ({
          ...prev,
          item: itemValue
        }));
      }
    }
  }, []);

  const [agentForm, setAgentForm] = useState({
    open_ai_token: "",
    mls_token: "",
    sf_client_key: "",
    sf_client_secret: "",
    sf_org: "",
    sf_security_token: "",
    sf_user: "",
    sf_user_pass: "",
    contact_email: "",
    confirm_contact_email: "",
    contact_phone: "",
    contact_phone_wsp: false,
    office_address: "",
    level: "basic",
    office_wsp_phone: "",
    item: 1,
    date_paid: "",
    current: false,
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    office_id: "",
    easy_broker_key: "",
    company: "",
    wsp_phone_number_id: "",
    messenger_access_token: "",
  });

  const [agentFormError, setAgentFormError] = useState("");
  const [agentFormSuccess, setAgentFormSuccess] = useState(false);

  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const agentFormWrapperRef = useRef(null);
  const agentFormInnerRef = useRef(null);

  useEffect(() => {
    const wrapper = agentFormWrapperRef.current;
    const inner = agentFormInnerRef.current;
    if (!wrapper || !inner) return;

    if (isAgentFormOpen) {
      wrapper.style.maxHeight = inner.scrollHeight + "px";
      wrapper.style.opacity = "1";
    } else {
      wrapper.style.maxHeight = "0px";
      wrapper.style.opacity = "0";
    }
  }, [isAgentFormOpen]);

  useEffect(() => {
    const wrapper = agentFormWrapperRef.current;
    const inner = agentFormInnerRef.current;
    if (!wrapper || !inner) return;

    const onResize = () => {
      if (isAgentFormOpen) {
        wrapper.style.maxHeight = inner.scrollHeight + "px";
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isAgentFormOpen]);

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

  const handleAgentFormChange = (e) => {
    const { name, type, checked, value } = e.target;
    setAgentForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizePayload = (raw) => {
    const toNullIfEmpty = (v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === "string" && v.trim() === "") return null;
      return v;
    };

    const toIntOrNull = (v) => {
      const cleaned = String(v ?? "").trim();
      if (!cleaned) return null;
      const num = parseInt(cleaned, 10);
      return Number.isFinite(num) ? num : null;
    };

    return {
      open_ai_token: toNullIfEmpty(raw.open_ai_token),
      mls_token: toNullIfEmpty(raw.mls_token),
      sf_client_key: toNullIfEmpty(raw.sf_client_key),
      sf_client_secret: toNullIfEmpty(raw.sf_client_secret),
      sf_org: toNullIfEmpty(raw.sf_org),
      sf_security_token: toNullIfEmpty(raw.sf_security_token),
      sf_user: toNullIfEmpty(raw.sf_user),
      sf_user_pass: toNullIfEmpty(raw.sf_user_pass),
      contact_email: toNullIfEmpty(raw.contact_email),
      contact_phone: toNullIfEmpty(raw.contact_phone),
      contact_phone_wsp: !!raw.contact_phone_wsp,
      office_address: toNullIfEmpty(raw.office_address),
      level: raw.level?.trim() || "basic",
      office_wsp_phone: toNullIfEmpty(raw.office_wsp_phone),
      item: typeof raw.item === 'number' ? raw.item : (raw.item ? parseInt(raw.item, 10) : 1),      date_paid: toNullIfEmpty(raw.date_paid),
      current: !!raw.current,
      password: toNullIfEmpty(raw.password),
      first_name: toNullIfEmpty(raw.first_name),
      last_name: toNullIfEmpty(raw.last_name),
      office_id: toIntOrNull(raw.office_id),
      easy_broker_key: toNullIfEmpty(raw.easy_broker_key),
      company: typeof raw.company === "string" ? raw.company : "",
      wsp_phone_number_id: toNullIfEmpty(raw.wsp_phone_number_id),
      messenger_access_token: toNullIfEmpty(raw.messenger_access_token),
    };
  };

  const handleAgentFormSubmit = async (e) => {
    e.preventDefault();
    setAgentFormError("");
    setAgentFormSuccess(false);

    if (!agentForm.contact_email) {
      setAgentFormError("Email is required to create an account.");
      setIsAgentFormOpen(true);
      return;
    }

    if (!agentForm.confirm_contact_email) {
      setAgentFormError("Please confirm your email.");
      setIsAgentFormOpen(true);
      return;
    }

    if (
      String(agentForm.contact_email).trim().toLowerCase() !==
      String(agentForm.confirm_contact_email).trim().toLowerCase()
    ) {
      setAgentFormError("Emails do not match.");
      setIsAgentFormOpen(true);
      return;
    }

    if (!agentForm.password) {
      setAgentFormError("Password is required to create an account.");
      setIsAgentFormOpen(true);
      return;
    }

    if (!agentForm.confirm_password) {
      setAgentFormError("Please confirm your password.");
      setIsAgentFormOpen(true);
      return;
    }

    if (agentForm.password !== agentForm.confirm_password) {
      setAgentFormError("Passwords do not match.");
      setIsAgentFormOpen(true);
      return;
    }

    if (!agentForm.level) {
      setAgentFormError("Level is required.");
      setIsAgentFormOpen(true);
      return;
    }

    try {
      const token = import.meta.env.VITE_CREATE_USER_TOKEN;
      
      if (!token) {
        console.error("VITE_CREATE_USER_TOKEN is not set");
        setAgentFormError(
          "Configuration error: Missing authentication token. Please contact support."
        );
        return;
      }

      const payload = normalizePayload(agentForm);

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = `${apiBaseUrl}/api/create_and_check_user`;
      
      console.log("🌐 API Base URL:", apiBaseUrl);
      console.log("📡 Calling API:", apiUrl);
      console.log("📦 Payload:", payload);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        if (!res.ok) {
          setAgentFormError(
            `Server error (${res.status}): ${res.statusText || "Unable to create user"}`
          );
          return;
        }
      }

      console.log("📥 Response status:", res.status);
      console.log("📥 Response data:", data);

      if (!res.ok) {
        const errorMessage = data?.error || data?.message || data?.detail || "Failed to create user";
        console.error("❌ Server error:", errorMessage, "Full response:", data);
        setAgentFormError(`❌ ${errorMessage}`);
        return;
      }

      console.log("✅ User created successfully!");
      setAgentFormSuccess(true);

      setAgentForm({
        open_ai_token: "",
        mls_token: "",
        sf_client_key: "",
        sf_client_secret: "",
        sf_org: "",
        sf_security_token: "",
        sf_user: "",
        sf_user_pass: "",
        contact_email: "",
        confirm_contact_email: "",
        contact_phone: "",
        contact_phone_wsp: false,
        office_address: "",
        level: "basic",
        office_wsp_phone: "",
        item: "",
        date_paid: "",
        current: false,
        password: "",
        confirm_password: "",
        first_name: "",
        last_name: "",
        office_id: "",
        easy_broker_key: "",
        company: "",
        wsp_phone_number_id: "",
        messenger_access_token: "",
      });

      setTimeout(() => setAgentFormSuccess(false), 5000);
    } catch (err) {
      console.error("❌ Agent form submission error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      setAgentFormError(
        `❌ Network error: ${err.message}. Please check your connection and try again.`
      );
    }
  };

  const requiredAsteriskStyle = { color: "#d11", marginLeft: "0px" };

  const rowWrapStyle = {
    display: "flex",
    gap: isMobile ? "10px" : "16px",
    flexDirection: isMobile ? "column" : "row",
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-container">
          <h1 className="home-hero-title">AI Agents turning Engagement into Growth</h1>
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
            onClick={() => setIsAgentFormOpen((v) => !v)}
            style={{ marginTop: "2em", border: "none", outline: "none" }}
          >
            {isAgentFormOpen ? "Close Form" : "Build your Agent Today"}
          </button>

          {/* Agent Form - With fade transition */}
          <div 
            id="agent-form" 
            style={{ 
              marginTop: "2em",
              opacity: isAgentFormOpen ? 1 : 0,
              maxHeight: isAgentFormOpen ? "5000px" : "0px",
              overflow: "hidden",
              transition: "opacity 0.5s ease-in-out, max-height 0.5s ease-in-out",
              pointerEvents: isAgentFormOpen ? "auto" : "none"
            }}
          >
            <form 
              onSubmit={handleAgentFormSubmit} 
              className="home-form" 
              style={{ 
                padding: 0,
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
              }}
            >
              {/* Blue header section */}
              <div style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                padding: "20px 10px",
                margin: 0
              }}>
                <h2 style={{ margin: 0, color: "white", textAlign: "center" }}>
                  Build Your Agent in 30 Seconds
                </h2>
              </div>

              {/* White description section */}
              <div style={{
                background: "white",
                padding: "20px",
                margin: 0,
                borderBottom: "1px solid #ccc"
              }}>
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "10px",
                    opacity: 0.85,
                    textAlign: "center",
                    color: "#333"
                  }}
                >
                  <strong>Create your account now</strong>, then <strong>log in anytime to complete or change the rest</strong>.
                 <br />
                  Only fields marked with an asterisk (<span style={requiredAsteriskStyle}>*</span>) are required.
                  <p style={{ marginTop: ".5em", marginBottom: "0", color: "#333" }}>
                    <i>Already have an account?</i> <a href="/login" style={{ color: "#1e3a8a", textDecoration: "underline" }}>Log in</a> and manage your agent.
                  </p>
                </p>
              </div>

              {/* Form fields section */}
              <div style={{ padding: "30px", background: "white" }}>
                <div
                  id="agent-collapsible"
                  className="agent-collapsible open"
                  ref={agentFormWrapperRef}
                >
                  <div ref={agentFormInnerRef}>
                    <div style={rowWrapStyle}>
                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="first_name" className="home-form-label">
                          First Name:
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          value={agentForm.first_name}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                        />
                      </div>

                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="last_name" className="home-form-label">
                          Last Name:
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          value={agentForm.last_name}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                        />
                      </div>
                    </div>

                    <div style={rowWrapStyle}>
                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="contact_email" className="home-form-label">
                          Contact Email: <span style={requiredAsteriskStyle}>*</span>
                        </label>
                        <input
                          type="email"
                          id="contact_email"
                          name="contact_email"
                          required
                          value={agentForm.contact_email}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                          autoComplete="email"
                        />
                      </div>

                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="confirm_contact_email" className="home-form-label">
                          Confirm Email: <span style={requiredAsteriskStyle}>*</span>
                        </label>
                        <input
                          type="email"
                          id="confirm_contact_email"
                          name="confirm_contact_email"
                          required
                          value={agentForm.confirm_contact_email}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div style={rowWrapStyle}>
                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="password" className="home-form-label">
                          Password: <span style={requiredAsteriskStyle}>*</span>
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          required
                          value={agentForm.password}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                          autoComplete="new-password"
                        />
                      </div>

                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="confirm_password" className="home-form-label">
                          Confirm Password: <span style={requiredAsteriskStyle}>*</span>
                        </label>
                        <input
                          type="password"
                          id="confirm_password"
                          name="confirm_password"
                          required
                          value={agentForm.confirm_password}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div style={rowWrapStyle}>
                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="contact_phone" className="home-form-label">
                          Contact Phone:
                        </label>
                        <input
                          type="tel"
                          id="contact_phone"
                          name="contact_phone"
                          value={agentForm.contact_phone}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                        />
                      </div>

                      <div
                        className="home-form-group"
                        style={{
                          flex: isMobile ? "unset" : "0 0 auto",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginTop: isMobile ? "0" : "28px",
                        }}
                      >
                        <input
                          type="checkbox"
                          id="contact_phone_wsp"
                          name="contact_phone_wsp"
                          checked={agentForm.contact_phone_wsp}
                          onChange={handleAgentFormChange}
                        />
                        <label
                          htmlFor="contact_phone_wsp"
                          className="home-form-label"
                          style={{ margin: 0, whiteSpace: "nowrap" }}
                        >
                          This phone is WhatsApp-enabled
                        </label>
                      </div>
                    </div>

                    <div style={rowWrapStyle}>
                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="company" className="home-form-label">
                          Company:
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          placeholder="example.com"
                          value={agentForm.company}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                        />
                      </div>

                      <div className="home-form-group" style={{ flex: 1 }}>
                        <label htmlFor="level" className="home-form-label">
                          Service Level:<span style={requiredAsteriskStyle}>*</span>
                        </label>
                        <select
                          id="level"
                          name="level"
                          required
                          value={agentForm.level}
                          onChange={handleAgentFormChange}
                          className="home-form-input"
                        >
                          <option value="free">Trial/Free</option>
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                    </div>

                    {/* Hidden item field */}
                    <input
                      type="hidden"
                      name="item"
                      value={agentForm.item}
                    />

                    {agentFormError && <p className="home-form-error">{agentFormError}</p>}
                    {agentFormSuccess && (
                      <p className="home-form-success">
                            ✅ Account created successfully! 
                            <a 
                            href="/login" 
                            style={{ 
                                color: '#310956', 
                                textDecoration: 'underline', 
                                marginLeft: '8px',
                                fontWeight: 'bold'
                            }}
                            >
                            Click here to log in
                            </a>
                        </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                      <button 
                        type="submit"
                        className="home-btn home-btn-green"
                        style={{ 
                          border: "none", 
                          outline: "none",
                          padding: "12px 30px",
                          fontSize: "16px"
                        }}
                      >
                        Let's Go!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
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
            <div>
              <ul className="home-services-list">
                <li className="home-service-item">
                  <span className="home-checkmark">✓</span> Technical Consulting
                </li>
                <li className="home-service-item">
                  <span className="home-checkmark">✓</span> CRM Administration
                </li>
                <li className="home-service-item">
                  <span className="home-checkmark">✓</span> API Integration
                </li>
                <li className="home-service-item">
                  <span className="home-checkmark">✓</span> Custom Solution Development
                </li>
                <li className="home-service-item">
                  <span className="home-checkmark">✓</span> Productivity Enhancement
                </li>
              </ul>
            </div>
            <div className="home-services-cta">
              <a href="#contact" className="home-btn" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Slider Section */}
      <section id="solutions" className="home-slider-section">
        <div className="home-container">
          <h2 className="home-section-title">How Can AI Help My Business?</h2>

          <div className="home-slider-container">
            {[
              { img: "/img/icon1.png", text: "Connect Your Workflows" },
              { img: "/img/icon2.jpg", text: "Capture Your Market" },
              { img: "/img/icon3.png", text: "Transform Operations" },
              { img: "/img/icon4.png", text: "Boost Business Potential" },
              { img: "/img/icon5.png", text: "Innovate and Optimize" },
              { img: "/img/icon6.png", text: "Empower Your Staff" },
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
      <section id="faq" className="home-faq-section">
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
      </section>

      {/* Contact Section */}
      <section id="contact" className="home-contact-section">
        <div className="home-container">
          <form onSubmit={handleContactSubmit} className="home-form" id="contact-form">
            <h2>Contact Us</h2>

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