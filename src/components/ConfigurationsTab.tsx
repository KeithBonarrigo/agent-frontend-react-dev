import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

// TypeScript interfaces
interface User {
  clientid?: number;
  contact_email?: string;
  first_name?: string;
  last_name?: string;
  level?: string;
  subscription_level?: string;
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
  const { t } = useTranslation('configurations');

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

  // Check user level for model restrictions (level from bot_client_user takes priority)
  const userLevel = (user?.level || user?.subscription_level || '').toLowerCase();
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
    <div className="flex" style={{ flexDirection: 'column', gap: '1.5em' }}>
      {/* Instructions Section */}
      <div className="section">
        <div>
          <div
            onClick={() => setIsInstructionsCollapsed(!isInstructionsCollapsed)}
            className={`section-header ${!isInstructionsCollapsed ? 'section-header-expanded' : ''}`}
          >
            <h2 className="section-title">
              <i className="fa-solid fa-clipboard-list"></i>
              {t('instructions.title')}
            </h2>
            <i className={`fa-solid fa-chevron-${isInstructionsCollapsed ? 'down' : 'up'} section-chevron`}></i>
          </div>

          {!isInstructionsCollapsed && (
            loadingInstructions ? (
              <p>{t('instructions.loading')}</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="section-description">
                  <p>{t('instructions.description')}</p>
                </div>

                {instructions.map((instruction, index) => (
                  <div
                    key={index}
                    draggable={instruction.trim() !== ''}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`instruction-row ${draggedIndex === index ? 'instruction-row-dragging' : ''}`}
                  >
                    <div
                      className={`instruction-drag-handle ${instruction.trim() !== '' ? 'instruction-drag-handle-active' : 'instruction-drag-handle-disabled'}`}
                      title="Drag to reorder"
                    >
                      ⋮⋮
                    </div>

                    <div className="instruction-number">
                      {index + 1}
                    </div>

                    <textarea
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      placeholder={`Instruction ${index + 1}...`}
                      className="instruction-textarea"
                    />

                    <div className="instruction-actions">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="btn-move"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === instructions.length - 1}
                        className="btn-move"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(index)}
                        className="btn btn-danger"
                        style={{ alignSelf: "flex-start" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <div className="instruction-button-row">
                  <button
                    type="button"
                    onClick={handleAddInstruction}
                    className="btn btn-success btn-icon"
                  >
                    <i className="fa-solid fa-plus"></i>
                    {t('instructions.addButton')}
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className={`btn btn-icon ${saving ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {saving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        {t('instructions.saving')}
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        {t('instructions.saveButton')}
                      </>
                    )}
                  </button>
                </div>

                {saveMessage && (
                  <p className={`save-message mt-2 ${saveMessage.includes('✅') ? 'save-message-success' : 'save-message-error'}`}>
                    {saveMessage}
                  </p>
                )}
              </form>
            )
          )}
        </div>
      </div>

      {/* Training Section */}
      <div className="section">
        <div
          onClick={() => setIsTrainingCollapsed(!isTrainingCollapsed)}
          className={`section-header ${!isTrainingCollapsed ? 'section-header-expanded' : ''}`}
        >
          <h2 className="section-title">
            <i className="fa-solid fa-graduation-cap"></i>
            {t('training.title')}
          </h2>
          <i className={`fa-solid fa-chevron-${isTrainingCollapsed ? 'down' : 'up'} section-chevron`}></i>
        </div>

        {!isTrainingCollapsed && (
          <>
            <p className="subsection-description">
              {t('training.description')}
            </p>

            {/* URL Embedding Section */}
            <div className="subsection">
              <div
                className={`subsection-header ${isEmbeddingSectionOpen ? 'subsection-header-expanded' : ''}`}
                onClick={() => setIsEmbeddingSectionOpen(!isEmbeddingSectionOpen)}
              >
                <h3 className="subsection-title">
                  <i className="fa-solid fa-globe embedding-icon-url"></i>
                  {t('training.urlEmbeddings.title')}
                  <span className="subsection-count">
                    - {embeddingsList.length} {embeddingsList.length === 1 ? 'Embedding' : 'Embeddings'}
                  </span>
                </h3>
                <i className={`fa-solid fa-chevron-${isEmbeddingSectionOpen ? 'up' : 'down'} section-chevron`} style={{ fontSize: '0.9em' }}></i>
              </div>

              {isEmbeddingSectionOpen && (
                <>
                  <p className="subsection-description">
                    {t('training.urlEmbeddings.crawlDescription')}
                  </p>

                  {embeddingsLoading ? (
                    <div className="loading-state">
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                      Loading embeddings...
                    </div>
                  ) : embeddingsList.length > 0 ? (
                    <div className="mb-3">
                      <h4 className="text-muted text-small mb-1">Embedded Websites</h4>
                      <div className="embedding-list">
                        {embeddingsList.map((embedding, index) => (
                          <div key={index} className="embedding-item">
                            <div className="embedding-info">
                              <i className="fa-solid fa-globe embedding-icon embedding-icon-url"></i>
                              <div className="embedding-details">
                                {embedding.title && (
                                  <span className="embedding-title">{embedding.title}</span>
                                )}
                                <span className="embedding-source">{embedding.url || embedding.source}</span>
                              </div>
                            </div>
                            <div className="embedding-meta">
                              {embedding.created_at && (
                                <span className="embedding-date">
                                  {new Date(embedding.created_at).toLocaleDateString()}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteEmbedding(embedding.id, 'url')}
                                className="btn-delete-sm"
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
                    <div className="empty-state">
                      {t('training.urlEmbeddings.emptyState')}
                    </div>
                  )}

                  {!showAddEmbeddingForm && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAddEmbeddingForm(true); }}
                      className="btn btn-primary btn-lg btn-icon"
                    >
                      <i className="fa-solid fa-plus"></i>
                      {t('training.urlEmbeddings.addNewButton')}
                    </button>
                  )}

                  {showAddEmbeddingForm && (
                    <form onSubmit={handleCreateEmbedding} className="form-container">
                      <div className="form-group">
                        <label className="form-label form-label-required">
                          Website URL
                        </label>
                        <input
                          type="url"
                          value={embeddingUrl}
                          onChange={(e) => setEmbeddingUrl(e.target.value)}
                          placeholder="https://example.com"
                          disabled={embeddingLoading}
                          className="form-input"
                          required
                        />
                      </div>

                      {embeddingError && (
                        <div className="alert alert-error mb-2">
                          {embeddingError}
                        </div>
                      )}

                      {embeddingSuccess && (
                        <div className="alert alert-success mb-2">
                          {embeddingSuccess}
                        </div>
                      )}

                      <div className="form-actions">
                        <button
                          type="submit"
                          disabled={embeddingLoading || !embeddingUrl.trim()}
                          className={`btn btn-lg ${embeddingLoading ? 'btn-secondary' : 'btn-primary'}`}
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
                          className="btn btn-secondary btn-lg"
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
            <div className="subsection">
              <div
                className={`subsection-header ${isFileSectionOpen ? 'subsection-header-expanded' : ''}`}
                onClick={() => setIsFileSectionOpen(!isFileSectionOpen)}
              >
                <h3 className="subsection-title">
                  <i className="fa-solid fa-file-arrow-up embedding-icon-file"></i>
                  File Embeddings
                  <span className="subsection-count">
                    - {fileEmbeddingsList.length} {fileEmbeddingsList.length === 1 ? 'Embedding' : 'Embeddings'}
                  </span>
                </h3>
                <i className={`fa-solid fa-chevron-${isFileSectionOpen ? 'up' : 'down'} section-chevron`} style={{ fontSize: '0.9em' }}></i>
              </div>

              {isFileSectionOpen && (
                <>
                  <p className="subsection-description">
                    {t('training.fileEmbeddings.uploadDescription')}
                  </p>

                  {fileEmbeddingsLoading ? (
                    <div className="loading-state">
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                      Loading file embeddings...
                    </div>
                  ) : fileEmbeddingsList.length > 0 ? (
                    <div className="mb-3">
                      <h4 className="text-muted text-small mb-1">Uploaded Files</h4>
                      <div className="embedding-list">
                        {fileEmbeddingsList.map((embedding, index) => (
                          <div key={index} className="embedding-item">
                            <div className="embedding-info">
                              <i className="fa-solid fa-file embedding-icon embedding-icon-file"></i>
                              <div className="embedding-details">
                                {embedding.title && (
                                  <span className="embedding-title">{embedding.title}</span>
                                )}
                                <span className="embedding-source">{embedding.filename || embedding.url || embedding.source}</span>
                              </div>
                            </div>
                            <div className="embedding-meta">
                              {embedding.created_at && (
                                <span className="embedding-date">
                                  {new Date(embedding.created_at).toLocaleDateString()}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteEmbedding(embedding.id, 'file')}
                                className="btn-delete-sm"
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
                    <div className="empty-state">
                      {t('training.fileEmbeddings.emptyState')}
                    </div>
                  )}

                  {!showAddFileForm && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAddFileForm(true); }}
                      className="btn btn-success btn-lg btn-icon"
                    >
                      <i className="fa-solid fa-plus"></i>
                      {t('training.fileEmbeddings.addNewButton')}
                    </button>
                  )}

                  {showAddFileForm && (
                    <div className="form-container">
                      <div className="form-group">
                        <label className="form-label">Choose File Source</label>
                        <div className="file-source-group">
                          <button
                            type="button"
                            onClick={() => { setFileSource('local'); setGoogleDriveFile(null); }}
                            className={`file-source-btn file-source-btn-local ${fileSource === 'local' ? 'active' : ''}`}
                          >
                            <i className="fa-solid fa-computer"></i>
                            Local File
                          </button>

                          {isGoogleDriveEnabled && (
                            <button
                              type="button"
                              onClick={() => { setFileSource('google-drive'); setEmbeddingFile(null); }}
                              className={`file-source-btn file-source-btn-google ${fileSource === 'google-drive' ? 'active' : ''}`}
                            >
                              <i className="fa-brands fa-google-drive"></i>
                              Google Drive
                            </button>
                          )}
                        </div>
                      </div>

                      {fileSource === 'local' && (
                        <form onSubmit={handleCreateFileEmbedding}>
                          <div className="form-group">
                            <label className="form-label form-label-required">Select File</label>
                            <input
                              type="file"
                              onChange={(e) => setEmbeddingFile(e.target.files?.[0] || null)}
                              accept=".pdf,.txt,.doc,.docx,.csv"
                              disabled={fileEmbeddingLoading}
                              className="form-input"
                              style={{ cursor: fileEmbeddingLoading ? 'not-allowed' : 'pointer' }}
                              required
                            />
                            {embeddingFile && (
                              <div className="form-file-info">
                                Selected: {embeddingFile.name} ({(embeddingFile.size / 1024).toFixed(2)} KB)
                              </div>
                            )}
                          </div>

                          {fileEmbeddingError && (
                            <div className="alert alert-error mb-2">
                              <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>
                              {fileEmbeddingError}
                            </div>
                          )}

                          {fileEmbeddingSuccess && (
                            <div className="alert alert-success mb-2">
                              <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5em' }}></i>
                              {fileEmbeddingSuccess}
                            </div>
                          )}

                          <div className="form-actions">
                            <button
                              type="submit"
                              disabled={fileEmbeddingLoading || !embeddingFile}
                              className={`btn btn-lg ${fileEmbeddingLoading ? 'btn-secondary' : 'btn-success'}`}
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
                              className="btn btn-secondary btn-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {fileSource === 'google-drive' && (
                        <div>
                          <div className="form-group">
                            <label className="form-label form-label-required">Select from Google Drive</label>

                            <button
                              type="button"
                              onClick={handleGoogleDrivePicker}
                              disabled={isGooglePickerLoading || fileEmbeddingLoading}
                              className={`btn btn-lg btn-icon ${isGooglePickerLoading ? 'btn-secondary' : ''}`}
                              style={{ backgroundColor: isGooglePickerLoading ? '#ccc' : '#4285f4', color: 'white' }}
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
                              <div className="google-drive-selected">
                                <i className="fa-brands fa-google-drive google-drive-selected-icon"></i>
                                <div className="google-drive-selected-info">
                                  <div className="google-drive-selected-name">{googleDriveFile.name}</div>
                                  {googleDriveFile.size && (
                                    <div className="google-drive-selected-size">
                                      {(googleDriveFile.size / 1024).toFixed(2)} KB
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setGoogleDriveFile(null)}
                                  className="google-drive-remove-btn"
                                  title="Remove selection"
                                >
                                  <i className="fa-solid fa-times"></i>
                                </button>
                              </div>
                            )}
                          </div>

                          {fileEmbeddingError && (
                            <div className="alert alert-error mb-2">
                              <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>
                              {fileEmbeddingError}
                            </div>
                          )}

                          {fileEmbeddingSuccess && (
                            <div className="alert alert-success mb-2">
                              <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5em' }}></i>
                              {fileEmbeddingSuccess}
                            </div>
                          )}

                          <div className="form-actions">
                            <button
                              type="button"
                              onClick={handleCreateFileEmbeddingFromGoogleDrive}
                              disabled={fileEmbeddingLoading || !googleDriveFile}
                              className={`btn btn-lg ${fileEmbeddingLoading || !googleDriveFile ? 'btn-secondary' : 'btn-success'}`}
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
                              className="btn btn-secondary btn-lg"
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
      <div className="section">
        <div
          onClick={() => setIsModelsCollapsed(!isModelsCollapsed)}
          className={`section-header ${!isModelsCollapsed ? 'section-header-expanded' : ''}`}
        >
          <h2 className="section-title">
            <i className="fa-solid fa-robot"></i>
            {t('models.title')}
          </h2>
          <i className={`fa-solid fa-chevron-${isModelsCollapsed ? 'down' : 'up'} section-chevron`}></i>
        </div>

        {!isModelsCollapsed && (
          fetchingCurrentModel ? (
            <div className="loading-state">
              <p>Loading...</p>
            </div>
          ) : (
            <form onSubmit={handleModelSubmit}>
              {/* Current Model and Model Selection - Side by side on larger screens */}
              <div className="model-cards-container">
                {/* Current Model Display */}
                <div className="model-card model-card-centered">
                  <div className="model-card-label">
                    {t('models.currentModel')}
                  </div>
                  <div className="model-card-value">
                    {getModelLogo(currentModel) && (
                      <img
                        src={getModelLogo(currentModel) || ''}
                        alt="Model logo"
                        className="model-logo"
                      />
                    )}
                    <span className="model-name">
                      {currentModel || 'Loading...'}
                    </span>
                  </div>
                </div>

                {/* Model Selection - Hidden for specialty levels (mls, easybroker) */}
                {!isSpecialtyLevel && (
                  <div className="model-card">
                    <label htmlFor="model-select" className="model-select-label">
                      {t('models.selectModel')}
                    </label>
                    <select
                      id="model-select"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="model-select"
                    >
                      <option value="">{t('models.selectPlaceholder')}</option>

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
                <div className="alert alert-error mb-3">
                  <strong>Error:</strong> {modelError}
                </div>
              )}

              {/* Success Message */}
              {modelSuccess && (
                <div className="alert alert-success mb-3">
                  {t('models.success')}
                </div>
              )}

              {/* Level-based Message Area - Hidden for specialty levels */}
              {!isSpecialtyLevel && (
                isRestrictedLevel ? (
                  <div className="restricted-warning">
                    <div className="restricted-warning-icon">🔒</div>
                    <div className="restricted-warning-title">
                      {t('models.restricted.title')}
                    </div>
                    <div>
                      {t('models.restricted.message')}
                      <br />
                      <strong>{t('models.restricted.upgrade')}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="note-box">
                    <strong>{t('models:note.title')}</strong> {t('models.note')}
                  </div>
                )
              )}

              {/* Buttons - Hidden for specialty levels */}
              {!isSpecialtyLevel && (
                <div className="actions-right">
                  <button
                    type="button"
                    onClick={handleModelCancel}
                    disabled={modelLoading}
                    className="btn btn-secondary"
                  >
                    {t('common:buttons.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={modelLoading || !selectedModel || isModelUnchanged()}
                    className={`btn ${selectedModel && !isModelUnchanged() ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {modelLoading ? t('models.updating') : t('models.updateButton')}
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
