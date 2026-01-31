import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser } from '../contexts/UserContext';
import { getApiUrl } from '../utils/getApiUrl';
import ConfigurationsTab from '../components/ConfigurationsTab';
import IntegrationsTab from '../components/IntegrationsTab';
import AddOnsTab from '../components/AddOnsTab';
import ConversationsTab from '../components/ConversationsTab';
import MetricsTab from '../components/MetricsTab';
import LeadsTab from '../components/LeadsTab';
import StylingTab from '../components/StylingTab';
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
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

  // Change Level Modal
  const [showChangeLevelModal, setShowChangeLevelModal] = useState(false);
  const [changeLevelLoading, setChangeLevelLoading] = useState(false);
  const [changeLevelError, setChangeLevelError] = useState(null);
  const [changeLevelSuccess, setChangeLevelSuccess] = useState(null);
  const [selectedNewLevel, setSelectedNewLevel] = useState('');

  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [newAgentLoading, setNewAgentLoading] = useState(false);
  const [newAgentError, setNewAgentError] = useState(null);
  const [newAgentSuccess, setNewAgentSuccess] = useState(null);
  const [newAgentForm, setNewAgentForm] = useState({ name: '', company: '' });

  // Agent Edit Form state
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [agentEditForm, setAgentEditForm] = useState({
    agent_name: '',
    mls_token: '',
    contact_email: '',
    contact_phone: '',
    contact_phone_wsp: false,
    office_lat: '',
    office_long: '',
    office_address: '',
    office_wsp_phone: '',
    company: '',
    timezone: 'America/Mazatlan',
    domain_to_install_bot: '',
    restrict_response: false,
    restrict_response_start: '',
    restrict_response_end: ''
  });
  const [agentEditLoading, setAgentEditLoading] = useState(false);
  const [agentEditError, setAgentEditError] = useState(null);
  const [agentEditSuccess, setAgentEditSuccess] = useState(null);

  // Training - URL Embedding state
  // These states manage the URL-based embedding feature in the Training tab
  // Allows users to submit website URLs that get crawled and converted to vector embeddings
  // for RAG (Retrieval Augmented Generation) to enhance agent responses with web content
  const [embeddingUrl, setEmbeddingUrl] = useState('');           // Current URL input value
  const [embeddingLoading, setEmbeddingLoading] = useState(false); // Loading state during API call
  const [embeddingError, setEmbeddingError] = useState(null);      // Error message from failed operations
  const [embeddingSuccess, setEmbeddingSuccess] = useState(null);  // Success message after operations
  const [isEmbeddingSectionOpen, setIsEmbeddingSectionOpen] = useState(false);  // Collapsible section toggle
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
  const [isFileSectionOpen, setIsFileSectionOpen] = useState(false);    // Collapsible section toggle
  const [showAddFileForm, setShowAddFileForm] = useState(false);       // Show/hide the add file form
  const [fileEmbeddingsList, setFileEmbeddingsList] = useState([]);    // List of existing file embeddings
  const [fileEmbeddingsLoading, setFileEmbeddingsLoading] = useState(false); // Loading state for list

  // Google Drive integration state - for importing files from Google Drive
  // Uses environment variables configured by the app owner (not per-client credentials)
  const [fileSource, setFileSource] = useState('local'); // 'local' or 'google-drive'
  const [googleDriveFile, setGoogleDriveFile] = useState(null); // Selected Google Drive file metadata
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [isGooglePickerLoading, setIsGooglePickerLoading] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  // Google Drive credentials from environment variables (configured once by app owner)
  const googleDriveConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || null,
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || null,
    appId: import.meta.env.VITE_GOOGLE_APP_ID || null
  };
  const isGoogleDriveEnabled = !!(googleDriveConfig.clientId && googleDriveConfig.apiKey);

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
        const apiBaseUrl = getApiUrl();
        const response = await fetch(`${apiBaseUrl}/api/account/${user.account_id}/clients`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        console.log('✅ Data received:', data);
        console.log('📊 Client token fields:', data.clients?.map(c => ({
          clientid: c.clientid,
          tokens_used: c.tokens_used,
          token_count: c.token_count,
          total_tokens: c.total_tokens
        })));

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
        const apiBaseUrl = getApiUrl();
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

  // Calculate total token usage for the selected subscription by summing tokens from all agents
  const subscriptionTokensUsed = agentsInSubscription.reduce((total, client) => {
    return total + (client.tokens_used || 0);
  }, 0);
  
  const canCreateAgentInSubscription = selectedSubscription &&
    selectedSubscription.plan_type === 'base' &&
    selectedSubscription.level !== 'free' &&
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

  // Populate agent edit form when selected client changes
  useEffect(() => {
    if (selectedClient) {
      setAgentEditForm({
        agent_name: selectedClient.agent_name || '',
        mls_token: selectedClient.mls_token ? '••••••••' : '',
        contact_email: selectedClient.contact_email || '',
        contact_phone: selectedClient.contact_phone || '',
        contact_phone_wsp: selectedClient.contact_phone_wsp || false,
        office_lat: selectedClient.office_lat || '',
        office_long: selectedClient.office_long || '',
        office_address: selectedClient.office_address || '',
        office_wsp_phone: selectedClient.office_wsp_phone || '',
        company: selectedClient.company || '',
        timezone: selectedClient.timezone || 'America/Mazatlan',
        domain_to_install_bot: selectedClient.domain_to_install_bot || '',
        restrict_response: selectedClient.restrict_response || false,
        restrict_response_start: parseTimeForInput(selectedClient.restrict_response_start),
        restrict_response_end: parseTimeForInput(selectedClient.restrict_response_end)
      });
      setIsEditingAgent(false);
      setAgentEditError(null);
      setAgentEditSuccess(null);
    }
  }, [selectedClient]);

  // Load Google API scripts when Google Drive is selected as file source
  useEffect(() => {
    if (fileSource !== 'google-drive' || isGoogleApiLoaded || !isGoogleDriveEnabled) return;

    // Load the Google API script
    const loadGoogleApi = () => {
      if (window.gapi) {
        setIsGoogleApiLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', () => {
          setIsGoogleApiLoaded(true);
        });
      };
      document.body.appendChild(script);
    };

    // Load Google Identity Services for OAuth
    const loadGoogleIdentity = () => {
      if (window.google?.accounts) return;

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      document.body.appendChild(script);
    };

    loadGoogleApi();
    loadGoogleIdentity();
  }, [fileSource, isGoogleApiLoaded, isGoogleDriveEnabled]);

  // handleGoogleDrivePicker - Opens Google Picker to select a file from Google Drive
  // User clicks "Sign in with Google" -> OAuth popup -> gets access token -> opens Picker
  const handleGoogleDrivePicker = () => {
    if (!isGoogleDriveEnabled) {
      setFileEmbeddingError('Google Drive is not configured. Please contact your administrator.');
      return;
    }

    setIsGooglePickerLoading(true);
    setFileEmbeddingError(null);

    // Initialize the token client for OAuth - user signs in with their Google account
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleDriveConfig.clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          setFileEmbeddingError('Failed to authenticate with Google Drive');
          setIsGooglePickerLoading(false);
          return;
        }

        setGoogleAccessToken(tokenResponse.access_token);
        createGooglePicker(tokenResponse.access_token);
      },
    });

    // Request access token - this opens the Google sign-in popup
    tokenClient.requestAccessToken();
  };

  // createGooglePicker - Creates and shows the Google Picker UI
  const createGooglePicker = (accessToken) => {
    const picker = new window.google.picker.PickerBuilder()
      .addView(new window.google.picker.DocsView()
        .setIncludeFolders(false)
        .setMimeTypes('text/csv,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
      .setOAuthToken(accessToken)
      .setDeveloperKey(googleDriveConfig.apiKey)
      .setAppId(googleDriveConfig.appId)
      .setCallback((data) => {
        setIsGooglePickerLoading(false);
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          setGoogleDriveFile({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.sizeBytes
          });
          // Clear local file if any
          setEmbeddingFile(null);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          // User cancelled - do nothing
        }
      })
      .build();

    picker.setVisible(true);
  };

  // handleCreateFileEmbeddingFromGoogleDrive - Creates embedding from Google Drive file
  // Downloads the file from Google Drive, then uploads to the existing /api/embeddings/create-from-file endpoint
  // Google Docs/Sheets/Slides need to be exported to standard formats since they're proprietary
  const handleCreateFileEmbeddingFromGoogleDrive = async () => {
    if (!googleDriveFile || !googleAccessToken) {
      setFileEmbeddingError('Please select a file from Google Drive');
      return;
    }

    setFileEmbeddingLoading(true);
    setFileEmbeddingError(null);
    setFileEmbeddingSuccess(null);

    try {
      // Google Workspace files need to be exported, not downloaded directly
      // Map Google MIME types to export formats
      const googleExportMap = {
        'application/vnd.google-apps.document': { exportMime: 'application/pdf', ext: '.pdf' },
        'application/vnd.google-apps.spreadsheet': { exportMime: 'text/csv', ext: '.csv' },
        'application/vnd.google-apps.presentation': { exportMime: 'application/pdf', ext: '.pdf' }
      };

      const isGoogleWorkspaceFile = googleExportMap[googleDriveFile.mimeType];
      let driveResponse;
      let finalFileName = googleDriveFile.name;
      let finalMimeType = googleDriveFile.mimeType;

      if (isGoogleWorkspaceFile) {
        // Export Google Workspace files to standard format
        const { exportMime, ext } = isGoogleWorkspaceFile;
        driveResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${googleDriveFile.id}/export?mimeType=${encodeURIComponent(exportMime)}`,
          {
            headers: {
              'Authorization': `Bearer ${googleAccessToken}`
            }
          }
        );
        // Add extension if not already present
        if (!finalFileName.toLowerCase().endsWith(ext)) {
          finalFileName = finalFileName + ext;
        }
        finalMimeType = exportMime;
      } else {
        // Regular files can be downloaded directly
        driveResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${googleDriveFile.id}?alt=media`,
          {
            headers: {
              'Authorization': `Bearer ${googleAccessToken}`
            }
          }
        );
      }

      if (!driveResponse.ok) {
        const errorText = await driveResponse.text();
        console.error('Google Drive download error:', errorText);
        throw new Error('Failed to download file from Google Drive. Please try selecting the file again.');
      }

      // Convert response to a File object
      const blob = await driveResponse.blob();

      // Sanitize filename - remove problematic characters
      const sanitizedFileName = finalFileName.replace(/[<>:"/\\|?*]/g, '_').trim();

      const file = new File([blob], sanitizedFileName, { type: finalMimeType || blob.type });

      // Create FormData and upload to existing endpoint
      const apiBaseUrl = getApiUrl();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', selectedClientId);
      formData.append('type', 'file');

      const response = await fetch(`${apiBaseUrl}/api/embeddings/create-from-file`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create embedding from Google Drive file');

      setFileEmbeddingSuccess('File embedding created successfully from Google Drive!');
      setGoogleDriveFile(null);
      setShowAddFileForm(false);
      setFileSource('local');

      // Refresh list
      fetchFileEmbeddings();

      setTimeout(() => setFileEmbeddingSuccess(null), 5000);
    } catch (error) {
      console.error('Create file embedding from Google Drive error:', error);
      setFileEmbeddingError(error.message);
    } finally {
      setFileEmbeddingLoading(false);
    }
  };

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
      const apiBaseUrl = getApiUrl();
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

  const handleChangeLevel = async () => {
    if (!selectedSubscription?.subscription_id || !selectedNewLevel) {
      setChangeLevelError('Please select a new level.');
      return;
    }

    if (selectedNewLevel === selectedSubscription.level) {
      setChangeLevelError('Please select a different level.');
      return;
    }

    setChangeLevelLoading(true);
    setChangeLevelError(null);
    setChangeLevelSuccess(null);

    try {
      const token = import.meta.env.VITE_CREATE_USER_TOKEN;
      const apiBaseUrl = getApiUrl();

      const response = await fetch(`${apiBaseUrl}/api/update-subscription-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscriptionId: selectedSubscription.subscription_id,
          newLevel: selectedNewLevel
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update subscription');

      setChangeLevelSuccess(`Subscription updated to ${selectedNewLevel}!`);
      setShowChangeLevelModal(false);
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Change level error:', error);
      setChangeLevelError(error.message);
    } finally {
      setChangeLevelLoading(false);
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
      const apiBaseUrl = getApiUrl();
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

  // handleUpdateAgent - Updates agent/client settings
  // Called when user submits the agent edit form
  // Updates bot_client_user table fields: agent_name, mls_token, contact_email, contact_phone,
  // contact_phone_wsp, office_lat, office_long, office_address, office_wsp_phone, company
  const handleUpdateAgent = async (e) => {
    e.preventDefault();

    if (!selectedClientId) {
      setAgentEditError('No agent selected');
      return;
    }

    if (!agentEditForm.domain_to_install_bot?.trim()) {
      setAgentEditError('Domain where agent is installed is required');
      return;
    }

    setAgentEditLoading(true);
    setAgentEditError(null);
    setAgentEditSuccess(null);

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(
        `${apiBaseUrl}/api/clients/${selectedClientId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_CREATE_USER_TOKEN}`
          },
          body: JSON.stringify({
            agent_name: agentEditForm.agent_name.trim() || null,
            mls_token: agentEditForm.mls_token.trim() || null,
            contact_email: agentEditForm.contact_email.trim() || null,
            contact_phone: agentEditForm.contact_phone.trim() || null,
            contact_phone_wsp: agentEditForm.contact_phone_wsp,
            office_lat: agentEditForm.office_lat ? parseFloat(agentEditForm.office_lat) : null,
            office_long: agentEditForm.office_long ? parseFloat(agentEditForm.office_long) : null,
            office_address: agentEditForm.office_address.trim() || null,
            office_wsp_phone: agentEditForm.office_wsp_phone.trim() || null,
            company: agentEditForm.company.trim() || null,
            timezone: agentEditForm.timezone,
            domain_to_install_bot: agentEditForm.domain_to_install_bot.trim(),
            restrict_response: agentEditForm.restrict_response,
            restrict_response_start: agentEditForm.restrict_response_start || null,
            restrict_response_end: agentEditForm.restrict_response_end || null
          }),
          credentials: 'include'
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update agent');

      setAgentEditSuccess('Agent updated successfully!');
      setIsEditingAgent(false);

      // Refresh data to show updated values
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Update agent error:', error);
      setAgentEditError(error.message);
    } finally {
      setAgentEditLoading(false);
    }
  };

  const handleAgentEditChange = (e) => {
    const { name, type, checked, value } = e.target;
    setAgentEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      const apiBaseUrl = getApiUrl();
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
      const apiBaseUrl = getApiUrl();
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
      const apiBaseUrl = getApiUrl();
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
      const apiBaseUrl = getApiUrl();
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
      const apiBaseUrl = getApiUrl();
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

  // Parse time from database format (e.g., "09:00:00-07" or "14:30:00+00") to HTML time input format ("HH:MM")
  const parseTimeForInput = (timeStr) => {
    if (!timeStr) return '';
    // Extract just the HH:MM part from formats like "09:00:00", "09:00:00-07", "09:00:00+00:00"
    const match = timeStr.match(/^(\d{2}:\d{2})/);
    return match ? match[1] : '';
  };
  
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


  const getClientDisplayName = (client) => {
    return client.agent_name || client.company || `Agent ${client.item || client.clientid}`;
  };

  const getSubscriptionDisplayName = (sub) => {
    const levelName = sub.level?.charAt(0).toUpperCase() + sub.level?.slice(1);
    const typeLabel = sub.plan_type === 'specialty' ? ' (Specialty)' : '';
    return `${levelName}${typeLabel}`;
  };


  if (isLoading) {
    return <div className="dashboard-loading"><p>Loading...</p></div>;
  }

  if (!isLoggedIn || !user) return null;

  return (
    <div className="dashboard-container">
      {/* Cancel Modal */}
      {showCancelModal && selectedSubscription && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-danger">
              <h2 className="modal-title">Cancel {getSubscriptionDisplayName(selectedSubscription)}</h2>
            </div>
            <div className="modal-body">
              <p>This will cancel your <strong>{selectedSubscription.level}</strong> subscription
                 and all {agentsInSubscription.length} agent(s) under it.</p>

              <div className="alert alert-warning">
                <p>
                  <strong>Cancel at period end:</strong> Keep access until billing period ends.
                </p>
              </div>

              <div className="alert alert-danger">
                <p>
                  <strong>Cancel immediately:</strong> Access ends now. No refunds.
                </p>
              </div>

              {cancelError && <p className="error-text">❌ {cancelError}</p>}

              <div className="flex gap-sm flex-wrap">
                <button onClick={() => handleCancelSubscription(false)} disabled={cancelLoading}
                  className={`btn btn-flex ${cancelLoading ? '' : 'btn-warning'}`}>
                  {cancelLoading ? 'Processing...' : 'Cancel at Period End'}
                </button>
                <button onClick={() => handleCancelSubscription(true)} disabled={cancelLoading}
                  className={`btn btn-flex ${cancelLoading ? '' : 'btn-danger'}`}>
                  {cancelLoading ? 'Processing...' : 'Cancel Immediately'}
                </button>
              </div>
              <button onClick={() => setShowCancelModal(false)}
                className="btn btn-secondary btn-full mt-sm">
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Level Modal */}
      {showChangeLevelModal && selectedSubscription && (
        <div className="modal-overlay" onClick={() => setShowChangeLevelModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-primary">
              <h2 className="modal-title">{t('subscription.changeLevel')}</h2>
              <p className="modal-subtitle">
                {t('subscription.currentLevel')}: <strong>{selectedSubscription.level?.charAt(0).toUpperCase() + selectedSubscription.level?.slice(1)}</strong>
              </p>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <p>{t('subscription.changeLevelInfo')}</p>
              </div>

              <label className="form-label mb-md">
                {t('subscription.selectNewLevel')}:
              </label>
              <select
                value={selectedNewLevel}
                onChange={(e) => setSelectedNewLevel(e.target.value)}
                className="form-input mb-md"
              >
                <option value="">{t('subscription.selectLevel')}</option>
                <option value="basic" disabled={selectedSubscription.level === 'basic'}>Basic - $29/month</option>
                <option value="pro" disabled={selectedSubscription.level === 'pro'}>Pro - $79/month</option>
                <option value="enterprise" disabled={selectedSubscription.level === 'enterprise'}>Enterprise - $199/month</option>
              </select>

              {changeLevelError && <p className="error-text mb-md">❌ {changeLevelError}</p>}
              {changeLevelSuccess && <p className="success-text mb-md">✅ {changeLevelSuccess}</p>}

              <div className="flex gap-sm">
                <button onClick={() => setShowChangeLevelModal(false)}
                  className="btn btn-secondary btn-flex">
                  {t('common:buttons.cancel')}
                </button>
                <button onClick={handleChangeLevel} disabled={changeLevelLoading || !selectedNewLevel}
                  className={`btn btn-flex-2 ${(changeLevelLoading || !selectedNewLevel) ? '' : 'btn-primary'}`}>
                  {changeLevelLoading ? t('common:buttons.loading') : t('subscription.confirmChange')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Agent Modal */}
      {showNewAgentModal && (
        <div className="modal-overlay" onClick={() => setShowNewAgentModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-success">
              <h2 className="modal-title">Create New Agent</h2>
              <p className="modal-subtitle">
                Adding to: <strong>{selectedSubscription ? getSubscriptionDisplayName(selectedSubscription) : ''}</strong>
              </p>
            </div>
            <form onSubmit={handleCreateAgent} className="modal-body">
              <div className="alert alert-info">
                <p>
                  💡 Token usage will count toward this subscription's limit
                  ({selectedSubscription?.token_limit ? formatNumber(selectedSubscription.token_limit) : 'Unlimited'} tokens)
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Agent Name <span className="error-text">*</span>
                </label>
                <input type="text" value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Sales Bot" className="form-input" required />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Company <span className="text-muted" style={{ fontWeight: 'normal' }}>(optional)</span>
                </label>
                <input type="text" value={newAgentForm.company}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g., Acme Inc" className="form-input" />
              </div>

              {newAgentError && (
                <div className="alert alert-danger">❌ {newAgentError}</div>
              )}
              {newAgentSuccess && (
                <div className="alert alert-success">✅ {newAgentSuccess}</div>
              )}

              <div className="flex gap-md">
                <button type="button" onClick={() => setShowNewAgentModal(false)}
                  className="btn btn-secondary btn-flex">
                  Cancel
                </button>
                <button type="submit" disabled={newAgentLoading || !newAgentForm.name.trim()}
                  className={`btn btn-flex-2 ${newAgentLoading ? '' : 'btn-success'}`}>
                  {newAgentLoading ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Combined Subscription Selector, Details & Agent Selector */}
      <div className="card" style={{ marginBottom: '1.5em' }}>
        {/* Header with Dashboard Title, Welcome Message, and Logout */}
        <div className="subscription-header" style={{ borderBottom: '1px solid rgb(44, 62, 80)' }}>
          <div className="flex flex-between flex-align-center flex-wrap gap-md">
            <div>
              <h1 className="subscription-title">{t('title')}</h1>
              <p className="subscription-welcome">
                Welcome, {user.first_name || 'User'} {user.last_name || ''} ({user.email})
              </p>
            </div>
            <button onClick={handleLogout} className="btn btn-danger btn-sm btn-icon">
              <span>↩</span> {t('logout')}
            </button>
          </div>
        </div>

        {/* Subscription Selector */}
        <div className="subscription-header">
          <div className="flex flex-align-center gap-md flex-wrap">
            <h3 className="m-0 text-white">{t('subscription.title')}:</h3>

            {loadingData ? (
              <span className="text-white">Loading...</span>
            ) : subscriptions.length === 0 ? (
              <span className="error-text">{t('subscription.noSubscriptions')}</span>
            ) : (
              <select value={selectedSubscriptionId || ''} onChange={handleSubscriptionChange}
                className="form-select" style={{ width: 'auto', minWidth: '250px', maxWidth: '400px' }}>
                {subscriptions.map((sub) => (
                  <option key={sub.subscriptionid} value={sub.subscriptionid}>
                    {getSubscriptionDisplayName(sub)} - {sub.agent_count || 0} agent(s)
                  </option>
                ))}
              </select>
            )}

            <span className="text-white text-sm" style={{ marginLeft: 'auto' }}>
              {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Subscription Details */}
        {selectedSubscription && (
          <div className="subscription-details">
            {/* Plan details and agent selector container - full width */}
            <div className="box">
              <div className="flex flex-between flex-align-center flex-wrap gap-sm">
                {/* Subscription name, status, and plan details - inline on large screens */}
                <div className="flex flex-align-center gap-sm flex-wrap">
                  <h3 className="m-0 flex flex-align-center gap-sm">
                    {getSubscriptionDisplayName(selectedSubscription)}
                    <span className={`badge badge-${selectedSubscription.subscription_status === 'past_due' ? 'past-due' : selectedSubscription.subscription_status}`}>
                      {t(`subscription.statuses.${selectedSubscription.subscription_status}`)}
                    </span>
                  </h3>
                  <span className="divider-vertical">|</span>
                  <div className="flex gap-sm flex-wrap text-sm">
                    <span className="info-pill">
                      <strong>{t('subscription.planType')}:</strong> {selectedSubscription.plan_type === 'specialty' ? t('subscription.singleAgent') : t('subscription.multiAgent')}
                    </span>
                    <span className="info-pill">
                      <strong>{t('subscription.agents')}:</strong> {agentsInSubscription.length}
                    </span>
                    {selectedSubscription.trial_end && selectedSubscription.subscription_status === 'trialing' && (
                      <span className="info-pill">
                        <strong>{t('subscription.trialEnds')}:</strong> {new Date(selectedSubscription.trial_end).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subscription Action Buttons - top right */}
                {selectedSubscription.subscription_id && selectedSubscription.subscription_status !== 'cancelled' && (
                  <div className="flex gap-sm flex-wrap">
                    {!['easybroker', 'mls'].includes(selectedSubscription.level?.toLowerCase()) && (
                      <button onClick={() => { setSelectedNewLevel(''); setChangeLevelError(null); setShowChangeLevelModal(true); }}
                        className="btn btn-primary btn-sm btn-icon">
                        <span>↕</span> {t('subscription.changeLevel')}
                      </button>
                    )}
                    <button onClick={() => setShowCancelModal(true)}
                      className="btn btn-danger btn-sm btn-icon">
                      <span>✕</span> {t('subscription.cancelSubscription')}
                    </button>
                  </div>
                )}
              </div>

              {/* Agent Selector - inline */}
              <div className="flex flex-align-center gap-sm flex-wrap mt-sm">
                <label className="form-label text-sm" style={{ marginBottom: 0 }}>{t('agents.selectAgent')}:</label>
                {agentsInSubscription.length === 0 ? (
                  <span className="text-muted text-sm">{t('agents.noAgents')}</span>
                ) : (
                  <select value={selectedClientId || ''} onChange={handleClientChange}
                    className="form-select form-input-sm" style={{ width: 'auto', minWidth: '200px', maxWidth: '300px', backgroundColor: '#f1f3f5' }}>
                    {agentsInSubscription.map((client) => (
                      <option key={client.clientid} value={client.clientid}>
                        {getClientDisplayName(client)}
                      </option>
                    ))}
                  </select>
                )}
                {canCreateAgentInSubscription && !specialtySubAtLimit ? (
                  <button onClick={() => setShowNewAgentModal(true)}
                    className="btn btn-success btn-sm btn-icon">
                    <span>+</span> {t('agents.newAgent')}
                  </button>
                ) : specialtySubAtLimit ? (
                  <span className="alert alert-warning text-xs" style={{ padding: '0.35em 0.6em', marginBottom: 0 }}>
                    ⚠️ {t('agents.specialtyLimit')}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Agent Settings Form */}
            {selectedClient && (
              <div className="box mt-md">
                <div className="flex flex-between flex-align-center" style={{ marginBottom: isEditingAgent ? '1em' : 0 }}>
                  <h4 className="m-0 flex flex-align-center gap-sm">
                    <span>⚙</span> {t('agentSettings')}
                  </h4>
                  {!isEditingAgent && (
                    <button onClick={() => setIsEditingAgent(true)} className="btn btn-primary btn-sm btn-icon">
                      <span>✎</span> {t('common:buttons.edit')}
                    </button>
                  )}
                </div>

                {isEditingAgent ? (
                  <form onSubmit={handleUpdateAgent}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1em' }}>
                      {/* Agent Name */}
                      <div>
                        <label className="form-label">{t('form.agentName')}</label>
                        <input
                          type="text"
                          name="agent_name"
                          value={agentEditForm.agent_name}
                          onChange={handleAgentEditChange}
                          placeholder="My AI Agent"
                          className="form-input form-input-sm"
                        />
                      </div>

                      {/* Company */}
                      <div>
                        <label className="form-label">{t('form.company')}</label>
                        <input
                          type="text"
                          name="company"
                          value={agentEditForm.company}
                          onChange={handleAgentEditChange}
                          placeholder="Acme Inc"
                          className="form-input form-input-sm"
                        />
                      </div>

                      {/* Domain to Install Bot */}
                      <div>
                        <label className="form-label">
                          {t('form.domainToInstall')}<span className="error-text">*</span>
                        </label>
                        <input
                          type="text"
                          name="domain_to_install_bot"
                          value={agentEditForm.domain_to_install_bot}
                          onChange={handleAgentEditChange}
                          placeholder="myexampledomain.com"
                          required
                          className="form-input form-input-sm"
                        />
                      </div>

                      {/* Contact Email */}
                      <div>
                        <label className="form-label">{t('form.contactEmail')}</label>
                        <input
                          type="email"
                          name="contact_email"
                          value={agentEditForm.contact_email}
                          onChange={handleAgentEditChange}
                          placeholder="contact@example.com"
                          className="form-input form-input-sm"
                        />
                      </div>

                      {/* Phone Numbers Row */}
                      <div className="flex gap-md flex-wrap" style={{ gridColumn: '1 / -1', alignItems: 'flex-end' }}>
                        {/* Contact Phone */}
                        <div style={{ width: '160px' }}>
                          <label className="form-label">{t('form.contactPhone')}</label>
                          <input
                            type="tel"
                            name="contact_phone"
                            value={agentEditForm.contact_phone}
                            onChange={handleAgentEditChange}
                            placeholder="+1 234 567 8900"
                            className="form-input form-input-sm"
                          />
                        </div>

                        {/* Office WhatsApp Phone */}
                        <div style={{ width: '160px' }}>
                          <label className="form-label">{t('form.whatsappPhone')}</label>
                          <input
                            type="tel"
                            name="office_wsp_phone"
                            value={agentEditForm.office_wsp_phone}
                            onChange={handleAgentEditChange}
                            placeholder="+1 234 567 8900"
                            className="form-input form-input-sm"
                          />
                        </div>

                        {/* Contact Phone is WhatsApp - Checkbox */}
                        <div className="flex flex-align-center gap-sm" style={{ paddingBottom: '0.5em' }}>
                          <input
                            type="checkbox"
                            id="contact_phone_wsp"
                            name="contact_phone_wsp"
                            checked={agentEditForm.contact_phone_wsp}
                            onChange={handleAgentEditChange}
                            className="form-checkbox"
                          />
                          <label htmlFor="contact_phone_wsp" className="form-label text-nowrap" style={{ marginBottom: 0, cursor: 'pointer' }}>
                            {t('common:labels.whatsappEnabled')}
                          </label>
                        </div>

                        {/* MLS Token - Only show for MLS level */}
                        {(selectedClient?.level === 'mls' || selectedClient?.subscription_level === 'mls') && (
                          <div style={{ width: '220px' }}>
                            <label className="form-label">{t('form.mlsToken')}</label>
                            <input
                              type="password"
                              name="mls_token"
                              value={agentEditForm.mls_token}
                              onChange={handleAgentEditChange}
                              placeholder="Enter MLS Token"
                              autoComplete="off"
                              className="form-input form-input-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* Office Address - Full Width */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">{t('form.officeAddress')}</label>
                        <input
                          type="text"
                          name="office_address"
                          value={agentEditForm.office_address}
                          onChange={handleAgentEditChange}
                          placeholder="123 Main St, City, State 12345"
                          className="form-input form-input-sm"
                        />
                      </div>

                      {/* Office Latitude */}
                      <div>
                        <label className="form-label">{t('form.latitude')}</label>
                        <input
                          type="number"
                          step="any"
                          name="office_lat"
                          value={agentEditForm.office_lat}
                          onChange={handleAgentEditChange}
                          placeholder="40.7128"
                          className="form-input form-input-sm"
                        />
                      </div>

                      {/* Office Longitude */}
                      <div>
                        <label className="form-label">{t('form.longitude')}</label>
                        <input
                          type="number"
                          step="any"
                          name="office_long"
                          value={agentEditForm.office_long}
                          onChange={handleAgentEditChange}
                          placeholder="-74.0060"
                          className="form-input form-input-sm"
                        />
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="form-label">{t('form.timezone')}</label>
                        <select
                          name="timezone"
                          value={agentEditForm.timezone}
                          onChange={handleAgentEditChange}
                          className="form-select form-input-sm"
                        >
                          <option value="America/New_York">Eastern Time (America/New_York)</option>
                          <option value="America/Chicago">Central Time (America/Chicago)</option>
                          <option value="America/Denver">Mountain Time (America/Denver)</option>
                          <option value="America/Phoenix">Arizona (America/Phoenix)</option>
                          <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                          <option value="America/Anchorage">Alaska (America/Anchorage)</option>
                          <option value="America/Honolulu">Hawaii (America/Honolulu)</option>
                          <option value="America/Mexico_City">Mexico Central (America/Mexico_City)</option>
                          <option value="America/Mazatlan">Mexico Mountain (America/Mazatlan)</option>
                          <option value="America/Tijuana">Mexico Pacific (America/Tijuana)</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                    </div>

                    {/* Response Restriction */}
                    <div className="restrict-response-section">
                      <div className="flex flex-align-center gap-md flex-wrap">
                        <div className="flex flex-align-center gap-sm">
                          <input
                            type="checkbox"
                            id="restrict_response"
                            name="restrict_response"
                            checked={agentEditForm.restrict_response}
                            onChange={(e) => setAgentEditForm(prev => ({ ...prev, restrict_response: e.target.checked }))}
                            className="form-checkbox"
                          />
                          <label htmlFor="restrict_response" className="form-label text-nowrap" style={{ marginBottom: 0, cursor: 'pointer' }}>
                            {t('form.restrictResponse')}
                          </label>
                        </div>

                        {agentEditForm.restrict_response && (
                          <>
                            <div className="flex flex-align-center gap-sm">
                              <label className="form-label-inline">{t('form.restrictResponseStart')}:</label>
                              <input
                                type="time"
                                name="restrict_response_start"
                                value={agentEditForm.restrict_response_start}
                                onChange={handleAgentEditChange}
                                className="form-time"
                              />
                            </div>
                            <div className="flex flex-align-center gap-sm">
                              <label className="form-label-inline">{t('form.restrictResponseEnd')}:</label>
                              <input
                                type="time"
                                name="restrict_response_end"
                                value={agentEditForm.restrict_response_end}
                                onChange={handleAgentEditChange}
                                className="form-time"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Error/Success Messages */}
                    {agentEditError && (
                      <div className="message-box message-error mt-md">❌ {agentEditError}</div>
                    )}
                    {agentEditSuccess && (
                      <div className="message-box message-success mt-md">✅ {agentEditSuccess}</div>
                    )}

                    {/* Form Buttons */}
                    <div className="flex gap-sm mt-md">
                      <button
                        type="submit"
                        disabled={agentEditLoading}
                        className={`btn btn-sm ${agentEditLoading ? '' : 'btn-success'}`}
                      >
                        {agentEditLoading ? t('common:buttons.saving') : t('form.saveChanges')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingAgent(false);
                          setAgentEditError(null);
                          // Reset form to original values
                          if (selectedClient) {
                            setAgentEditForm({
                              agent_name: selectedClient.agent_name || '',
                              mls_token: selectedClient.mls_token ? '••••••••' : '',
                              contact_email: selectedClient.contact_email || '',
                              contact_phone: selectedClient.contact_phone || '',
                              contact_phone_wsp: selectedClient.contact_phone_wsp || false,
                              office_lat: selectedClient.office_lat || '',
                              office_long: selectedClient.office_long || '',
                              office_address: selectedClient.office_address || '',
                              office_wsp_phone: selectedClient.office_wsp_phone || '',
                              company: selectedClient.company || '',
                              timezone: selectedClient.timezone || 'America/Mazatlan',
                              domain_to_install_bot: selectedClient.domain_to_install_bot || '',
                              restrict_response: selectedClient.restrict_response || false,
                              restrict_response_start: parseTimeForInput(selectedClient.restrict_response_start),
                              restrict_response_end: parseTimeForInput(selectedClient.restrict_response_end)
                            });
                          }
                        }}
                        disabled={agentEditLoading}
                        className="btn btn-secondary btn-sm"
                      >
                        {t('common:buttons.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Read-only view - compact single line */
                  <div className="flex flex-wrap gap-sm text-sm mt-sm">
                    {agentEditForm.agent_name && (
                      <span><strong className="text-muted">Agent:</strong> {agentEditForm.agent_name}</span>
                    )}
                    {agentEditForm.company && (
                      <span><strong className="text-muted">Company:</strong> {agentEditForm.company}</span>
                    )}
                    {agentEditForm.domain_to_install_bot && (
                      <span><strong className="text-muted">Install Domain:</strong> {agentEditForm.domain_to_install_bot}</span>
                    )}
                    {agentEditForm.contact_email && (
                      <span><strong className="text-muted">Email:</strong> {agentEditForm.contact_email}</span>
                    )}
                    {agentEditForm.contact_phone && (
                      <span><strong className="text-muted">Office Phone:</strong> {agentEditForm.contact_phone}{agentEditForm.contact_phone_wsp && <span style={{ color: '#25D366' }}> (WhatsApp Enabled)</span>}</span>
                    )}
                    {agentEditForm.office_wsp_phone && agentEditForm.office_wsp_phone !== agentEditForm.contact_phone && (
                      <span><strong className="text-muted">WhatsApp:</strong> {agentEditForm.office_wsp_phone}</span>
                    )}
                    {agentEditForm.mls_token && (selectedClient?.level === 'mls' || selectedClient?.subscription_level === 'mls') && (
                      <span><strong className="text-muted">MLS:</strong> ••••••••</span>
                    )}
                    {(agentEditForm.office_address || agentEditForm.timezone) && (
                      <div className="flex gap-lg flex-wrap mt-sm" style={{ flexBasis: '100%' }}>
                        {agentEditForm.office_address && (
                          <span><strong className="text-muted">Address:</strong> {agentEditForm.office_address}</span>
                        )}
                        {agentEditForm.timezone && (
                          <span><strong className="text-muted">Timezone:</strong> {agentEditForm.timezone}</span>
                        )}
                      </div>
                    )}
                    {!agentEditForm.agent_name && !agentEditForm.company && !agentEditForm.contact_email && !agentEditForm.contact_phone && !agentEditForm.office_address && (
                      <span className="text-muted" style={{ fontStyle: 'italic' }}>No agent settings configured. Click Edit to add details.</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {cancelSuccess && (
              <div className="alert alert-success mt-md">✅ {cancelSuccess}</div>
            )}
          </div>
        )}

      </div>

      {/* Agent Details + Tabs Container */}
      {selectedClient && (
        <div className="card">
          {/* Selected Agent Details */}
          <div className="subscription-header flex flex-wrap flex-center gap-md" style={{ gap: '1em 2em' }}>
            <span className="text-white"><strong>Agent:</strong> {getClientDisplayName(selectedClient)}</span>
            <span className="text-white"><strong>Agent ID:</strong> {selectedClient.clientid}</span>
            <span className="text-white"><strong>Level:</strong> <span className="capitalize" style={{
              backgroundColor: getLevelColor(selectedClient.subscription_level || selectedClient.level),
              color: 'white', padding: '0.15em 0.5em', borderRadius: '3px', fontSize: '0.9em'
            }}>{selectedClient.subscription_level || selectedClient.level || 'basic'}</span></span>
            {selectedClient.company && <span className="text-white"><strong>Company:</strong> {selectedClient.company}</span>}
          </div>

          {/* Tabs - Navigation for different dashboard sections */}
          {/* Training tab: RAG embeddings, Add-Ons tab: selectable decorators/integrations */}
          <div className="flex flex-center flex-wrap" style={{ borderBottom: '2px solid #ddd', backgroundColor: '#e9ecef' }}>
            <button className={`dashboard-tab ${activeTab === 'configurations' ? 'dashboard-tab-active' : ''}`} onClick={() => setActiveTab('configurations')}>⚙ {t('common:navigation.configurations')}</button>
            <button className={`dashboard-tab ${activeTab === 'addons' ? 'dashboard-tab-active' : ''}`} onClick={() => setActiveTab('addons')}>⊕ {t('common:navigation.addons')}</button>
            <button className={`dashboard-tab ${activeTab === 'styling' ? 'dashboard-tab-active' : ''}`} onClick={() => setActiveTab('styling')}>◉ {t('common:navigation.styling')}</button>
            <button className={`dashboard-tab ${activeTab === 'integrations' ? 'dashboard-tab-active' : ''}`} onClick={() => setActiveTab('integrations')}>⇄ {t('common:navigation.integrations')}</button>
            <button className={`dashboard-tab ${activeTab === 'conversations' ? 'dashboard-tab-active' : ''}`} onClick={() => setActiveTab('conversations')}>◐ {t('common:navigation.conversations')}</button>
            <button className={`dashboard-tab ${activeTab === 'leads' ? 'dashboard-tab-active' : ''}`} onClick={() => setActiveTab('leads')}>⊛ {t('common:navigation.leads')}</button>
            <button className={`dashboard-tab ${activeTab === 'metrics' ? 'dashboard-tab-active' : ''}`} onClick={() => setActiveTab('metrics')}>▦ {t('common:navigation.metrics')}</button>
          </div>

          {/* Tab Content */}
          {loadingData ? (
            <div className="dashboard-loading"><p>Loading...</p></div>
          ) : (
            <>
          {activeTab === 'configurations' && <ConfigurationsTab user={selectedClient} clientId={selectedClientId} />}
          {/* Add-Ons Tab - Selectable decorators/integrations from server's decorator registry */}
          {activeTab === 'addons' && <AddOnsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'integrations' && <IntegrationsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'conversations' && <ConversationsTab user={selectedClient} clientId={selectedClientId} />}
          {activeTab === 'metrics' && <MetricsTab user={selectedClient} clientId={selectedClientId} subscription={selectedSubscription} tokensUsed={subscriptionTokensUsed} />}
          {activeTab === 'leads' && <LeadsTab clientId={selectedClientId} />}
          {activeTab === 'styling' && <StylingTab user={selectedClient} clientId={selectedClientId} onNavigateToIntegrations={() => setActiveTab('integrations')} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}