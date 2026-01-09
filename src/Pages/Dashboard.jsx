import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import ConfigurationsTab from '../components/ConfigurationsTab';
import ModelsTab from '../components/ModelsTab';
import IntegrationsTab from '../components/IntegrationsTab';
import ConversationsTab from '../components/ConversationsTab';
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading, logout } = useUser();
  const [activeTab, setActiveTab] = useState('configurations');
  const [tokenUsage, setTokenUsage] = useState(null);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [tokenError, setTokenError] = useState(null);
  const [tokenLimits, setTokenLimits] = useState(null);
  const [loadingLimits, setLoadingLimits] = useState(true);
  
  // State for multiple clients/subscriptions
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loadingClients, setLoadingClients] = useState(true);
  const [itemNames, setItemNames] = useState({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, isLoading, navigate]);

  // Fetch all clients/subscriptions for this account
  useEffect(() => {
    const fetchClients = async () => {
      console.log('📡 fetchClients called');
      console.log('user?.account_id:', user?.account_id);
      
      if (!user?.account_id) {
        console.warn('⚠️ No account_id found in user context!');
        
        if (user?.client_id) {
          console.log('🔄 Falling back to single client from user context');
          setClients([{
            clientid: parseInt(user.client_id, 10),
            first_name: user.first_name,
            last_name: user.last_name,
            contact_email: user.email,
            level: user.level,
            item: user.item_id,
            company: user.company
          }]);
          setSelectedClientId(parseInt(user.client_id, 10));
          setLoadingClients(false);
        } else {
          console.error('❌ No client_id either! User context is incomplete.');
          setLoadingClients(false);
        }
        return;
      }

      setLoadingClients(true);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const url = `${apiBaseUrl}/api/account/${user.account_id}/clients`;
        console.log('📡 Fetching clients from:', url);
        
        const response = await fetch(url, {
          credentials: 'include'
        });

        console.log('📡 Clients response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Clients fetch failed:', errorText);
          throw new Error('Failed to fetch clients');
        }

        const data = await response.json();
        console.log('✅ Clients data received:', data);
        setClients(data.clients || []);
        
        if (data.clients && data.clients.length > 0) {
          const initialClientId = user.client_id || data.clients[0].clientid;
          console.log('Setting selectedClientId to:', initialClientId);
          setSelectedClientId(parseInt(initialClientId, 10));

          // Build item names from the response
          const namesMap = {};
          data.clients.forEach((client) => {
            if (client.item) {
              namesMap[client.item] = client.item_domain || `Subscription ${client.item}`;
            }
          });
          console.log('Item names loaded:', namesMap);
          setItemNames(namesMap);
        }
      } catch (error) {
        console.error('❌ Error fetching clients:', error);
        if (user) {
          console.log('🔄 Using fallback client data from user context');
          setClients([{
            clientid: parseInt(user.client_id, 10),
            first_name: user.first_name,
            last_name: user.last_name,
            contact_email: user.email,
            level: user.level,
            item: user.item_id,
            company: user.company
          }]);
          setSelectedClientId(parseInt(user.client_id, 10));
        }
      } finally {
        setLoadingClients(false);
      }
    };

    if (user) {
      fetchClients();
    }
  }, [user?.account_id, user?.client_id]);

  // Get the currently selected client object - use string comparison for type safety
  const selectedClient = clients.find(c => String(c.clientid) === String(selectedClientId)) || null;

  // Fetch token limits from server
  useEffect(() => {
    const fetchTokenLimits = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiBaseUrl}/api/token/limits`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch token limits');
        }

        const data = await response.json();
        setTokenLimits(data.limits);
      } catch (error) {
        console.error('Error fetching token limits:', error);
        setTokenLimits({
          'free': 100000,
          'basic': 500000,
          'pro': 2000000,
          'enterprise': null
        });
      } finally {
        setLoadingLimits(false);
      }
    };

    fetchTokenLimits();
  }, []);

  // Fetch token usage for ENTIRE ACCOUNT (sum of all subscriptions)
  useEffect(() => {
    const fetchAccountTokenUsage = async () => {
      if (!user?.account_id) return;

      setLoadingTokens(true);
      setTokenError(null);

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        console.log('📡 Fetching account token usage for account:', user.account_id);
        const response = await fetch(`${apiBaseUrl}/api/token/usage/account/${user.account_id}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch token usage');
        }

        const data = await response.json();
        console.log('✅ Account token usage received:', data);
        setTokenUsage(data.tokens_used || 0);
      } catch (error) {
        console.error('Error fetching account token usage:', error);
        setTokenError('Unable to load token data');
        setTokenUsage(0);
      } finally {
        setLoadingTokens(false);
      }
    };

    if (user?.account_id) {
      fetchAccountTokenUsage();
    }
  }, [user?.account_id]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleClientChange = (e) => {
    const newClientId = parseInt(e.target.value, 10);
    console.log('🔄 Subscription changed to:', newClientId);
    setSelectedClientId(newClientId);
  };

  const refreshTokenUsage = async () => {
    if (!user?.account_id) return;

    setLoadingTokens(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/token/usage/account/${user.account_id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTokenUsage(data.tokens_used || 0);
        setTokenError(null);
      }
    } catch (error) {
      console.error('Error refreshing token usage:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  // Calculate account token limit (sum of all subscription limits, or highest tier)
  const getAccountTokenLimit = () => {
    if (!tokenLimits || clients.length === 0) return null;

    // Option 1: Use the highest tier limit among all subscriptions
    const tierOrder = ['free', 'basic', 'pro', 'enterprise'];
    let highestTier = 'free';
    
    clients.forEach(client => {
      const clientLevel = (client.level || 'basic').toLowerCase();
      if (tierOrder.indexOf(clientLevel) > tierOrder.indexOf(highestTier)) {
        highestTier = clientLevel;
      }
    });

    return tokenLimits[highestTier];

    // Option 2: Sum all subscription limits (uncomment if preferred)
    // let totalLimit = 0;
    // let hasUnlimited = false;
    // clients.forEach(client => {
    //   const clientLevel = (client.level || 'basic').toLowerCase();
    //   const limit = tokenLimits[clientLevel];
    //   if (limit === null) {
    //     hasUnlimited = true;
    //   } else {
    //     totalLimit += limit;
    //   }
    // });
    // return hasUnlimited ? null : totalLimit;
  };

  const getTokenUsagePercentage = () => {
    const limit = getAccountTokenLimit();
    if (!limit) return 0;
    return Math.min((tokenUsage / limit) * 100, 100);
  };

  const getUsageColor = () => {
    const percentage = getTokenUsagePercentage();
    if (percentage < 50) return '#28a745';
    if (percentage < 80) return '#ffc107';
    return '#dc3545';
  };

  const getUsageStatus = () => {
    const limit = getAccountTokenLimit();
    if (!limit) return 'Unlimited';
    const percentage = getTokenUsagePercentage();
    if (percentage < 50) return 'Good';
    if (percentage < 80) return 'Moderate';
    if (percentage < 90) return 'High';
    return 'Critical';
  };

  const tokenLimit = getAccountTokenLimit();

  // Get display name for a client/subscription
  const getClientDisplayName = (client) => {
    const itemName = itemNames[client.item] || `Subscription ${client.item || 'N/A'}`;
    const company = client.company ? ` - ${client.company}` : '';
    return `${itemName}${company}`;
  };

  const tabContainerStyle = {
    display: 'flex',
    borderBottom: '2px solid #ddd',
    marginTop: '1.5em',
    marginBottom: '2em',
    flexWrap: 'wrap'
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

  if (isLoading) {
    return (
      <div style={{ padding: "2em", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <div style={{ padding: "2em", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header with Account Info */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "1.5em",
        flexWrap: "wrap",
        gap: "1em"
      }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: "0.25em 0 0 0", color: "#666", fontSize: "0.95em" }}>
            Welcome, {user.first_name || 'User'} {user.last_name || ''} ({user.email})
          </p>
        </div>
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

      {/* Account Token Usage - Shows total across all subscriptions */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.25em 1.5em',
        borderRadius: '8px',
        marginBottom: '1.5em',
        border: '1px solid #dee2e6'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1em'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.25em 0', color: '#333', fontSize: '1em' }}>
              Account Token Usage
            </h3>
            <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>
              Total across all {clients.length} subscription{clients.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5em',
            flexWrap: 'wrap'
          }}>
            {loadingTokens || loadingLimits ? (
              <div style={{ fontSize: '1.2em', color: '#007bff' }}>
                Loading...
              </div>
            ) : tokenError ? (
              <div style={{ fontSize: '0.9em', color: '#dc3545' }}>
                {tokenError}
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.75em',
                    fontWeight: 'bold',
                    color: getUsageColor()
                  }}>
                    {formatNumber(tokenUsage)}
                  </div>
                  <div style={{ fontSize: '0.75em', color: '#666' }}>
                    tokens used
                  </div>
                </div>

                {tokenLimit && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.25em',
                    minWidth: '150px'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '10px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '5px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${getTokenUsagePercentage()}%`,
                        height: '100%',
                        backgroundColor: getUsageColor(),
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75em',
                      color: '#666'
                    }}>
                      <span>{formatNumber(tokenLimit - tokenUsage)} remaining</span>
                      <span style={{ color: getUsageColor(), fontWeight: 'bold' }}>
                        {getUsageStatus()}
                      </span>
                    </div>
                  </div>
                )}

                {!tokenLimit && (
                  <div style={{
                    fontSize: '1em',
                    color: '#28a745',
                    fontWeight: 'bold'
                  }}>
                    ∞ Unlimited
                  </div>
                )}
              </>
            )}

            <button
              onClick={refreshTokenUsage}
              disabled={loadingTokens}
              style={{
                padding: '0.5em 1em',
                fontSize: '0.9em',
                backgroundColor: loadingTokens ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingTokens ? 'not-allowed' : 'pointer'
              }}
              title="Refresh token count"
            >
              {loadingTokens ? '...' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Selector */}
      <div style={{
        backgroundColor: '#e7f3ff',
        padding: '1.25em 1.5em',
        borderRadius: '8px',
        marginBottom: '1.5em',
        border: '1px solid #b3d7ff'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1em',
          flexWrap: 'wrap'
        }}>
          <label style={{ 
            fontWeight: 'bold', 
            color: '#0056b3',
            whiteSpace: 'nowrap',
            fontSize: '1.1em'
          }}>
            Select Subscription:
          </label>
          
          {loadingClients ? (
            <span style={{ color: '#666' }}>Loading subscriptions...</span>
          ) : clients.length === 0 ? (
            <span style={{ color: '#dc3545' }}>No subscriptions found</span>
          ) : (
            <select
              value={selectedClientId || ''}
              onChange={handleClientChange}
              style={{
                padding: '0.6em 1em',
                fontSize: '1em',
                borderRadius: '4px',
                border: '1px solid #0056b3',
                backgroundColor: 'white',
                minWidth: '280px',
                cursor: 'pointer'
              }}
            >
              {clients.map((client) => (
                <option key={client.clientid} value={client.clientid}>
                  {getClientDisplayName(client)} ({client.level || 'basic'})
                </option>
              ))}
            </select>
          )}

          <span style={{ color: '#666', fontSize: '0.9em', marginLeft: 'auto' }}>
            {clients.length} subscription{clients.length !== 1 ? 's' : ''} on this account
          </span>
        </div>
      </div>

      {/* Selected Subscription Details */}
      {selectedClient && (
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5em',
          borderRadius: '8px',
          marginBottom: '1em',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 1em 0', color: '#333' }}>
            {getClientDisplayName(selectedClient)}
          </h3>
          
          <div style={{ display: 'flex', gap: '2em', flexWrap: 'wrap' }}>
            <p style={{ margin: '0', color: '#666' }}>
              <strong>Subscription ID:</strong> {selectedClientId}
            </p>
            <p style={{ margin: '0', color: '#666' }}>
              <strong>Service Level:</strong>{' '}
              <span style={{ 
                textTransform: 'capitalize',
                backgroundColor: selectedClient.level === 'enterprise' ? '#6f42c1' : 
                                 selectedClient.level === 'pro' ? '#007bff' : 
                                 selectedClient.level === 'basic' ? '#28a745' : '#6c757d',
                color: 'white',
                padding: '0.15em 0.5em',
                borderRadius: '3px',
                fontSize: '0.9em'
              }}>
                {selectedClient.level || 'basic'}
              </span>
            </p>
            {selectedClient.company && (
              <p style={{ margin: '0', color: '#666' }}>
                <strong>Company:</strong> {selectedClient.company}
              </p>
            )}
          </div>
        </div>
      )}

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
      {loadingClients ? (
        <div style={{ textAlign: 'center', padding: '2em' }}>
          <p>Loading subscriptions...</p>
        </div>
      ) : selectedClient ? (
        <>
          {activeTab === 'configurations' && <ConfigurationsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'models' && <ModelsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'integrations' && <IntegrationsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'conversations' && <ConversationsTab user={selectedClient} clientId={selectedClientId} />}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
          <p>No subscription selected. Please select a subscription above.</p>
        </div>
      )}
    </div>
  );
}