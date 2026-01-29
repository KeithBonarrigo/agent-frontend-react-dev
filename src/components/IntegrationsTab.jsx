import { useState, useRef } from "react";

// IntegrationsTab - Displays embed code and integration methods for the AI agent
// Provides the script tag users need to embed the chatbot on their website
// Future: Will include WhatsApp, Messenger, and other platform integrations
export default function IntegrationsTab({ user, clientId }) {
  const [copied, setCopied] = useState(false);
  const [chatbotLoaded, setChatbotLoaded] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const chatbotScriptRef = useRef(null);

  if (!clientId) {
    return (
      <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
        <p>Please select a subscription to configure integrations.</p>
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
  const handleTryItOut = () => {
    if (chatbotLoaded || chatbotLoading) return;

    setChatbotLoading(true);

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
      alert('Failed to load chatbot. Please try again.');
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
          <strong>⚠️ MLS Token Required:</strong> You must enter a valid MLS token for this service to work. You can do this above in your company settings.
          <br /><span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>Note: The token is encrypted upon entry and will not be viewable afterward.</span>
        </div>
      )}

      {/* Website Embed Code Section */}
      <div style={{ marginBottom: "2em" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1em" }}>Website Embed Code</h2>
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
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
        <p style={{ fontSize: "0.9em", color: "#666", marginTop: "0.5em", textAlign: "center" }}>
          Copy this code and paste it in the &lt;head&gt; section of your website at <strong style={{ color: '#007bff' }}>{user?.domain_to_install_bot || 'your domain'}</strong>.
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
            {chatbotLoading ? "Loading..." : chatbotLoaded ? "Chatbot loaded! Look for it in the corner." : "Try It Out!"}
          </button>
        </div>
      </div>

      {/* Other Integrations Coming Soon */}
      <div style={{ marginTop: "2em", paddingTop: "2em", borderTop: "1px solid #ddd", textAlign: "center", color: "#666" }}>
        <h3>Other Integrations</h3>
        <p>WhatsApp, Messenger, and other integrations coming soon...</p>
      </div>
    </div>
  );
}
