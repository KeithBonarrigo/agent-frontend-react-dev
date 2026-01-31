import { useState, useEffect } from "react";
import { getApiUrl } from "../utils/getApiUrl";

// TypeScript interfaces
interface User {
  clientid?: number;
  contact_email?: string;
  first_name?: string;
  last_name?: string;
  level?: string;
  item?: number;
  company?: string;
}

interface ConfigurationsTabProps {
  user: User;
  clientId: number;
}

// Helper function to get the logo path for a model
function getModelLogo(model: string | null): string | null {
  if (!model) return null;

  if (model.toLowerCase().includes('claude')) {
    return '/img/logos/claude.png';
  }
  if (model.toLowerCase().includes('gpt')) {
    return '/img/logos/openAi.png';
  }

  return null;
}

interface Embedding {
  id: number;
  url?: string;
  source?: string;
  title?: string;
  filename?: string;
  type?: string;
  created_at?: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
}

export default function ConfigurationsTab({ user, clientId }: ConfigurationsTabProps) {
  // Instructions state
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [loadingInstructions, setLoadingInstructions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isInstructionsCollapsed, setIsInstructionsCollapsed] = useState(true);

  // Training section collapsed state
  const [isTrainingCollapsed, setIsTrainingCollapsed] = useState(true);

  // Models section state
  const [isModelsCollapsed, setIsModelsCollapsed] = useState(true);
  const [selectedModel, setSelectedModel] = useState('');
  const [currentModel, setCurrentModel] = useState('');
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState('');
  const [modelSuccess, setModelSuccess] = useState(false);
  const [fetchingCurrentModel, setFetchingCurrentModel] = useState(true);

  // Check user level for model restrictions
  const userLevel = (user?.level || '').toLowerCase();
  const isSpecialtyLevel = userLevel === 'mls' || userLevel === 'easybroker';
  const isRestrictedLevel = userLevel === 'free' || userLevel === 'basic';

  // URL Embedding state
  const [embeddingUrl, setEmbeddingUrl] = useState('');
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [embeddingError, setEmbeddingError] = useState<string | null>(null);
  const [embeddingSuccess, setEmbeddingSuccess] = useState<string | null>(null);
  const [isEmbeddingSectionOpen, setIsEmbeddingSectionOpen] = useState(false);
  const [showAddEmbeddingForm, setShowAddEmbeddingForm] = useState(false);
  const [embeddingsList, setEmbeddingsList] = useState<Embedding[]>([]);
  const [embeddingsLoading, setEmbeddingsLoading] = useState(false);

  // File Embedding state
  const [embeddingFile, setEmbeddingFile] = useState<File | null>(null);
  const [fileEmbeddingLoading, setFileEmbeddingLoading] = useState(false);
  const [fileEmbeddingError, setFileEmbeddingError] = useState<string | null>(null);
  const [fileEmbeddingSuccess, setFileEmbeddingSuccess] = useState<string | null>(null);
  const [isFileSectionOpen, setIsFileSectionOpen] = useState(false);
  const [showAddFileForm, setShowAddFileForm] = useState(false);
  const [fileEmbeddingsList, setFileEmbeddingsList] = useState<Embedding[]>([]);
  const [fileEmbeddingsLoading, setFileEmbeddingsLoading] = useState(false);

  // Google Drive integration state
  const [fileSource, setFileSource] = useState<'local' | 'google-drive'>('local');
  const [googleDriveFile, setGoogleDriveFile] = useState<GoogleDriveFile | null>(null);
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [isGooglePickerLoading, setIsGooglePickerLoading] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Google Drive credentials from environment variables
  const googleDriveConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || null,
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || null,
    appId: import.meta.env.VITE_GOOGLE_APP_ID || null
  };
  const isGoogleDriveEnabled = !!(googleDriveConfig.clientId && googleDriveConfig.apiKey);

  // Fetch client instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      if (!clientId) {
        console.warn('No clientId provided to ConfigurationsTab');
        setLoadingInstructions(false);
        return;
      }

      try {
        const apiBaseUrl = getApiUrl();
        const response = await fetch(`${apiBaseUrl}/api/client-instructions/${clientId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch instructions');
        }

        const data = await response.json();

        if (data.client_instructions) {
          if (Array.isArray(data.client_instructions.client_instructions) &&
              data.client_instructions.client_instructions.length > 0) {
            setInstructions([...data.client_instructions.client_instructions, '']);
          } else {
            setInstructions(['']);
          }
        } else {
          setInstructions(['']);
        }
      } catch (error) {
        console.error('Error fetching instructions:', error);
        setInstructions(['']);
      } finally {
        setLoadingInstructions(false);
      }
    };

    fetchInstructions();
  }, [clientId]);

  // Fetch embeddings when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchEmbeddings();
      fetchFileEmbeddings();
    }
  }, [clientId]);

  // Load Google APIs for Drive picker
  useEffect(() => {
    if (fileSource !== 'google-drive' || isGoogleApiLoaded || !isGoogleDriveEnabled) return;

    const loadGoogleApi = () => {
      if ((window as any).gapi) {
        (window as any).gapi.load('picker', () => {
          setIsGoogleApiLoaded(true);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('picker', () => {
          setIsGoogleApiLoaded(true);
        });
      };
      document.body.appendChild(script);
    };

    const loadGoogleIdentity = () => {
      if ((window as any).google?.accounts) return;

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      document.body.appendChild(script);
    };

    loadGoogleApi();
    loadGoogleIdentity();
  }, [fileSource, isGoogleApiLoaded, isGoogleDriveEnabled]);

  // Instruction handlers
  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    if (newInstructions.length === 0) {
      newInstructions.push('');
    }
    setInstructions(newInstructions);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newInstructions = [...instructions];
    const draggedItem = newInstructions[draggedIndex];

    newInstructions.splice(draggedIndex, 1);
    newInstructions.splice(index, 0, draggedItem);

    setInstructions(newInstructions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newInstructions = [...instructions];
    [newInstructions[index - 1], newInstructions[index]] =
    [newInstructions[index], newInstructions[index - 1]];
    setInstructions(newInstructions);
  };

  const moveDown = (index: number) => {
    if (index === instructions.length - 1) return;
    const newInstructions = [...instructions];
    [newInstructions[index], newInstructions[index + 1]] =
    [newInstructions[index + 1], newInstructions[index]];
    setInstructions(newInstructions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');

    try {
      const filteredInstructions = instructions.filter(inst => inst.trim() !== '');

      const payload = {
        client_instructions: {
          client_instructions: filteredInstructions
        }
      };

      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/client-instructions/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save instructions');
      }

      setSaveMessage('✅ Instructions saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving instructions:', error);
      setSaveMessage('❌ Failed to save instructions');
    } finally {
      setSaving(false);
    }
  };

  // Embedding functions
  const fetchEmbeddings = async () => {
    if (!clientId) return;

    setEmbeddingsLoading(true);
    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/embeddings/client/${clientId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(`Server returned non-JSON response`);
      }

      if (!response.ok) throw new Error(data.error || 'Failed to fetch embeddings');

      const allEmbeddings = data.embeddings || [];
      const urlEmbeddings = allEmbeddings.filter((emb: Embedding) => !emb.type || emb.type === 'url');
      setEmbeddingsList(urlEmbeddings);
    } catch (error) {
      console.error('Fetch embeddings error:', error);
      setEmbeddingsList([]);
    } finally {
      setEmbeddingsLoading(false);
    }
  };

  const fetchFileEmbeddings = async () => {
    if (!clientId) return;

    setFileEmbeddingsLoading(true);
    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/embeddings/client/${clientId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(`Server returned non-JSON response`);
      }

      if (!response.ok) throw new Error(data.error || 'Failed to fetch file embeddings');

      const allEmbeddings = data.embeddings || [];
      const fileEmbeddings = allEmbeddings.filter((emb: Embedding) => emb.type === 'file');
      setFileEmbeddingsList(fileEmbeddings);
    } catch (error) {
      console.error('Fetch file embeddings error:', error);
      setFileEmbeddingsList([]);
    } finally {
      setFileEmbeddingsLoading(false);
    }
  };

  const handleCreateEmbedding = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!embeddingUrl.trim()) {
      setEmbeddingError('Please enter a valid URL');
      return;
    }

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
      const response = await fetch(`${apiBaseUrl}/api/embeddings/create-from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: embeddingUrl.trim(),
          clientId: clientId,
          type: 'url'
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create embedding');

      setEmbeddingSuccess('Embedding created successfully!');
      setEmbeddingUrl('');
      setShowAddEmbeddingForm(false);
      fetchEmbeddings();

      setTimeout(() => setEmbeddingSuccess(null), 5000);
    } catch (error: any) {
      console.error('Create embedding error:', error);
      setEmbeddingError(error.message);
    } finally {
      setEmbeddingLoading(false);
    }
  };

  const handleCreateFileEmbedding = async (e: React.FormEvent) => {
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
      const formData = new FormData();
      formData.append('file', embeddingFile);
      formData.append('clientId', String(clientId));
      formData.append('type', 'file');

      const response = await fetch(`${apiBaseUrl}/api/embeddings/create-from-file`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create embedding from file');

      setFileEmbeddingSuccess('File embedding created successfully!');
      setEmbeddingFile(null);
      setShowAddFileForm(false);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchFileEmbeddings();

      setTimeout(() => setFileEmbeddingSuccess(null), 5000);
    } catch (error: any) {
      console.error('Create file embedding error:', error);
      setFileEmbeddingError(error.message);
    } finally {
      setFileEmbeddingLoading(false);
    }
  };

  const handleDeleteEmbedding = async (embeddingId: number, embeddingType: 'url' | 'file') => {
    if (!confirm('Are you sure you want to delete this embedding? This action cannot be undone.')) {
      return;
    }

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/embeddings/${embeddingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete embedding');

      if (embeddingType === 'url') {
        fetchEmbeddings();
        setEmbeddingSuccess('Embedding deleted successfully!');
        setTimeout(() => setEmbeddingSuccess(null), 3000);
      } else {
        fetchFileEmbeddings();
        setFileEmbeddingSuccess('Embedding deleted successfully!');
        setTimeout(() => setFileEmbeddingSuccess(null), 3000);
      }
    } catch (error: any) {
      console.error('Delete embedding error:', error);
      if (embeddingType === 'url') {
        setEmbeddingError(error.message);
        setTimeout(() => setEmbeddingError(null), 5000);
      } else {
        setFileEmbeddingError(error.message);
        setTimeout(() => setFileEmbeddingError(null), 5000);
      }
    }
  };

  // Google Drive functions
  const handleGoogleDrivePicker = () => {
    if (!isGoogleDriveEnabled) {
      setFileEmbeddingError('Google Drive is not configured. Please contact your administrator.');
      return;
    }

    setIsGooglePickerLoading(true);
    setFileEmbeddingError(null);

    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleDriveConfig.clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          setFileEmbeddingError('Failed to authenticate with Google Drive');
          setIsGooglePickerLoading(false);
          return;
        }

        setGoogleAccessToken(tokenResponse.access_token);
        createGooglePicker(tokenResponse.access_token);
      },
    });

    tokenClient.requestAccessToken();
  };

  const createGooglePicker = (accessToken: string) => {
    const picker = new (window as any).google.picker.PickerBuilder()
      .addView(new (window as any).google.picker.DocsView()
        .setIncludeFolders(false)
        .setMimeTypes('text/csv,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
      .setOAuthToken(accessToken)
      .setDeveloperKey(googleDriveConfig.apiKey)
      .setAppId(googleDriveConfig.appId)
      .setCallback((data: any) => {
        setIsGooglePickerLoading(false);
        if (data.action === (window as any).google.picker.Action.PICKED) {
          const file = data.docs[0];
          setGoogleDriveFile({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.sizeBytes
          });
          setEmbeddingFile(null);
        }
      })
      .build();

    picker.setVisible(true);
  };

  const handleCreateFileEmbeddingFromGoogleDrive = async () => {
    if (!googleDriveFile || !googleAccessToken) {
      setFileEmbeddingError('Please select a file from Google Drive');
      return;
    }

    setFileEmbeddingLoading(true);
    setFileEmbeddingError(null);
    setFileEmbeddingSuccess(null);

    try {
      const googleExportMap: Record<string, { exportMime: string; ext: string }> = {
        'application/vnd.google-apps.document': { exportMime: 'application/pdf', ext: '.pdf' },
        'application/vnd.google-apps.spreadsheet': { exportMime: 'text/csv', ext: '.csv' },
        'application/vnd.google-apps.presentation': { exportMime: 'application/pdf', ext: '.pdf' }
      };

      const isGoogleWorkspaceFile = googleExportMap[googleDriveFile.mimeType];
      let driveResponse;
      let finalFileName = googleDriveFile.name;
      let finalMimeType = googleDriveFile.mimeType;

      if (isGoogleWorkspaceFile) {
        const { exportMime, ext } = isGoogleWorkspaceFile;
        driveResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${googleDriveFile.id}/export?mimeType=${encodeURIComponent(exportMime)}`,
          { headers: { 'Authorization': `Bearer ${googleAccessToken}` } }
        );
        if (!finalFileName.toLowerCase().endsWith(ext)) {
          finalFileName = finalFileName + ext;
        }
        finalMimeType = exportMime;
      } else {
        driveResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${googleDriveFile.id}?alt=media`,
          { headers: { 'Authorization': `Bearer ${googleAccessToken}` } }
        );
      }

      if (!driveResponse.ok) {
        throw new Error('Failed to download file from Google Drive. Please try selecting the file again.');
      }

      const blob = await driveResponse.blob();
      const sanitizedFileName = finalFileName.replace(/[<>:"/\\|?*]/g, '_').trim();
      const file = new File([blob], sanitizedFileName, { type: finalMimeType || blob.type });

      const apiBaseUrl = getApiUrl();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', String(clientId));
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

      fetchFileEmbeddings();

      setTimeout(() => setFileEmbeddingSuccess(null), 5000);
    } catch (error: any) {
      console.error('Create file embedding from Google Drive error:', error);
      setFileEmbeddingError(error.message);
    } finally {
      setFileEmbeddingLoading(false);
    }
  };

  // Model functions
  const fetchCurrentModel = async () => {
    if (!clientId) return;

    setFetchingCurrentModel(true);
    setModelError('');

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/model/${clientId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch current model');
      }

      const data = await response.json();

      if (data.model) {
        setCurrentModel(data.model);
        setSelectedModel(data.model);
      } else {
        setCurrentModel('Not set (will use gpt-5 as default)');
        setSelectedModel('gpt-5');
      }
    } catch (err) {
      console.error('Error fetching current model:', err);
      setModelError('Failed to fetch current model');
    } finally {
      setFetchingCurrentModel(false);
    }
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModelLoading(true);
    setModelError('');
    setModelSuccess(false);

    if (!clientId) {
      setModelError('No client selected');
      setModelLoading(false);
      return;
    }

    if (!selectedModel) {
      setModelError('Please select a model');
      setModelLoading(false);
      return;
    }

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/model`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          clientId: clientId,
          model: selectedModel
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update model');
      }

      setCurrentModel(selectedModel);
      setModelSuccess(true);

      setTimeout(() => {
        setModelSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Error updating model:', err);
      setModelError(err.message || 'Failed to update model');
    } finally {
      setModelLoading(false);
    }
  };

  const handleModelCancel = () => {
    if (currentModel.includes('Not set')) {
      setSelectedModel('gpt-5');
    } else {
      setSelectedModel(currentModel || 'gpt-5');
    }
    setModelError('');
    setModelSuccess(false);
  };

  const isModelUnchanged = () => {
    if (currentModel.includes('Not set')) {
      return selectedModel === 'gpt-5';
    }
    return selectedModel === currentModel;
  };

  // Fetch current model on mount
  useEffect(() => {
    if (clientId) {
      fetchCurrentModel();
    }
  }, [clientId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }}>
      {/* Instructions Section */}
      <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
        <div>
          <div
            onClick={() => setIsInstructionsCollapsed(!isInstructionsCollapsed)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              userSelect: "none",
              marginBottom: isInstructionsCollapsed ? 0 : "1em"
            }}
          >
            <h2 style={{ margin: 0 }}>Add Your Agent Instructions</h2>
            <i
              className={`fa-solid fa-chevron-${isInstructionsCollapsed ? 'down' : 'up'}`}
              style={{ fontSize: "1.2em", color: "#666" }}
            ></i>
          </div>

          {!isInstructionsCollapsed && (
            loadingInstructions ? (
              <p>Loading instructions...</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1em" }}>
                  <p style={{ color: "#666", fontSize: "0.9em", textAlign: "center" }}>
                    Add custom instructions for your AI agent. Drag to reorder, or use arrow buttons.
                  </p>
                </div>

                {instructions.map((instruction, index) => (
                  <div
                    key={index}
                    draggable={instruction.trim() !== ''}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "10px",
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transition: "opacity 0.2s",
                      backgroundColor: draggedIndex === index ? "#f0f0f0" : "transparent",
                      padding: "5px",
                      borderRadius: "4px"
                    }}
                  >
                    <div
                      style={{
                        cursor: instruction.trim() !== '' ? 'grab' : 'default',
                        padding: "10px 5px",
                        color: instruction.trim() !== '' ? "#666" : "#ccc",
                        fontSize: "18px",
                        userSelect: "none",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Drag to reorder"
                    >
                      ⋮⋮
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "30px",
                        fontWeight: "bold",
                        color: "#666",
                        fontSize: "14px"
                      }}
                    >
                      {index + 1}
                    </div>

                    <textarea
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      placeholder={`Instruction ${index + 1}...`}
                      style={{
                        flex: 1,
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        minHeight: "60px",
                        fontFamily: "inherit",
                        fontSize: "14px"
                      }}
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: index === 0 ? "#e9ecef" : "#007bff",
                          color: index === 0 ? "#6c757d" : "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                          fontSize: "12px"
                        }}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === instructions.length - 1}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: index === instructions.length - 1 ? "#e9ecef" : "#007bff",
                          color: index === instructions.length - 1 ? "#6c757d" : "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: index === instructions.length - 1 ? "not-allowed" : "pointer",
                          fontSize: "12px"
                        }}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(index)}
                        style={{
                          padding: "10px 15px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          alignSelf: "flex-start"
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <div style={{ display: "flex", gap: "10px", marginTop: "20px", marginLeft: "45px" }}>
                  <button
                    type="button"
                    onClick={handleAddInstruction}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add Instruction
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: saving ? "#6c757d" : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {saving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        Save Instructions
                      </>
                    )}
                  </button>
                </div>

                {saveMessage && (
                  <p style={{
                    marginTop: "10px",
                    color: saveMessage.includes('✅') ? '#28a745' : '#dc3545',
                    fontWeight: "bold"
                  }}>
                    {saveMessage}
                  </p>
                )}
              </form>
            )
          )}
        </div>
      </div>

      {/* Training Section */}
      <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
        <div
          onClick={() => setIsTrainingCollapsed(!isTrainingCollapsed)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
            marginBottom: isTrainingCollapsed ? 0 : "1em"
          }}
        >
          <h2 style={{ margin: 0 }}>Training</h2>
          <i
            className={`fa-solid fa-chevron-${isTrainingCollapsed ? 'down' : 'up'}`}
            style={{ fontSize: "1.2em", color: "#666" }}
          ></i>
        </div>

        {!isTrainingCollapsed && (
          <>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1.5em' }}>
              Configure and manage your agent's training data, knowledge base, and learning parameters.
            </p>

            {/* URL Embedding Section */}
            <div style={{ backgroundColor: 'white', padding: '1.5em', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '1.5em' }}>
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
                  <span style={{ fontSize: '0.75em', color: '#666', fontWeight: 'normal' }}>
                    - {embeddingsList.length} {embeddingsList.length === 1 ? 'Embedding' : 'Embeddings'}
                  </span>
                </h3>
                <i className={`fa-solid fa-chevron-${isEmbeddingSectionOpen ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9em' }}></i>
              </div>

              {isEmbeddingSectionOpen && (
                <>
                  <p style={{ color: '#666', fontSize: '0.95em', marginBottom: '1.5em' }}>
                    Train your agent by providing website URLs. The system will crawl and create embeddings from the content.
                  </p>

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
                          {embeddingError}
                        </div>
                      )}

                      {embeddingSuccess && (
                        <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#155724' }}>
                          {embeddingSuccess}
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
            <div style={{ backgroundColor: 'white', padding: '1.5em', borderRadius: '8px', border: '1px solid #dee2e6' }}>
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
                  <span style={{ fontSize: '0.75em', color: '#666', fontWeight: 'normal' }}>
                    - {fileEmbeddingsList.length} {fileEmbeddingsList.length === 1 ? 'Embedding' : 'Embeddings'}
                  </span>
                </h3>
                <i className={`fa-solid fa-chevron-${isFileSectionOpen ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9em' }}></i>
              </div>

              {isFileSectionOpen && (
                <>
                  <p style={{ color: '#666', fontSize: '0.95em', marginBottom: '1.5em' }}>
                    Upload document files to train your agent. Supported formats: PDF, TXT, DOC, DOCX, CSV.
                  </p>

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

                  {showAddFileForm && (
                    <div style={{ marginTop: '1.5em', padding: '1.5em', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                      <div style={{ marginBottom: '1.5em' }}>
                        <label style={{ display: 'block', marginBottom: '0.75em', fontWeight: 'bold', color: '#333' }}>
                          Choose File Source
                        </label>
                        <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => { setFileSource('local'); setGoogleDriveFile(null); }}
                            style={{
                              padding: '0.6em 1.2em',
                              fontSize: '0.95em',
                              backgroundColor: fileSource === 'local' ? '#28a745' : '#fff',
                              color: fileSource === 'local' ? 'white' : '#333',
                              border: `2px solid ${fileSource === 'local' ? '#28a745' : '#dee2e6'}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5em',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fa-solid fa-computer"></i>
                            Local File
                          </button>

                          {isGoogleDriveEnabled && (
                            <button
                              type="button"
                              onClick={() => { setFileSource('google-drive'); setEmbeddingFile(null); }}
                              style={{
                                padding: '0.6em 1.2em',
                                fontSize: '0.95em',
                                backgroundColor: fileSource === 'google-drive' ? '#4285f4' : '#fff',
                                color: fileSource === 'google-drive' ? 'white' : '#333',
                                border: `2px solid ${fileSource === 'google-drive' ? '#4285f4' : '#dee2e6'}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5em',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fa-brands fa-google-drive"></i>
                              Google Drive
                            </button>
                          )}
                        </div>
                      </div>

                      {fileSource === 'local' && (
                        <form onSubmit={handleCreateFileEmbedding}>
                          <div style={{ marginBottom: '1em' }}>
                            <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold', color: '#333' }}>
                              Select File <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                              type="file"
                              onChange={(e) => setEmbeddingFile(e.target.files?.[0] || null)}
                              accept=".pdf,.txt,.doc,.docx,.csv"
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
                              <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>
                              {fileEmbeddingError}
                            </div>
                          )}

                          {fileEmbeddingSuccess && (
                            <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#155724' }}>
                              <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5em' }}></i>
                              {fileEmbeddingSuccess}
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
                              onClick={(e) => { e.stopPropagation(); setShowAddFileForm(false); setEmbeddingFile(null); setFileEmbeddingError(null); setFileEmbeddingSuccess(null); setFileSource('local'); }}
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

                      {fileSource === 'google-drive' && (
                        <div>
                          <div style={{ marginBottom: '1em' }}>
                            <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold', color: '#333' }}>
                              Select from Google Drive <span style={{ color: '#dc3545' }}>*</span>
                            </label>

                            <button
                              type="button"
                              onClick={handleGoogleDrivePicker}
                              disabled={isGooglePickerLoading || fileEmbeddingLoading}
                              style={{
                                padding: '0.75em 1.5em',
                                fontSize: '1em',
                                backgroundColor: isGooglePickerLoading ? '#ccc' : '#4285f4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isGooglePickerLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5em'
                              }}
                            >
                              {isGooglePickerLoading ? (
                                <>
                                  <i className="fa-solid fa-spinner fa-spin"></i>
                                  Opening Google Drive...
                                </>
                              ) : (
                                <>
                                  <i className="fa-brands fa-google-drive"></i>
                                  Choose from Google Drive
                                </>
                              )}
                            </button>

                            {googleDriveFile && (
                              <div style={{
                                marginTop: '1em',
                                padding: '0.75em 1em',
                                backgroundColor: '#e8f4fd',
                                border: '1px solid #4285f4',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75em'
                              }}>
                                <i className="fa-brands fa-google-drive" style={{ color: '#4285f4', fontSize: '1.2em' }}></i>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '500', color: '#333' }}>{googleDriveFile.name}</div>
                                  {googleDriveFile.size && (
                                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                                      {(googleDriveFile.size / 1024).toFixed(2)} KB
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setGoogleDriveFile(null)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#666',
                                    cursor: 'pointer',
                                    padding: '0.25em'
                                  }}
                                  title="Remove selection"
                                >
                                  <i className="fa-solid fa-times"></i>
                                </button>
                              </div>
                            )}
                          </div>

                          {fileEmbeddingError && (
                            <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#721c24' }}>
                              <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>
                              {fileEmbeddingError}
                            </div>
                          )}

                          {fileEmbeddingSuccess && (
                            <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', padding: '0.75em', marginBottom: '1em', color: '#155724' }}>
                              <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5em' }}></i>
                              {fileEmbeddingSuccess}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '1em' }}>
                            <button
                              type="button"
                              onClick={handleCreateFileEmbeddingFromGoogleDrive}
                              disabled={fileEmbeddingLoading || !googleDriveFile}
                              style={{
                                padding: '0.75em 1.5em',
                                fontSize: '1em',
                                backgroundColor: fileEmbeddingLoading || !googleDriveFile ? '#ccc' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: fileEmbeddingLoading || !googleDriveFile ? 'not-allowed' : 'pointer',
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
                                  <i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: '0.5em' }}></i>
                                  Import from Google Drive
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setShowAddFileForm(false); setGoogleDriveFile(null); setFileEmbeddingError(null); setFileEmbeddingSuccess(null); setFileSource('local'); }}
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
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Models Section */}
      <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
        <div
          onClick={() => setIsModelsCollapsed(!isModelsCollapsed)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
            marginBottom: isModelsCollapsed ? 0 : "1em"
          }}
        >
          <h2 style={{ margin: 0 }}>Models</h2>
          <i
            className={`fa-solid fa-chevron-${isModelsCollapsed ? 'down' : 'up'}`}
            style={{ fontSize: "1.2em", color: "#666" }}
          ></i>
        </div>

        {!isModelsCollapsed && (
          fetchingCurrentModel ? (
            <div style={{ textAlign: "center", padding: "2em", color: "#666" }}>
              <p>Loading...</p>
            </div>
          ) : (
            <form onSubmit={handleModelSubmit}>
              {/* Current Model and Model Selection - Side by side on larger screens */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
                marginBottom: "25px",
                alignItems: "stretch"
              }}>
                {/* Current Model Display */}
                <div style={{
                  flex: "1 1 280px",
                  padding: "20px",
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}>
                  <div style={{
                    fontSize: "12px",
                    color: "#6c757d",
                    marginBottom: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: "600"
                  }}>
                    Current Model
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}>
                    {getModelLogo(currentModel) && (
                      <img
                        src={getModelLogo(currentModel) || ''}
                        alt="Model logo"
                        style={{
                          width: "36px",
                          height: "36px",
                          objectFit: "contain"
                        }}
                      />
                    )}
                    <span style={{
                      color: "#007bff",
                      fontWeight: "700",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                      fontSize: "18px"
                    }}>
                      {currentModel || 'Loading...'}
                    </span>
                  </div>
                </div>

                {/* Model Selection - Hidden for specialty levels (mls, easybroker) */}
                {!isSpecialtyLevel && (
                  <div style={{
                    flex: "1 1 280px",
                    padding: "20px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "2px solid #dee2e6"
                  }}>
                    <label
                      htmlFor="model-select"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#333",
                        fontSize: "14px"
                      }}
                    >
                      Select Model:
                    </label>
                    <select
                      id="model-select"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "14px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                      }}
                    >
                      <option value="">-- Select a model --</option>

                      <optgroup label="Claude (Anthropic)">
                        <option value="claude-3-5-sonnet" disabled={isRestrictedLevel} style={isRestrictedLevel ? { color: '#999', fontStyle: 'italic' } : {}}>
                          claude-3-5-sonnet (Most Popular){isRestrictedLevel ? ' 🔒' : ''}
                        </option>
                        <option value="claude-3-7-sonnet" disabled={isRestrictedLevel} style={isRestrictedLevel ? { color: '#999', fontStyle: 'italic' } : {}}>
                          claude-3-7-sonnet (Newest - Sonnet 4){isRestrictedLevel ? ' 🔒' : ''}
                        </option>
                        <option value="claude-3-5-haiku">claude-3-5-haiku (Fast & Cheap)</option>
                        <option value="claude-3-opus" disabled={isRestrictedLevel} style={isRestrictedLevel ? { color: '#999', fontStyle: 'italic' } : {}}>
                          claude-3-opus (Most Capable){isRestrictedLevel ? ' 🔒' : ''}
                        </option>
                      </optgroup>

                      <optgroup label="OpenAI">
                        <option value="gpt-5" disabled={isRestrictedLevel} style={isRestrictedLevel ? { color: '#999', fontStyle: 'italic' } : {}}>
                          gpt-5{isRestrictedLevel ? ' 🔒' : ''}
                        </option>
                        <option value="gpt-4-turbo">gpt-4-turbo</option>
                        <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
                        <option value="gpt-3.5-turbo-1106">gpt-3.5-turbo-1106</option>
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {modelError && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "#f8d7da",
                  color: "#721c24",
                  borderRadius: "4px",
                  marginBottom: "20px",
                  border: "1px solid #f5c6cb",
                  fontSize: "14px"
                }}>
                  <strong>Error:</strong> {modelError}
                </div>
              )}

              {/* Success Message */}
              {modelSuccess && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  borderRadius: "4px",
                  marginBottom: "20px",
                  border: "1px solid #c3e6cb",
                  fontSize: "14px"
                }}>
                  Model updated successfully!
                </div>
              )}

              {/* Level-based Message Area - Hidden for specialty levels */}
              {!isSpecialtyLevel && (
                isRestrictedLevel ? (
                  <div style={{
                    marginBottom: "20px",
                    padding: "16px 20px",
                    backgroundColor: "#fff3e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#e65100",
                    border: "2px solid #ffb74d",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(230, 81, 0, 0.15)"
                  }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</div>
                    <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "6px" }}>
                      Premium Models Locked
                    </div>
                    <div>
                      Your current plan only allows access to basic models.
                      <br />
                      <strong>Upgrade to Pro or Enterprise to unlock all models!</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: "20px",
                    padding: "12px",
                    backgroundColor: "#fff3cd",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#856404",
                    border: "1px solid #ffeeba",
                    textAlign: "center"
                  }}>
                    <strong>Note:</strong> Different models have different capabilities and pricing. Choose based on your needs.
                  </div>
                )
              )}

              {/* Buttons - Hidden for specialty levels */}
              {!isSpecialtyLevel && (
                <div style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end"
                }}>
                  <button
                    type="button"
                    onClick={handleModelCancel}
                    disabled={modelLoading}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: modelLoading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: modelLoading ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modelLoading || !selectedModel || isModelUnchanged()}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: selectedModel && !isModelUnchanged() ? "#007bff" : "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: modelLoading || !selectedModel || isModelUnchanged() ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: modelLoading || !selectedModel || isModelUnchanged() ? 0.6 : 1
                    }}
                  >
                    {modelLoading ? 'Updating...' : 'Update Model'}
                  </button>
                </div>
              )}
            </form>
          )
        )}
      </div>
    </div>
  );
}
