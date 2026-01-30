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
  /* position, width, height, border-radius, background, box-shadow, z-index */
}

/* ---------------------------------------------
   #chatbot-header
   The clickable header bar at the top.
   Shows "Chat with Us" text.
   Clicking toggles expand/collapse.
   --------------------------------------------- */
#chatbot-header {
  /* background, color, padding, font-weight, font-size */
}

/* ---------------------------------------------
   #chat-box
   The scrollable message area.
   Contains all user and bot messages.
   --------------------------------------------- */
#chat-box {
  /* flex, overflow-y, padding, background-color, font-size */
}

/* Scrollbar styling for chat-box */
#chat-box::-webkit-scrollbar { }
#chat-box::-webkit-scrollbar-track { }
#chat-box::-webkit-scrollbar-thumb { }

/* ---------------------------------------------
   #chat-input
   The text input field at the bottom.
   Where users type their messages.
   --------------------------------------------- */
#chat-input {
  /* width, padding, border, font-size, background-color */
}
#chat-input:focus { }
#chat-input::placeholder { }

/* ---------------------------------------------
   .user-icon
   The circular icon next to each message.
   fa-user for user messages, fa-robot for bot.
   --------------------------------------------- */
.user-icon {
  /* background-color, color, border-radius, width, height */
}

/* User icon (right-aligned messages) */
#chat-box > div[style*="text-align: right"] .user-icon { }

/* Bot icon (left-aligned messages) */
#chat-box > div[style*="text-align: left"] .user-icon { }

/* ---------------------------------------------
   .bot-typing / #chatbot-typing
   The typing indicator with animated dots.
   Shown while waiting for bot response.
   --------------------------------------------- */
.bot-typing { }
.bot-typing .bubble { }
.bot-typing .dot { }

/* ---------------------------------------------
   .property-results / .property-grid / .property-card
   MLS/EasyBroker property listing cards.
   Used when bot returns property search results.
   --------------------------------------------- */
#chat-box .property-results { }
#chat-box .property-grid { }
#chat-box .property-card { }`;

export default function StylingTab({ clientId }: StylingTabProps) {
  const [customCss, setCustomCss] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(CSS_REFERENCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              {copied ? "Copied!" : "Copy Reference"}
            </button>
          </div>

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
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
