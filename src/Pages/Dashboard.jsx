import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading, logout } = useUser();
  const [instructions, setInstructions] = useState(['']);
  const [loadingInstructions, setLoadingInstructions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, isLoading, navigate]);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

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

      console.log('📦 Sending payload:', payload);
      console.log('🔑 Client ID:', user.client_id);

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/client-instructions/${user.client_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', response.status);
      const responseData = await response.json();
      console.log('📥 Response data:', responseData);

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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ padding: "2em", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render if not logged in (will redirect)
  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <div style={{ padding: "2em", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "2em"
      }}>
        <h1>My Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: "0.5em 1.5em",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      <p><strong>Welcome, {user.first_name} {user.last_name}!</strong></p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Client ID:</strong> {user.client_id}</p>
      <p><strong>Service Level:</strong> <span className="capitalize">{user.level}</span></p>

      {/* Website Embed Code Section */}
      <div style={{ marginTop: "1.5em" }}>
        <p style={{ fontWeight: "bold", marginBottom: "0.5em" }}>Website Embed Code:</p>
        <div style={{ position: "relative" }}>
          <pre style={{ 
            backgroundColor: "#fff", 
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
        <p style={{ fontSize: "0.9em", color: "#666", marginTop: "0.5em", textAlign: "center" }}>
          Copy this code and paste it in the &lt;head&gt; section of your website.
        </p>
      </div>

      {user.accounts && user.accounts.length > 1 && (
        <div style={{ marginTop: "2em" }}>
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
      <div style={{ marginTop: "3em", borderTop: "1px solid #ddd", paddingTop: "2em" }}>
        <h2>Add Your Bot Instructions</h2>
        
        {loadingInstructions ? (
          <p>Loading instructions...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1em" }}>
              <p style={{ color: "#666", fontSize: "0.9em", textAlign: "center" }}>
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