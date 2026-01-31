import { useState, useEffect } from "react";
import { getApiUrl } from "../utils/getApiUrl";

interface User {
  clientid?: number;
  contact_email?: string;
  first_name?: string;
  last_name?: string;
  level?: string;
  item?: number;
  company?: string;
}

interface StylingTabProps {
  user: User;
  clientId: number;
  onNavigateToIntegrations?: () => void;
}

const CSS_REFERENCE = `/* =============================================
   CHATBOT CSS REFERENCE
   ============================================= */

/* ---------------------------------------------
   #chatbot-container
   The main wrapper div for the entire chatbot.
   Fixed position in bottom-right corner.
   Contains: header, chat-box, and input.
   --------------------------------------------- */
#chatbot-container {
  position: fixed;
  bottom: 0;
  right: 20px;
  width: 300px;
  max-height: 70%;
  border-radius: 12px 12px 0 0;
  background-color: #ffffff;
  border: 1px solid #2c3e50;
  border-bottom: none;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.12), 0 -4px 15px rgba(0, 0, 0, 0.12);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ---------------------------------------------
   #chatbot-header
   The clickable header bar at the top.
   Shows "Chat with Us" text.
   Clicking toggles expand/collapse.
   --------------------------------------------- */
#chatbot-header {
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  color: white;
  padding: 15px 18px;
  text-align: center;
  font-weight: 600;
  font-size: 15px;
  align-items: center;
  letter-spacing: 0.3px;
  min-height: 50px;
  box-sizing: border-box;
}

/* ---------------------------------------------
   #chat-box
   The scrollable message area.
   Contains all user and bot messages.
   --------------------------------------------- */
#chat-box {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

/* Scrollbar styling for chat-box */
#chat-box::-webkit-scrollbar {
  width: 6px;
}
#chat-box::-webkit-scrollbar-track {
  background: #f1f1f1;
}
#chat-box::-webkit-scrollbar-thumb {
  background: #2c3e50;
  border-radius: 3px;
}
#chat-box::-webkit-scrollbar-thumb:hover {
  background: #1a252f;
}

/* ---------------------------------------------
   #chat-input
   The text input field at the bottom.
   Where users type their messages.
   --------------------------------------------- */
#chat-input {
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-top: 1px solid #2c3e50;
  font-size: 14px;
  font-family: inherit;
  background-color: #ffffff;
  color: #212529;
  outline: none;
  box-sizing: border-box;
}
#chat-input:focus {
  background-color: #f8f9fa;
}
#chat-input::placeholder {
  color: #6c757d;
}

/* ---------------------------------------------
   .user-icon
   The circular icon next to each message.
   fa-user for user messages, fa-robot for bot.
   --------------------------------------------- */
.user-icon {
  background-color: #2c3e50;
  color: white;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  font-size: 14px;
  flex-shrink: 0;
}

/* User icon (right-aligned messages) - blue */
#chat-box > div[style*="text-align: right"] .user-icon {
  background-color: #0d6efd;
  color: white;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.25);
  flex-shrink: 0;
}

/* Bot icon (left-aligned messages) - dark */
#chat-box > div[style*="text-align: left"] .user-icon {
  background-color: #2c3e50;
  color: white;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(44, 62, 80, 0.25);
  flex-shrink: 0;
}

/* ---------------------------------------------
   .bot-typing / #chatbot-typing
   The typing indicator with animated dots.
   Shown while waiting for bot response.
   --------------------------------------------- */
.bot-typing {
  background: transparent;
}
.bot-typing .bubble {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.bot-typing .dot {
  background: #2c3e50;
}

/* ---------------------------------------------
   .property-results / .property-grid / .property-card
   MLS/EasyBroker property listing cards.
   Used when bot returns property search results.
   --------------------------------------------- */
#chat-box .property-results {
  margin: 0;
  width: 100%;
}
#chat-box .property-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
#chat-box .property-card {
  width: 90%;
  max-width: 90%;
}`;

export default function StylingTab({ clientId, onNavigateToIntegrations }: StylingTabProps) {
  const [customCss, setCustomCss] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState("");

  const handleCopyReference = () => {
    navigator.clipboard.writeText(CSS_REFERENCE);
    setCopied(true);
    setCopyMessage(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setCopyMessage(false), 5000);
  };

  const handleSuggestColors = async () => {
    if (analyzing) return;

    setAnalyzing(true);
    setSuggestMessage("");

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/color-analysis/${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ save: false })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze colors');
      }

      const data = await response.json();

      if (data.customCss) {
        setCustomCss(data.customCss);
        setSuggestMessage("success");
        setTimeout(() => setSuggestMessage(""), 5000);
      }
    } catch (error) {
      console.error('Error analyzing colors:', error);
      setSuggestMessage("error");
      setTimeout(() => setSuggestMessage(""), 3000);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchStyling = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        const apiBaseUrl = getApiUrl();
        const response = await fetch(`${apiBaseUrl}/api/client-styling/${clientId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setCustomCss(data.custom_css || "");
        }
      } catch (error) {
        console.error('Error fetching styling:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStyling();
  }, [clientId]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/client-styling/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ custom_css: customCss })
      });

      if (!response.ok) {
        throw new Error('Failed to save styling');
      }

      setSaveMessage("Styling saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error('Error saving styling:', error);
      setSaveMessage("Failed to save styling");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      <h2>Custom CSS</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1em" }}>
            <p style={{ color: "#666", fontSize: "0.9em", margin: 0 }}>
              Add custom CSS to style your chat widget. These styles will be injected into the widget.
            </p>
            <div style={{ display: "flex", gap: "0.5em" }}>
              <button
                onClick={handleSuggestColors}
                disabled={analyzing}
                style={{
                  padding: "6px 12px",
                  backgroundColor: analyzing ? "#6c757d" : "#6f42c1",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: analyzing ? "not-allowed" : "pointer",
                  fontSize: "0.85em",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className={analyzing ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-palette"}></i>
                {analyzing ? "Analyzing..." : "Suggest Colors"}
              </button>
              <button
                onClick={handleCopyReference}
                style={{
                  padding: "6px 12px",
                  backgroundColor: copied ? "#28a745" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.85em",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className={copied ? "fa-solid fa-check" : "fa-solid fa-copy"}></i>
                {copied ? "Copied!" : "Copy Current Styling"}
              </button>
            </div>
          </div>

          {suggestMessage && (
            <p style={{
              margin: "0 0 1em 0",
              padding: "8px 12px",
              borderRadius: "4px",
              backgroundColor: suggestMessage === "success" ? "#d4edda" : "#f8d7da",
              color: suggestMessage === "success" ? "#155724" : "#721c24",
              fontSize: "0.9em",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <i className={suggestMessage === "success" ? "fa-solid fa-wand-magic-sparkles" : "fa-solid fa-exclamation-circle"}></i>
              {suggestMessage === "success" ? "Colors suggested! Review and save when ready." : "Failed to analyze colors. Please try again."}
            </p>
          )}

          {copyMessage && (
            <p style={{
              margin: "0 0 1em 0",
              padding: "8px 12px",
              borderRadius: "4px",
              backgroundColor: "#d1ecf1",
              color: "#0c5460",
              fontSize: "0.9em",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <i className="fa-solid fa-clipboard-check"></i>
              Current styling copied! Paste it in the text field below to edit.
            </p>
          )}

          <textarea
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder={CSS_REFERENCE}
            style={{
              width: "100%",
              minHeight: "500px",
              padding: "12px",
              fontFamily: "monospace",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              resize: "vertical",
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              lineHeight: "1.5"
            }}
          />

          <div style={{ marginTop: "1em", display: "flex", alignItems: "center", gap: "1em" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 20px",
                backgroundColor: saving ? "#6c757d" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  Save CSS
                </>
              )}
            </button>

            {saveMessage && (
              <span style={{
                color: saveMessage.includes('successfully') ? '#28a745' : '#dc3545',
                fontWeight: "bold"
              }}>
                {saveMessage.includes('successfully') ? '✅' : '❌'} {saveMessage}
                {saveMessage.includes('successfully') && onNavigateToIntegrations && (
                  <>
                    {' '}
                    <button
                      onClick={onNavigateToIntegrations}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#007bff',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit',
                        fontWeight: 'normal'
                      }}
                    >
                      Test it in Integrations
                    </button>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
