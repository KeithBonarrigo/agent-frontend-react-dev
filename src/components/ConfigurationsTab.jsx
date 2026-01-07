import { useState, useEffect } from "react";

export default function ConfigurationsTab({ user }) {
  const [instructions, setInstructions] = useState(['']);
  const [loadingInstructions, setLoadingInstructions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch client instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      if (!user?.client_id) return;

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiBaseUrl}/api/client-instructions/${user.client_id}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch instructions');
        }

        const data = await response.json();
        
        // Extract instructions from the response
        if (data.client_instructions) {
          if (Array.isArray(data.client_instructions.client_instructions) && 
              data.client_instructions.client_instructions.length > 0) {
            setInstructions([...data.client_instructions.client_instructions, '']);
          } else {
            setInstructions(['']);
          }
        } else {
          setInstructions(['']);
        }
      } catch (error) {
        console.error('Error fetching instructions:', error);
        setInstructions(['']);
      } finally {
        setLoadingInstructions(false);
      }
    };

    if (user?.client_id) {
      fetchInstructions();
    }
  }, [user?.client_id]);

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
  }

  const embedCode = `<script src='${webEmbedProtocol}://${webEmbedDomain}/chatbot.js?id=${user?.client_id}'></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    if (newInstructions.length === 0) {
      newInstructions.push('');
    }
    setInstructions(newInstructions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');

    try {
      // Filter out empty instructions
      const filteredInstructions = instructions.filter(inst => inst.trim() !== '');
      
      const payload = {
        client_instructions: {
          client_instructions: filteredInstructions
        }
      };

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/client-instructions/${user.client_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error('Failed to save instructions');
      }

      setSaveMessage('✅ Instructions saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving instructions:', error);
      setSaveMessage('❌ Failed to save instructions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Website Embed Code Section */}
      <div style={{ marginBottom: "2em" }}>
        <p style={{ fontWeight: "bold", marginBottom: "0.5em" }}>Website Embed Code:</p>
        <div style={{ position: "relative" }}>
          <pre style={{ 
            backgroundColor: "#f5f5f5", 
            padding: "1em", 
            borderRadius: "4px",
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
              top: "0.5em",
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
        <p style={{ fontSize: "0.9em", color: "#666", marginTop: "0.5em" }}>
          Copy this code and paste it in the &lt;head&gt; section of your website.
        </p>
      </div>

      {user.accounts && user.accounts.length > 1 && (
        <div style={{ marginTop: "2em", marginBottom: "2em" }}>
          <h3>Your Accounts:</h3>
          <ul>
            {user.accounts.map(acc => (
              <li key={acc.client_id}>
                {acc.level} - {acc.email}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Client Instructions Form */}
      <div style={{ marginTop: "2em", paddingTop: "2em", borderTop: "1px solid #ddd" }}>
        <h2>Client Instructions</h2>
        
        {loadingInstructions ? (
          <p>Loading instructions...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1em" }}>
              <p style={{ color: "#666", fontSize: "0.9em" }}>
                Add custom instructions for your AI agent. Each instruction should be on a separate line.
              </p>
            </div>

            {instructions.map((instruction, index) => (
              <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <textarea
                  value={instruction}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  placeholder={`Instruction ${index + 1}...`}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    minHeight: "60px",
                    fontFamily: "inherit",
                    fontSize: "14px"
                  }}
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    style={{
                      padding: "10px 15px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      alignSelf: "flex-start"
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={handleAddInstruction}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                + Add Instruction
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  backgroundColor: saving ? "#6c757d" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                {saving ? "Saving..." : "Save Instructions"}
              </button>
            </div>

            {saveMessage && (
              <p style={{ 
                marginTop: "10px", 
                color: saveMessage.includes('✅') ? '#28a745' : '#dc3545',
                fontWeight: "bold"
              }}>
                {saveMessage}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
