import { useEffect, useRef, useState } from "react";

export default function SignupForm({ isOpen, onClose }) {
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
  const [showLoginLink, setShowLoginLink] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const agentFormWrapperRef = useRef(null);
  const agentFormInnerRef = useRef(null);

  useEffect(() => {
    const wrapper = agentFormWrapperRef.current;
    const inner = agentFormInnerRef.current;
    if (!wrapper || !inner) return;

    if (isOpen) {
      wrapper.style.maxHeight = inner.scrollHeight + "px";
      wrapper.style.opacity = "1";
    } else {
      wrapper.style.maxHeight = "0px";
      wrapper.style.opacity = "0";
    }
  }, [isOpen]);

  useEffect(() => {
    const wrapper = agentFormWrapperRef.current;
    const inner = agentFormInnerRef.current;
    if (!wrapper || !inner) return;

    const onResize = () => {
      if (isOpen) {
        wrapper.style.maxHeight = inner.scrollHeight + "px";
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen]);

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
      item: typeof raw.item === 'number' ? raw.item : (raw.item ? parseInt(raw.item, 10) : 1),
      date_paid: toNullIfEmpty(raw.date_paid),
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
      return;
    }

    if (!agentForm.confirm_contact_email) {
      setAgentFormError("Please confirm your email.");
      return;
    }

    if (
      String(agentForm.contact_email).trim().toLowerCase() !==
      String(agentForm.confirm_contact_email).trim().toLowerCase()
    ) {
      setAgentFormError("Emails do not match.");
      return;
    }

    if (!agentForm.password) {
      setAgentFormError("Password is required to create an account.");
      return;
    }

    if (!agentForm.confirm_password) {
      setAgentFormError("Please confirm your password.");
      return;
    }

    if (agentForm.password !== agentForm.confirm_password) {
      setAgentFormError("Passwords do not match.");
      return;
    }

    if (!agentForm.level) {
      setAgentFormError("Level is required.");
      return;
    }

    // NEW: Validate terms and conditions acceptance
    if (!termsAccepted) {
      setAgentFormError("You must accept the Terms and Conditions to create an account.");
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
      setShowLoginLink(true);

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

      // Reset terms checkbox after successful submission
      setTermsAccepted(false);

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
    <>
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px"
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                padding: "20px",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h2 style={{ margin: 0, color: "white", fontSize: "20px" }}>
                Terms and Conditions
              </h2>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "28px",
                  cursor: "pointer",
                  padding: "0",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "30px", lineHeight: "1.6" }}>
              <p style={{ marginTop: 0 }}>
                <strong>Here are the terms and conditions</strong>
              </p>
              
              <p>
                By using our service, you agree to these terms and conditions. 
                Please read them carefully before proceeding.
              </p>

              <h3 style={{ marginTop: "20px", color: "#1e3a8a" }}>1. Acceptance of Terms</h3>
              <p>
                By accessing and using this service, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>

              <h3 style={{ marginTop: "20px", color: "#1e3a8a" }}>2. Use of Service</h3>
              <p>
                You agree to use this service only for lawful purposes and in accordance with 
                these terms and conditions.
              </p>

              <h3 style={{ marginTop: "20px", color: "#1e3a8a" }}>3. Privacy Policy</h3>
              <p>
                Your privacy is important to us. We are committed to protecting your personal 
                information and your right to privacy.
              </p>

              <h3 style={{ marginTop: "20px", color: "#1e3a8a" }}>4. Changes to Terms</h3>
              <p>
                We reserve the right to modify these terms at any time. You should check this 
                page regularly to take notice of any changes we make.
              </p>

              <div style={{ marginTop: "30px", textAlign: "center" }}>
                <button
                  onClick={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  style={{
                    padding: "12px 30px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    cursor: "pointer",
                    marginRight: "10px"
                  }}
                >
                  I Accept
                </button>
                <button
                  onClick={() => setShowTermsModal(false)}
                  style={{
                    padding: "12px 30px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signup Form */}
      <div 
        id="agent-form" 
        style={{ 
          marginTop: "2em",
          opacity: isOpen ? 1 : 0,
          maxHeight: isOpen ? "5000px" : "0px",
          overflow: "hidden",
          transition: "opacity 0.5s ease-in-out, max-height 0.5s ease-in-out",
          pointerEvents: isOpen ? "auto" : "none"
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
              Build Your AI Agent in 30 Seconds
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
                <i>Already have an account?</i> <a href="/login" style={{ color: "#1e3a8a", textDecoration: "underline" }}>Log in</a> here and manage your agent.
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

                {/* Terms and Conditions Checkbox */}
                <div style={{ marginTop: "20px", marginBottom: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "15px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px",
                      border: "1px solid #dee2e6"
                    }}
                  >
                    <input
                      type="checkbox"
                      id="terms_accepted"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer"
                      }}
                    />
                    <label
                      htmlFor="terms_accepted"
                      style={{
                        margin: 0,
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#333"
                      }}
                    >
                      I agree to all{" "}
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        style={{
                          color: "#1e3a8a",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                      >
                        Terms and Conditions
                      </span>
                      <span style={requiredAsteriskStyle}> *</span>
                    </label>
                  </div>
                </div>

                {/* Hidden item field */}
                <input
                  type="hidden"
                  name="item"
                  value={agentForm.item}
                />

                {/* Fixed height container for messages */}
                <div style={{ minHeight: "60px", marginTop: "10px" }}>
                  {agentFormError && <p className="home-form-error">{agentFormError}</p>}
                  {agentFormSuccess && (
                    <p className="home-form-success">
                      ✅ Account created successfully! 
                    </p>
                  )}
                  {showLoginLink && (
                    <p style={{ textAlign: "center", marginTop: "10px" }}>
                      <a 
                        href="/login" 
                        style={{ 
                          color: '#310956', 
                          textDecoration: 'underline',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}
                      >
                        Click here to log in
                      </a>
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
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
    </>
  );
}
