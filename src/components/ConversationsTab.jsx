import { useState, useEffect } from "react";

export default function ConversationsTab() {
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [expandedDomains, setExpandedDomains] = useState(new Set());
  const [expandedChannels, setExpandedChannels] = useState(new Set());
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [conversationSearch, setConversationSearch] = useState('');

  // Fetch conversations on mount
  useEffect(() => {
    if (conversations.length === 0) {
      fetchConversations();
    }
  }, []);

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

  return (
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
  );
}
