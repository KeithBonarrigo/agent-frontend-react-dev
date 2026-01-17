import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// AddOnsTab - Displays selectable decorators (integrations) that users can enable for their agent
// Fetches available add-ons from the server's decorator registry (only those with selectable: true)
// Allows users to toggle add-ons on/off for their specific agent
// Also provides CSV file upload and embedding functionality for RAG training
// Interacts with: /api/decorators/selectable, /api/clients/:clientId/decorators endpoints
export default function AddOnsTab({ user, clientId }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Selectable Decorators (Add-Ons) state
  // Fetches available add-ons from the server's decorator registry
  // Only decorators with selectable: true are returned
  const [availableAddOns, setAvailableAddOns] = useState([]);
  const [addOnsLoading, setAddOnsLoading] = useState(true);
  const [addOnsError, setAddOnsError] = useState(null);

  // Client's enabled add-ons - tracks which decorators are active for this agent
  const [enabledAddOns, setEnabledAddOns] = useState([]);
  const [savingAddOn, setSavingAddOn] = useState(null); // Tracks which add-on is being saved

  // OAuth connection status for add-ons that use OAuth (e.g., Google Calendar)
  const [oauthStatus, setOauthStatus] = useState({}); // { 'google-calendar': { connected: true, email: '...' } }
  const [oauthStatusLoading, setOauthStatusLoading] = useState({});

  // Credentials modal state - for add-ons that require credentials (e.g., Google service accounts)
  const [credentialsModal, setCredentialsModal] = useState({
    isOpen: false,
    addOnKey: null,
    addOnName: null,
    credsInstructions: null,
    credsWhereFind: null
  });
  const [credentialsInput, setCredentialsInput] = useState(''); // JSON string for credentials (server add-ons)
  const [credentialsError, setCredentialsError] = useState(null);
  const [showWhereFind, setShowWhereFind] = useState(false); // Toggle for collapsible help section

  // OAuth success/error message from redirect
  const [oauthMessage, setOauthMessage] = useState(null);

  // Fetch available selectable decorators from the server
  // Calls GET /api/decorators/selectable to get list of user-configurable add-ons
  useEffect(() => {
    const fetchAvailableAddOns = async () => {
      setAddOnsLoading(true);
      setAddOnsError(null);

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiBaseUrl}/api/decorators/selectable`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch add-ons (${response.status})`);
        }

        const data = await response.json();
        setAvailableAddOns(data.decorators || []);
      } catch (error) {
        console.error('Error fetching available add-ons:', error);
        setAddOnsError(error.message);
      } finally {
        setAddOnsLoading(false);
      }
    };

    fetchAvailableAddOns();
  }, []);

  // Fetch which add-ons are enabled for this specific client/agent
  // Calls GET /api/clients/:clientId/decorators to get active decorators
  useEffect(() => {
    const fetchEnabledAddOns = async () => {
      if (!clientId) return;

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiBaseUrl}/api/clients/${clientId}/decorators`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch enabled add-ons (${response.status})`);
        }

        const data = await response.json();
        // Extract decorator keys that are enabled for this client
        setEnabledAddOns(data.decorators || []);
      } catch (error) {
        console.error('Error fetching enabled add-ons:', error);
        // Don't show error for this - just means no add-ons enabled yet
      }
    };

    fetchEnabledAddOns();
  }, [clientId]);

  // Check for OAuth redirect messages in URL params
  useEffect(() => {
    const oauthResult = searchParams.get('oauth');
    const provider = searchParams.get('provider');
    const message = searchParams.get('message');

    if (oauthResult) {
      if (oauthResult === 'success') {
        setOauthMessage({ type: 'success', text: `Successfully connected ${provider || 'integration'}!` });
        // Refresh OAuth status for all add-ons
        availableAddOns.forEach(addOn => {
          if (addOn.authType === 'oauth') {
            fetchOAuthStatus(addOn.key);
          }
        });
      } else if (oauthResult === 'error') {
        setOauthMessage({ type: 'error', text: message || 'Failed to connect integration' });
      }
      // Clear URL params after processing
      setSearchParams({});
      // Auto-hide message after 5 seconds
      setTimeout(() => setOauthMessage(null), 5000);
    }
  }, [searchParams, setSearchParams, availableAddOns]);

  // Fetch OAuth status for add-ons that use OAuth when available add-ons are loaded
  useEffect(() => {
    if (!clientId || availableAddOns.length === 0) return;

    availableAddOns.forEach(addOn => {
      if (addOn.authType === 'oauth') {
        fetchOAuthStatus(addOn.key);
      }
    });
  }, [clientId, availableAddOns]);

  // fetchOAuthStatus - Checks if an OAuth-based add-on is connected
  const fetchOAuthStatus = async (addOnKey) => {
    if (!clientId) return;

    setOauthStatusLoading(prev => ({ ...prev, [addOnKey]: true }));
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/integrations/${addOnKey}/status/${clientId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        // Not connected or endpoint doesn't exist
        setOauthStatus(prev => ({ ...prev, [addOnKey]: { connected: false } }));
        return;
      }

      const data = await response.json();
      setOauthStatus(prev => ({ ...prev, [addOnKey]: data }));
    } catch (error) {
      console.error(`Error fetching OAuth status for ${addOnKey}:`, error);
      setOauthStatus(prev => ({ ...prev, [addOnKey]: { connected: false } }));
    } finally {
      setOauthStatusLoading(prev => ({ ...prev, [addOnKey]: false }));
    }
  };

  // initiateOAuthFlow - Redirects user to OAuth provider for authorization
  const initiateOAuthFlow = async (addOnKey) => {
    if (!clientId) return;

    setSavingAddOn(addOnKey);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const oauthUrlEndpoint = `${apiBaseUrl}/api/integrations/${addOnKey}/oauth-url?clientId=${clientId}`;
      console.log('🔐 OAuth: Requesting OAuth URL from:', oauthUrlEndpoint);

      const response = await fetch(oauthUrlEndpoint, {
        method: 'GET',
        credentials: 'include'
      });

      console.log('🔐 OAuth: Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('🔐 OAuth: Error response:', data);
        throw new Error(data.error || 'Failed to get OAuth URL');
      }

      const data = await response.json();
      console.log('🔐 OAuth: Received data:', data);

      if (!data.url) {
        console.error('🔐 OAuth: No URL in response!');
        throw new Error('Server did not return an OAuth URL');
      }

      // Redirect to OAuth provider
      console.log('🔐 OAuth: Redirecting to:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('🔐 OAuth: Error initiating OAuth flow:', error);
      setOauthMessage({ type: 'error', text: error.message });
      setTimeout(() => setOauthMessage(null), 5000);
    } finally {
      setSavingAddOn(null);
    }
  };

  // disconnectOAuth - Disconnects an OAuth-based add-on
  const disconnectOAuth = async (addOnKey) => {
    if (!clientId) return;
    if (!confirm('Are you sure you want to disconnect this integration?')) return;

    setSavingAddOn(addOnKey);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      // Use the standard decorator disable endpoint
      const response = await fetch(`${apiBaseUrl}/api/clients/${clientId}/decorators/${addOnKey}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect integration');
      }

      // Update local state
      setOauthStatus(prev => ({ ...prev, [addOnKey]: { connected: false } }));
      setEnabledAddOns(prev => prev.filter(key => key !== addOnKey));
      setOauthMessage({ type: 'success', text: 'Integration disconnected successfully' });
      setTimeout(() => setOauthMessage(null), 3000);
    } catch (error) {
      console.error('Error disconnecting OAuth:', error);
      setOauthMessage({ type: 'error', text: error.message });
      setTimeout(() => setOauthMessage(null), 5000);
    } finally {
      setSavingAddOn(null);
    }
  };

  // Toggle an add-on on/off for this client
  // If enabling an add-on that requires credentials, opens the credentials modal first
  // If enabling an add-on that uses OAuth, initiates OAuth flow
  // Calls POST /api/clients/:clientId/decorators/:decoratorKey to enable (with optional creds)
  // Calls DELETE /api/clients/:clientId/decorators/:decoratorKey to disable
  const handleToggleAddOn = async (addOn, isCurrentlyEnabled) => {
    const decoratorKey = addOn.key;

    // If this is an OAuth-based add-on, handle differently
    if (addOn.authType === 'oauth') {
      const status = oauthStatus[decoratorKey];
      if (status?.connected) {
        // Already connected - disconnect
        await disconnectOAuth(decoratorKey);
      } else {
        // Not connected - initiate OAuth flow
        await initiateOAuthFlow(decoratorKey);
      }
      return;
    }

    // If enabling and requires credentials, open the credentials modal instead
    if (!isCurrentlyEnabled && addOn.requiresCredentials) {
      setCredentialsModal({
        isOpen: true,
        addOnKey: decoratorKey,
        addOnName: addOn.displayName,
        credsInstructions: addOn.credsInstructions || null,
        credsWhereFind: addOn.credsWhereFind || null
      });
      setCredentialsInput('');
      setCredentialsError(null);
      setShowWhereFind(false); // Reset collapsible state when opening modal
      return;
    }

    // Otherwise proceed with toggle (disable or enable without credentials)
    await performToggle(decoratorKey, isCurrentlyEnabled, null);
  };

  // Performs the actual API call to enable/disable an add-on
  // Called directly for disabling, or from handleCredentialsSubmit for enabling with creds
  const performToggle = async (decoratorKey, isCurrentlyEnabled, creds = null) => {
    setSavingAddOn(decoratorKey);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const method = isCurrentlyEnabled ? 'DELETE' : 'POST';

      // Build request body for POST requests
      // Always include body for POST, even if creds is null (server expects JSON)
      const requestBody = method === 'POST' ? JSON.stringify({ creds: creds || null }) : undefined;

      console.log('🔄 Add-on toggle request:', {
        method,
        decoratorKey,
        clientId,
        hasCreds: !!creds,
        bodyPreview: creds ? '(credentials provided)' : '(no credentials)'
      });

      const response = await fetch(
        `${apiBaseUrl}/api/clients/${clientId}/decorators/${decoratorKey}`,
        {
          method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${isCurrentlyEnabled ? 'disable' : 'enable'} add-on`);
      }

      // Update local state to reflect the change
      if (isCurrentlyEnabled) {
        setEnabledAddOns(prev => prev.filter(key => key !== decoratorKey));
      } else {
        setEnabledAddOns(prev => [...prev, decoratorKey]);
      }

      return true;
    } catch (error) {
      console.error('Error toggling add-on:', error);
      throw error;
    } finally {
      setSavingAddOn(null);
    }
  };

  // Handles credentials form submission from the modal
  // Parses the JSON input and calls performToggle with the credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setCredentialsError(null);

    // Parse and validate JSON credentials
    let parsedCreds;
    try {
      parsedCreds = JSON.parse(credentialsInput);
    } catch {
      setCredentialsError('Invalid JSON format. Please paste valid JSON credentials.');
      return;
    }

    try {
      await performToggle(credentialsModal.addOnKey, false, parsedCreds);
      // Close modal on success
      setCredentialsModal({ isOpen: false, addOnKey: null, addOnName: null });
      setCredentialsInput('');
    } catch (error) {
      setCredentialsError(error.message);
    }
  };

  // Closes the credentials modal without saving
  const handleCloseCredentialsModal = () => {
    setCredentialsModal({ isOpen: false, addOnKey: null, addOnName: null, credsInstructions: null, credsWhereFind: null });
    setCredentialsInput('');
    setCredentialsError(null);
    setShowWhereFind(false);
  };

  if (!clientId) {
    return (
      <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
        <p>Please select an agent to configure add-ons.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      <h2 style={{ marginTop: 0, color: "#333", textAlign: "center" }}>Add-Ons</h2>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "1.5em" }}>
        Enhance your AI agent with additional features and integrations. Some add-ons may require additional configuration.
      </p>

      {/* OAuth Success/Error Message */}
      {oauthMessage && (
        <div style={{
          padding: "1em",
          marginBottom: "1.5em",
          borderRadius: "8px",
          maxWidth: "600px",
          margin: "0 auto 1.5em auto",
          backgroundColor: oauthMessage.type === 'success' ? "#d4edda" : "#f8d7da",
          border: `1px solid ${oauthMessage.type === 'success' ? "#c3e6cb" : "#f5c6cb"}`,
          color: oauthMessage.type === 'success' ? "#155724" : "#721c24",
          textAlign: "center"
        }}>
          <i className={`fa-solid ${oauthMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} style={{ marginRight: "0.5em" }}></i>
          {oauthMessage.text}
        </div>
      )}

      {/* Loading State */}
      {addOnsLoading && (
        <div style={{ textAlign: "center", padding: "2em", color: "#666" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.5em" }}></i>
          Loading available add-ons...
        </div>
      )}

      {/* Error State */}
      {addOnsError && !addOnsLoading && (
        <div style={{
          textAlign: "center",
          padding: "1.5em",
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "8px",
          color: "#721c24",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: "0.5em" }}></i>
          {addOnsError}
        </div>
      )}

      {/* Empty State */}
      {!addOnsLoading && !addOnsError && availableAddOns.length === 0 && (
        <div style={{ textAlign: "center", padding: "2em", color: "#999" }}>
          No add-ons available at this time.
        </div>
      )}

      {/* Add-Ons Grid - Server-side decorators and Frontend integrations */}
      {!addOnsLoading && !addOnsError && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
          maxWidth: "900px",
          margin: "0 auto"
        }}>
          {/* Server-side Add-Ons */}
          {availableAddOns.map((addOn) => {
            const isEnabled = enabledAddOns.includes(addOn.key);
            const isSaving = savingAddOn === addOn.key;
            const isOAuth = addOn.authType === 'oauth';
            const oauthConnected = isOAuth && oauthStatus[addOn.key]?.connected;
            const oauthEmail = isOAuth && oauthStatus[addOn.key]?.email;
            const isOAuthLoading = isOAuth && oauthStatusLoading[addOn.key];

            // For OAuth add-ons, "enabled" means connected
            const effectiveEnabled = isOAuth ? oauthConnected : isEnabled;

            return (
              <div
                key={addOn.key}
                style={{
                  backgroundColor: "#fff",
                  border: `2px solid ${effectiveEnabled ? "#28a745" : "#dee2e6"}`,
                  borderRadius: "8px",
                  padding: "1.25em",
                  transition: "all 0.2s ease",
                  boxShadow: effectiveEnabled ? "0 2px 8px rgba(40, 167, 69, 0.15)" : "0 2px 4px rgba(0,0,0,0.05)"
                }}
              >
                {/* Add-On Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75em" }}>
                  <h4 style={{ margin: 0, color: "#333", fontSize: "1.1em", display: "flex", alignItems: "center", gap: "0.5em" }}>
                    {addOn.logo && (
                      <img
                        src={`/img/add-ons/${addOn.logo}`}
                        alt={`${addOn.displayName} logo`}
                        style={{ width: "44px", height: "44px", objectFit: "contain" }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {addOn.displayName}
                  </h4>

                  {/* OAuth Connect/Disconnect Button */}
                  {isOAuth ? (
                    <button
                      onClick={() => handleToggleAddOn(addOn, oauthConnected)}
                      disabled={isSaving || isOAuthLoading}
                      style={{
                        padding: "0.5em 1em",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: (isSaving || isOAuthLoading) ? "#ccc" : (oauthConnected ? "#dc3545" : "#007bff"),
                        color: "#fff",
                        cursor: (isSaving || isOAuthLoading) ? "not-allowed" : "pointer",
                        fontSize: "0.85em",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4em",
                        flexShrink: 0
                      }}
                    >
                      {(isSaving || isOAuthLoading) ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : oauthConnected ? (
                        <>
                          <i className="fa-solid fa-unlink"></i>
                          Disconnect
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-link"></i>
                          Connect
                        </>
                      )}
                    </button>
                  ) : (
                    /* Toggle Switch for non-OAuth add-ons */
                    <button
                      onClick={() => handleToggleAddOn(addOn, isEnabled)}
                      disabled={isSaving}
                      style={{
                        width: "60px",
                        height: "30px",
                        borderRadius: "15px",
                        border: "none",
                        backgroundColor: isSaving ? "#ccc" : (isEnabled ? "#28a745" : "#dee2e6"),
                        cursor: isSaving ? "not-allowed" : "pointer",
                        position: "relative",
                        transition: "background-color 0.2s ease",
                        flexShrink: 0
                      }}
                      title={isEnabled ? "Click to disable" : "Click to enable"}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "3px",
                          left: isEnabled ? "33px" : "3px",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#fff",
                          transition: "left 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {isSaving && (
                          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "0.7em", color: "#666" }}></i>
                        )}
                      </span>
                    </button>
                  )}
                </div>

                {/* Content beneath header - slightly indented */}
                <div style={{ paddingLeft: "1em" }}>
                  {/* OAuth Badge */}
                  {isOAuth && (
                    <span style={{
                      fontSize: "0.75em",
                      backgroundColor: "#e7f3ff",
                      color: "#0066cc",
                      padding: "0.2em 0.5em",
                      borderRadius: "4px",
                      display: "inline-block",
                      marginBottom: "0.5em",
                      marginRight: "0.5em"
                    }}>
                      <i className="fa-brands fa-google" style={{ marginRight: "0.3em" }}></i>
                      Sign in with Google
                    </span>
                  )}

                  {/* Requires Setup Badge (for non-OAuth) */}
                  {!isOAuth && addOn.requiresCredentials && (
                    <span style={{
                      fontSize: "0.75em",
                      backgroundColor: "#fff3cd",
                      color: "#856404",
                      padding: "0.2em 0.5em",
                      borderRadius: "4px",
                      display: "inline-block",
                      marginBottom: "0.5em"
                    }}>
                      <i className="fa-solid fa-key" style={{ marginRight: "0.3em" }}></i>
                      Requires Setup
                    </span>
                  )}

                  {/* Add-On Description */}
                  <p style={{
                    margin: 0,
                    fontSize: "0.9em",
                    color: "#666",
                    lineHeight: "1.5"
                  }}>
                    {addOn.description}
                  </p>

                  {/* Status Indicator */}
                  <div style={{
                    marginTop: "0.75em",
                    paddingTop: "0.75em",
                    borderTop: "1px solid #eee",
                    fontSize: "0.85em"
                  }}>
                    {isOAuth ? (
                      // OAuth status
                      isOAuthLoading ? (
                        <span style={{ color: "#666" }}>
                          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.4em" }}></i>
                          Checking connection...
                        </span>
                      ) : oauthConnected ? (
                        <div>
                          <span style={{ color: "#28a745", fontWeight: "600" }}>
                            <i className="fa-solid fa-check-circle" style={{ marginRight: "0.4em" }}></i>
                            Connected
                          </span>
                          {oauthEmail && (
                            <span style={{ color: "#666", marginLeft: "0.5em", fontSize: "0.9em" }}>
                              ({oauthEmail})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#999" }}>
                          <i className="fa-solid fa-circle" style={{ marginRight: "0.4em" }}></i>
                          Not connected
                        </span>
                      )
                    ) : (
                      // Non-OAuth status
                      <span style={{
                        color: isEnabled ? "#28a745" : "#999",
                        fontWeight: isEnabled ? "600" : "400"
                      }}>
                        <i className={`fa-solid ${isEnabled ? "fa-check-circle" : "fa-circle"}`} style={{ marginRight: "0.4em" }}></i>
                        {isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coming Soon Section */}
      <div style={{
        marginTop: "2em",
        padding: "1.5em",
        backgroundColor: "#fff3cd",
        border: "1px solid #ffc107",
        borderRadius: "8px",
        textAlign: "center"
      }}>
        <p style={{ margin: 0, color: "#856404" }}>
          <strong>More Add-Ons Coming Soon:</strong> Additional integrations and features are in development.
        </p>
      </div>

      {/* Credentials Modal - Displayed when enabling add-ons that require credentials */}
      {credentialsModal.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "2em",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ margin: "0 0 0.5em 0", color: "#333" }}>
              <i className="fa-solid fa-key" style={{ marginRight: "0.5em", color: "#856404" }}></i>
              Configure {credentialsModal.addOnName}
            </h3>
            <p style={{ color: "#666", marginBottom: "1.5em", fontSize: "0.9em" }}>
              {credentialsModal.credsInstructions || 'This add-on requires credentials to function. Paste your JSON credentials below (e.g., Google service account JSON).'}
            </p>

            <form onSubmit={handleCredentialsSubmit}>
              <textarea
                value={credentialsInput}
                onChange={(e) => setCredentialsInput(e.target.value)}
                placeholder={'{"type": "service_account", "project_id": "...", ...}'}
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "1em",
                  fontFamily: "monospace",
                  fontSize: "0.85em",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  resize: "vertical",
                  boxSizing: "border-box"
                }}
              />

              {/* Collapsible "Where do I find this?" Section */}
              {credentialsModal.credsWhereFind && (
                <div style={{ marginTop: "1em" }}>
                  <button
                    type="button"
                    onClick={() => setShowWhereFind(!showWhereFind)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "#007bff",
                      fontSize: "0.9em",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4em"
                    }}
                  >
                    <i className={`fa-solid fa-chevron-${showWhereFind ? 'down' : 'right'}`} style={{ fontSize: "0.8em" }}></i>
                    Where do I find this?
                  </button>
                  {showWhereFind && (
                    <div style={{
                      marginTop: "0.75em",
                      padding: "1em",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      borderRadius: "4px",
                      fontSize: "0.85em",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                      color: "#495057"
                    }}>
                      {credentialsModal.credsWhereFind}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {credentialsError && (
                <div style={{
                  marginTop: "1em",
                  padding: "0.75em",
                  backgroundColor: "#f8d7da",
                  border: "1px solid #f5c6cb",
                  borderRadius: "4px",
                  color: "#721c24",
                  fontSize: "0.9em"
                }}>
                  <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: "0.5em" }}></i>
                  {credentialsError}
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: "flex", gap: "1em", marginTop: "1.5em", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleCloseCredentialsModal}
                  style={{
                    padding: "0.75em 1.5em",
                    backgroundColor: "#6c757d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9em"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddOn === credentialsModal.addOnKey}
                  style={{
                    padding: "0.75em 1.5em",
                    backgroundColor: savingAddOn === credentialsModal.addOnKey ? "#ccc" : "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: savingAddOn === credentialsModal.addOnKey ? "not-allowed" : "pointer",
                    fontSize: "0.9em"
                  }}
                >
                  {savingAddOn === credentialsModal.addOnKey ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.5em" }}></i>
                      Saving...
                    </>
                  ) : (
                    "Enable Add-On"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
