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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, isLoading, navigate]);

  // Fetch token limits from server
  useEffect(() => {
    const fetchTokenLimits = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // FIXED: Changed from /api/token-limits to /api/token/limits
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
        // Fallback to default limits if server fetch fails
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

  // Fetch token usage
  useEffect(() => {
    const fetchTokenUsage = async () => {
      if (!user?.client_id) return;

      setLoadingTokens(true);
      setTokenError(null);

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // FIXED: Changed from /api/token-usage to /api/token/usage
        const response = await fetch(`${apiBaseUrl}/api/token/usage/${user.client_id}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch token usage');
        }

        const data = await response.json();
        setTokenUsage(data.tokens_used || 0);
      } catch (error) {
        console.error('Error fetching token usage:', error);
        setTokenError('Unable to load token data');
        setTokenUsage(0);
      } finally {
        setLoadingTokens(false);
      }
    };

    if (user?.client_id) {
      fetchTokenUsage();
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

  const refreshTokenUsage = async () => {
    if (!user?.client_id) return;

    setLoadingTokens(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // FIXED: Changed from /api/token-usage to /api/token/usage
      const response = await fetch(`${apiBaseUrl}/api/token/usage/${user.client_id}`, {
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

  // Format number with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  // Get token limit for current user's service level
  const getCurrentTokenLimit = () => {
    if (!tokenLimits || !user?.level) return null;
    return tokenLimits[user.level.toLowerCase()];
  };

  // Calculate token usage percentage
  const getTokenUsagePercentage = () => {
    const limit = getCurrentTokenLimit();
    if (!limit) return 0; // unlimited
    return Math.min((tokenUsage / limit) * 100, 100);
  };

  // Get color based on usage
  const getUsageColor = () => {
    const percentage = getTokenUsagePercentage();
    if (percentage < 50) return '#28a745'; // green
    if (percentage < 80) return '#ffc107'; // yellow
    return '#dc3545'; // red
  };

  // Get usage status text
  const getUsageStatus = () => {
    const limit = getCurrentTokenLimit();
    if (!limit) return 'Unlimited';
    const percentage = getTokenUsagePercentage();
    if (percentage < 50) return 'Good';
    if (percentage < 80) return 'Moderate';
    if (percentage < 90) return 'High';
    return 'Critical';
  };

  const tokenLimit = getCurrentTokenLimit();

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

      {/* User Information Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5em',
        borderRadius: '8px',
        marginBottom: '1em',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1em' }}>
          <div>
            <p style={{ margin: '0 0 0.5em 0' }}>
              <strong>Welcome, {user.first_name} {user.last_name}!</strong>
            </p>
            <p style={{ margin: '0 0 0.5em 0', color: '#666' }}>
              <strong>Email:</strong> {user.email}
            </p>
          </div>
          
          <div>
            <p style={{ margin: '0 0 0.5em 0', color: '#666' }}>
              <strong>Client ID:</strong> {user.client_id}
            </p>
            <p style={{ margin: '0', color: '#666' }}>
              <strong>Service Level:</strong> <span className="capitalize">{user.level}</span>
            </p>
          </div>

          {/* Token Usage Card */}
          <div style={{
            backgroundColor: 'white',
            padding: '1em',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5em'
            }}>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                Total Tokens Used
              </div>
              <button
                onClick={refreshTokenUsage}
                disabled={loadingTokens}
                style={{
                  padding: '0.3em 0.6em',
                  fontSize: '0.85em',
                  backgroundColor: loadingTokens ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loadingTokens ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                title="Refresh token count"
              >
                {loadingTokens ? '...' : '↻'}
              </button>
            </div>

            {loadingTokens || loadingLimits ? (
              <div style={{ fontSize: '1.5em', color: '#007bff', textAlign: 'center' }}>
                Loading...
              </div>
            ) : tokenError ? (
              <div style={{ fontSize: '0.9em', color: '#dc3545', textAlign: 'center' }}>
                {tokenError}
              </div>
            ) : (
              <>
                <div style={{
                  fontSize: '2em',
                  fontWeight: 'bold',
                  color: getUsageColor(),
                  textAlign: 'center',
                  marginBottom: '0.3em'
                }}>
                  {formatNumber(tokenUsage)}
                </div>

                {tokenLimit && (
                  <>
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '0.5em'
                    }}>
                      <div style={{
                        width: `${getTokenUsagePercentage()}%`,
                        height: '100%',
                        backgroundColor: getUsageColor(),
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    {/* Usage Info */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75em',
                      color: '#666'
                    }}>
                      <span>
                        {formatNumber(tokenLimit - tokenUsage)} remaining
                      </span>
                      <span style={{ color: getUsageColor(), fontWeight: 'bold' }}>
                        {getUsageStatus()}
                      </span>
                    </div>
                  </>
                )}

                {!tokenLimit && (
                  <div style={{
                    fontSize: '0.8em',
                    color: '#28a745',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    ∞ Unlimited
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
      {activeTab === 'configurations' && <ConfigurationsTab user={user} />}
      {activeTab === 'models' && <ModelsTab />}
      {activeTab === 'integrations' && <IntegrationsTab />}
      {activeTab === 'conversations' && <ConversationsTab />}
    </div>
  );
}
