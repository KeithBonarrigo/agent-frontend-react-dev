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
  
  // State for multiple clients/agents
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loadingClients, setLoadingClients] = useState(true);

  // State for cancel subscription
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  // State for new agent
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [newAgentLoading, setNewAgentLoading] = useState(false);
  const [newAgentError, setNewAgentError] = useState(null);
  const [newAgentSuccess, setNewAgentSuccess] = useState(null);
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    company: ''
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, isLoading, navigate]);

  // Fetch all clients/agents for this account
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
            agent_name: user.agent_name || 'My Agent',
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
        }
      } catch (error) {
        console.error('❌ Error fetching clients:', error);
        if (user) {
          console.log('🔄 Using fallback client data from user context');
          setClients([{
            clientid: parseInt(user.client_id, 10),
            agent_name: user.agent_name || 'My Agent',
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

  // Get account level from first client (they all share the same account level)
  const accountLevel = clients.length > 0 ? (clients[0].level || 'basic') : (user?.level || 'basic');

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

  // Fetch token usage for ENTIRE ACCOUNT (sum of all agents)
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
    console.log('🔄 Agent changed to:', newClientId);
    setSelectedClientId(newClientId);
    // Clear any previous cancel messages when switching agents
    setCancelSuccess(null);
    setCancelError(null);
  };

  const handleCancelSubscription = async (immediate = false) => {
    if (!selectedClient?.subscription_id) {
      setCancelError('No subscription ID found for this agent.');
      return;
    }

    setCancelLoading(true);
    setCancelError(null);
    setCancelSuccess(null);

    try {
      const token = import.meta.env.VITE_CREATE_USER_TOKEN;
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const endpoint = immediate ? '/api/cancel-subscription-now' : '/api/cancel-subscription';

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscriptionId: selectedClient.subscription_id
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setCancelSuccess(immediate 
        ? 'Subscription cancelled immediately.' 
        : 'Subscription will be cancelled at the end of the billing period.'
      );
      setShowCancelModal(false);

      // Refresh clients list to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Cancel subscription error:', error);
      setCancelError(error.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleNewAgentFormChange = (e) => {
    const { name, value } = e.target;
    setNewAgentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    
    if (!newAgentForm.name.trim()) {
      setNewAgentError('Please enter a name for this agent');
      return;
    }

    setNewAgentLoading(true);
    setNewAgentError(null);
    setNewAgentSuccess(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiBaseUrl}/api/account/${user.account_id}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAgentForm.name.trim(),
          company: newAgentForm.company.trim() || null,
          contactEmail: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          level: accountLevel // Inherit the account's plan level
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent');
      }

      setNewAgentSuccess('Agent created successfully!');
      
      // Reset form
      setNewAgentForm({
        name: '',
        company: ''
      });

      // Refresh clients list after a short delay
      setTimeout(() => {
        setShowNewAgentModal(false);
        setNewAgentSuccess(null);
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Create agent error:', error);
      setNewAgentError(error.message);
    } finally {
      setNewAgentLoading(false);
    }
  };

  const closeNewAgentModal = () => {
    setShowNewAgentModal(false);
    setNewAgentForm({
      name: '',
      company: ''
    });
    setNewAgentError(null);
    setNewAgentSuccess(null);
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

  // Calculate account token limit (sum of all agent limits, or highest tier)
  const getAccountTokenLimit = () => {
    if (!tokenLimits || clients.length === 0) return null;

    // Option 1: Use the highest tier limit among all agents
    const tierOrder = ['free', 'basic', 'pro', 'enterprise'];
    let highestTier = 'free';
    
    clients.forEach(client => {
      const clientLevel = (client.level || 'basic').toLowerCase();
      if (tierOrder.indexOf(clientLevel) > tierOrder.indexOf(highestTier)) {
        highestTier = clientLevel;
      }
    });

    return tokenLimits[highestTier];
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

  // Get display name for a client/agent
  const getClientDisplayName = (client) => {
    // Use agent_name if available, otherwise fall back to company or generic name
    if (client.agent_name) {
      return client.agent_name;
    }
    if (client.company) {
      return client.company;
    }
    return `Agent ${client.item || client.clientid}`;
  };

  const getLevelColor = (level) => {
    switch ((level || 'basic').toLowerCase()) {
      case 'enterprise': return '#6f42c1';
      case 'pro': return '#007bff';
      case 'basic': return '#28a745';
      default: return '#6c757d';
    }
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

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
  };

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
      {/* Cancel Subscription Modal */}
      {showCancelModal && selectedClient && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                padding: '20px',
                borderRadius: '8px 8px 0 0'
              }}
            >
              <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
                Cancel Subscription
              </h2>
            </div>

            <div style={{ padding: '30px' }}>
              <p style={{ marginTop: 0 }}>
                Are you sure you want to cancel <strong>{getClientDisplayName(selectedClient)}</strong>?
              </p>

              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                  <strong>Cancel at period end:</strong> You'll keep access until your current billing period ends.
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, color: '#721c24', fontSize: '14px' }}>
                  <strong>Cancel immediately:</strong> Your access will end right away. No refunds for partial periods.
                </p>
              </div>

              {cancelError && (
                <p style={{ color: '#dc3545', marginBottom: '15px' }}>
                  ❌ {cancelError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleCancelSubscription(false)}
                  disabled={cancelLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: cancelLoading ? '#ccc' : '#ffc107',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: cancelLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {cancelLoading ? 'Processing...' : 'Cancel at Period End'}
                </button>

                <button
                  onClick={() => handleCancelSubscription(true)}
                  disabled={cancelLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: cancelLoading ? '#ccc' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: cancelLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {cancelLoading ? 'Processing...' : 'Cancel Immediately'}
                </button>
              </div>

              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '10px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Keep My Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Agent Modal */}
      {showNewAgentModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={closeNewAgentModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                padding: '20px',
                borderRadius: '8px 8px 0 0'
              }}
            >
              <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
                Create New Agent
              </h2>
              <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Add another agent under your{' '}
                <span style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  textTransform: 'capitalize'
                }}>
                  {accountLevel}
                </span>
                {' '}plan
              </p>
            </div>

            <form onSubmit={handleCreateAgent} style={{ padding: '30px' }}>
              {/* Info Box */}
              <div style={{
                backgroundColor: '#e7f3ff',
                border: '1px solid #b3d7ff',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '24px'
              }}>
                <p style={{ margin: 0, color: '#0056b3', fontSize: '14px' }}>
                  💡 This will create a new agent that shares your account's token limit. 
                  All agents under your account contribute to the same token usage.
                </p>
              </div>

              {/* Name Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Agent Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newAgentForm.name}
                  onChange={handleNewAgentFormChange}
                  placeholder="e.g., My Real Estate Bot, Customer Service Bot"
                  style={inputStyle}
                  required
                />
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#666' }}>
                  A friendly name to identify this agent
                </p>
              </div>

              {/* Company Field */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>
                  Company Name <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={newAgentForm.company}
                  onChange={handleNewAgentFormChange}
                  placeholder="e.g., Acme Real Estate"
                  style={inputStyle}
                />
              </div>

              {/* Error Message */}
              {newAgentError && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  color: '#721c24'
                }}>
                  ❌ {newAgentError}
                </div>
              )}

              {/* Success Message */}
              {newAgentSuccess && (
                <div style={{
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  color: '#155724'
                }}>
                  ✅ {newAgentSuccess}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={closeNewAgentModal}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={newAgentLoading || !newAgentForm.name.trim()}
                  style={{
                    flex: 2,
                    padding: '12px',
                    backgroundColor: newAgentLoading || !newAgentForm.name.trim()
                      ? '#ccc' 
                      : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: newAgentLoading || !newAgentForm.name.trim() 
                      ? 'not-allowed' 
                      : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {newAgentLoading ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Account Token Usage - Shows total across all agents */}
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
              <span style={{
                marginLeft: '10px',
                backgroundColor: getLevelColor(accountLevel),
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.8em',
                textTransform: 'capitalize',
                verticalAlign: 'middle'
              }}>
                {accountLevel}
              </span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>
              Total across all {clients.length} agent{clients.length !== 1 ? 's' : ''}
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

      {/* Agent Selector */}
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
            Select Agent:
          </label>
          
          {loadingClients ? (
            <span style={{ color: '#666' }}>Loading agents...</span>
          ) : clients.length === 0 ? (
            <span style={{ color: '#dc3545' }}>No agents found</span>
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
                  {getClientDisplayName(client)}
                </option>
              ))}
            </select>
          )}

          {/* New Agent Button */}
          <button
            onClick={() => setShowNewAgentModal(true)}
            style={{
              padding: '0.6em 1.2em',
              fontSize: '1em',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            <span style={{ fontSize: '1.2em' }}>+</span> New Agent
          </button>

          <span style={{ color: '#666', fontSize: '0.9em', marginLeft: 'auto' }}>
            {clients.length} agent{clients.length !== 1 ? 's' : ''} on this account
          </span>
        </div>
      </div>

      {/* Selected Agent Details */}
      {selectedClient && (
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5em',
          borderRadius: '8px',
          marginBottom: '1em',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1em'
          }}>
            <div>
              <h3 style={{ margin: '0 0 1em 0', color: '#333' }}>
                {getClientDisplayName(selectedClient)}
              </h3>
              
              <div style={{ display: 'flex', gap: '2em', flexWrap: 'wrap' }}>
                <p style={{ margin: '0', color: '#666' }}>
                  <strong>Agent ID:</strong> {selectedClientId}
                </p>
                <p style={{ margin: '0', color: '#666' }}>
                  <strong>Service Level:</strong>{' '}
                  <span style={{ 
                    textTransform: 'capitalize',
                    backgroundColor: getLevelColor(selectedClient.level),
                    color: 'white',
                    padding: '0.15em 0.5em',
                    borderRadius: '3px',
                    fontSize: '0.9em'
                  }}>
                    {selectedClient.level || 'basic'}
                  </span>
                </p>
                {selectedClient.subscription_status && (
                  <p style={{ margin: '0', color: '#666' }}>
                    <strong>Status:</strong>{' '}
                    <span style={{ 
                      backgroundColor: 
                        selectedClient.subscription_status === 'active' ? '#28a745' : 
                        selectedClient.subscription_status === 'trialing' ? '#17a2b8' :
                        selectedClient.subscription_status === 'past_due' ? '#ffc107' :
                        selectedClient.subscription_status === 'cancelled' ? '#dc3545' : '#6c757d',
                      color: selectedClient.subscription_status === 'past_due' ? '#000' : 'white',
                      padding: '0.15em 0.5em',
                      borderRadius: '3px',
                      fontSize: '0.9em',
                      textTransform: 'capitalize'
                    }}>
                      {selectedClient.subscription_status}
                    </span>
                  </p>
                )}
                {selectedClient.company && (
                  <p style={{ margin: '0', color: '#666' }}>
                    <strong>Company:</strong> {selectedClient.company}
                  </p>
                )}
                {selectedClient.trial_end && selectedClient.subscription_status === 'trialing' && (
                  <p style={{ margin: '0', color: '#666' }}>
                    <strong>Trial Ends:</strong>{' '}
                    {new Date(selectedClient.trial_end).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Cancel Subscription Button */}
            {selectedClient.subscription_id && 
             selectedClient.subscription_status !== 'cancelled' && (
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  padding: '0.5em 1em',
                  backgroundColor: 'transparent',
                  color: '#dc3545',
                  border: '1px solid #dc3545',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9em',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#dc3545';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#dc3545';
                }}
              >
                Cancel Subscription
              </button>
            )}
          </div>

          {/* Success/Error Messages */}
          {cancelSuccess && (
            <div style={{
              marginTop: '1em',
              padding: '1em',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              color: '#155724'
            }}>
              ✅ {cancelSuccess}
            </div>
          )}
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
          <p>Loading agents...</p>
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
          <p>No agent selected. Please select an agent above.</p>
        </div>
      )}
    </div>
  );
}