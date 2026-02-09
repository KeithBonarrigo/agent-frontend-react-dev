import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

// IntegrationsTab - Displays embed code and integration methods for the AI agent
// Provides the script tag users need to embed the chatbot on their website
// Includes WhatsApp Embedded Signup for connecting WhatsApp Business numbers
export default function IntegrationsTab({ user, clientId }) {
  const { t } = useTranslation('integrations');
  const [copied, setCopied] = useState(false);
  const [chatbotLoaded, setChatbotLoaded] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const chatbotScriptRef = useRef(null);
  const customCssRef = useRef(null);

  // WhatsApp Embedded Signup state
  const [wspStatus, setWspStatus] = useState(user?.wsp_status || null); // null or 'active'
  const [savedWspPhone, setSavedWspPhone] = useState(user?.office_wsp_phone || '');
  const [wspLoading, setWspLoading] = useState(false);
  const [wspError, setWspError] = useState('');
  const [wspSuccess, setWspSuccess] = useState('');
  const sessionInfoRef = useRef({});

  // Load Facebook SDK for WhatsApp Embedded Signup
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FB_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v21.0'
      });
    };

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }, []);

  // Session info listener - captures phone_number_id and waba_id from Meta's popup
  useEffect(() => {
    const sessionInfoListener = (event) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.data.event === 'FINISH') {
            sessionInfoRef.current = {
              phone_number_id: data.data.phone_number_id,
              waba_id: data.data.waba_id
            };
          } else if (data.data.event === 'CANCEL') {
            sessionInfoRef.current = {};
            setWspLoading(false);
          }
        }
      } catch {
        // Not JSON or not our event
      }
    };

    window.addEventListener('message', sessionInfoListener);
    return () => window.removeEventListener('message', sessionInfoListener);
  }, []);

  // Send auth code + session info to backend after Embedded Signup completes
  const handleSignupComplete = useCallback(async (code) => {
    try {
      const apiBaseUrl = getApiUrl();
      const sessionInfo = sessionInfoRef.current;

      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/whatsapp-embedded-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code,
          phone_number_id: sessionInfo.phone_number_id,
          waba_id: sessionInfo.waba_id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      setWspStatus('active');
      setSavedWspPhone(data.phone_number || t('whatsapp.connected'));
      setWspSuccess(t('whatsapp.success'));
      setTimeout(() => setWspSuccess(''), 5000);
    } catch (err) {
      setWspError(err.message || t('whatsapp.signupError'));
    } finally {
      setWspLoading(false);
    }
  }, [clientId, t]);

  // Launch Meta's Embedded Signup popup via Facebook SDK
  const launchWhatsAppSignup = useCallback(() => {
    if (!window.FB) {
      setWspError(t('whatsapp.sdkError'));
      return;
    }

    setWspLoading(true);
    setWspError('');
    setWspSuccess('');
    sessionInfoRef.current = {};

    window.FB.login(
      function (response) {
        if (response.authResponse) {
          const code = response.authResponse.code;
          handleSignupComplete(code);
        } else {
          setWspLoading(false);
        }
      },
      {
        config_id: import.meta.env.VITE_WA_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: 2
        }
      }
    );
  }, [handleSignupComplete, t]);

  if (!clientId) {
    return (
      <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
        <p>{t('noSubscription')}</p>
      </div>
    );
  }

  // Determine the correct domain based on current hostname (runtime detection)
  // Used to generate the correct embed script URL for the chatbot
  const hostname = window.location.hostname;
  let webEmbedDomain;
  let webEmbedProtocol = 'https';

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    webEmbedDomain = 'localhost:3000';
    webEmbedProtocol = 'http';
  } else if (hostname.includes('dev.botwerx.ai')) {
    webEmbedDomain = 'chatdev.botwerx.ai';
  } else if (hostname.includes('staging.botwerx.ai')) {
    webEmbedDomain = 'chatstaging.botwerx.ai';
  } else if (hostname.includes('botwerx.ai')) {
    webEmbedDomain = 'chat.botwerx.ai';
  } else if (hostname.includes('aibridge.global')) {
    webEmbedDomain = 'chat.aibridge.global';
  } else {
    // Default fallback
    webEmbedDomain = 'chat.botwerx.ai';
  }

  // Generate the embed code script tag with the client's unique ID
  const embedCode = `<script src='${webEmbedProtocol}://${webEmbedDomain}/chatbot.js?id=${clientId}'></script>`;

  // Copy embed code to clipboard with visual feedback
  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load chatbot script for preview
  const handleTryItOut = async () => {
    if (chatbotLoaded || chatbotLoading) return;

    setChatbotLoading(true);

    // Fetch and inject custom CSS first
    try {
      const apiBaseUrl = getApiUrl();
      const cssResponse = await fetch(`${apiBaseUrl}/api/client-styling/${clientId}`, {
        credentials: 'include'
      });

      if (cssResponse.ok) {
        const cssData = await cssResponse.json();
        if (cssData.custom_css) {
          // Remove old custom CSS if exists
          if (customCssRef.current) {
            customCssRef.current.remove();
          }
          // Inject new custom CSS
          const styleEl = document.createElement('style');
          styleEl.id = `custom-css-${clientId}`;
          styleEl.textContent = cssData.custom_css;
          document.head.appendChild(styleEl);
          customCssRef.current = styleEl;
          console.log('🎨 Custom CSS injected');
        }
      }
    } catch (error) {
      console.error('Error fetching custom CSS:', error);
    }

    const chatbotUrl = `${webEmbedProtocol}://${webEmbedDomain}/chatbot.js?id=${clientId}`;
    console.log('🤖 Loading chatbot from:', chatbotUrl);

    const script = document.createElement('script');
    script.src = chatbotUrl;
    script.async = true;
    script.onload = () => {
      console.log('✅ Chatbot script loaded successfully');
      setChatbotLoading(false);
      setChatbotLoaded(true);
    };
    script.onerror = (err) => {
      console.error('❌ Chatbot script failed to load:', err);
      setChatbotLoading(false);
      alert(t('webEmbed.loadFailed'));
    };

    document.body.appendChild(script);
  };

  // Check if MLS token is missing for MLS domain
  const isMlsDomain = user?.domain === 'mls.aibridge.global';
  const hasMlsToken = user?.mls_token && user.mls_token.trim() !== '';

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      {/* MLS Token Warning */}
      {isMlsDomain && !hasMlsToken && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '1em',
          marginBottom: '1.5em',
          color: '#721c24',
          textAlign: 'center'
        }}>
          <strong>⚠️ {t('mlsWarning.title')}</strong> {t('mlsWarning.message')}
          <br /><span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>{t('mlsWarning.note')}</span>
        </div>
      )}

      {/* Website Embed Code Section */}
      <div style={{ marginBottom: "2em" }}>
        <h2 className="section-title section-title-centered" style={{ marginBottom: "1em" }}>
          <i className="fa-solid fa-window-maximize"></i>
          {t('webEmbed.title')}
        </h2>
        <div style={{ position: "relative", width: "70%", marginLeft: "auto", marginRight: "auto" }}>
          <pre style={{
            backgroundColor: "#fff",
            padding: "1em",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            overflowX: "auto",
            border: "1px solid #ddd",
            margin: 0
          }}>
            <code>{embedCode}</code>
          </pre>
          <button
            onClick={handleCopy}
            style={{
              position: "absolute",
              top: "0.25em",
              right: "0.5em",
              padding: "0.4em 0.8em",
              backgroundColor: copied ? "#28a745" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85em"
            }}
          >
            {copied ? `✓ ${t('common:buttons.copied')}` : t('common:buttons.copy')}
          </button>
        </div>
        <p style={{ fontSize: "0.9em", color: "#666", marginTop: "0.5em", textAlign: "center" }}>
          {t('webEmbed.copyInstruction')} <strong style={{ color: '#007bff' }}>{user?.domain_to_install_bot || t('webEmbed.yourDomain')}</strong>.
        </p>
        <div style={{ textAlign: "center", marginTop: "1em" }}>
          <button
            onClick={handleTryItOut}
            disabled={chatbotLoaded || chatbotLoading}
            style={{
              background: "none",
              border: "none",
              color: chatbotLoaded ? "#28a745" : "#007bff",
              cursor: chatbotLoaded || chatbotLoading ? "default" : "pointer",
              fontSize: "1em",
              textDecoration: chatbotLoaded ? "none" : "underline",
              padding: 0
            }}
          >
            {chatbotLoading ? t('common:buttons.loading') : chatbotLoaded ? t('webEmbed.chatbotLoaded') : t('webEmbed.tryItOut')}
          </button>
        </div>
      </div>

      {/* WhatsApp Embedded Signup */}
      <div style={{ marginTop: "2em", paddingTop: "2em", borderTop: "1px solid #ddd" }}>
        <h2 className="section-title section-title-centered" style={{ marginBottom: "1em" }}>
          <i className="fa-brands fa-whatsapp" style={{ color: "#25D366" }}></i>
          {' '}{t('whatsapp.title')}
        </h2>
        <p style={{ fontSize: "0.95em", color: "#666", textAlign: "center", marginBottom: "1.5em" }}>
          {t('whatsapp.description')}
        </p>

        {/* State: Active / Connected */}
        {wspStatus === 'active' && savedWspPhone ? (
          <div style={{
            backgroundColor: "#fff",
            padding: "1.25em",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #ddd",
            width: "70%",
            marginLeft: "auto",
            marginRight: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <span style={{ fontSize: "0.85em", color: "#888" }}>{t('whatsapp.currentNumber')}</span>
              <p style={{ margin: "0.25em 0 0", fontSize: "1.1em", fontWeight: "600", color: "#333" }}>
                <i className="fa-brands fa-whatsapp" style={{ color: "#25D366", marginRight: "0.5em" }}></i>
                {savedWspPhone}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75em" }}>
              <span style={{
                backgroundColor: "#d4edda",
                color: "#155724",
                padding: "0.25em 0.75em",
                borderRadius: "12px",
                fontSize: "0.8em",
                fontWeight: "600"
              }}>
                {t('whatsapp.registered')}
              </span>
              <button
                onClick={async () => {
                  if (!window.confirm(t('whatsapp.removeConfirm'))) return;
                  setWspLoading(true);
                  setWspError('');
                  try {
                    const apiBaseUrl = getApiUrl();
                    const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/whatsapp-register`, {
                      method: 'DELETE',
                      credentials: 'include'
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.error || 'Failed to remove');
                    }
                    setSavedWspPhone('');
                    setWspStatus(null);
                  } catch (err) {
                    setWspError(t('whatsapp.removeError'));
                  } finally {
                    setWspLoading(false);
                  }
                }}
                disabled={wspLoading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc3545",
                  cursor: wspLoading ? "default" : "pointer",
                  fontSize: "0.85em",
                  textDecoration: "underline",
                  padding: 0
                }}
              >
                {wspLoading ? t('whatsapp.removing') : t('whatsapp.remove')}
              </button>
            </div>
          </div>

        /* State: Not connected - show Connect button */
        ) : (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={launchWhatsAppSignup}
              disabled={wspLoading}
              style={{
                padding: "0.75em 2em",
                backgroundColor: wspLoading ? "#ccc" : "#25D366",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: wspLoading ? "default" : "pointer",
                fontSize: "1em",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5em"
              }}
            >
              <i className="fa-brands fa-whatsapp"></i>
              {wspLoading ? t('whatsapp.connecting') : t('whatsapp.connectButton')}
            </button>
            <p style={{ fontSize: "0.85em", color: "#888", marginTop: "0.75em" }}>
              {t('whatsapp.connectHelper')}
            </p>
          </div>
        )}

        {/* Success / Error messages */}
        {wspSuccess && (
          <p style={{ textAlign: "center", color: "#28a745", marginTop: "0.75em", fontWeight: "600" }}>
            {wspSuccess}
          </p>
        )}
        {wspError && (
          <p style={{ textAlign: "center", color: "#dc3545", marginTop: "0.75em", fontWeight: "600" }}>
            {wspError}
          </p>
        )}
      </div>
    </div>
  );
}
