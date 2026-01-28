import { useState, useEffect } from "react";
import { getApiUrl } from "../utils/getApiUrl";

// Helper function to calculate and format duration between two timestamps
function formatDuration(firstTimestamp, lastTimestamp) {
  if (!firstTimestamp || !lastTimestamp) return '—';

  const first = new Date(firstTimestamp);
  const last = new Date(lastTimestamp);
  const diffMs = last - first;

  if (diffMs < 0) return '—';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

export default function ConversationsTab({ clientId, user }) {
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [expandedDomains, setExpandedDomains] = useState(new Set());
  const [expandedChannels, setExpandedChannels] = useState(new Set());
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [conversationSearch, setConversationSearch] = useState('');
  const [activeSessions, setActiveSessions] = useState({});
  const [showOnlyLive, setShowOnlyLive] = useState(false);

  // Fetch active sessions from Redis
  const fetchActiveSessions = async () => {
    if (!clientId) return;

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/admin/active-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clientId })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.activeSessions || {});
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  // Fetch conversations when clientId is available
  useEffect(() => {
    if (clientId) {
      fetchConversations();
      fetchActiveSessions();

      // Poll for active sessions every 30 seconds
      const interval = setInterval(fetchActiveSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [clientId]);

  const fetchConversations = async () => {
    if (!clientId) {
      console.warn('No clientId available');
      return;
    }

    setLoadingConversations(true);
    setConversationsError(null);

    try {
      const apiBaseUrl = getApiUrl();
      const historyKey = import.meta.env.VITE_HISTORY_VIEW_KEY || '';
      
      const url = new URL(`${apiBaseUrl}/admin/history`);
      if (historyKey) {
        url.searchParams.append('key', historyKey);
      }
      url.searchParams.append('format', 'json');
      url.searchParams.append('limit', '5000');
      url.searchParams.append('clientId', clientId.toString());

      console.log('📡 Fetching conversations for client:', clientId);
      console.log('API URL:', url.toString());

      const response = await fetch(url.toString(), {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Conversations data received:', data);
      
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversationsError(error.message);
    } finally {
      setLoadingConversations(false);
    }
  };

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

  const expandAllLive = () => {
    const liveDomains = new Set();
    const liveChannels = new Set();
    const liveUsers = new Set();

    conversations.forEach(conv => {
      let domainHasLive = false;
      conv.channels.forEach(ch => {
        const liveUsersInChannel = ch.users.filter(u =>
          !u.userid.startsWith('web:') && activeSessions[u.userid]
        );
        if (liveUsersInChannel.length > 0) {
          domainHasLive = true;
          liveChannels.add(`${conv.domain}|${ch.channel}`);
          liveUsersInChannel.forEach(u => {
            liveUsers.add(`${conv.domain}|${ch.channel}|${u.userid}`);
          });
        }
      });
      if (domainHasLive) {
        liveDomains.add(conv.domain);
      }
    });

    setExpandedDomains(liveDomains);
    setExpandedChannels(liveChannels);
    setExpandedUsers(liveUsers);
  };

  // Filter conversations based on search and live status
  const filteredConversations = conversations
    .map(conv => {
      // If showing only live, filter channels and users
      if (showOnlyLive) {
        const filteredChannels = conv.channels
          .map(ch => ({
            ...ch,
            users: ch.users.filter(u =>
              !u.userid.startsWith('web:') && activeSessions[u.userid]
            )
          }))
          .filter(ch => ch.users.length > 0);

        if (filteredChannels.length === 0) return null;
        return { ...conv, channels: filteredChannels };
      }
      return conv;
    })
    .filter(conv => conv !== null)
    .filter(conv => {
      const searchLower = conversationSearch.toLowerCase().trim();
      if (!searchLower) return true;

      if (conv.domain.toLowerCase().includes(searchLower)) return true;

      return conv.channels.some(ch =>
        ch.channel.toLowerCase().includes(searchLower) ||
        ch.users.some(u => u.userid.toLowerCase().includes(searchLower))
      );
    });

  // Show message if no clientId available
  if (!clientId) {
    return (
      <div style={{ padding: '2em', textAlign: 'center', color: '#666' }}>
        <p>Please select a subscription to view conversations.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      <h2 style={{ margin: '0 0 1em 0', textAlign: 'center' }}>Conversation History</h2>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1em',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ position: 'relative', flex: '1 1 250px', minWidth: '200px', maxWidth: '400px' }}>
          <i className="fa fa-search" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999',
            fontSize: '14px'
          }}></i>
          <input
            type="text"
            placeholder="Filter by domain, channel, or user..."
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={expandAll}
            style={{
              padding: '8px 14px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-angles-down"></i>
            Expand All
          </button>
          <button
            onClick={expandAllLive}
            style={{
              padding: '8px 14px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-tower-broadcast"></i>
            Expand All Live
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: '8px 14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-angles-up"></i>
            Collapse All
          </button>
          <button
            onClick={fetchConversations}
            style={{
              padding: '8px 14px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-rotate"></i>
            Refresh
          </button>
          <button
            onClick={() => setShowOnlyLive(!showOnlyLive)}
            style={{
              padding: '8px 14px',
              backgroundColor: showOnlyLive ? '#28a745' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {showOnlyLive ? (
              <i className="fa-solid fa-circle" style={{ fontSize: '8px' }}></i>
            ) : (
              <i className="fa-solid fa-list"></i>
            )}
            {showOnlyLive ? 'Live Only' : 'Show All'}
          </button>
        </div>
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
          <p>No conversations found for this subscription.</p>
        </div>
      ) : (
        <div>
          {filteredConversations.map((conv, idx) => {
            const isDomainExpanded = expandedDomains.has(conv.domain);

            // Count total active users across all channels in this domain
            const domainActiveCount = conv.channels.reduce((total, ch) => {
              const channelActiveUsers = ch.users.filter(u =>
                !u.userid.startsWith('web:') && activeSessions[u.userid]
              );
              return total + channelActiveUsers.length;
            }, 0);

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
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isDomainExpanded ? '−' : '+'} {user?.agent_name || conv.domain}
                    {domainActiveCount > 0 && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#28a745',
                            borderRadius: '50%',
                            display: 'inline-block'
                          }}
                        />
                        {domainActiveCount} online
                      </span>
                    )}
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

                      // Count active users in this channel
                      const filteredUsers = channel.users.filter(u => !u.userid.startsWith('web:'));
                      const activeCount = filteredUsers.filter(u => activeSessions[u.userid]).length;

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
                              background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 50%, #1a252f 100%)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                              {isChannelExpanded ? '−' : '+'} <strong>Channel:</strong> {channel.channel}
                              {activeCount > 0 && (
                                <span style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: '#d4edda',
                                  color: '#155724',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  <span
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      backgroundColor: '#28a745',
                                      borderRadius: '50%',
                                      display: 'inline-block'
                                    }}
                                  />
                                  {activeCount} online
                                </span>
                              )}
                            </span>
                            <span style={{ fontSize: '12px', color: '#fff' }}>
                              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {isChannelExpanded && (
                            <div>
                              {channel.users
                                .filter(u => !u.userid.startsWith('web:'))
                                .map((userConv, uIdx) => {
                                const userKey = `${conv.domain}|${channel.channel}|${userConv.userid}`;
                                const isUserExpanded = expandedUsers.has(userKey);

                                return (
                                  <div
                                    key={uIdx}
                                    style={{
                                      borderTop: '1px solid #ddd',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <div
                                      onClick={() => toggleUser(userKey)}
                                      style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#e9ecef',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '14px'
                                      }}
                                    >
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {isUserExpanded ? '−' : '+'} <strong>User:</strong> {userConv.userid}
                                        {activeSessions[userConv.userid] && (
                                          <span
                                            style={{
                                              width: '10px',
                                              height: '10px',
                                              backgroundColor: '#28a745',
                                              borderRadius: '50%',
                                              display: 'inline-block',
                                              boxShadow: '0 0 4px #28a745'
                                            }}
                                            title="User is currently online"
                                          />
                                        )}
                                      </span>
                                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#666' }}>
                                        <span>{userConv.messages.length} messages</span>
                                        <span>{userConv.totalTokens.toLocaleString()} tokens</span>
                                      </div>
                                    </div>

                                    {isUserExpanded && (
                                      <div style={{ backgroundColor: '#fff' }}>
                                        <div style={{
                                          fontSize: '12px',
                                          color: '#666',
                                          padding: '8px 12px',
                                          display: 'flex',
                                          gap: '16px',
                                          borderTop: '1px solid #e0e0e0'
                                        }}>
                                          <span><strong>First:</strong> {userConv.firstMessage}</span>
                                          <span><strong>Last:</strong> {userConv.lastMessage}</span>
                                          <span><strong>Duration:</strong> {formatDuration(userConv.firstMessage, userConv.lastMessage)}</span>
                                        </div>

                                        <div style={{
                                          maxHeight: '400px',
                                          overflowY: 'auto',
                                          borderTop: '1px solid #e0e0e0'
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
  );
}