import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "./StripePaymentForm";
import { useDomain } from "../contexts/DomainContext";
import { getApiUrl } from "../utils/getApiUrl";
import "../styles/SignupForm.css";

export default function SignupForm({ isOpen }) {
  const { t } = useTranslation('signup');
  // Get domain information from context
  const { domainInfo } = useDomain();

  // Debug logging for environment configuration
  useEffect(() => {
    console.log('🔧 ============ SIGNUP FORM ENV CONFIG ============');
    console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL || '❌ NOT SET (using localhost:3000)');
    console.log('🔧 VITE_CREATE_USER_TOKEN:', import.meta.env.VITE_CREATE_USER_TOKEN ? '✅ SET' : '❌ NOT SET');
    console.log('🔧 VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('🔧 Current hostname:', window.location.hostname);
    console.log('🔧 Current origin:', window.location.origin);
    console.log('🔧 MODE:', import.meta.env.MODE);
    console.log('🔧 PROD:', import.meta.env.PROD);
    console.log('🔧 DEV:', import.meta.env.DEV);
    console.log('🔧 ================================================');
  }, []);

  const [stripePromise, setStripePromise] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);

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
          const apiBaseUrl = getApiUrl();
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
    domain_to_install_bot: "",
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
    mls: { amount: 7900, name: "Real Estate Agent (MLS)" },
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
      const apiBaseUrl = getApiUrl();
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
      // First, check if we have domain context
      if (domainInfo) {
        const currentDomain = domainInfo.targetDomain;
        console.log("🔍 Domain from context:", currentDomain);
        console.log("🔍 Domain type:", domainInfo.domainType);
        console.log("🔍 User selected level:", level);

        // Use the current domain they're visiting from (unless it's local development)
        if (domainInfo.domainType !== 'local') {
          console.log("✅ Using current domain:", currentDomain);
          return currentDomain;
        }
      }

      // Fallback for local development or if no context available
      console.log("⚠️ Fallback: Using default base domain");
      return 'base.aibridge.global';
    };

    const level = raw.level?.trim() || "basic";
    const assignedDomain = getDomain(level);

    console.log("📋 Final domain assignment:", assignedDomain);

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
      contact_phone: raw.contact_phone ? `+${raw.contact_phone.replace(/^\+/, '')}` : null,
      contact_phone_wsp: !!raw.contact_phone_wsp,
      contact_form_wsp: !!raw.contact_phone_wsp,
      office_address: toNullIfEmpty(raw.office_address),
      level: level,
      office_wsp_phone: raw.contact_phone ? `+${raw.contact_phone.replace(/^\+/, '')}` : null,
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
      domain: assignedDomain,
      domain_to_install_bot: toNullIfEmpty(raw.domain_to_install_bot),
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

    if (!agentForm.domain_to_install_bot?.trim()) {
      setAgentFormError("Domain where agent will be installed is required.");
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

      const apiBaseUrl = getApiUrl();
      const apiUrl = `${apiBaseUrl}/api/create-subscription`; // CHANGED from create-payment-intent

      const pricing = pricingMap[agentForm.level];

      console.log("🔗 API Base URL:", apiBaseUrl);
      console.log("🔗 Full API URL:", apiUrl);
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

      const apiBaseUrl = getApiUrl();
      const apiUrl = `${apiBaseUrl}/api/create_and_check_user`;

      console.log('👤 ============ CREATE USER ============');
      console.log('👤 API Base URL:', apiBaseUrl);
      console.log('👤 Create User endpoint:', apiUrl);
      console.log('👤 =====================================');

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
        domain_to_install_bot: "",
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

  return (
    <>
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="signup-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="signup-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="signup-modal-header">
              <h2 className="signup-modal-title">Terms and Conditions</h2>
              <button onClick={() => setShowTermsModal(false)} className="signup-modal-close">
                ×
              </button>
            </div>

            <div className="signup-modal-body">
              <p style={{ marginTop: 0 }}>
                <strong>Here are the terms and conditions</strong>
              </p>

              <p>
                By using our service, you agree to these terms and conditions.
                Please read them carefully before proceeding.
              </p>

              <h3 className="signup-terms-heading">1. Acceptance of Terms</h3>
              <p>
                By accessing and using this service, you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>

              <h3 className="signup-terms-heading">2. Use of Service</h3>
              <p>
                You agree to use this service only for lawful purposes and in accordance with
                these terms and conditions.
              </p>

              <h3 className="signup-terms-heading">3. Privacy Policy</h3>
              <p>
                Your privacy is important to us. We are committed to protecting your personal
                information and your right to privacy.
              </p>

              <h3 className="signup-terms-heading">4. Changes to Terms</h3>
              <p>
                We reserve the right to modify these terms at any time. You should check this
                page regularly to take notice of any changes we make.
              </p>

              <div className="signup-terms-buttons">
                <button
                  onClick={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  className="signup-btn-accept"
                >
                  I Accept
                </button>
                <button onClick={() => setShowTermsModal(false)} className="signup-btn-close">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Payment Modal - UPDATED FOR SUBSCRIPTIONS */}
      {showPaymentForm && clientSecret && stripePromise && (
        <div className="signup-modal-overlay">
          <div className="signup-modal-container signup-modal-container-narrow" onClick={(e) => e.stopPropagation()}>
            <div className="signup-modal-header">
              <h2 className="signup-modal-title">Start Your Free Trial</h2>
              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setSubscriptionData(null);
                  setAgentFormError("Payment cancelled");
                }}
                className="signup-modal-close"
              >
                ×
              </button>
            </div>

            <div className="signup-modal-body">
              <div className="signup-payment-info">
                <p className="signup-payment-plan">
                  {pricingMap[agentForm.level].name} Plan
                </p>
                <p className="signup-payment-price">
                  ${(pricingMap[agentForm.level].amount / 100).toFixed(2)}
                  <span className="signup-payment-price-period">/month</span>
                </p>

                {/* Trial info banner */}
                <div className="signup-trial-banner">
                  <p className="signup-trial-title">🎉 30-Day Free Trial</p>
                  <p className="signup-trial-text">
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
        className={`signup-form-wrapper ${isOpen ? 'open' : 'closed'}`}
      >
        <form
          onSubmit={handleAgentFormSubmit}
          className="home-form signup-form-container"
        >
          <div className="signup-form-header">
            <h2>{t('title')}</h2>
          </div>

          <div className="signup-form-subtitle">
            <p dangerouslySetInnerHTML={{ __html: t('subtitle') }} />
          </div>

          <div className="signup-form-body">
            <div
              id="agent-collapsible"
              className="agent-collapsible open"
              ref={agentFormWrapperRef}
            >
              <div ref={agentFormInnerRef}>
                {/* Agent Name and Company Row */}
                <div className="signup-form-row">
                  <div className="home-form-group">
                    <label htmlFor="agent_name" className="home-form-label">
                      {t('form.agentName')}:
                    </label>
                    <input
                      type="text"
                      id="agent_name"
                      name="agent_name"
                      value={agentForm.agent_name}
                      onChange={handleAgentFormChange}
                      placeholder="(You can change this later)"
                      className="home-form-input"
                    />
                  </div>

                  <div className="home-form-group">
                    <label htmlFor="company" className="home-form-label">
                      {t('form.company')}:
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
                </div>

                <div className="signup-form-row">
                  <div className="home-form-group">
                    <label htmlFor="first_name" className="home-form-label">
                      {t('form.firstName')}:
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

                  <div className="home-form-group">
                    <label htmlFor="last_name" className="home-form-label">
                      {t('form.lastName')}:
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

                <div className="signup-form-row">
                  <div className="home-form-group">
                    <label htmlFor="contact_email" className="home-form-label">
                      {t('form.email')}: <span className="signup-required">*</span>
                    </label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      required
                      value={agentForm.contact_email}
                      onChange={handleAgentFormChange}
                      onBlur={(e) => checkEmailExists(e.target.value)}
                      className={`home-form-input ${emailExists ? 'signup-email-error' : ''}`}
                      autoComplete="email"
                    />
                    {checkingEmail && (
                      <p className="signup-email-checking">Checking email...</p>
                    )}
                    {emailExists && (
                      <p className="signup-email-exists">
                        This email is already registered.{' '}
                        <a href="/login">Log in here</a>
                      </p>
                    )}
                  </div>

                  <div className="home-form-group">
                    <label htmlFor="confirm_contact_email" className="home-form-label">
                      {t('form.confirmEmail')}: <span className="signup-required">*</span>
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

                <div className="signup-form-row">
                  <div className="home-form-group">
                    <label htmlFor="password" className="home-form-label">
                      {t('form.password')}: <span className="signup-required">*</span>
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

                  <div className="home-form-group">
                    <label htmlFor="confirm_password" className="home-form-label">
                      {t('form.confirmPassword')}: <span className="signup-required">*</span>
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

                <div className="signup-form-row">
                  <div className="home-form-group">
                    <label htmlFor="contact_phone" className="home-form-label">
                      {t('form.phone')}:
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

                  <div className="home-form-group">
                    <label htmlFor="level" className="home-form-label">
                      {t('form.serviceLevel')}:<span className="signup-required">*</span>
                    </label>
                    <select
                      id="level"
                      name="level"
                      required
                      value={agentForm.level}
                      onChange={handleAgentFormChange}
                      className="home-form-input"
                    >
                      <option value="free">{t('plans.free')}</option>
                      <option value="basic">{t('plans.basic')}</option>
                      <option value="pro">{t('plans.pro')}</option>
                      <option value="enterprise">{t('plans.enterprise')}</option>
                      <option value="easybroker">{t('plans.easybroker')}</option>
                      <option value="mls">{t('plans.mls')}</option>
                    </select>
                  </div>
                </div>

                {/* Domain to Install Bot */}
                <div className="home-form-group signup-domain-field">
                  <label htmlFor="domain_to_install_bot" className="home-form-label">
                    {t('form.domainToInstall')}:<span className="signup-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="domain_to_install_bot"
                    name="domain_to_install_bot"
                    required
                    value={agentForm.domain_to_install_bot}
                    onChange={handleAgentFormChange}
                    placeholder="myexampledomain.com"
                    className="home-form-input"
                  />
                </div>

                {/* WhatsApp and Terms checkboxes - centered row */}
                <div className="signup-checkbox-container">
                  <div className="signup-checkbox-row">
                    <div className="signup-checkbox-item">
                      <input
                        type="checkbox"
                        id="contact_phone_wsp"
                        name="contact_phone_wsp"
                        checked={agentForm.contact_phone_wsp}
                        onChange={handleAgentFormChange}
                      />
                      <label
                        htmlFor="contact_phone_wsp"
                        className="home-form-label signup-checkbox-label-inline"
                      >
                        This phone is WhatsApp-enabled
                      </label>
                    </div>

                    <div className="signup-checkbox-item">
                      <input
                        type="checkbox"
                        id="terms_accepted"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <label htmlFor="terms_accepted" className="signup-checkbox-label">
                        I agree to all{" "}
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermsModal(true);
                          }}
                          className="signup-terms-link"
                        >
                          Terms and Conditions
                        </span>
                        <span className="signup-required"> *</span>
                      </label>
                    </div>
                  </div>
                </div>

                <input
                  type="hidden"
                  name="item"
                  value={agentForm.item}
                />

                <div className="signup-messages">
                  {agentFormError && <p className="home-form-error">{agentFormError}</p>}
                  {agentFormSuccess && (
                    <p className="home-form-success">
                      ✅ Account created successfully!
                    </p>
                  )}
                  {showLoginLink && (
                    <p className="signup-login-link">
                      <a href="/login">Click here to log in</a>
                    </p>
                  )}
                </div>

                <div className="signup-submit-container">
                  <button
                    type="submit"
                    className="home-btn home-btn-green signup-submit-btn"
                    disabled={emailExists || checkingEmail}
                  >
                    {agentForm.level === "free" ? t('buttons.letsGo') : t('buttons.startFreeTrial')}
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