import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import { loadFacebookSdk } from "../utils/loadFacebookSdk";
import "./Tabs.css";

// IntegrationsTab - Displays embed code and integration methods for the AI agent
// Provides the script tag users need to embed the chatbot on their website
// Includes WhatsApp phone number registration with SMS verification
// Includes Messenger page connection via Facebook Login
export default function IntegrationsTab({ user, clientId }) {
  const { t } = useTranslation('integrations');

  const [copied, setCopied] = useState(false);
  const [chatbotLoaded, setChatbotLoaded] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const chatbotScriptRef = useRef(null);
  const customCssRef = useRef(null);

  // Pre-load Facebook SDK so FB.login() can be called synchronously on click
  useEffect(() => {
    loadFacebookSdk().catch(() => {});
  }, []);

  // WhatsApp registration state
  const [wspStatus, setWspStatus] = useState(user?.wsp_status || null);
  const [savedWspPhone, setSavedWspPhone] = useState(user?.office_wsp_phone || '');
  const [wspPhone, setWspPhone] = useState('');
  const [wspCode, setWspCode] = useState('');
  const [wspPin, setWspPin] = useState('');
  const [wspStep, setWspStep] = useState('input'); // 'input' or 'verify'
  const [wspLoading, setWspLoading] = useState(false);
  const [wspError, setWspError] = useState('');
  const [wspSuccess, setWspSuccess] = useState('');

  // Messenger state
  const [msgStatus, setMsgStatus] = useState(user?.messenger_status || null);
  const [msgPageName, setMsgPageName] = useState(user?.messenger_page_name || '');
  const [msgPageId, setMsgPageId] = useState(user?.messenger_page_id || '');
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');
  const [msgPages, setMsgPages] = useState([]);
  const [msgSelectedPageId, setMsgSelectedPageId] = useState('');
  const [msgUserToken, setMsgUserToken] = useState('');
  const [msgStep, setMsgStep] = useState('connect'); // 'connect' or 'select-page'

  // Send verification code to the entered phone number
  const handleSendCode = async () => {
    if (!wspPhone.trim()) return;
    setWspLoading(true);
    setWspError('');
    setWspSuccess('');

    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/whatsapp-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone_number: wspPhone.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('whatsapp.sendCodeError'));

      setWspStep('verify');
      setWspSuccess(t('whatsapp.codeSent'));
      setTimeout(() => setWspSuccess(''), 5000);
    } catch (err) {
      setWspError(err.message);
    } finally {
      setWspLoading(false);
    }
  };

  // Verify the code entered by the user
  const handleVerifyCode = async () => {
    if (!wspCode.trim() || !wspPin.trim() || wspPin.trim().length !== 6) return;
    setWspLoading(true);
    setWspError('');
    setWspSuccess('');

    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/whatsapp-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: wspCode.trim(), pin: wspPin.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('whatsapp.verifyError'));

      setWspStatus('active');
      setSavedWspPhone(data.phone_number || wspPhone);
      setWspSuccess(t('whatsapp.success'));
      setWspPhone('');
      setWspCode('');
      setWspPin('');
      setWspStep('input');
      setTimeout(() => setWspSuccess(''), 5000);
    } catch (err) {
      setWspError(err.message);
    } finally {
      setWspLoading(false);
    }
  };

  // Disconnect the registered WhatsApp number
  const handleDisconnect = async () => {
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
      setWspStep('input');
    } catch (err) {
      setWspError(t('whatsapp.removeError'));
    } finally {
      setWspLoading(false);
    }
  };

  // Messenger: initiate FB.login and fetch Pages
  const handleMessengerConnect = async () => {
    setMsgLoading(true);
    setMsgError('');
    setMsgSuccess('');

    try {
      const FB = await loadFacebookSdk();

      FB.login((response) => {
        if (response.authResponse) {
          const userAccessToken = response.authResponse.accessToken;
          setMsgUserToken(userAccessToken);

          FB.api('/me/accounts', { access_token: userAccessToken }, (pagesResponse) => {
            if (pagesResponse.error) {
              setMsgError(t('messenger.fetchPagesError'));
              setMsgLoading(false);
              return;
            }

            const pages = pagesResponse.data || [];

            if (pages.length === 0) {
              setMsgError(t('messenger.noPagesFound'));
              setMsgLoading(false);
              return;
            }

            if (pages.length === 1) {
              handleMessengerSubmit(userAccessToken, pages[0].id, pages[0].name);
            } else {
              setMsgPages(pages.map(p => ({ id: p.id, name: p.name })));
              setMsgStep('select-page');
              setMsgLoading(false);
            }
          });
        } else {
          setMsgError(t('messenger.loginCancelled'));
          setMsgLoading(false);
        }
      }, { scope: 'pages_messaging,pages_manage_metadata' });

    } catch (err) {
      setMsgError(err.message || t('messenger.sdkLoadError'));
      setMsgLoading(false);
    }
  };

  // Messenger: submit selected page + token to backend
  const handleMessengerSubmit = async (userAccessToken, pageId, pageName) => {
    setMsgLoading(true);
    setMsgError('');

    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/messenger-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_access_token: userAccessToken,
          page_id: pageId,
          page_name: pageName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('messenger.connectError'));

      setMsgStatus('active');
      setMsgPageName(pageName || data.page_name);
      setMsgPageId(pageId);
      setMsgStep('connect');
      setMsgPages([]);
      setMsgSelectedPageId('');
      setMsgUserToken('');
      setMsgSuccess(t('messenger.success'));
      setTimeout(() => setMsgSuccess(''), 5000);
    } catch (err) {
      setMsgError(err.message);
    } finally {
      setMsgLoading(false);
    }
  };

  // Messenger: confirm page selection from dropdown
  const handlePageSelectConfirm = () => {
    if (!msgSelectedPageId || !msgUserToken) return;
    const selectedPage = msgPages.find(p => p.id === msgSelectedPageId);
    if (!selectedPage) return;
    handleMessengerSubmit(msgUserToken, selectedPage.id, selectedPage.name);
  };

  // Messenger: disconnect
  const handleMessengerDisconnect = async () => {
    if (!window.confirm(t('messenger.removeConfirm'))) return;
    setMsgLoading(true);
    setMsgError('');

    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/messenger-connect`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to disconnect');
      }
      setMsgPageName('');
      setMsgPageId('');
      setMsgStatus(null);
      setMsgStep('connect');
    } catch (err) {
      setMsgError(t('messenger.removeError'));
    } finally {
      setMsgLoading(false);
    }
  };

  if (!clientId) {
    return (
      <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
        <p>{t('noSubscription')}</p>
      </div>
    );
  }

  // Determine the correct domain based on current hostname (runtime detection)
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
    webEmbedDomain = 'chat.botwerx.ai';
  }

  const embedCode = `<script src='${webEmbedProtocol}://${webEmbedDomain}/chatbot.js?id=${clientId}'></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTryItOut = async () => {
    if (chatbotLoaded || chatbotLoading) return;

    setChatbotLoading(true);

    try {
      const apiBaseUrl = getApiUrl();
      const cssResponse = await fetch(`${apiBaseUrl}/api/client-styling/${clientId}`, {
        credentials: 'include'
      });

      if (cssResponse.ok) {
        const cssData = await cssResponse.json();
        if (cssData.custom_css) {
          if (customCssRef.current) {
            customCssRef.current.remove();
          }
          const styleEl = document.createElement('style');
          styleEl.id = `custom-css-${clientId}`;
          styleEl.textContent = cssData.custom_css;
          document.head.appendChild(styleEl);
          customCssRef.current = styleEl;
        }
      }
    } catch (error) {
      console.error('Error fetching custom CSS:', error);
    }

    const chatbotUrl = `${webEmbedProtocol}://${webEmbedDomain}/chatbot.js?id=${clientId}`;

    const script = document.createElement('script');
    script.src = chatbotUrl;
    script.async = true;
    script.onload = () => {
      setChatbotLoading(false);
      setChatbotLoaded(true);
    };
    script.onerror = () => {
      setChatbotLoading(false);
      alert(t('webEmbed.loadFailed'));
    };

    document.body.appendChild(script);
  };

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

      {/* WhatsApp Registration */}
      <div style={{ marginTop: "2em", paddingTop: "2em", borderTop: "1px solid #ddd" }}>
        <h2 className="section-title section-title-centered" style={{ marginBottom: "1em" }}>
          <i className="fa-brands fa-whatsapp" style={{ color: "#25D366" }}></i>
          {' '}{t('whatsapp.title')}
        </h2>
        <p style={{ fontSize: "0.95em", color: "#666", textAlign: "center", marginBottom: "1.5em" }}>
          {t('whatsapp.description')}
        </p>

        {/* Prerequisite warning */}
        {wspStatus !== 'active' && (
          <p style={{
            fontSize: "0.85em",
            color: "#856404",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: "4px",
            padding: "0.75em 1em",
            width: "70%",
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: "1em",
            textAlign: "center"
          }}>
            {t('whatsapp.prerequisiteWarning')}
          </p>
        )}

        {/* State: Connected */}
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
                onClick={handleDisconnect}
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

        /* State: Not connected - show registration form */
        ) : (
          <div style={{
            backgroundColor: "#fff",
            padding: "1.5em",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #ddd",
            width: "70%",
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            {/* Step 1: Phone number input */}
            <div style={{ marginBottom: wspStep === 'verify' ? "1.25em" : 0 }}>
              <label style={{ display: "block", fontSize: "0.85em", color: "#555", marginBottom: "0.4em", fontWeight: "600" }}>
                {t('whatsapp.phoneLabel')}
              </label>
              <div style={{ display: "flex", gap: "0.5em" }}>
                <input
                  type="tel"
                  value={wspPhone}
                  onChange={(e) => setWspPhone(e.target.value)}
                  placeholder={t('whatsapp.phonePlaceholder')}
                  disabled={wspStep === 'verify' || wspLoading}
                  style={{
                    flex: 1,
                    padding: "0.6em 0.8em",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "1em",
                    backgroundColor: wspStep === 'verify' ? '#f0f0f0' : '#fff'
                  }}
                />
                <button
                  onClick={handleSendCode}
                  disabled={!wspPhone.trim() || wspLoading || wspStep === 'verify'}
                  style={{
                    padding: "0.6em 1.2em",
                    backgroundColor: (!wspPhone.trim() || wspLoading || wspStep === 'verify') ? "#ccc" : "#25D366",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: (!wspPhone.trim() || wspLoading || wspStep === 'verify') ? "default" : "pointer",
                    fontSize: "0.9em",
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}
                >
                  {wspLoading && wspStep === 'input' ? t('whatsapp.sending') : t('whatsapp.sendCode')}
                </button>
              </div>
              <p style={{ fontSize: "0.8em", color: "#888", marginTop: "0.4em", marginBottom: 0 }}>
                {t('whatsapp.phoneHelper')}
              </p>
            </div>

            {/* Step 2: Verification code input */}
            {wspStep === 'verify' && (
              <div>
                <label style={{ display: "block", fontSize: "0.85em", color: "#555", marginBottom: "0.4em", fontWeight: "600" }}>
                  {t('whatsapp.codeLabel')}
                </label>
                <div style={{ display: "flex", gap: "0.5em" }}>
                  <input
                    type="text"
                    value={wspCode}
                    onChange={(e) => setWspCode(e.target.value)}
                    placeholder={t('whatsapp.codePlaceholder')}
                    disabled={wspLoading}
                    style={{
                      flex: 1,
                      padding: "0.6em 0.8em",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "1em"
                    }}
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={!wspCode.trim() || wspPin.trim().length !== 6 || wspLoading}
                    style={{
                      padding: "0.6em 1.2em",
                      backgroundColor: (!wspCode.trim() || wspPin.trim().length !== 6 || wspLoading) ? "#ccc" : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: (!wspCode.trim() || wspPin.trim().length !== 6 || wspLoading) ? "default" : "pointer",
                      fontSize: "0.9em",
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {wspLoading ? t('whatsapp.verifying') : t('whatsapp.verify')}
                  </button>
                </div>
                {/* PIN input */}
                <label style={{ display: "block", fontSize: "0.85em", color: "#555", marginBottom: "0.4em", marginTop: "1em", fontWeight: "600" }}>
                  {t('whatsapp.pinLabel')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={wspPin}
                  onChange={(e) => setWspPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={t('whatsapp.pinPlaceholder')}
                  disabled={wspLoading}
                  style={{
                    width: "100%",
                    padding: "0.6em 0.8em",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "1em",
                    boxSizing: "border-box"
                  }}
                />
                <p style={{ fontSize: "0.8em", color: "#888", marginTop: "0.4em", marginBottom: 0 }}>
                  {t('whatsapp.pinHelper')}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4em" }}>
                  <p style={{ fontSize: "0.8em", color: "#888", margin: 0 }}>
                    {t('whatsapp.codeHelper')}
                  </p>
                  <button
                    onClick={() => { setWspStep('input'); setWspCode(''); setWspPin(''); setWspError(''); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#007bff",
                      cursor: "pointer",
                      fontSize: "0.8em",
                      textDecoration: "underline",
                      padding: 0
                    }}
                  >
                    {t('whatsapp.changeNumber')}
                  </button>
                </div>
              </div>
            )}
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

      {/* Messenger Integration */}
      <div style={{ marginTop: "2em", paddingTop: "2em", borderTop: "1px solid #ddd" }}>
        <h2 className="section-title section-title-centered" style={{ marginBottom: "1em" }}>
          <i className="fa-brands fa-facebook-messenger" style={{ color: "#0084FF" }}></i>
          {' '}{t('messenger.title')}
        </h2>
        <p style={{ fontSize: "0.95em", color: "#666", textAlign: "center", marginBottom: "1.5em" }}>
          {t('messenger.description')}
        </p>

        {/* Connected state */}
        {msgStatus === 'active' && msgPageName ? (
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
              <span style={{ fontSize: "0.85em", color: "#888" }}>{t('messenger.connectedPage')}</span>
              <p style={{ margin: "0.25em 0 0", fontSize: "1.1em", fontWeight: "600", color: "#333" }}>
                <i className="fa-brands fa-facebook-messenger" style={{ color: "#0084FF", marginRight: "0.5em" }}></i>
                {msgPageName}
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
                {t('messenger.connected')}
              </span>
              <button
                onClick={handleMessengerDisconnect}
                disabled={msgLoading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc3545",
                  cursor: msgLoading ? "default" : "pointer",
                  fontSize: "0.85em",
                  textDecoration: "underline",
                  padding: 0
                }}
              >
                {msgLoading ? t('messenger.disconnecting') : t('messenger.disconnect')}
              </button>
            </div>
          </div>

        ) : msgStep === 'select-page' ? (
          /* Page selection state */
          <div style={{
            backgroundColor: "#fff",
            padding: "1.5em",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #ddd",
            width: "70%",
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            <label style={{ display: "block", fontSize: "0.85em", color: "#555", marginBottom: "0.4em", fontWeight: "600" }}>
              {t('messenger.selectPageLabel')}
            </label>
            <div style={{ display: "flex", gap: "0.5em" }}>
              <select
                value={msgSelectedPageId}
                onChange={(e) => setMsgSelectedPageId(e.target.value)}
                disabled={msgLoading}
                style={{
                  flex: 1,
                  padding: "0.6em 0.8em",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "1em"
                }}
              >
                <option value="">{t('messenger.selectPagePlaceholder')}</option>
                {msgPages.map(page => (
                  <option key={page.id} value={page.id}>{page.name}</option>
                ))}
              </select>
              <button
                onClick={handlePageSelectConfirm}
                disabled={!msgSelectedPageId || msgLoading}
                style={{
                  padding: "0.6em 1.2em",
                  backgroundColor: (!msgSelectedPageId || msgLoading) ? "#ccc" : "#0084FF",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (!msgSelectedPageId || msgLoading) ? "default" : "pointer",
                  fontSize: "0.9em",
                  fontWeight: "600",
                  whiteSpace: "nowrap"
                }}
              >
                {msgLoading ? t('messenger.connecting') : t('messenger.confirmPage')}
              </button>
            </div>
            <p style={{ fontSize: "0.8em", color: "#888", marginTop: "0.4em", marginBottom: 0 }}>
              {t('messenger.selectPageHelper')}
            </p>
            <div style={{ marginTop: "0.6em" }}>
              <button
                onClick={() => { setMsgStep('connect'); setMsgPages([]); setMsgSelectedPageId(''); setMsgUserToken(''); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  cursor: "pointer",
                  fontSize: "0.8em",
                  textDecoration: "underline",
                  padding: 0
                }}
              >
                {t('messenger.cancelSelection')}
              </button>
            </div>
          </div>

        ) : (
          /* Disconnected state */
          <div style={{
            backgroundColor: "#fff",
            padding: "1.5em",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #ddd",
            width: "70%",
            marginLeft: "auto",
            marginRight: "auto",
            textAlign: "center"
          }}>
            <button
              onClick={handleMessengerConnect}
              disabled={msgLoading}
              style={{
                padding: "0.75em 2em",
                backgroundColor: msgLoading ? "#ccc" : "#0084FF",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: msgLoading ? "default" : "pointer",
                fontSize: "1em",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5em"
              }}
            >
              <i className="fa-brands fa-facebook"></i>
              {msgLoading ? t('messenger.connecting') : t('messenger.connectButton')}
            </button>
            <p style={{ fontSize: "0.8em", color: "#888", marginTop: "0.75em", marginBottom: 0 }}>
              {t('messenger.connectHelper')}
            </p>
          </div>
        )}

        {msgSuccess && (
          <p style={{ textAlign: "center", color: "#28a745", marginTop: "0.75em", fontWeight: "600" }}>
            {msgSuccess}
          </p>
        )}
        {msgError && (
          <p style={{ textAlign: "center", color: "#dc3545", marginTop: "0.75em", fontWeight: "600" }}>
            {msgError}
          </p>
        )}
      </div>
    </div>
  );
}
