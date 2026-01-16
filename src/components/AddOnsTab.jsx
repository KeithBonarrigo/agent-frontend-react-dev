import { useState, useEffect } from "react";

// AddOnsTab - Displays selectable decorators (integrations) that users can enable for their agent
// Fetches available add-ons from the server's decorator registry (only those with selectable: true)
// Allows users to toggle add-ons on/off for their specific agent
// Also provides CSV file upload and embedding functionality for RAG training
// Interacts with: /api/decorators/selectable, /api/clients/:clientId/decorators endpoints
export default function AddOnsTab({ user, clientId }) {
  // Selectable Decorators (Add-Ons) state
  // Fetches available add-ons from the server's decorator registry
  // Only decorators with selectable: true are returned
  const [availableAddOns, setAvailableAddOns] = useState([]);
  const [addOnsLoading, setAddOnsLoading] = useState(true);
  const [addOnsError, setAddOnsError] = useState(null);

  // Client's enabled add-ons - tracks which decorators are active for this agent
  const [enabledAddOns, setEnabledAddOns] = useState([]);
  const [savingAddOn, setSavingAddOn] = useState(null); // Tracks which add-on is being saved

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

  // CSV Embedding state - for uploading and embedding CSV files
  const [csvFile, setCsvFile] = useState(null);
  const [csvEmbeddingLoading, setCsvEmbeddingLoading] = useState(false);
  const [csvEmbeddingError, setCsvEmbeddingError] = useState(null);
  const [csvEmbeddingSuccess, setCsvEmbeddingSuccess] = useState(null);
  const [isCsvSectionOpen, setIsCsvSectionOpen] = useState(false);
  const [showAddCsvForm, setShowAddCsvForm] = useState(false);
  const [csvEmbeddingsList, setCsvEmbeddingsList] = useState([]);
  const [csvEmbeddingsLoading, setCsvEmbeddingsLoading] = useState(false);

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

  // Fetch CSV embeddings when client changes
  useEffect(() => {
    if (clientId) {
      fetchCsvEmbeddings();
    }
  }, [clientId]);

  // fetchCsvEmbeddings - Retrieves CSV-based embeddings for the current agent
  const fetchCsvEmbeddings = async () => {
    if (!clientId) return;

    setCsvEmbeddingsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/embeddings/client/${clientId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server returned ${response.status}`);
      }

      if (!response.ok) throw new Error(data.error || 'Failed to fetch CSV embeddings');

      // Filter to only CSV embeddings (type === 'csv')
      const allEmbeddings = data.embeddings || [];
      const csvEmbeddings = allEmbeddings.filter(emb => emb.type === 'csv');
      setCsvEmbeddingsList(csvEmbeddings);
    } catch (error) {
      console.error('Fetch CSV embeddings error:', error);
      setCsvEmbeddingsList([]);
    } finally {
      setCsvEmbeddingsLoading(false);
    }
  };

  // handleCreateCsvEmbedding - Uploads a CSV file and creates embeddings from its content
  const handleCreateCsvEmbedding = async (e) => {
    e.preventDefault();

    if (!csvFile) {
      setCsvEmbeddingError('Please select a CSV file');
      return;
    }

    setCsvEmbeddingLoading(true);
    setCsvEmbeddingError(null);
    setCsvEmbeddingSuccess(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('clientId', clientId);
      formData.append('type', 'csv');

      const response = await fetch(`${apiBaseUrl}/api/embeddings/create-from-file`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create embedding from CSV');

      setCsvEmbeddingSuccess('CSV embedding created successfully!');
      setCsvFile(null);
      setShowAddCsvForm(false);

      // Reset file input
      const fileInput = document.querySelector('#csv-file-input');
      if (fileInput) fileInput.value = '';

      // Refresh list
      fetchCsvEmbeddings();

      setTimeout(() => setCsvEmbeddingSuccess(null), 5000);
    } catch (error) {
      console.error('Create CSV embedding error:', error);
      setCsvEmbeddingError(error.message);
    } finally {
      setCsvEmbeddingLoading(false);
    }
  };

  // handleDeleteCsvEmbedding - Deletes a CSV embedding
  const handleDeleteCsvEmbedding = async (embeddingId) => {
    if (!confirm('Are you sure you want to delete this CSV embedding? This action cannot be undone.')) {
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/embeddings/${embeddingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete embedding');

      fetchCsvEmbeddings();
      setCsvEmbeddingSuccess('CSV embedding deleted successfully!');
      setTimeout(() => setCsvEmbeddingSuccess(null), 3000);
    } catch (error) {
      console.error('Delete CSV embedding error:', error);
      setCsvEmbeddingError(error.message);
      setTimeout(() => setCsvEmbeddingError(null), 5000);
    }
  };

  // Toggle an add-on on/off for this client
  // If enabling an add-on that requires credentials, opens the credentials modal first
  // Calls POST /api/clients/:clientId/decorators/:decoratorKey to enable (with optional creds)
  // Calls DELETE /api/clients/:clientId/decorators/:decoratorKey to disable
  const handleToggleAddOn = async (addOn, isCurrentlyEnabled) => {
    const decoratorKey = addOn.key;

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

            return (
              <div
                key={addOn.key}
                style={{
                  backgroundColor: "#fff",
                  border: `2px solid ${isEnabled ? "#28a745" : "#dee2e6"}`,
                  borderRadius: "8px",
                  padding: "1.25em",
                  transition: "all 0.2s ease",
                  boxShadow: isEnabled ? "0 2px 8px rgba(40, 167, 69, 0.15)" : "0 2px 4px rgba(0,0,0,0.05)"
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

                  {/* Toggle Switch */}
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
                </div>

                {/* Content beneath header - slightly indented */}
                <div style={{ paddingLeft: "1em" }}>
                  {/* Requires Setup Badge */}
                  {addOn.requiresCredentials && (
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
                    <span style={{
                      color: isEnabled ? "#28a745" : "#999",
                      fontWeight: isEnabled ? "600" : "400"
                    }}>
                      <i className={`fa-solid ${isEnabled ? "fa-check-circle" : "fa-circle"}`} style={{ marginRight: "0.4em" }}></i>
                      {isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSV Embedding Section */}
      <div style={{ backgroundColor: 'white', padding: '1.5em', borderRadius: '8px', border: '1px solid #dee2e6', marginTop: '2em' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: isCsvSectionOpen ? '1em' : 0
          }}
          onClick={() => setIsCsvSectionOpen(!isCsvSectionOpen)}
        >
          <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
            <i className="fa-solid fa-file-csv" style={{ color: '#17a2b8' }}></i>
            CSV Embeddings
            <span style={{ fontSize: '0.75em', color: '#666', fontWeight: 'normal' }}>
              - {csvEmbeddingsList.length} {csvEmbeddingsList.length === 1 ? 'Embedding' : 'Embeddings'}
            </span>
          </h3>
          <i className={`fa-solid fa-chevron-${isCsvSectionOpen ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9em' }}></i>
        </div>

        {isCsvSectionOpen && (
          <>
            <p style={{ color: '#666', fontSize: '0.95em', marginBottom: '1.5em' }}>
              Upload CSV files to train your agent. Each row will be processed and embedded for RAG retrieval.
            </p>

            {/* CSV Embeddings List */}
            {csvEmbeddingsLoading ? (
              <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                Loading CSV embeddings...
              </div>
            ) : csvEmbeddingsList.length > 0 ? (
              <div style={{ marginBottom: '1.5em' }}>
                <h4 style={{ margin: '0 0 0.75em 0', fontSize: '0.95em', color: '#666' }}>Uploaded CSV Files</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
                  {csvEmbeddingsList.map((embedding, index) => (
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
                        <i className="fa-solid fa-file-csv" style={{ color: '#17a2b8', fontSize: '0.9em' }}></i>
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
                          onClick={() => handleDeleteCsvEmbedding(embedding.id)}
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
                No CSV embeddings yet. Click "Add CSV File" to get started.
              </div>
            )}

            {/* Success/Error Messages */}
            {csvEmbeddingSuccess && (
              <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#155724' }}>
                <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5em' }}></i>
                {csvEmbeddingSuccess}
              </div>
            )}

            {csvEmbeddingError && !showAddCsvForm && (
              <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#721c24' }}>
                <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>
                {csvEmbeddingError}
              </div>
            )}

            {/* Add New Button */}
            {!showAddCsvForm && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddCsvForm(true); }}
                style={{
                  padding: '0.75em 1.5em',
                  fontSize: '1em',
                  backgroundColor: '#17a2b8',
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
                Add CSV File
              </button>
            )}

            {/* Add CSV Form */}
            {showAddCsvForm && (
              <form onSubmit={handleCreateCsvEmbedding} style={{ marginTop: '1.5em', padding: '1.5em', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                <div style={{ marginBottom: '1em' }}>
                  <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold', color: '#333' }}>
                    Select CSV File <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    id="csv-file-input"
                    type="file"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    accept=".csv"
                    disabled={csvEmbeddingLoading}
                    style={{
                      width: '100%',
                      padding: '0.75em',
                      fontSize: '1em',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      cursor: csvEmbeddingLoading ? 'not-allowed' : 'pointer'
                    }}
                    required
                  />
                  {csvFile && (
                    <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                      Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>

                {csvEmbeddingError && (
                  <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#721c24' }}>
                    <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>
                    {csvEmbeddingError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1em' }}>
                  <button
                    type="submit"
                    disabled={csvEmbeddingLoading || !csvFile}
                    style={{
                      padding: '0.75em 1.5em',
                      fontSize: '1em',
                      backgroundColor: csvEmbeddingLoading ? '#ccc' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: csvEmbeddingLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {csvEmbeddingLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                        Creating Embedding...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-upload" style={{ marginRight: '0.5em' }}></i>
                        Upload CSV
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowAddCsvForm(false); setCsvFile(null); setCsvEmbeddingError(null); }}
                    disabled={csvEmbeddingLoading}
                    style={{
                      padding: '0.75em 1.5em',
                      fontSize: '1em',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: csvEmbeddingLoading ? 'not-allowed' : 'pointer',
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
