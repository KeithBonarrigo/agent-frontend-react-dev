import { useState } from "react";

export default function IntegrationsTab({ user, clientId }) {
  const [copied, setCopied] = useState(false);

  if (!clientId) {
    return (
      <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
        <p>Please select a subscription to configure integrations.</p>
      </div>
    );
  }

  const dashboardMode = import.meta.env.VITE_MODE || 'local';
  let webEmbedDomain;
  let webEmbedProtocol;
  
  switch(dashboardMode){
    case "local":
        webEmbedDomain = 'localhost:3000';
        webEmbedProtocol = 'http';
    break;
    case "dev":
        webEmbedDomain = 'chatdev.aibridge.global';
        webEmbedProtocol = 'https';
    break;
    case "staging":
        webEmbedDomain = 'chatstaging.aibridge.global';
        webEmbedProtocol = 'https';
    break;
    case "production":
        webEmbedDomain = 'chat.aibridge.global';
        webEmbedProtocol = 'https';
    break;
    default:
        webEmbedDomain = 'localhost:3000';
        webEmbedProtocol = 'http';
  }

  const embedCode = `<script src='${webEmbedProtocol}://${webEmbedDomain}/chatbot.js?id=${clientId}'></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
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
          Copy this code and paste it in the &lt;head&gt; section of your website.
        </p>
      </div>

      {/* Other Integrations Coming Soon */}
      <div style={{ marginTop: "2em", paddingTop: "2em", borderTop: "1px solid #ddd", textAlign: "center", color: "#666" }}>
        <h3>Other Integrations</h3>
        <p>WhatsApp, Messenger, and other integrations coming soon...</p>
      </div>
    </div>
  );
}