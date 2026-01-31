import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

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
  const { t } = useTranslation('conversations');
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
      <div className="tab-empty-state">
        <p>{t('noSubscription')}</p>
      </div>
    );
  }

  return (
    <div className="tab-container">
      <h2 className="tab-title">{t('title')}</h2>

      <div className="toolbar">
        <div className="search-container">
          <i className="fa fa-search search-icon"></i>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
            className="input-search"
          />
        </div>
        <div className="btn-group">
          <button onClick={expandAll} className="btn btn-primary">
            <i className="fa-solid fa-angles-down"></i>
            {t('buttons.expandAll')}
          </button>
          <button onClick={expandAllLive} className="btn btn-success">
            <i className="fa-solid fa-tower-broadcast"></i>
            {t('buttons.expandAllLive')}
          </button>
          <button onClick={collapseAll} className="btn btn-secondary">
            <i className="fa-solid fa-angles-up"></i>
            {t('buttons.collapseAll')}
          </button>
          <button onClick={fetchConversations} className="btn btn-success">
            <i className="fa-solid fa-rotate"></i>
            {t('buttons.refresh')}
          </button>
          <button
            onClick={() => setShowOnlyLive(!showOnlyLive)}
            className={`btn ${showOnlyLive ? 'btn-success' : 'btn-info'}`}
          >
            {showOnlyLive ? (
              <i className="fa-solid fa-circle" style={{ fontSize: '8px' }}></i>
            ) : (
              <i className="fa-solid fa-list"></i>
            )}
            {showOnlyLive ? t('buttons.liveOnly') : t('buttons.showAll')}
          </button>
        </div>
      </div>

      {loadingConversations ? (
        <div className="tab-loading-state">
          <p>{t('loading')}</p>
        </div>
      ) : conversationsError ? (
        <div className="alert alert-error">
          <strong>{t('error')}</strong> {conversationsError}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="tab-empty-state">
          <p>{t('noConversations')}</p>
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
              <div key={idx} className="accordion-item">
                <div onClick={() => toggleDomain(conv.domain)} className="accordion-header">
                  <span className="flex flex-center gap-sm">
                    {isDomainExpanded ? '−' : '+'} {user?.agent_name || conv.domain}
                    {domainActiveCount > 0 && (
                      <span className="badge-online">
                        <span className="status-dot status-dot-online" />
                        {domainActiveCount} {t('online')}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted" style={{ fontWeight: 'normal' }}>
                    {conv.channels.length} {conv.channels.length !== 1 ? t('channels_plural') : t('channels')}
                  </span>
                </div>

                {isDomainExpanded && (
                  <div className="accordion-body">
                    {conv.channels.map((channel, chIdx) => {
                      const channelKey = `${conv.domain}|${channel.channel}`;
                      const isChannelExpanded = expandedChannels.has(channelKey);

                      // Count active users in this channel
                      const filteredUsers = channel.users.filter(u => !u.userid.startsWith('web:'));
                      const activeCount = filteredUsers.filter(u => activeSessions[u.userid]).length;

                      return (
                        <div key={chIdx} className="channel-item">
                          <div onClick={() => toggleChannel(channelKey)} className="channel-header">
                            <span className="flex flex-center gap-sm">
                              {isChannelExpanded ? '−' : '+'} <strong>{t('channel')}</strong> {channel.channel}
                              {activeCount > 0 && (
                                <span className="badge-online">
                                  <span className="status-dot status-dot-online" />
                                  {activeCount} {t('online')}
                                </span>
                              )}
                            </span>
                            <span className="text-xs">
                              {filteredUsers.length} {filteredUsers.length !== 1 ? t('users_plural') : t('users')}
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
                                  <div key={uIdx} className="user-item">
                                    <div onClick={() => toggleUser(userKey)} className="user-header">
                                      <span className="flex flex-center gap-sm">
                                        {isUserExpanded ? '−' : '+'} <strong>{t('user')}</strong> {userConv.userid}
                                        {activeSessions[userConv.userid] && (
                                          <span className="status-dot status-dot-online status-dot-lg" title="User is currently online" />
                                        )}
                                      </span>
                                      <div className="user-stats">
                                        <span>{userConv.messages.length} {t('messages')}</span>
                                        <span>{userConv.totalTokens.toLocaleString()} {t('tokens')}</span>
                                      </div>
                                    </div>

                                    {isUserExpanded && (
                                      <div className="user-details">
                                        <div className="user-meta">
                                          <span><strong>{t('first')}</strong> {userConv.firstMessage}</span>
                                          <span><strong>{t('last')}</strong> {userConv.lastMessage}</span>
                                          <span><strong>{t('duration')}</strong> {formatDuration(userConv.firstMessage, userConv.lastMessage)}</span>
                                        </div>

                                        <div className="messages-container">
                                          {userConv.messages.map((msg, mIdx) => (
                                            <div key={mIdx} className="message-row">
                                              <div className="message-sender">
                                                {msg.sender}
                                              </div>
                                              <div className="message-content">
                                                {msg.message}
                                              </div>
                                              <div className="message-tokens">
                                                {msg.tokens || '-'}
                                              </div>
                                              <div className="message-time">
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
