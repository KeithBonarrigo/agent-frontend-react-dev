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

  // Training - URL Embedding state
  // These states manage the URL-based embedding feature in the Training tab
  // Allows users to submit website URLs that get crawled and converted to vector embeddings
  // for RAG (Retrieval Augmented Generation) to enhance agent responses with web content
  const [embeddingUrl, setEmbeddingUrl] = useState('');           // Current URL input value
  const [embeddingLoading, setEmbeddingLoading] = useState(false); // Loading state during API call
  const [embeddingError, setEmbeddingError] = useState(null);      // Error message from failed operations
  const [embeddingSuccess, setEmbeddingSuccess] = useState(null);  // Success message after operations
  const [isEmbeddingSectionOpen, setIsEmbeddingSectionOpen] = useState(true);  // Collapsible section toggle
  const [showAddEmbeddingForm, setShowAddEmbeddingForm] = useState(false);     // Show/hide the add URL form
  const [embeddingsList, setEmbeddingsList] = useState([]);        // List of existing URL embeddings
  const [embeddingsLoading, setEmbeddingsLoading] = useState(false); // Loading state for fetching list

  // Training - File Embedding state
  // These states manage file upload-based embeddings in the Training tab
  // Allows users to upload documents (PDF, TXT, DOC, DOCX) that get parsed and converted to embeddings
  // for RAG to enhance agent responses with document content
  const [embeddingFile, setEmbeddingFile] = useState(null);            // Selected file object
  const [fileEmbeddingLoading, setFileEmbeddingLoading] = useState(false); // Loading during upload
  const [fileEmbeddingError, setFileEmbeddingError] = useState(null);      // Error message
  const [fileEmbeddingSuccess, setFileEmbeddingSuccess] = useState(null);  // Success message
  const [isFileSectionOpen, setIsFileSectionOpen] = useState(true);    // Collapsible section toggle
  const [showAddFileForm, setShowAddFileForm] = useState(false);       // Show/hide the add file form
  const [fileEmbeddingsList, setFileEmbeddingsList] = useState([]);    // List of existing file embeddings
  const [fileEmbeddingsLoading, setFileEmbeddingsLoading] = useState(false); // Loading state for list

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

  // Fetch embeddings when selected client changes
  // Triggers both URL and file embedding fetches when user selects a different agent
  // This ensures the Training tab displays the correct embeddings for the current agent
  // Interacts with: fetchEmbeddings(), fetchFileEmbeddings(), selectedClientId state
  useEffect(() => {
    if (selectedClientId) {
      fetchEmbeddings();
      fetchFileEmbeddings();
    }
  }, [selectedClientId]);

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

  // handleCreateEmbedding - Creates a new URL-based embedding
  // Called when user submits a URL in the Training tab's URL Embedding form
  // Validates URL format, sends to backend API which crawls the page and creates vector embeddings
  // Interacts with: /api/embeddings/create-from-url endpoint, embeddingUrl state, selectedClientId
  // On success: clears form, refreshes embeddings list, shows success message for 5 seconds
  const handleCreateEmbedding = async (e) => {
    e.preventDefault();

    if (!embeddingUrl.trim()) {
      setEmbeddingError('Please enter a valid URL');
      return;
    }

    // Basic URL validation - uses URL constructor to verify format
    try {
      new URL(embeddingUrl);
    } catch {
      setEmbeddingError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setEmbeddingLoading(true);
    setEmbeddingError(null);
    setEmbeddingSuccess(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${apiBaseUrl}/api/embeddings/create-from-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: embeddingUrl.trim(),
            clientId: selectedClientId,
            type: 'url' // Flag to indicate this is a URL embedding (vs file embedding)
          }),
          credentials: 'include'
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create embedding');

      setEmbeddingSuccess('Embedding created successfully!');
      setEmbeddingUrl('');
      setShowAddEmbeddingForm(false);

      // Refresh embeddings list to show the newly created embedding
      fetchEmbeddings();

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setEmbeddingSuccess(null);
      }, 5000);

    } catch (error) {
      console.error('Create embedding error:', error);
      setEmbeddingError(error.message);
    } finally {
      setEmbeddingLoading(false);
    }
  };

  // fetchEmbeddings - Retrieves URL-based embeddings for the current agent
  // Called on client selection change and after creating/deleting embeddings
  // Fetches from /api/embeddings/client/:clientId and filters for type='url' embeddings only
  // Includes robust error handling for non-JSON responses (e.g., HTML error pages)
  // Interacts with: embeddingsList state, selectedClientId, embeddingsLoading
  const fetchEmbeddings = async () => {
    if (!selectedClientId) {
      console.log('⚠️ fetchEmbeddings called but no selectedClientId:', selectedClientId);
      return;
    }

    console.log('📡 Fetching embeddings for clientId:', selectedClientId);
    setEmbeddingsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${apiBaseUrl}/api/embeddings/client/${selectedClientId}`;
      console.log('📡 Fetch URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      console.log('📡 Response status:', response.status, response.statusText);

      // Check if response is actually JSON before parsing
      // This prevents parsing errors when server returns HTML error pages
      const contentType = response.headers.get('content-type');
      console.log('📡 Response content-type:', contentType);

      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📡 Embeddings response:', data);
      } else {
        const text = await response.text();
        console.error('📡 Non-JSON response received:', text);
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 200)}`);
      }

      if (!response.ok) throw new Error(data.error || `Failed to fetch embeddings (${response.status})`);

      // Filter to only URL embeddings (type === 'url' or no type field for backward compatibility)
      // Backward compatibility: older embeddings without a type field are treated as URL embeddings
      const allEmbeddings = data.embeddings || [];
      const urlEmbeddings = allEmbeddings.filter(emb => !emb.type || emb.type === 'url');

      setEmbeddingsList(urlEmbeddings);
      console.log('✅ URL Embeddings loaded:', urlEmbeddings.length, 'of', allEmbeddings.length, 'total');
    } catch (error) {
      console.error('❌ Fetch embeddings error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      setEmbeddingsList([]); // Clear list on error to prevent stale data
    } finally {
      setEmbeddingsLoading(false);
    }
  };

  // fetchFileEmbeddings - Retrieves file-based embeddings for the current agent
  // Called on client selection change and after creating/deleting file embeddings
  // Uses same API endpoint as URL embeddings but filters for type='file' only
  // Note: Shares endpoint with fetchEmbeddings() - both fetch all embeddings, then filter client-side
  // Interacts with: fileEmbeddingsList state, selectedClientId, fileEmbeddingsLoading
  const fetchFileEmbeddings = async () => {
    if (!selectedClientId) {
      console.log('⚠️ fetchFileEmbeddings called but no selectedClientId:', selectedClientId);
      return;
    }

    console.log('📄 Fetching file embeddings for clientId:', selectedClientId);
    setFileEmbeddingsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // Using same endpoint as URL embeddings - filtering by type happens on frontend
      const url = `${apiBaseUrl}/api/embeddings/client/${selectedClientId}`;
      console.log('📄 Fetch URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      console.log('📄 Response status:', response.status, response.statusText);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      console.log('📄 Response content-type:', contentType);

      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📄 File embeddings response:', data);
      } else {
        const text = await response.text();
        console.error('📄 Non-JSON response received:', text);
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 200)}`);
      }

      if (!response.ok) throw new Error(data.error || `Failed to fetch file embeddings (${response.status})`);

      // Filter to only file embeddings (type === 'file')
      // Unlike URL embeddings, file embeddings must explicitly have type='file'
      const allEmbeddings = data.embeddings || [];
      const fileEmbeddings = allEmbeddings.filter(emb => emb.type === 'file');

      setFileEmbeddingsList(fileEmbeddings);
      console.log('✅ File embeddings loaded:', fileEmbeddings.length, 'of', allEmbeddings.length, 'total');
    } catch (error) {
      console.error('❌ Fetch file embeddings error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      setFileEmbeddingsList([]); // Clear list on error to prevent stale data
    } finally {
      setFileEmbeddingsLoading(false);
    }
  };

  // handleCreateFileEmbedding - Uploads a file and creates embeddings from its content
  // Called when user submits a file in the Training tab's File Embedding form
  // Uses FormData to send file to backend, which parses document and creates vector embeddings
  // Supports PDF, TXT, DOC, DOCX formats (validated via file input accept attribute)
  // Interacts with: /api/embeddings/create-from-file endpoint, embeddingFile state, selectedClientId
  // On success: clears form, resets file input, refreshes list, shows success message for 5 seconds
  const handleCreateFileEmbedding = async (e) => {
    e.preventDefault();

    if (!embeddingFile) {
      setFileEmbeddingError('Please select a file');
      return;
    }

    setFileEmbeddingLoading(true);
    setFileEmbeddingError(null);
    setFileEmbeddingSuccess(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // Use FormData for multipart/form-data file upload (no Content-Type header needed)
      const formData = new FormData();
      formData.append('file', embeddingFile);
      formData.append('clientId', selectedClientId);
      formData.append('type', 'file'); // Flag to differentiate from URL embeddings

      const response = await fetch(
        `${apiBaseUrl}/api/embeddings/create-from-file`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include'
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create embedding from file');

      setFileEmbeddingSuccess('File embedding created successfully!');
      setEmbeddingFile(null);
      setShowAddFileForm(false);

      // Reset file input element manually (React doesn't control file inputs)
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      // Refresh file embeddings list to show the newly created embedding
      fetchFileEmbeddings();

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setFileEmbeddingSuccess(null);
      }, 5000);

    } catch (error) {
      console.error('Create file embedding error:', error);
      setFileEmbeddingError(error.message);
    } finally {
      setFileEmbeddingLoading(false);
    }
  };

  // handleDeleteEmbedding - Deletes an embedding (URL or file) from the system
  // Called when user clicks the delete button on an embedding in the Training tab
  // Shows confirmation dialog before deletion to prevent accidental data loss
  // Interacts with: /api/embeddings/:embeddingId (DELETE), fetchEmbeddings(), fetchFileEmbeddings()
  // Uses embeddingType parameter to determine which list to refresh and which state to update
  const handleDeleteEmbedding = async (embeddingId, embeddingType) => {
    if (!confirm('Are you sure you want to delete this embedding? This action cannot be undone.')) {
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${apiBaseUrl}/api/embeddings/${embeddingId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete embedding');

      // Refresh the appropriate list based on embedding type
      // This ensures the UI reflects the deletion immediately
      if (embeddingType === 'url') {
        fetchEmbeddings();
        setEmbeddingSuccess('Embedding deleted successfully!');
        setTimeout(() => setEmbeddingSuccess(null), 3000);
      } else {
        fetchFileEmbeddings();
        setFileEmbeddingSuccess('Embedding deleted successfully!');
        setTimeout(() => setFileEmbeddingSuccess(null), 3000);
      }

    } catch (error) {
      console.error('Delete embedding error:', error);
      // Show error in the appropriate section based on embedding type
      if (embeddingType === 'url') {
        setEmbeddingError(error.message);
        setTimeout(() => setEmbeddingError(null), 5000);
      } else {
        setFileEmbeddingError(error.message);
        setTimeout(() => setFileEmbeddingError(null), 5000);
      }
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

      {/* Tabs - Navigation for different dashboard sections */}
      {/* Training tab added to allow users to manage RAG embeddings for their agents */}
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginTop: '1.5em', marginBottom: '2em', flexWrap: 'wrap' }}>
        <button style={tabStyle(activeTab === 'configurations')} onClick={() => setActiveTab('configurations')}>Configurations</button>
        <button style={tabStyle(activeTab === 'training')} onClick={() => setActiveTab('training')}>Training</button>
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
          {/* Training Tab - RAG Embedding Management
              Allows users to add knowledge sources (URLs and files) to enhance their AI agent's responses
              Two sections: URL Embeddings (web scraping) and File Embeddings (document uploads)
              Each section is collapsible and has its own list, add form, and CRUD operations
              Interacts with: embedding state variables, fetch/create/delete embedding functions */}
          {activeTab === 'training' && (
            <div style={{ padding: '2em', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h2 style={{ marginTop: 0, color: '#333' }}>Training</h2>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Configure and manage your agent's training data, knowledge base, and learning parameters.
              </p>

              {/* URL Embedding Section - Collapsible panel for managing website-based embeddings */}
              <div style={{ backgroundColor: 'white', padding: '1.5em', borderRadius: '8px', border: '1px solid #dee2e6', marginTop: '1.5em' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    marginBottom: isEmbeddingSectionOpen ? '1em' : 0
                  }}
                  onClick={() => setIsEmbeddingSectionOpen(!isEmbeddingSectionOpen)}
                >
                  <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                    <i className="fa-solid fa-globe" style={{ color: '#007bff' }}></i>
                    URL Embeddings
                  </h3>
                  <i className={`fa-solid fa-chevron-${isEmbeddingSectionOpen ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9em' }}></i>
                </div>

                {isEmbeddingSectionOpen && (
                  <>
                    <p style={{ color: '#666', fontSize: '0.95em', marginBottom: '1.5em' }}>
                      Train your agent by providing website URLs. The system will crawl and create embeddings from the content.
                    </p>

                    {/* Embeddings List */}
                    {embeddingsLoading ? (
                      <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                        Loading embeddings...
                      </div>
                    ) : embeddingsList.length > 0 ? (
                      <div style={{ marginBottom: '1.5em' }}>
                        <h4 style={{ margin: '0 0 0.75em 0', fontSize: '0.95em', color: '#666' }}>Embedded Websites</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
                          {embeddingsList.map((embedding, index) => (
                            <div key={index} style={{
                              padding: '0.75em 1em',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '4px',
                              border: '1px solid #dee2e6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em', flex: 1 }}>
                                <i className="fa-solid fa-globe" style={{ color: '#007bff', fontSize: '0.9em' }}></i>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
                                  {embedding.title && (
                                    <span style={{ color: '#333', fontSize: '0.95em', fontWeight: '500' }}>{embedding.title}</span>
                                  )}
                                  <span style={{ color: '#666', fontSize: '0.85em' }}>{embedding.url || embedding.source}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
                                {embedding.created_at && (
                                  <span style={{ fontSize: '0.85em', color: '#999', whiteSpace: 'nowrap' }}>
                                    {new Date(embedding.created_at).toLocaleDateString()}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDeleteEmbedding(embedding.id, 'url')}
                                  style={{
                                    padding: '0.4em 0.75em',
                                    fontSize: '0.85em',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4em'
                                  }}
                                  title="Delete embedding"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2em', color: '#999', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '1.5em' }}>
                        No embeddings yet. Click "Add New Embedding" to get started.
                      </div>
                    )}

                    {/* Add New Button */}
                    {!showAddEmbeddingForm && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAddEmbeddingForm(true); }}
                        style={{
                          padding: '0.75em 1.5em',
                          fontSize: '1em',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5em'
                        }}
                      >
                        <i className="fa-solid fa-plus"></i>
                        Add New Embedding
                      </button>
                    )}

                    {/* Add Embedding Form */}
                    {showAddEmbeddingForm && (
                      <form onSubmit={handleCreateEmbedding} style={{ marginTop: '1.5em', padding: '1.5em', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                  <div style={{ marginBottom: '1em' }}>
                    <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold', color: '#333' }}>
                      Website URL <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      type="url"
                      value={embeddingUrl}
                      onChange={(e) => setEmbeddingUrl(e.target.value)}
                      placeholder="https://example.com"
                      disabled={embeddingLoading}
                      style={{
                        width: '100%',
                        padding: '0.75em',
                        fontSize: '1em',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  {embeddingError && (
                    <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#721c24' }}>
                      ❌ {embeddingError}
                    </div>
                  )}

                  {embeddingSuccess && (
                    <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#155724' }}>
                      ✅ {embeddingSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1em' }}>
                    <button
                      type="submit"
                      disabled={embeddingLoading || !embeddingUrl.trim()}
                      style={{
                        padding: '0.75em 1.5em',
                        fontSize: '1em',
                        backgroundColor: embeddingLoading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: embeddingLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {embeddingLoading ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                          Creating Embedding...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-plus" style={{ marginRight: '0.5em' }}></i>
                          Create Embedding
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAddEmbeddingForm(false); setEmbeddingUrl(''); setEmbeddingError(null); setEmbeddingSuccess(null); }}
                      disabled={embeddingLoading}
                      style={{
                        padding: '0.75em 1.5em',
                        fontSize: '1em',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: embeddingLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
              </div>

              {/* File Embedding Section */}
              <div style={{ backgroundColor: 'white', padding: '1.5em', borderRadius: '8px', border: '1px solid #dee2e6', marginTop: '1.5em' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    marginBottom: isFileSectionOpen ? '1em' : 0
                  }}
                  onClick={() => setIsFileSectionOpen(!isFileSectionOpen)}
                >
                  <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                    <i className="fa-solid fa-file-arrow-up" style={{ color: '#28a745' }}></i>
                    File Embeddings
                  </h3>
                  <i className={`fa-solid fa-chevron-${isFileSectionOpen ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9em' }}></i>
                </div>

                {isFileSectionOpen && (
                  <>
                    <p style={{ color: '#666', fontSize: '0.95em', marginBottom: '1.5em' }}>
                      Upload document files to train your agent. Supported formats: PDF, TXT, DOC, DOCX.
                    </p>

                    {/* File Embeddings List */}
                    {fileEmbeddingsLoading ? (
                      <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                        Loading file embeddings...
                      </div>
                    ) : fileEmbeddingsList.length > 0 ? (
                      <div style={{ marginBottom: '1.5em' }}>
                        <h4 style={{ margin: '0 0 0.75em 0', fontSize: '0.95em', color: '#666' }}>Uploaded Files</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
                          {fileEmbeddingsList.map((embedding, index) => (
                            <div key={index} style={{
                              padding: '0.75em 1em',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '4px',
                              border: '1px solid #dee2e6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em', flex: 1 }}>
                                <i className="fa-solid fa-file" style={{ color: '#28a745', fontSize: '0.9em' }}></i>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
                                  {embedding.title && (
                                    <span style={{ color: '#333', fontSize: '0.95em', fontWeight: '500' }}>{embedding.title}</span>
                                  )}
                                  <span style={{ color: '#666', fontSize: '0.85em' }}>{embedding.filename || embedding.url || embedding.source}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
                                {embedding.created_at && (
                                  <span style={{ fontSize: '0.85em', color: '#999', whiteSpace: 'nowrap' }}>
                                    {new Date(embedding.created_at).toLocaleDateString()}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDeleteEmbedding(embedding.id, 'file')}
                                  style={{
                                    padding: '0.4em 0.75em',
                                    fontSize: '0.85em',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4em'
                                  }}
                                  title="Delete embedding"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2em', color: '#999', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '1.5em' }}>
                        No file embeddings yet. Click "Add New File" to get started.
                      </div>
                    )}

                    {/* Add New Button */}
                    {!showAddFileForm && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAddFileForm(true); }}
                        style={{
                          padding: '0.75em 1.5em',
                          fontSize: '1em',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5em'
                        }}
                      >
                        <i className="fa-solid fa-plus"></i>
                        Add New File
                      </button>
                    )}

                    {/* Add File Form */}
                    {showAddFileForm && (
                      <form onSubmit={handleCreateFileEmbedding} style={{ marginTop: '1.5em', padding: '1.5em', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                      <div style={{ marginBottom: '1em' }}>
                        <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold', color: '#333' }}>
                          Select File <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setEmbeddingFile(e.target.files[0])}
                          accept=".pdf,.txt,.doc,.docx"
                          disabled={fileEmbeddingLoading}
                          style={{
                            width: '100%',
                            padding: '0.75em',
                            fontSize: '1em',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            cursor: fileEmbeddingLoading ? 'not-allowed' : 'pointer'
                          }}
                          required
                        />
                        {embeddingFile && (
                          <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                            Selected: {embeddingFile.name} ({(embeddingFile.size / 1024).toFixed(2)} KB)
                          </div>
                        )}
                      </div>

                      {fileEmbeddingError && (
                        <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#721c24' }}>
                          ❌ {fileEmbeddingError}
                        </div>
                      )}

                      {fileEmbeddingSuccess && (
                        <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#155724' }}>
                          ✅ {fileEmbeddingSuccess}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '1em' }}>
                        <button
                          type="submit"
                          disabled={fileEmbeddingLoading || !embeddingFile}
                          style={{
                            padding: '0.75em 1.5em',
                            fontSize: '1em',
                            backgroundColor: fileEmbeddingLoading ? '#ccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: fileEmbeddingLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          {fileEmbeddingLoading ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                              Creating Embedding...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-upload" style={{ marginRight: '0.5em' }}></i>
                              Upload File
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowAddFileForm(false); setEmbeddingFile(null); setFileEmbeddingError(null); setFileEmbeddingSuccess(null); }}
                          disabled={fileEmbeddingLoading}
                          style={{
                            padding: '0.75em 1.5em',
                            fontSize: '1em',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: fileEmbeddingLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                    )}
                  </>
                )}
              </div>

              {/* Coming Soon Section */}
              <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '1.5em', marginTop: '1.5em' }}>
                <p style={{ margin: 0, color: '#856404' }}>
                  <strong>Additional Features Coming Soon:</strong> Document uploads, training datasets, and fine-tuning options will be available in future updates.
                </p>
              </div>
            </div>
          )}
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