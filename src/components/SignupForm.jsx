import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "./StripePaymentForm";

export default function SignupForm({ isOpen }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [stripePromise, setStripePromise] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Initialize Stripe - try local env var first, then fetch from backend
  useEffect(() => {
    const initStripe = async () => {
      try {
        // Try to use local env var first (for local development)
        const localKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        
        if (localKey) {
          console.log('✅ Using local Stripe key from env');
          setStripePromise(loadStripe(localKey));
        } else {
          // Fallback: fetch from backend (for Heroku environments)
          console.log('📡 Fetching Stripe key from backend...');
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const response = await fetch(`${apiBaseUrl}/api/stripe-config`);
          const { publishableKey } = await response.json();
          
          if (publishableKey) {
            console.log('✅ Stripe key loaded from backend');
            setStripePromise(loadStripe(publishableKey));
          } else {
            console.error('❌ No publishable key available');
          }
        }
      } catch (error) {
        console.error('❌ Error loading Stripe key:', error);
      }
    };
    
    initStripe();
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
    agent_name: "",
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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [validatedFormData, setValidatedFormData] = useState(null);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const agentFormWrapperRef = useRef(null);
  const agentFormInnerRef = useRef(null);

  // Price mapping for service levels
  const pricingMap = {
    free: { amount: 0, name: "Trial/Free" },
    basic: { amount: 2900, name: "Basic" },
    pro: { amount: 7900, name: "Pro" },
    enterprise: { amount: 19900, name: "Enterprise" },
    easybroker: { amount: 7900, name: "Real Estate Agent (EasyBroker)" },
  };

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

  const checkEmailExists = async (email) => {
    if (!email || !email.trim()) {
      setEmailExists(false);
      return;
    }

    try {
      setCheckingEmail(true);
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      setEmailExists(data.exists);
      
      if (data.exists) {
        setAgentFormError('This email is already registered. Please log in instead.');
      } else {
        if (agentFormError === 'This email is already registered. Please log in instead.') {
          setAgentFormError('');
        }
      }
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setCheckingEmail(false);
    }
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

    const getDomain = (level) => {
      if (level === 'easybroker') {
        return 'easybroker.aibridge.global';
      }
      // Default domain for all other levels
      return 'base.aibridge.global';
    };

    const level = raw.level?.trim() || "basic";

    return {
      agent_name: toNullIfEmpty(raw.agent_name),
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
      level: level,
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
      domain: getDomain(level),
    };
  };

  const handleAgentFormSubmit = async (e) => {
    e.preventDefault();
    setAgentFormError("");
    setAgentFormSuccess(false);

    if (emailExists) {
      setAgentFormError("This email is already registered. Please log in instead.");
      return;
    }

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

    if (!termsAccepted) {
      setAgentFormError("You must accept the Terms and Conditions to create an account.");
      return;
    }

    const payload = normalizePayload(agentForm);
    setValidatedFormData(payload);

    // If free tier, skip payment and create user directly
    if (agentForm.level === "free") {
      await createUser(payload, null);
      return;
    }

    // For paid tiers, create SUBSCRIPTION (not payment intent)
    try {
      const token = import.meta.env.VITE_CREATE_USER_TOKEN;
      
      if (!token) {
        console.error("VITE_CREATE_USER_TOKEN is not set");
        setAgentFormError(
          "Configuration error: Missing authentication token. Please contact support."
        );
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = `${apiBaseUrl}/api/create-subscription`; // CHANGED from create-payment-intent
      
      const pricing = pricingMap[agentForm.level];
      
      console.log("🌐 Creating subscription for:", pricing);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: agentForm.contact_email,
          name: `${agentForm.first_name || ''} ${agentForm.last_name || ''}`.trim() || agentForm.contact_email,
          level: agentForm.level
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data?.error || "Failed to create subscription";
        console.error("❌ Subscription error:", errorMessage);
        setAgentFormError(`❌ ${errorMessage}`);
        return;
      }

      console.log("✅ Subscription created successfully!", data);
      
      // Store subscription data
      setSubscriptionData({
        subscriptionId: data.subscriptionId,
        customerId: data.customerId,
        trialEnd: data.trialEnd
      });
      
      setClientSecret(data.clientSecret);
      setShowPaymentForm(true);

    } catch (err) {
      console.error("❌ Subscription creation error:", err);
      setAgentFormError(
        `❌ Network error: ${err.message}. Please check your connection and try again.`
      );
    }
  };

  const createUser = async (payload, paymentData) => {
    try {
      const token = import.meta.env.VITE_CREATE_USER_TOKEN;

      if (!token) {
        console.error("VITE_CREATE_USER_TOKEN is not set");
        setAgentFormError(
          "Configuration error: Missing authentication token. Please contact support."
        );
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = `${apiBaseUrl}/api/create_and_check_user`;

      const userPayload = {
        ...payload,
        // Subscription data
        subscription_id: paymentData?.subscriptionId || subscriptionData?.subscriptionId || null,
        stripe_customer_id: paymentData?.customerId || subscriptionData?.customerId || null,
        subscription_status: 'trialing',
        trial_end: paymentData?.trialEnd || subscriptionData?.trialEnd || null,
        subscription_amount: pricingMap[payload.level]?.amount || null,
        subscription_currency: 'usd',
        // Legacy payment fields
        payment_intent_id: paymentData?.paymentIntentId || null,
        payment_status: paymentData?.status || 'trialing',
        payment_amount: paymentData?.amount || null,
        payment_currency: paymentData?.currency || 'usd',
        payment_created: paymentData?.created || null,
        date_paid: new Date().toISOString(),
        current: true // User is active during trial
      };

      console.log("📡 Creating user with payload:", userPayload);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userPayload),
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

      if (!res.ok) {
        const errorMessage = data?.error || data?.message || data?.detail || "Failed to create user";
        console.error("❌ Server error:", errorMessage);
        setAgentFormError(`❌ ${errorMessage}`);
        return;
      }

      console.log("✅ User created successfully!");
      setAgentFormSuccess(true);
      setShowLoginLink(true);
      setShowPaymentForm(false);
      setSubscriptionData(null); // Clear subscription data

      setAgentForm({
        agent_name: "",
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

      setTermsAccepted(false);
      setEmailExists(false);
      setTimeout(() => setAgentFormSuccess(false), 5000);
    } catch (err) {
      console.error("❌ User creation error:", err);
      setAgentFormError(
        `❌ Network error: ${err.message}. Please check your connection and try again.`
      );
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    console.log("✅ Payment method saved:", paymentData);
    await createUser(validatedFormData, {
      ...paymentData,
      ...subscriptionData
    });
  };

  const handlePaymentError = (error) => {
    console.error("❌ Payment error:", error);
    setAgentFormError(`Payment failed: ${error}`);
    setShowPaymentForm(false);
    setSubscriptionData(null);
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

      {/* Stripe Payment Modal - UPDATED FOR SUBSCRIPTIONS */}
      {showPaymentForm && clientSecret && stripePromise && (
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
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                Start Your Free Trial
              </h2>
              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setSubscriptionData(null);
                  setAgentFormError("Payment cancelled");
                }}
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

            <div style={{ padding: "30px" }}>
              <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                  {pricingMap[agentForm.level].name} Plan
                </p>
                <p style={{ margin: "5px 0", fontSize: "32px", fontWeight: "bold", color: "#1e3a8a" }}>
                  ${(pricingMap[agentForm.level].amount / 100).toFixed(2)}
                  <span style={{ fontSize: "16px", fontWeight: "normal" }}>/month</span>
                </p>
                
                {/* Trial info banner */}
                <div style={{
                  background: "#e8f5e9",
                  border: "1px solid #4caf50",
                  borderRadius: "8px",
                  padding: "12px",
                  marginTop: "15px"
                }}>
                  <p style={{ margin: 0, color: "#2e7d32", fontWeight: "bold" }}>
                    🎉 30-Day Free Trial
                  </p>
                  <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "13px" }}>
                    You won't be charged today. Your card will be charged after the trial ends.
                    Cancel anytime during the trial.
                  </p>
                </div>
              </div>

              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isSetupIntent={true}
                />
              </Elements>
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
          <div style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
            padding: "20px 10px",
            margin: 0
          }}>
            <h2 style={{ margin: 0, color: "white", textAlign: "center" }}>
              Start an Account and Build Your AI Agent in 30 Seconds
            </h2>
          </div>

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

          <div style={{ padding: "30px", background: "#f9f9f9" }}>
            <div
              id="agent-collapsible"
              className="agent-collapsible open"
              ref={agentFormWrapperRef}
            >
              <div ref={agentFormInnerRef}>
                {/* Agent Name Field */}
                <div className="home-form-group" style={{ marginBottom: "16px" }}>
                  <label htmlFor="agent_name" className="home-form-label">
                    Agent Name:
                  </label>
                  <input
                    type="text"
                    id="agent_name"
                    name="agent_name"
                    value={agentForm.agent_name}
                    onChange={handleAgentFormChange}
                    placeholder="e.g., My Real Estate Bot, Customer Service Agent"
                    className="home-form-input"
                  />
                  <p style={{ 
                    margin: "6px 0 0 0", 
                    fontSize: "12px", 
                    color: "#666" 
                  }}>
                    A friendly name to identify your agent (you can change this later)
                  </p>
                </div>

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
                      onBlur={(e) => checkEmailExists(e.target.value)}
                      className="home-form-input"
                      autoComplete="email"
                      style={emailExists ? { borderColor: '#d11' } : {}}
                    />
                    {checkingEmail && (
                      <p style={{ 
                        color: '#666', 
                        fontSize: '13px', 
                        marginTop: '5px',
                        marginBottom: 0 
                      }}>
                        Checking email...
                      </p>
                    )}
                    {emailExists && (
                      <p style={{ 
                        color: '#d11', 
                        fontSize: '13px', 
                        marginTop: '5px',
                        marginBottom: 0 
                      }}>
                        This email is already registered.{' '}
                        <a href="/login" style={{ color: '#1e3a8a', textDecoration: 'underline' }}>
                          Log in here
                        </a>
                      </p>
                    )}
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
                      flex: 1,
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
                      placeholder="Acme"
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
                      <option value="free">Trial/Free - $0/month</option>
                      <option value="basic">Basic - $29/month</option>
                      <option value="pro">Pro - $79/month</option>
                      <option value="enterprise">Enterprise - $199/month</option>
                      <option value="easybroker">Real Estate Agent (EasyBroker) - $79/month</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "20px", marginBottom: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "15px",
                      backgroundColor: "#fff",
                      borderRadius: "4px",
                      border: "1px solid #dee2e6",
                      maxWidth: "20em", 
                      marginLeft: "auto", 
                      marginRight: "auto",
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

                <input
                  type="hidden"
                  name="item"
                  value={agentForm.item}
                />

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
                    disabled={emailExists || checkingEmail}
                  >
                    {agentForm.level === "free" ? "Let's Go!" : "Start Free Trial"}
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