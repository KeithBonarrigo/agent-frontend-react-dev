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
  const [activeTab, setActiveTab] = useState('configurations');
  
  // Conversations state
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [expandedDomains, setExpandedDomains] = useState(new Set());
  const [expandedChannels, setExpandedChannels] = useState(new Set());
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [conversationSearch, setConversationSearch] = useState('');

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

  // Fetch conversations when tab is opened
  useEffect(() => {
    if (activeTab === 'conversations' && conversations.length === 0) {
      fetchConversations();
    }
  }, [activeTab]);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    setConversationsError(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const historyKey = import.meta.env.VITE_HISTORY_VIEW_KEY || '';
      
      const url = new URL(`${apiBaseUrl}/admin/history`);
      if (historyKey) {
        url.searchParams.append('key', historyKey);
      }
      url.searchParams.append('format', 'json');
      url.searchParams.append('limit', '5000');

      const response = await fetch(url.toString(), {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversationsError(error.message);
    } finally {
      setLoadingConversations(false);
    }
  };

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

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/client-instructions/${user.client_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      //const responseData = await response.json();

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

  // Conversation toggle functions
  const toggleDomain = (domain) => {
    const newSet = new Set(expandedDomains);
    if (newSet.has(domain)) {
      newSet.delete(domain);
    } else {
      newSet.add(domain);
    }
    setExpandedDomains(newSet);
  };

  const toggleChannel = (key) => {
    const newSet = new Set(expandedChannels);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedChannels(newSet);
  };

  const toggleUser = (key) => {
    const newSet = new Set(expandedUsers);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedUsers(newSet);
  };

  const expandAll = () => {
    setExpandedDomains(new Set(conversations.map(c => c.domain)));
    const channelKeys = conversations.flatMap(c => 
      c.channels.map(ch => `${c.domain}|${ch.channel}`)
    );
    setExpandedChannels(new Set(channelKeys));
    const userKeys = conversations.flatMap(c => 
      c.channels.flatMap(ch => 
        ch.users.map(u => `${c.domain}|${ch.channel}|${u.userid}`)
      )
    );
    setExpandedUsers(new Set(userKeys));
  };

  const collapseAll = () => {
    setExpandedDomains(new Set());
    setExpandedChannels(new Set());
    setExpandedUsers(new Set());
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const searchLower = conversationSearch.toLowerCase().trim();
    if (!searchLower) return true;
    
    if (conv.domain.toLowerCase().includes(searchLower)) return true;
    
    return conv.channels.some(ch => 
      ch.channel.toLowerCase().includes(searchLower) ||
      ch.users.some(u => u.userid.toLowerCase().includes(searchLower))
    );
  });

  // Tab styles
  const tabContainerStyle = {
    display: 'flex',
    borderBottom: '2px solid #ddd',
    marginTop: '2em',
    marginBottom: '2em'
  };

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    backgroundColor: isActive ? '#007bff' : 'transparent',
    color: isActive ? 'white' : '#333',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.3s ease',
    marginRight: '4px'
  });

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
    <div style={{ padding: "2em", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "1em"
      }}>
        <h1>Dashboard</h1>
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

      {/* Tabs Navigation */}
      <div style={tabContainerStyle}>
        <button 
          style={tabStyle(activeTab === 'configurations')}
          onClick={() => setActiveTab('configurations')}
        >
          Configurations
        </button>
        <button 
          style={tabStyle(activeTab === 'models')}
          onClick={() => setActiveTab('models')}
        >
          Models
        </button>
        <button 
          style={tabStyle(activeTab === 'integrations')}
          onClick={() => setActiveTab('integrations')}
        >
          Integrations
        </button>
        <button 
          style={tabStyle(activeTab === 'conversations')}
          onClick={() => setActiveTab('conversations')}
        >
          Conversations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'configurations' && (
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
      )}

      {activeTab === 'models' && (
        <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
          <h2>Models</h2>
          <p>Model configuration coming soon...</p>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
          <h2>Integrations</h2>
          <p>Integration settings coming soon...</p>
        </div>
      )}

      {activeTab === 'conversations' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1em'
          }}>
            <h2 style={{ margin: 0 }}>Conversation History</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={expandAll}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Collapse All
              </button>
              <button
                onClick={fetchConversations}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1em' }}>
            <input
              type="text"
              placeholder="Filter by domain, channel, or user..."
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {loadingConversations ? (
            <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
              <p>Loading conversations...</p>
            </div>
          ) : conversationsError ? (
            <div style={{ 
              padding: '1em', 
              backgroundColor: '#f8d7da', 
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '4px'
            }}>
              <strong>Error:</strong> {conversationsError}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
              <p>No conversations found.</p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conv, idx) => {
                const isDomainExpanded = expandedDomains.has(conv.domain);
                
                return (
                  <div 
                    key={idx}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      onClick={() => toggleDomain(conv.domain)}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f8f9fa',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      <span>
                        {isDomainExpanded ? '▼' : '►'} {conv.domain}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                        {conv.channels.length} channel{conv.channels.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {isDomainExpanded && (
                      <div style={{ padding: '10px' }}>
                        {conv.channels.map((channel, chIdx) => {
                          const channelKey = `${conv.domain}|${channel.channel}`;
                          const isChannelExpanded = expandedChannels.has(channelKey);

                          return (
                            <div
                              key={chIdx}
                              style={{
                                border: '1px solid #e0e0e0',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                onClick={() => toggleChannel(channelKey)}
                                style={{
                                  padding: '10px 14px',
                                  backgroundColor: '#f0f0f0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <span>
                                  {isChannelExpanded ? '▼' : '►'} <strong>Channel:</strong> {channel.channel}
                                </span>
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                  {channel.users.length} user{channel.users.length !== 1 ? 's' : ''}
                                </span>
                              </div>

                              {isChannelExpanded && (
                                <div style={{ padding: '8px' }}>
                                  {channel.users.map((userConv, uIdx) => {
                                    const userKey = `${conv.domain}|${channel.channel}|${userConv.userid}`;
                                    const isUserExpanded = expandedUsers.has(userKey);

                                    return (
                                      <div
                                        key={uIdx}
                                        style={{
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          marginBottom: '6px',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        <div
                                          onClick={() => toggleUser(userKey)}
                                          style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#fafafa',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '14px'
                                          }}
                                        >
                                          <span>
                                            {isUserExpanded ? '▼' : '►'} <strong>User:</strong> {userConv.userid}
                                          </span>
                                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#666' }}>
                                            <span>{userConv.messages.length} messages</span>
                                            <span>{userConv.totalTokens.toLocaleString()} tokens</span>
                                          </div>
                                        </div>

                                        {isUserExpanded && (
                                          <div style={{ padding: '10px', backgroundColor: '#fff' }}>
                                            <div style={{ 
                                              fontSize: '12px', 
                                              color: '#666', 
                                              marginBottom: '8px',
                                              display: 'flex',
                                              gap: '16px'
                                            }}>
                                              <span><strong>First:</strong> {userConv.firstMessage}</span>
                                              <span><strong>Last:</strong> {userConv.lastMessage}</span>
                                            </div>
                                            
                                            <div style={{ 
                                              maxHeight: '400px', 
                                              overflowY: 'auto',
                                              border: '1px solid #e0e0e0',
                                              borderRadius: '4px'
                                            }}>
                                              {userConv.messages.map((msg, mIdx) => (
                                                <div
                                                  key={mIdx}
                                                  style={{
                                                    padding: '10px',
                                                    borderBottom: mIdx < userConv.messages.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                    display: 'grid',
                                                    gridTemplateColumns: '150px 1fr 80px 150px',
                                                    gap: '12px',
                                                    fontSize: '13px'
                                                  }}
                                                >
                                                  <div style={{ fontWeight: '600', color: '#333' }}>
                                                    {msg.sender}
                                                  </div>
                                                  <div style={{ 
                                                    whiteSpace: 'pre-wrap', 
                                                    wordBreak: 'break-word',
                                                    color: '#555'
                                                  }}>
                                                    {msg.message}
                                                  </div>
                                                  <div style={{ 
                                                    textAlign: 'right', 
                                                    color: '#666',
                                                    fontVariantNumeric: 'tabular-nums'
                                                  }}>
                                                    {msg.tokens || '-'}
                                                  </div>
                                                  <div style={{ 
                                                    textAlign: 'right', 
                                                    color: '#999',
                                                    fontSize: '12px'
                                                  }}>
                                                    {new Date(msg.updated).toLocaleString()}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
