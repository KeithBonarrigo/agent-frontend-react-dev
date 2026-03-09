import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import { loadFacebookSdk } from "../utils/loadFacebookSdk";
import "./Tabs.css";

// IntegrationsTab - Displays embed code and integration methods for the AI agent
// Provides the script tag users need to embed the chatbot on their website
// Includes WhatsApp phone number registration with SMS verification
// Includes Messenger page connection via Facebook Login
export default function IntegrationsTab({ user, clientId, onClientUpdate }) {
  const { t } = useTranslation('integrations');
  const [searchParams, setSearchParams] = useSearchParams();

  const [copied, setCopied] = useState(false);
  const [chatbotLoaded, setChatbotLoaded] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const chatbotScriptRef = useRef(null);
  const customCssRef = useRef(null);

  // Pre-load Facebook SDK so FB.login() can be called synchronously on click
  useEffect(() => {
    loadFacebookSdk().catch(() => {});
  }, []);

  // Persist integration states to localStorage
  const saveIntegrationState = (updates) => {
    try {
      const key = `integrations_${clientId}`;
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...saved, ...updates }));
    } catch { /* ignore */ }
  };

  // Restore integration states from localStorage on mount
  // This ensures connected states survive tab switches and page refreshes
  useEffect(() => {
    if (!clientId) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`integrations_${clientId}`) || '{}');
      if (saved.igStatus === 'active' && saved.igAccountName) {
        setIgStatus('active');
        setIgAccountName(saved.igAccountName);
      }
      if (saved.msgStatus === 'active' && saved.msgPageName) {
        setMsgStatus('active');
        setMsgPageName(saved.msgPageName);
        if (saved.msgPageId) setMsgPageId(saved.msgPageId);
      }
      if (saved.wspStatus === 'active' && saved.wspPhone) {
        setWspStatus('active');
        setSavedWspPhone(saved.wspPhone);
      }
    } catch { /* ignore */ }
  }, [clientId]);

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

  // Instagram state
  const [igStatus, setIgStatus] = useState(user?.instagram_status || null);
  const [igAccountName, setIgAccountName] = useState(user?.instagram_account_name || '');
  const [igLoading, setIgLoading] = useState(false);
  const [igError, setIgError] = useState('');
  const [igSuccess, setIgSuccess] = useState('');

  // Instagram test message state
  const [igTestRecipient, setIgTestRecipient] = useState('');
  const [igTestMessage, setIgTestMessage] = useState('');
  const [igTestLoading, setIgTestLoading] = useState(false);
  const [igTestResult, setIgTestResult] = useState({ type: '', message: '' });

  // Google Calendar state
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalEmail, setGcalEmail] = useState('');
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalChecking, setGcalChecking] = useState(true);
  const [gcalError, setGcalError] = useState('');

  // Check for OAuth redirect (Google Calendar)
  useEffect(() => {
    const oauthResult = searchParams.get('oauth');
    const provider = searchParams.get('provider');
    if (oauthResult && provider === 'google-calendar') {
      if (oauthResult === 'success') {
        fetchGcalStatus();
      } else {
        setGcalError(searchParams.get('message') || t('googleCalendar.connectError'));
        setTimeout(() => setGcalError(''), 5000);
      }
      setSearchParams({});
    }
  }, [searchParams]);

  // Fetch Google Calendar OAuth status on mount
  useEffect(() => {
    if (clientId) fetchGcalStatus();
  }, [clientId]);

  const fetchGcalStatus = async () => {
    if (!clientId) return;
    setGcalChecking(true);
    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/integrations/google-calendar/status/${clientId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setGcalConnected(data.connected || false);
        setGcalEmail(data.email || '');
      } else {
        setGcalConnected(false);
      }
    } catch {
      setGcalConnected(false);
    } finally {
      setGcalChecking(false);
    }
  };

  const handleGcalConnect = async () => {
    if (!clientId) return;
    setGcalLoading(true);
    setGcalError('');
    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/integrations/google-calendar/oauth-url?clientId=${clientId}&origin=${encodeURIComponent(window.location.origin)}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to get OAuth URL');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL returned');
      }
    } catch (err) {
      setGcalError(err.message);
      setTimeout(() => setGcalError(''), 5000);
    } finally {
      setGcalLoading(false);
    }
  };

  const handleGcalDisconnect = async () => {
    if (!clientId || !confirm(t('googleCalendar.confirmDisconnect'))) return;
    setGcalLoading(true);
    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/decorators/googleAvailabilityDecorator`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setGcalConnected(false);
        setGcalEmail('');
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      setGcalError(err.message);
      setTimeout(() => setGcalError(''), 5000);
    } finally {
      setGcalLoading(false);
    }
  };

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
      onClientUpdate?.({ wsp_status: 'active', office_wsp_phone: data.phone_number || wspPhone });
      saveIntegrationState({ wspStatus: 'active', wspPhone: data.phone_number || wspPhone });
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
      onClientUpdate?.({ wsp_status: null, office_wsp_phone: '' });
      saveIntegrationState({ wspStatus: null, wspPhone: '' });
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
      }, { config_id: import.meta.env.VITE_MSG_CONFIG_ID });

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
      onClientUpdate?.({ messenger_status: 'active', messenger_page_name: pageName || data.page_name, messenger_page_id: pageId });
      saveIntegrationState({ msgStatus: 'active', msgPageName: pageName || data.page_name, msgPageId: pageId });
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

  // Instagram: connect via Facebook Login for Business (Instagram config)
  const handleInstagramConnect = async () => {
    setIgLoading(true);
    setIgError('');
    setIgSuccess('');

    try {
      const FB = await loadFacebookSdk();

      FB.login((response) => {
        if (response.authResponse) {
          const userAccessToken = response.authResponse.accessToken;
          // Send token to backend — backend will exchange for long-lived token,
          // look up the linked Instagram Business Account, and subscribe to webhooks
          handleInstagramSubmit(userAccessToken);
        } else {
          setIgError(t('instagram.loginCancelled'));
          setIgLoading(false);
        }
      }, { config_id: import.meta.env.VITE_IG_CONFIG_ID });

    } catch (err) {
      setIgError(err.message || t('instagram.sdkLoadError'));
      setIgLoading(false);
    }
  };

  // Instagram: submit token to backend
  const handleInstagramSubmit = async (userAccessToken) => {
    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/instagram-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_access_token: userAccessToken })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('instagram.connectError'));

      const accountName = data.instagram_username || data.instagram_account_name || '';
      setIgStatus('active');
      setIgAccountName(accountName);
      setIgSuccess(t('instagram.success'));
      setTimeout(() => setIgSuccess(''), 5000);
      onClientUpdate?.({ instagram_status: 'active', instagram_account_name: accountName });
      saveIntegrationState({ igStatus: 'active', igAccountName: accountName });
    } catch (err) {
      setIgError(err.message);
    } finally {
      setIgLoading(false);
    }
  };

  // Instagram: disconnect
  const handleInstagramDisconnect = async () => {
    if (!window.confirm(t('instagram.removeConfirm'))) return;
    setIgLoading(true);
    setIgError('');

    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/instagram-connect`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to disconnect');
      }
      setIgAccountName('');
      setIgStatus(null);
      onClientUpdate?.({ instagram_status: null, instagram_account_name: '' });
      saveIntegrationState({ igStatus: null, igAccountName: '' });
    } catch (err) {
      setIgError(t('instagram.removeError'));
    } finally {
      setIgLoading(false);
    }
  };

  // Instagram: send test message
  const handleInstagramTestMessage = async () => {
    if (!igTestRecipient.trim() || !igTestMessage.trim()) return;
    setIgTestLoading(true);
    setIgTestResult({ type: '', message: '' });

    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/instagram-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipient_id: igTestRecipient.trim(),
          message: igTestMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('instagram.sendError'));

      setIgTestResult({ type: 'success', message: t('instagram.sendSuccess') });
      setIgTestMessage('');
      setTimeout(() => setIgTestResult({ type: '', message: '' }), 5000);
    } catch (err) {
      setIgTestResult({ type: 'error', message: err.message });
    } finally {
      setIgTestLoading(false);
    }
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
      onClientUpdate?.({ messenger_status: null, messenger_page_name: '', messenger_page_id: '' });
      saveIntegrationState({ msgStatus: null, msgPageName: '', msgPageId: '' });
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
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6em',
          padding: '0.75em 1em',
          backgroundColor: '#e8f4fd',
          border: '1px solid #bee5eb',
          borderRadius: '6px',
          color: '#0c5460',
          fontSize: '0.85em',
          lineHeight: '1.5',
          marginBottom: '1.5em'
        }}>
          <i className="fa-solid fa-circle-info" style={{ marginTop: '0.2em', flexShrink: 0 }}></i>
          <span>
            <strong>{t('mlsWarning.title')}</strong> {t('mlsWarning.message')}
            <br /><span style={{ fontStyle: 'italic' }}>{t('mlsWarning.note')}</span>
          </span>
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

      {/* Integration Cards */}
      <div className="grid grid-cards" style={{ marginTop: '2em' }}>

        {/* WhatsApp Card */}
        <div style={{
          backgroundColor: "#fff",
          border: `2px solid ${wspStatus === 'active' && savedWspPhone ? "#28a745" : "#dee2e6"}`,
          borderRadius: "8px",
          padding: "1.25em",
          transition: "all 0.2s ease",
          boxShadow: wspStatus === 'active' && savedWspPhone ? "0 2px 8px rgba(40, 167, 69, 0.15)" : "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5em", marginBottom: "0.75em" }}>
            <i className="fa-brands fa-whatsapp" style={{ fontSize: "2.2em", color: "#25D366" }}></i>
            <h4 style={{ margin: 0, color: "#333", fontSize: "1.1em" }}>
              {t('whatsapp.title')}
            </h4>
          </div>

          {/* Content */}
          <div>
            <p style={{ margin: 0, fontSize: "0.9em", color: "#666", lineHeight: "1.5" }}>
              {t('whatsapp.description')}
              {wspStatus !== 'active' && <><br />{t('whatsapp.prerequisiteWarning')}</>}
            </p>

            {/* Connected: show phone number */}
            {wspStatus === 'active' && savedWspPhone ? (
              <div style={{ marginTop: "0.75em", paddingTop: "0.75em", borderTop: "1px solid #eee", fontSize: "0.85em" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#28a745", fontWeight: "600" }}>
                      <i className="fa-solid fa-check-circle" style={{ marginRight: "0.4em" }}></i>
                      {t('whatsapp.registered')}
                    </span>
                    <span style={{ color: "#666", marginLeft: "0.5em", fontSize: "0.9em" }}>
                      ({savedWspPhone})
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={wspLoading}
                    style={{
                      padding: "0.4em 0.8em",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: wspLoading ? "#ccc" : "#dc3545",
                      color: "#fff",
                      cursor: wspLoading ? "not-allowed" : "pointer",
                      fontSize: "0.85em",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4em",
                      flexShrink: 0,
                      minWidth: "120px",
                      justifyContent: "center"
                    }}
                  >
                    {wspLoading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fa-solid fa-unlink"></i> {t('whatsapp.remove')}</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Not connected: show registration form */
              <div style={{ marginTop: "1em", paddingTop: "0.75em", borderTop: "1px solid #eee" }}>
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

                {/* Status: Not Connected */}
                <div style={{ marginTop: "0.75em", paddingTop: "0.75em", borderTop: "1px solid #eee", fontSize: "0.85em" }}>
                  <span style={{ color: "#999" }}>
                    <i className="fa-solid fa-circle" style={{ marginRight: "0.4em" }}></i>
                    {t('whatsapp.notConnected') || 'Not connected'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Success / Error messages */}
          {wspSuccess && (
            <p style={{ textAlign: "center", color: "#28a745", marginTop: "0.75em", fontWeight: "600", marginBottom: 0 }}>
              {wspSuccess}
            </p>
          )}
          {wspError && (
            <p style={{ textAlign: "center", color: "#dc3545", marginTop: "0.75em", fontWeight: "600", marginBottom: 0 }}>
              {wspError}
            </p>
          )}
        </div>

        {/* Messenger Card */}
        <div style={{
          backgroundColor: "#fff",
          border: `2px solid ${msgStatus === 'active' && msgPageName ? "#28a745" : "#dee2e6"}`,
          borderRadius: "8px",
          padding: "1.25em",
          transition: "all 0.2s ease",
          boxShadow: msgStatus === 'active' && msgPageName ? "0 2px 8px rgba(40, 167, 69, 0.15)" : "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5em", marginBottom: "0.75em" }}>
            <i className="fa-brands fa-facebook-messenger" style={{ fontSize: "2.2em", color: "#0084FF" }}></i>
            <h4 style={{ margin: 0, color: "#333", fontSize: "1.1em" }}>
              {t('messenger.title')}
            </h4>
          </div>

          {/* Content */}
          <div>
            <p style={{ margin: 0, fontSize: "0.9em", color: "#666", lineHeight: "1.5" }}>
              {t('messenger.description')}
            </p>

            {/* Connected: show page name */}
            {msgStatus === 'active' && msgPageName ? (
              <div style={{ marginTop: "0.75em", paddingTop: "0.75em", borderTop: "1px solid #eee", fontSize: "0.85em" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#28a745", fontWeight: "600" }}>
                      <i className="fa-solid fa-check-circle" style={{ marginRight: "0.4em" }}></i>
                      {t('messenger.connected')}
                    </span>
                    <span style={{ color: "#666", marginLeft: "0.5em", fontSize: "0.9em" }}>
                      ({msgPageName})
                    </span>
                  </div>
                  <button
                    onClick={handleMessengerDisconnect}
                    disabled={msgLoading}
                    style={{
                      padding: "0.4em 0.8em",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: msgLoading ? "#ccc" : "#dc3545",
                      color: "#fff",
                      cursor: msgLoading ? "not-allowed" : "pointer",
                      fontSize: "0.85em",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4em",
                      flexShrink: 0,
                      minWidth: "120px",
                      justifyContent: "center"
                    }}
                  >
                    {msgLoading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fa-solid fa-unlink"></i> {t('messenger.disconnect')}</>
                    )}
                  </button>
                </div>
              </div>
            ) : msgStep === 'select-page' ? (
              /* Page selection state */
              <div style={{ marginTop: "1em", paddingTop: "0.75em", borderTop: "1px solid #eee" }}>
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

                <div style={{ marginTop: "0.75em", paddingTop: "0.75em", borderTop: "1px solid #eee", fontSize: "0.85em" }}>
                  <span style={{ color: "#999" }}>
                    <i className="fa-solid fa-circle" style={{ marginRight: "0.4em" }}></i>
                    {t('messenger.notConnected') || 'Not connected'}
                  </span>
                </div>
              </div>
            ) : (
              /* Disconnected state */
              <div style={{ marginTop: "0.75em", paddingTop: "0.75em", borderTop: "1px solid #eee", fontSize: "0.85em" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#999" }}>
                    <i className="fa-solid fa-circle" style={{ marginRight: "0.4em" }}></i>
                    {t('messenger.notConnected') || 'Not connected'}
                  </span>
                  <button
                    onClick={handleMessengerConnect}
                    disabled={msgLoading}
                    style={{
                      padding: "0.4em 0.8em",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: msgLoading ? "#ccc" : "#007bff",
                      color: "#fff",
                      cursor: msgLoading ? "not-allowed" : "pointer",
                      fontSize: "0.85em",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4em",
                      flexShrink: 0,
                      minWidth: "120px",
                      justifyContent: "center"
                    }}
                  >
                    {msgLoading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fa-solid fa-link"></i> {t('messenger.connectButton')}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Success / Error messages */}
          {msgSuccess && (
            <p style={{ textAlign: "center", color: "#28a745", marginTop: "0.75em", fontWeight: "600", marginBottom: 0 }}>
              {msgSuccess}
            </p>
          )}
          {msgError && (
            <p style={{ textAlign: "center", color: "#dc3545", marginTop: "0.75em", fontWeight: "600", marginBottom: 0 }}>
              {msgError}
            </p>
          )}
        </div>

        {/* Google Calendar Card */}
        <div style={{
          backgroundColor: "#fff",
          border: `2px solid ${gcalConnected ? "#28a745" : "#dee2e6"}`,
          borderRadius: "8px",
          padding: "1.25em",
          transition: "all 0.2s ease",
          boxShadow: gcalConnected ? "0 2px 8px rgba(40, 167, 69, 0.15)" : "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          {/* Header - centered logo + title like other cards */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5em", marginBottom: "0.75em" }}>
            <img
              src="/img/add-ons/free-google-calendar-logo-icon.webp"
              alt="Google Calendar"
              style={{ width: "2.2em", height: "2.2em", objectFit: "contain" }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h4 style={{ margin: 0, color: "#333", fontSize: "1.1em" }}>
              {t('googleCalendar.title')}
            </h4>
          </div>

          {/* Content */}
          <div>
            {/* Sign in with Google badge */}
            <span style={{
              fontSize: "0.75em",
              backgroundColor: "#e7f3ff",
              color: "#0066cc",
              padding: "0.2em 0.5em",
              borderRadius: "4px",
              display: "inline-block",
              marginBottom: "0.5em"
            }}>
              <i className="fa-brands fa-google" style={{ marginRight: "0.3em" }}></i>
              {t('googleCalendar.signInWithGoogle')}
            </span>

            <p style={{ margin: 0, fontSize: "0.9em", color: "#666", lineHeight: "1.5" }}>
              {t('googleCalendar.description')}
            </p>

            {/* Status + connect/disconnect */}
            <div style={{ marginTop: "0.75em", paddingTop: "0.75em", borderTop: "1px solid #eee", fontSize: "0.85em" }}>
              {gcalChecking ? (
                <span style={{ color: "#666" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.4em" }}></i>
                  {t('googleCalendar.checking')}
                </span>
              ) : gcalConnected ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#28a745", fontWeight: "600" }}>
                      <i className="fa-solid fa-check-circle" style={{ marginRight: "0.4em" }}></i>
                      {t('googleCalendar.connected')}
                    </span>
                    {gcalEmail && (
                      <span style={{ color: "#666", marginLeft: "0.5em", fontSize: "0.9em" }}>
                        ({gcalEmail})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleGcalDisconnect}
                    disabled={gcalLoading}
                    style={{
                      padding: "0.4em 0.8em",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: gcalLoading ? "#ccc" : "#dc3545",
                      color: "#fff",
                      cursor: gcalLoading ? "not-allowed" : "pointer",
                      fontSize: "0.85em",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4em",
                      flexShrink: 0,
                      minWidth: "120px",
                      justifyContent: "center"
                    }}
                  >
                    {gcalLoading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fa-solid fa-unlink"></i> {t('googleCalendar.disconnect')}</>
                    )}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#999" }}>
                    <i className="fa-solid fa-circle" style={{ marginRight: "0.4em" }}></i>
                    {t('googleCalendar.notConnected')}
                  </span>
                  <button
                    onClick={handleGcalConnect}
                    disabled={gcalLoading}
                    style={{
                      padding: "0.4em 0.8em",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: gcalLoading ? "#ccc" : "#007bff",
                      color: "#fff",
                      cursor: gcalLoading ? "not-allowed" : "pointer",
                      fontSize: "0.85em",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4em",
                      flexShrink: 0,
                      minWidth: "120px",
                      justifyContent: "center"
                    }}
                  >
                    {gcalLoading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fa-solid fa-link"></i> {t('googleCalendar.connect')}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {gcalError && (
            <p style={{ textAlign: "center", color: "#dc3545", marginTop: "0.75em", fontWeight: "600", marginBottom: 0 }}>
              {gcalError}
            </p>
          )}
        </div>

        {/* Instagram Card */}
        <div style={{
          backgroundColor: "#fff",
          border: `2px solid ${igStatus === 'active' && igAccountName ? "#28a745" : "#dee2e6"}`,
          borderRadius: "8px",
          padding: "1.25em",
          transition: "all 0.2s ease",
          boxShadow: igStatus === 'active' && igAccountName ? "0 2px 8px rgba(40, 167, 69, 0.15)" : "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5em", marginBottom: "0.75em" }}>
            <i className="fa-brands fa-instagram" style={{ fontSize: "2.2em", color: "#E4405F" }}></i>
            <h4 style={{ margin: 0, color: "#333", fontSize: "1.1em" }}>
              {t('instagram.title')}
            </h4>
          </div>

          {/* Content */}
          <div>
            <p style={{ margin: 0, fontSize: "0.9em", color: "#666", lineHeight: "1.5" }}>
              {t('instagram.description')}
              {igStatus !== 'active' && <><br />{t('instagram.prerequisiteWarning')}</>}
            </p>

            {/* Connected: show account + test message */}
            {igStatus === 'active' && igAccountName ? (
              <>
                <div style={{ marginTop: "0.75em", paddingTop: "0.75em", borderTop: "1px solid #eee", fontSize: "0.85em" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: "#28a745", fontWeight: "600" }}>
                        <i className="fa-solid fa-check-circle" style={{ marginRight: "0.4em" }}></i>
                        {t('instagram.connected')}
                      </span>
                      <span style={{ color: "#666", marginLeft: "0.5em", fontSize: "0.9em" }}>
                        (@{igAccountName})
                      </span>
                    </div>
                    <button
                      onClick={handleInstagramDisconnect}
                      disabled={igLoading}
                      style={{
                        padding: "0.4em 0.8em",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: igLoading ? "#ccc" : "#dc3545",
                        color: "#fff",
                        cursor: igLoading ? "not-allowed" : "pointer",
                        fontSize: "0.85em",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4em",
                        flexShrink: 0
                      }}
                    >
                      {igLoading ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <><i className="fa-solid fa-unlink"></i> {t('instagram.disconnect')}</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Send Test Message */}
                <div style={{ marginTop: "1em", paddingTop: "0.75em", borderTop: "1px solid #eee" }}>
                  <h4 style={{ fontSize: "0.95em", fontWeight: "600", color: "#333", marginTop: 0, marginBottom: "0.75em" }}>
                    <i className="fa-solid fa-paper-plane" style={{ marginRight: "0.5em" }}></i>
                    {t('instagram.testTitle')}
                  </h4>

                  <div style={{ marginBottom: "0.75em" }}>
                    <label style={{ display: "block", fontSize: "0.85em", fontWeight: "600", color: "#555", marginBottom: "0.25em" }}>
                      {t('instagram.recipientLabel')}
                    </label>
                    <input
                      type="text"
                      value={igTestRecipient}
                      onChange={(e) => setIgTestRecipient(e.target.value)}
                      placeholder={t('instagram.recipientPlaceholder')}
                      style={{
                        width: "100%",
                        padding: "0.5em 0.75em",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "0.9em",
                        boxSizing: "border-box"
                      }}
                    />
                    <span style={{ fontSize: "0.75em", color: "#888", marginTop: "0.25em", display: "block" }}>
                      {t('instagram.recipientHelper')}
                    </span>
                  </div>

                  <div style={{ marginBottom: "0.75em" }}>
                    <label style={{ display: "block", fontSize: "0.85em", fontWeight: "600", color: "#555", marginBottom: "0.25em" }}>
                      {t('instagram.messageLabel')}
                    </label>
                    <textarea
                      value={igTestMessage}
                      onChange={(e) => setIgTestMessage(e.target.value)}
                      placeholder={t('instagram.messagePlaceholder')}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "0.5em 0.75em",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "0.9em",
                        boxSizing: "border-box",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  <button
                    onClick={handleInstagramTestMessage}
                    disabled={igTestLoading || !igTestRecipient.trim() || !igTestMessage.trim()}
                    style={{
                      padding: "0.5em 1.5em",
                      backgroundColor: (igTestLoading || !igTestRecipient.trim() || !igTestMessage.trim()) ? "#ccc" : "#E4405F",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: (igTestLoading || !igTestRecipient.trim() || !igTestMessage.trim()) ? "default" : "pointer",
                      fontSize: "0.9em",
                      fontWeight: "600"
                    }}
                  >
                    {igTestLoading ? t('instagram.sending') : t('instagram.sendButton')}
                  </button>

                  {igTestResult.message && (
                    <p style={{
                      fontSize: "0.85em",
                      fontWeight: "600",
                      marginTop: "0.5em",
                      marginBottom: 0,
                      color: igTestResult.type === 'success' ? '#28a745' : '#dc3545'
                    }}>
                      {igTestResult.message}
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Not connected status */
              <div style={{ marginTop: "0.75em", paddingTop: "0.75em", borderTop: "1px solid #eee", fontSize: "0.85em" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#999" }}>
                    <i className="fa-solid fa-circle" style={{ marginRight: "0.4em" }}></i>
                    {t('instagram.notConnected') || 'Not connected'}
                  </span>
                  <button
                    onClick={handleInstagramConnect}
                    disabled={igLoading}
                    style={{
                      padding: "0.4em 0.8em",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: igLoading ? "#ccc" : "#007bff",
                      color: "#fff",
                      cursor: igLoading ? "not-allowed" : "pointer",
                      fontSize: "0.85em",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4em",
                      flexShrink: 0,
                      minWidth: "120px",
                      justifyContent: "center"
                    }}
                  >
                    {igLoading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fa-solid fa-link"></i> {t('instagram.connectButton')}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Success / Error messages */}
          {igSuccess && (
            <p style={{ textAlign: "center", color: "#28a745", marginTop: "0.75em", fontWeight: "600", marginBottom: 0 }}>
              {igSuccess}
            </p>
          )}
          {igError && (
            <p style={{ textAlign: "center", color: "#dc3545", marginTop: "0.75em", fontWeight: "600", marginBottom: 0 }}>
              {igError}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
