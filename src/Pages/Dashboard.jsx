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
  const [tokenLimits, setTokenLimits] = useState(null);
  const [loadingLimits, setLoadingLimits] = useState(true);
  
  // Subscriptions and agents
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [newAgentLoading, setNewAgentLoading] = useState(false);
  const [newAgentError, setNewAgentError] = useState(null);
  const [newAgentSuccess, setNewAgentSuccess] = useState(null);
  const [newAgentForm, setNewAgentForm] = useState({ name: '', company: '' });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, isLoading, navigate]);

  // Fetch subscriptions and agents
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.account_id) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiBaseUrl}/api/account/${user.account_id}/clients`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        console.log('✅ Data received:', data);
        
        setClients(data.clients || []);
        setSubscriptions(data.subscriptions || []);
        
        // Set initial selections
        if (data.subscriptions?.length > 0) {
          const firstSub = data.subscriptions[0];
          setSelectedSubscriptionId(firstSub.subscriptionid);
          
          // Find first agent in this subscription - use String() for type-safe comparison
          const firstAgent = data.clients?.find(c => String(c.subscriptionid) === String(firstSub.subscriptionid));
          if (firstAgent) {
            setSelectedClientId(firstAgent.clientid);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) fetchData();
  }, [user?.account_id]);

  // Fetch token limits
  useEffect(() => {
    const fetchTokenLimits = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiBaseUrl}/api/token/limits`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setTokenLimits(data.limits);
        }
      } catch (error) {
        console.error('Error fetching token limits:', error);
        setTokenLimits({ free: 100000, basic: 500000, pro: 2000000, enterprise: null });
      } finally {
        setLoadingLimits(false);
      }
    };
    fetchTokenLimits();
  }, []);

  // Derived state - use String() for type-safe comparison
  const selectedSubscription = subscriptions.find(s => String(s.subscriptionid) === String(selectedSubscriptionId));
  const agentsInSubscription = clients.filter(c => String(c.subscriptionid) === String(selectedSubscriptionId));
  const selectedClient = clients.find(c => String(c.clientid) === String(selectedClientId));
  
  const canCreateAgentInSubscription = selectedSubscription && 
    selectedSubscription.plan_type === 'base' &&
    selectedSubscription.subscription_status !== 'cancelled' &&
    selectedSubscription.subscription_status !== 'past_due';

  const specialtySubAtLimit = selectedSubscription?.plan_type === 'specialty' && 
    agentsInSubscription.length >= 1;

  // Handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSubscriptionChange = (e) => {
    const newSubId = e.target.value;  // Don't parseInt - keep as string
    setSelectedSubscriptionId(newSubId);
    
    // Select first agent in this subscription - use String() comparison
    const firstAgent = clients.find(c => String(c.subscriptionid) === String(newSubId));
    setSelectedClientId(firstAgent?.clientid || null);
    
    setCancelSuccess(null);
    setCancelError(null);
  };

  const handleClientChange = (e) => {
    setSelectedClientId(e.target.value);  // Don't parseInt - keep as string
  };

  const handleCancelSubscription = async (immediate = false) => {
    if (!selectedSubscription?.subscription_id) {
      setCancelError('No Stripe subscription ID found.');
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
        body: JSON.stringify({ subscriptionId: selectedSubscription.subscription_id }),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel');

      setCancelSuccess(immediate 
        ? 'Subscription cancelled immediately.' 
        : 'Subscription will cancel at period end.');
      setShowCancelModal(false);
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Cancel error:', error);
      setCancelError(error.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    
    if (!newAgentForm.name.trim()) {
      setNewAgentError('Please enter a name');
      return;
    }

    setNewAgentLoading(true);
    setNewAgentError(null);
    setNewAgentSuccess(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${apiBaseUrl}/api/account/${user.account_id}/subscriptions/${selectedSubscriptionId}/clients`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newAgentForm.name.trim(),
            company: newAgentForm.company.trim() || null,
            contactEmail: user.email,
            firstName: user.first_name,
            lastName: user.last_name
          }),
          credentials: 'include'
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create agent');

      setNewAgentSuccess('Agent created!');
      setNewAgentForm({ name: '', company: '' });
      
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

  // Utility functions
  const formatNumber = (num) => num?.toLocaleString() || '0';
  
  const getLevelColor = (level) => {
    const colors = {
      enterprise: '#6f42c1',
      pro: '#007bff',
      basic: '#28a745',
      easybroker: '#fd7e14',
      free: '#6c757d'
    };
    return colors[level?.toLowerCase()] || '#6c757d';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#28a745',
      trialing: '#17a2b8',
      past_due: '#ffc107',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getUsagePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return '#28a745';
    if (percentage < 80) return '#ffc107';
    return '#dc3545';
  };

  const getClientDisplayName = (client) => {
    return client.agent_name || client.company || `Agent ${client.item || client.clientid}`;
  };

  const getSubscriptionDisplayName = (sub) => {
    const levelName = sub.level?.charAt(0).toUpperCase() + sub.level?.slice(1);
    const typeLabel = sub.plan_type === 'specialty' ? ' (Specialty)' : '';
    return `${levelName}${typeLabel}`;
  };

  // Styles
  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    backgroundColor: isActive ? '#007bff' : 'transparent',
    color: isActive ? 'white' : '#333',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: isActive ? 'bold' : 'normal',
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

  if (isLoading) {
    return <div style={{ padding: "2em", textAlign: "center" }}><p>Loading...</p></div>;
  }

  if (!isLoggedIn || !user) return null;

  return (
    <div style={{ padding: "2em", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Cancel Modal */}
      {showCancelModal && selectedSubscription && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
        }} onClick={() => setShowCancelModal(false)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '8px', maxWidth: '500px', width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              padding: '20px', borderRadius: '8px 8px 0 0'
            }}>
              <h2 style={{ margin: 0, color: 'white' }}>Cancel {getSubscriptionDisplayName(selectedSubscription)}</h2>
            </div>
            <div style={{ padding: '30px' }}>
              <p>This will cancel your <strong>{selectedSubscription.level}</strong> subscription 
                 and all {agentsInSubscription.length} agent(s) under it.</p>
              
              <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                  <strong>Cancel at period end:</strong> Keep access until billing period ends.
                </p>
              </div>
              
              <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                <p style={{ margin: 0, color: '#721c24', fontSize: '14px' }}>
                  <strong>Cancel immediately:</strong> Access ends now. No refunds.
                </p>
              </div>
              
              {cancelError && <p style={{ color: '#dc3545' }}>❌ {cancelError}</p>}
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => handleCancelSubscription(false)} disabled={cancelLoading}
                  style={{ flex: 1, padding: '12px', backgroundColor: cancelLoading ? '#ccc' : '#ffc107',
                    color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cancelLoading ? 'not-allowed' : 'pointer' }}>
                  {cancelLoading ? 'Processing...' : 'Cancel at Period End'}
                </button>
                <button onClick={() => handleCancelSubscription(true)} disabled={cancelLoading}
                  style={{ flex: 1, padding: '12px', backgroundColor: cancelLoading ? '#ccc' : '#dc3545',
                    color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cancelLoading ? 'not-allowed' : 'pointer' }}>
                  {cancelLoading ? 'Processing...' : 'Cancel Immediately'}
                </button>
              </div>
              <button onClick={() => setShowCancelModal(false)}
                style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: 'transparent',
                  color: '#666', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Agent Modal */}
      {showNewAgentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
        }} onClick={() => setShowNewAgentModal(false)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '8px', maxWidth: '500px', width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              padding: '20px', borderRadius: '8px 8px 0 0'
            }}>
              <h2 style={{ margin: 0, color: 'white' }}>Create New Agent</h2>
              <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Adding to: <strong>{selectedSubscription ? getSubscriptionDisplayName(selectedSubscription) : ''}</strong>
              </p>
            </div>
            <form onSubmit={handleCreateAgent} style={{ padding: '30px' }}>
              <div style={{ backgroundColor: '#e7f3ff', border: '1px solid #b3d7ff', borderRadius: '8px', padding: '15px', marginBottom: '24px' }}>
                <p style={{ margin: 0, color: '#0056b3', fontSize: '14px' }}>
                  💡 Token usage will count toward this subscription's limit 
                  ({selectedSubscription?.token_limit ? formatNumber(selectedSubscription.token_limit) : 'Unlimited'} tokens)
                </p>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                  Agent Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input type="text" value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Sales Bot" style={inputStyle} required />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                  Company <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span>
                </label>
                <input type="text" value={newAgentForm.company}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g., Acme Inc" style={inputStyle} />
              </div>
              
              {newAgentError && (
                <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#721c24' }}>
                  ❌ {newAgentError}
                </div>
              )}
              {newAgentSuccess && (
                <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#155724' }}>
                  ✅ {newAgentSuccess}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowNewAgentModal(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={newAgentLoading || !newAgentForm.name.trim()}
                  style={{ flex: 2, padding: '12px', backgroundColor: newAgentLoading ? '#ccc' : '#28a745',
                    color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold',
                    cursor: newAgentLoading ? 'not-allowed' : 'pointer' }}>
                  {newAgentLoading ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5em", flexWrap: "wrap", gap: "1em" }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: "0.25em 0 0 0", color: "#666", fontSize: "0.95em" }}>
            Welcome, {user.first_name || 'User'} {user.last_name || ''} ({user.email})
          </p>
        </div>
        <button onClick={handleLogout}
          style={{ padding: "0.5em 1.5em", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {/* Subscription Selector */}
      <div style={{ backgroundColor: '#f0f4f8', padding: '1.25em 1.5em', borderRadius: '8px', marginBottom: '1.5em', border: '1px solid #d0d7de' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 'bold', color: '#24292f', fontSize: '1.1em' }}>Subscription:</label>
          
          {loadingData ? (
            <span style={{ color: '#666' }}>Loading...</span>
          ) : subscriptions.length === 0 ? (
            <span style={{ color: '#dc3545' }}>No subscriptions found</span>
          ) : (
            <select value={selectedSubscriptionId || ''} onChange={handleSubscriptionChange}
              style={{ padding: '0.6em 1em', fontSize: '1em', borderRadius: '4px', border: '1px solid #d0d7de', backgroundColor: 'white', minWidth: '250px', cursor: 'pointer' }}>
              {subscriptions.map((sub) => (
                <option key={sub.subscriptionid} value={sub.subscriptionid}>
                  {getSubscriptionDisplayName(sub)} - {sub.agent_count || 0} agent(s)
                </option>
              ))}
            </select>
          )}
          
          <span style={{ color: '#666', fontSize: '0.9em', marginLeft: 'auto' }}>
            {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Selected Subscription Details & Token Usage */}
      {selectedSubscription && (
        <div style={{ backgroundColor: '#fff', padding: '1.5em', borderRadius: '8px', marginBottom: '1.5em', border: '1px solid #dee2e6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5em' }}>
            {/* Subscription Info */}
            <div>
              <h3 style={{ margin: '0 0 0.5em 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getSubscriptionDisplayName(selectedSubscription)}
                <span style={{
                  backgroundColor: getStatusColor(selectedSubscription.subscription_status),
                  color: selectedSubscription.subscription_status === 'past_due' ? '#000' : 'white',
                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.7em', textTransform: 'capitalize'
                }}>
                  {selectedSubscription.subscription_status}
                </span>
              </h3>
              <div style={{ display: 'flex', gap: '2em', flexWrap: 'wrap', fontSize: '0.9em', color: '#666' }}>
                <span><strong>Plan Type:</strong> {selectedSubscription.plan_type === 'specialty' ? 'Single Agent' : 'Multi-Agent'}</span>
                <span><strong>Agents:</strong> {agentsInSubscription.length}</span>
                {selectedSubscription.trial_end && selectedSubscription.subscription_status === 'trialing' && (
                  <span><strong>Trial Ends:</strong> {new Date(selectedSubscription.trial_end).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Token Usage */}
            <div style={{ minWidth: '250px' }}>
              <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '4px' }}>Token Usage</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: getUsageColor(getUsagePercentage(selectedSubscription.tokens_used, selectedSubscription.token_limit)) }}>
                  {formatNumber(selectedSubscription.tokens_used || 0)}
                </span>
                <span style={{ color: '#666' }}>
                  / {selectedSubscription.token_limit ? formatNumber(selectedSubscription.token_limit) : '∞'}
                </span>
              </div>
              {selectedSubscription.token_limit && (
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${getUsagePercentage(selectedSubscription.tokens_used, selectedSubscription.token_limit)}%`,
                    height: '100%',
                    backgroundColor: getUsageColor(getUsagePercentage(selectedSubscription.tokens_used, selectedSubscription.token_limit)),
                    transition: 'width 0.3s'
                  }} />
                </div>
              )}
            </div>

            {/* Cancel Button */}
            {selectedSubscription.subscription_id && selectedSubscription.subscription_status !== 'cancelled' && (
              <button onClick={() => setShowCancelModal(true)}
                style={{ padding: '0.5em 1em', backgroundColor: 'transparent', color: '#dc3545',
                  border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' }}>
                Cancel Subscription
              </button>
            )}
          </div>
          
          {cancelSuccess && (
            <div style={{ marginTop: '1em', padding: '1em', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', color: '#155724' }}>
              ✅ {cancelSuccess}
            </div>
          )}
        </div>
      )}

      {/* Agent Selector */}
      <div style={{ backgroundColor: '#e7f3ff', padding: '1.25em 1.5em', borderRadius: '8px', marginBottom: '1.5em', border: '1px solid #b3d7ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 'bold', color: '#0056b3', fontSize: '1.1em' }}>Select Agent:</label>
          
          {agentsInSubscription.length === 0 ? (
            <span style={{ color: '#666' }}>No agents in this subscription</span>
          ) : (
            <select value={selectedClientId || ''} onChange={handleClientChange}
              style={{ padding: '0.6em 1em', fontSize: '1em', borderRadius: '4px', border: '1px solid #0056b3', backgroundColor: 'white', minWidth: '280px', cursor: 'pointer' }}>
              {agentsInSubscription.map((client) => (
                <option key={client.clientid} value={client.clientid}>
                  {getClientDisplayName(client)}
                </option>
              ))}
            </select>
          )}

          {/* New Agent Button */}
          {canCreateAgentInSubscription && !specialtySubAtLimit ? (
            <button onClick={() => setShowNewAgentModal(true)}
              style={{ padding: '0.6em 1.2em', fontSize: '1em', backgroundColor: '#28a745',
                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.2em' }}>+</span> New Agent
            </button>
          ) : specialtySubAtLimit ? (
            <div style={{ padding: '0.6em 1em', backgroundColor: '#fff3cd', color: '#856404',
              border: '1px solid #ffc107', borderRadius: '4px', fontSize: '0.9em' }}>
              ⚠️ Specialty plans allow 1 agent only
            </div>
          ) : null}

          <span style={{ color: '#666', fontSize: '0.9em', marginLeft: 'auto' }}>
            {agentsInSubscription.length} agent{agentsInSubscription.length !== 1 ? 's' : ''} in this subscription
          </span>
        </div>
      </div>

      {/* Selected Agent Details */}
      {selectedClient && (
        <div style={{ backgroundColor: '#fff', padding: '1.5em', borderRadius: '8px', marginBottom: '1em', border: '1px solid #dee2e6' }}>
          <h3 style={{ margin: '0 0 1em 0', color: '#333' }}>{getClientDisplayName(selectedClient)}</h3>
          <div style={{ display: 'flex', gap: '2em', flexWrap: 'wrap', fontSize: '0.95em', color: '#666' }}>
            <span><strong>Agent ID:</strong> {selectedClient.clientid}</span>
            <span><strong>Level:</strong> <span style={{
              backgroundColor: getLevelColor(selectedClient.subscription_level || selectedClient.level),
              color: 'white', padding: '0.15em 0.5em', borderRadius: '3px', fontSize: '0.9em', textTransform: 'capitalize'
            }}>{selectedClient.subscription_level || selectedClient.level || 'basic'}</span></span>
            {selectedClient.company && <span><strong>Company:</strong> {selectedClient.company}</span>}
            {selectedClient.domain && <span><strong>Domain:</strong> {selectedClient.domain}</span>}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginTop: '1.5em', marginBottom: '2em', flexWrap: 'wrap' }}>
        <button style={tabStyle(activeTab === 'configurations')} onClick={() => setActiveTab('configurations')}>Configurations</button>
        <button style={tabStyle(activeTab === 'models')} onClick={() => setActiveTab('models')}>Models</button>
        <button style={tabStyle(activeTab === 'integrations')} onClick={() => setActiveTab('integrations')}>Integrations</button>
        <button style={tabStyle(activeTab === 'conversations')} onClick={() => setActiveTab('conversations')}>Conversations</button>
      </div>

      {/* Tab Content */}
      {loadingData ? (
        <div style={{ textAlign: 'center', padding: '2em' }}><p>Loading...</p></div>
      ) : selectedClient ? (
        <>
          {activeTab === 'configurations' && <ConfigurationsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'models' && <ModelsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'integrations' && <IntegrationsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'conversations' && <ConversationsTab user={selectedClient} clientId={selectedClientId} />}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
          <p>No agent selected. {agentsInSubscription.length === 0 && canCreateAgentInSubscription && 'Create one to get started!'}</p>
        </div>
      )}
    </div>
  );
}