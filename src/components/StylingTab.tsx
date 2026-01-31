import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

type ImageType = 'logo' | 'user-avatar' | 'bot-avatar';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
}

interface User {
  clientid?: number;
  contact_email?: string;
  first_name?: string;
  last_name?: string;
  level?: string;
  item?: number;
  company?: string;
  domain_to_install_bot?: string;
}

interface StylingTabProps {
  user: User;
  clientId: number;
  onNavigateToIntegrations?: () => void;
}

interface Branding {
  logo_url: string | null;
  headline: string;
  greeting: string;
  user_icon: string | null;
  bot_icon: string | null;
}

const DEFAULT_BRANDING: Branding = {
  logo_url: null,
  headline: "Chat with Us",
  greeting: "Hi! How can I help you today?",
  user_icon: null,
  bot_icon: null
};

const CSS_REFERENCE = `/* =============================================
   CHATBOT CSS REFERENCE
   ============================================= */

/* ---------------------------------------------
   #chatbot-container
   The main wrapper div for the entire chatbot.
   Fixed position in bottom-right corner.
   Contains: header, chat-box, and input.
   --------------------------------------------- */
#chatbot-container {
  position: fixed;
  bottom: 0;
  right: 20px;
  width: 300px;
  max-height: 70%;
  border-radius: 12px 12px 0 0;
  background-color: #ffffff;
  border: 1px solid #2c3e50;
  border-bottom: none;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.12), 0 -4px 15px rgba(0, 0, 0, 0.12);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ---------------------------------------------
   #chatbot-header
   The clickable header bar at the top.
   Shows "Chat with Us" text.
   Clicking toggles expand/collapse.
   --------------------------------------------- */
#chatbot-header {
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  color: white;
  padding: 15px 18px;
  text-align: center;
  font-weight: 600;
  font-size: 15px;
  align-items: center;
  letter-spacing: 0.3px;
  min-height: 50px;
  box-sizing: border-box;
}

/* ---------------------------------------------
   #chat-box
   The scrollable message area.
   Contains all user and bot messages.
   --------------------------------------------- */
#chat-box {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

/* Scrollbar styling for chat-box */
#chat-box::-webkit-scrollbar {
  width: 6px;
}
#chat-box::-webkit-scrollbar-track {
  background: #f1f1f1;
}
#chat-box::-webkit-scrollbar-thumb {
  background: #2c3e50;
  border-radius: 3px;
}
#chat-box::-webkit-scrollbar-thumb:hover {
  background: #1a252f;
}

/* ---------------------------------------------
   #chat-input
   The text input field at the bottom.
   Where users type their messages.
   --------------------------------------------- */
#chat-input {
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-top: 1px solid #2c3e50;
  font-size: 14px;
  font-family: inherit;
  background-color: #ffffff;
  color: #212529;
  outline: none;
  box-sizing: border-box;
}
#chat-input:focus {
  background-color: #f8f9fa;
}
#chat-input::placeholder {
  color: #6c757d;
}

/* ---------------------------------------------
   .user-icon
   The circular icon next to each message.
   fa-user for user messages, fa-robot for bot.
   --------------------------------------------- */
.user-icon {
  background-color: #2c3e50;
  color: white;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  font-size: 14px;
  flex-shrink: 0;
}

/* User icon (right-aligned messages) - blue */
#chat-box > div[style*="text-align: right"] .user-icon {
  background-color: #0d6efd;
  color: white;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.25);
  flex-shrink: 0;
}

/* Bot icon (left-aligned messages) - dark */
#chat-box > div[style*="text-align: left"] .user-icon {
  background-color: #2c3e50;
  color: white;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(44, 62, 80, 0.25);
  flex-shrink: 0;
}

/* ---------------------------------------------
   .bot-typing / #chatbot-typing
   The typing indicator with animated dots.
   Shown while waiting for bot response.
   --------------------------------------------- */
.bot-typing {
  background: transparent;
}
.bot-typing .bubble {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.bot-typing .dot {
  background: #2c3e50;
}

/* ---------------------------------------------
   .property-results / .property-grid / .property-card
   MLS/EasyBroker property listing cards.
   Used when bot returns property search results.
   --------------------------------------------- */
#chat-box .property-results {
  margin: 0;
  width: 100%;
}
#chat-box .property-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
#chat-box .property-card {
  width: 90%;
  max-width: 90%;
}`;

export default function StylingTab({ user, clientId, onNavigateToIntegrations }: StylingTabProps) {
  const { t } = useTranslation('styling');
  const placeholderDomain = user?.domain_to_install_bot || 'example.com';
  const [customCss, setCustomCss] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState("");
  const [isThemeCollapsed, setIsThemeCollapsed] = useState(true);
  const [isCssCollapsed, setIsCssCollapsed] = useState(true);
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSaveMessage, setBrandingSaveMessage] = useState("");

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState<ImageType | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key in ImageType]?: HTMLInputElement | null }>({});

  // Google Drive integration state
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [isGooglePickerLoading, setIsGooglePickerLoading] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [activeImageType, setActiveImageType] = useState<ImageType | null>(null);

  // Google Drive credentials from environment variables
  const googleDriveConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || null,
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || null,
    appId: import.meta.env.VITE_GOOGLE_APP_ID || null
  };
  const isGoogleDriveEnabled = !!(googleDriveConfig.clientId && googleDriveConfig.apiKey);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(CSS_REFERENCE);
    setCopied(true);
    setCopyMessage(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setCopyMessage(false), 5000);
  };

  const handleSuggestColors = async () => {
    if (analyzing) return;

    setAnalyzing(true);
    setSuggestMessage("");

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/color-analysis/${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ save: false })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze colors');
      }

      const data = await response.json();

      if (data.customCss) {
        setCustomCss(data.customCss);
        setSuggestMessage("success");
        setTimeout(() => setSuggestMessage(""), 5000);
      }
    } catch (error) {
      console.error('Error analyzing colors:', error);
      setSuggestMessage("error");
      setTimeout(() => setSuggestMessage(""), 3000);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchStyling = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        const apiBaseUrl = getApiUrl();
        const response = await fetch(`${apiBaseUrl}/api/client-styling/${clientId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setCustomCss(data.custom_css || "");
          if (data.branding) {
            setBranding({
              logo_url: data.branding.logo_url || null,
              headline: data.branding.headline || DEFAULT_BRANDING.headline,
              greeting: data.branding.greeting || DEFAULT_BRANDING.greeting,
              user_icon: data.branding.user_icon || null,
              bot_icon: data.branding.bot_icon || null
            });
          }
        }
      } catch (error) {
        console.error('Error fetching styling:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStyling();
  }, [clientId]);

  // Load Google APIs for Drive picker
  useEffect(() => {
    if (!isGoogleDriveEnabled || isGoogleApiLoaded) return;

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
  }, [isGoogleDriveEnabled, isGoogleApiLoaded]);

  // Handle local file upload
  const handleLocalFileUpload = async (file: File, imageType: ImageType) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setImageUploadError(t('branding.upload.invalidType'));
      setTimeout(() => setImageUploadError(null), 5000);
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setImageUploadError(t('branding.upload.tooLarge'));
      setTimeout(() => setImageUploadError(null), 5000);
      return;
    }

    setUploadingImage(imageType);
    setImageUploadError(null);

    try {
      const apiBaseUrl = getApiUrl();
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${apiBaseUrl}/api/branding-images/${clientId}/${imageType}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();

      // Update the branding field with the returned URL
      const fieldMap: { [key in ImageType]: keyof Branding } = {
        'logo': 'logo_url',
        'user-avatar': 'user_icon',
        'bot-avatar': 'bot_icon'
      };
      handleBrandingChange(fieldMap[imageType], data.url);

    } catch (error: any) {
      console.error('Image upload error:', error);
      setImageUploadError(error.message || t('branding.upload.failed'));
      setTimeout(() => setImageUploadError(null), 5000);
    } finally {
      setUploadingImage(null);
    }
  };

  // Handle Google Drive picker
  const handleGoogleDrivePicker = (imageType: ImageType) => {
    if (!isGoogleDriveEnabled) {
      setImageUploadError(t('branding.upload.googleDriveNotConfigured'));
      setTimeout(() => setImageUploadError(null), 5000);
      return;
    }

    setActiveImageType(imageType);
    setIsGooglePickerLoading(true);
    setImageUploadError(null);

    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleDriveConfig.clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          setImageUploadError(t('branding.upload.googleAuthFailed'));
          setIsGooglePickerLoading(false);
          setTimeout(() => setImageUploadError(null), 5000);
          return;
        }

        setGoogleAccessToken(tokenResponse.access_token);
        createGooglePicker(tokenResponse.access_token, imageType);
      },
    });

    tokenClient.requestAccessToken();
  };

  // Create Google Picker for images
  const createGooglePicker = (accessToken: string, imageType: ImageType) => {
    const google = (window as any).google;

    // Use DocsView with image MIME types (same pattern as ConfigurationsTab)
    const imageView = new google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setMimeTypes('image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp,image/tiff');

    const picker = new google.picker.PickerBuilder()
      .addView(imageView)
      .setOAuthToken(accessToken)
      .setDeveloperKey(googleDriveConfig.apiKey)
      .setAppId(googleDriveConfig.appId)
      .setCallback(async (data: any) => {
        setIsGooglePickerLoading(false);
        if (data.action === google.picker.Action.PICKED) {
          const file = data.docs[0];
          await uploadFromGoogleDrive(file, accessToken, imageType);
        }
      })
      .build();

    picker.setVisible(true);
  };

  // Download from Google Drive and upload to backend
  const uploadFromGoogleDrive = async (
    driveFile: GoogleDriveFile,
    accessToken: string,
    imageType: ImageType
  ) => {
    setUploadingImage(imageType);
    setImageUploadError(null);

    try {
      // Download file from Google Drive
      const driveResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!driveResponse.ok) {
        throw new Error('Failed to download file from Google Drive');
      }

      const blob = await driveResponse.blob();
      const sanitizedFileName = driveFile.name.replace(/[<>:"/\\|?*]/g, '_').trim();
      const file = new File([blob], sanitizedFileName, { type: driveFile.mimeType || blob.type });

      // Upload to backend
      const apiBaseUrl = getApiUrl();
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${apiBaseUrl}/api/branding-images/${clientId}/${imageType}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();

      // Update the branding field with the returned URL
      const fieldMap: { [key in ImageType]: keyof Branding } = {
        'logo': 'logo_url',
        'user-avatar': 'user_icon',
        'bot-avatar': 'bot_icon'
      };
      handleBrandingChange(fieldMap[imageType], data.url);

    } catch (error: any) {
      console.error('Google Drive upload error:', error);
      setImageUploadError(error.message || t('branding.upload.failed'));
      setTimeout(() => setImageUploadError(null), 5000);
    } finally {
      setUploadingImage(null);
      setActiveImageType(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/client-styling/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ custom_css: customCss })
      });

      if (!response.ok) {
        throw new Error('Failed to save styling');
      }

      setSaveMessage("Styling saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error('Error saving styling:', error);
      setSaveMessage("Failed to save styling");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    setBrandingSaveMessage("");

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/client-styling/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ branding })
      });

      if (!response.ok) {
        throw new Error('Failed to save branding');
      }

      setBrandingSaveMessage("success");
      setTimeout(() => setBrandingSaveMessage(""), 3000);
    } catch (error) {
      console.error('Error saving branding:', error);
      setBrandingSaveMessage("error");
      setTimeout(() => setBrandingSaveMessage(""), 3000);
    } finally {
      setSavingBranding(false);
    }
  };

  const handleBrandingChange = (field: keyof Branding, value: string) => {
    setBranding(prev => ({
      ...prev,
      [field]: value === "" ? null : value
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }}>
      {/* Branding Section */}
      <div className="tab-container">
        <div
          onClick={() => setIsThemeCollapsed(!isThemeCollapsed)}
          className={`section-header ${!isThemeCollapsed ? 'section-header-expanded' : ''}`}
        >
          <h2 className="section-title">
            <i className="fa-solid fa-palette"></i>
            {t('branding.title')}
          </h2>
          <i className={`fa-solid fa-chevron-${isThemeCollapsed ? 'down' : 'up'} section-chevron`}></i>
        </div>

        {!isThemeCollapsed && (
          <div>
            <p style={{ color: '#666', marginBottom: '1.5em' }}>
              {t('branding.description')}
            </p>

            {imageUploadError && (
              <div style={{
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                padding: '0.75em 1em',
                marginBottom: '1em',
                color: '#721c24',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em'
              }}>
                <i className="fa-solid fa-exclamation-triangle"></i>
                {imageUploadError}
              </div>
            )}

            {loading ? (
              <p>{t('loading')}</p>
            ) : (
              <div>
                {/* Row 1: Logo URL + Headline */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25em'
                }}>
                  {/* Logo URL */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: '500', color: '#333' }}>
                      {t('branding.logoUrl.label')}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5em' }}>
                      <input
                        type="url"
                        value={branding.logo_url || ""}
                        onChange={(e) => handleBrandingChange('logo_url', e.target.value)}
                        placeholder={`https://${placeholderDomain}/logo-bot-example.png`}
                        style={{
                          flex: 1,
                          padding: '0.75em',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '1em',
                          boxSizing: 'border-box'
                        }}
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                        ref={(el) => { fileInputRefs.current['logo'] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLocalFileUpload(file, 'logo');
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current['logo']?.click()}
                        disabled={uploadingImage === 'logo'}
                        style={{
                          padding: '0.75em',
                          backgroundColor: uploadingImage === 'logo' ? '#6c757d' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: uploadingImage === 'logo' ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4em',
                          whiteSpace: 'nowrap'
                        }}
                        title={t('branding.upload.localFile')}
                      >
                        {uploadingImage === 'logo' ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa-solid fa-upload"></i>
                        )}
                      </button>
                      {isGoogleDriveEnabled && (
                        <button
                          type="button"
                          onClick={() => handleGoogleDrivePicker('logo')}
                          disabled={uploadingImage === 'logo' || isGooglePickerLoading}
                          style={{
                            padding: '0.75em',
                            backgroundColor: uploadingImage === 'logo' || isGooglePickerLoading ? '#6c757d' : '#4285f4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: uploadingImage === 'logo' || isGooglePickerLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={t('branding.upload.googleDrive')}
                        >
                          <i className="fa-brands fa-google-drive"></i>
                        </button>
                      )}
                    </div>
                    <small style={{ color: '#666', fontSize: '0.85em' }}>
                      {t('branding.logoUrl.hint')} • {t('branding.logoUrl.maxSize')}
                    </small>
                  </div>

                  {/* Headline */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: '500', color: '#333' }}>
                      {t('branding.headline.label')}
                    </label>
                    <input
                      type="text"
                      value={branding.headline}
                      onChange={(e) => handleBrandingChange('headline', e.target.value)}
                      placeholder={t('branding.headline.placeholder')}
                      style={{
                        width: '100%',
                        padding: '0.75em',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '1em',
                        boxSizing: 'border-box'
                      }}
                    />
                    <small style={{ color: '#666', fontSize: '0.85em' }}>{t('branding.headline.hint')}</small>
                  </div>
                </div>

                {/* Row 2: User Icon + Bot Icon */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1.25em',
                  marginTop: '1.25em'
                }}>
                  {/* User Icon */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: '500', color: '#333' }}>
                      {t('branding.userIcon.label')}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5em' }}>
                      <input
                        type="url"
                        value={branding.user_icon || ""}
                        onChange={(e) => handleBrandingChange('user_icon', e.target.value)}
                        placeholder={`https://${placeholderDomain}/user-avatar-bot-example.png`}
                        style={{
                          flex: 1,
                          padding: '0.75em',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '1em',
                          boxSizing: 'border-box'
                        }}
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                        ref={(el) => { fileInputRefs.current['user-avatar'] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLocalFileUpload(file, 'user-avatar');
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current['user-avatar']?.click()}
                        disabled={uploadingImage === 'user-avatar'}
                        style={{
                          padding: '0.75em',
                          backgroundColor: uploadingImage === 'user-avatar' ? '#6c757d' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: uploadingImage === 'user-avatar' ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4em',
                          whiteSpace: 'nowrap'
                        }}
                        title={t('branding.upload.localFile')}
                      >
                        {uploadingImage === 'user-avatar' ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa-solid fa-upload"></i>
                        )}
                      </button>
                      {isGoogleDriveEnabled && (
                        <button
                          type="button"
                          onClick={() => handleGoogleDrivePicker('user-avatar')}
                          disabled={uploadingImage === 'user-avatar' || isGooglePickerLoading}
                          style={{
                            padding: '0.75em',
                            backgroundColor: uploadingImage === 'user-avatar' || isGooglePickerLoading ? '#6c757d' : '#4285f4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: uploadingImage === 'user-avatar' || isGooglePickerLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={t('branding.upload.googleDrive')}
                        >
                          <i className="fa-brands fa-google-drive"></i>
                        </button>
                      )}
                    </div>
                    <small style={{ color: '#666', fontSize: '0.85em' }}>
                      {t('branding.userIcon.hint')} • {t('branding.userIcon.maxSize')}
                    </small>
                  </div>

                  {/* Bot Icon */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: '500', color: '#333' }}>
                      {t('branding.botIcon.label')}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5em' }}>
                      <input
                        type="url"
                        value={branding.bot_icon || ""}
                        onChange={(e) => handleBrandingChange('bot_icon', e.target.value)}
                        placeholder={`https://${placeholderDomain}/bot-avatar-bot-example.png`}
                        style={{
                          flex: 1,
                          padding: '0.75em',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '1em',
                          boxSizing: 'border-box'
                        }}
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                        ref={(el) => { fileInputRefs.current['bot-avatar'] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLocalFileUpload(file, 'bot-avatar');
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current['bot-avatar']?.click()}
                        disabled={uploadingImage === 'bot-avatar'}
                        style={{
                          padding: '0.75em',
                          backgroundColor: uploadingImage === 'bot-avatar' ? '#6c757d' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: uploadingImage === 'bot-avatar' ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4em',
                          whiteSpace: 'nowrap'
                        }}
                        title={t('branding.upload.localFile')}
                      >
                        {uploadingImage === 'bot-avatar' ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa-solid fa-upload"></i>
                        )}
                      </button>
                      {isGoogleDriveEnabled && (
                        <button
                          type="button"
                          onClick={() => handleGoogleDrivePicker('bot-avatar')}
                          disabled={uploadingImage === 'bot-avatar' || isGooglePickerLoading}
                          style={{
                            padding: '0.75em',
                            backgroundColor: uploadingImage === 'bot-avatar' || isGooglePickerLoading ? '#6c757d' : '#4285f4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: uploadingImage === 'bot-avatar' || isGooglePickerLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={t('branding.upload.googleDrive')}
                        >
                          <i className="fa-brands fa-google-drive"></i>
                        </button>
                      )}
                    </div>
                    <small style={{ color: '#666', fontSize: '0.85em' }}>
                      {t('branding.botIcon.hint')} • {t('branding.botIcon.maxSize')}
                    </small>
                  </div>
                </div>

                {/* Greeting - Full Width */}
                <div style={{ marginTop: '1.25em' }}>
                  <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: '500', color: '#333' }}>
                    {t('branding.greeting.label')}
                  </label>
                  <textarea
                    value={branding.greeting}
                    onChange={(e) => handleBrandingChange('greeting', e.target.value)}
                    placeholder={t('branding.greeting.placeholder')}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75em',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '1em',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                  <small style={{ color: '#666', fontSize: '0.85em' }}>{t('branding.greeting.hint')}</small>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginTop: '1.25em' }}>
                  <button
                    onClick={handleSaveBranding}
                    disabled={savingBranding}
                    className={`btn ${savingBranding ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {savingBranding ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        {t('branding.buttons.saving')}
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        {t('branding.buttons.save')}
                      </>
                    )}
                  </button>

                  {brandingSaveMessage && (
                    <span style={{
                      color: brandingSaveMessage === 'success' ? '#28a745' : '#dc3545',
                      fontWeight: '500'
                    }}>
                      {brandingSaveMessage === 'success' ? '✅' : '❌'} {brandingSaveMessage === 'success' ? t('branding.messages.saveSuccess') : t('branding.messages.saveFailed')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom CSS Styling Section */}
      <div className="tab-container">
        <div
          onClick={() => setIsCssCollapsed(!isCssCollapsed)}
          className={`section-header ${!isCssCollapsed ? 'section-header-expanded' : ''}`}
        >
          <h2 className="section-title">
            <i className="fa-solid fa-code"></i>
            {t('title')}
          </h2>
          <i className={`fa-solid fa-chevron-${isCssCollapsed ? 'down' : 'up'} section-chevron`}></i>
        </div>

        {!isCssCollapsed && (
          <>
            {loading ? (
              <p>{t('loading')}</p>
            ) : (
              <div>
                <div className="toolbar">
                  <p className="text-muted text-small mb-0">
                    {t('description')}
                  </p>
                  <div className="btn-group">
                    <button
                      onClick={handleSuggestColors}
                      disabled={analyzing}
                      className={`btn ${analyzing ? 'btn-secondary' : 'btn-purple'}`}
                    >
                      <i className={analyzing ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-palette"}></i>
                      {analyzing ? t('buttons.analyzing') : t('buttons.suggestColors')}
                    </button>
                    <button
                      onClick={handleCopyReference}
                      className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}
                    >
                      <i className={copied ? "fa-solid fa-check" : "fa-solid fa-copy"}></i>
                      {copied ? t('buttons.copied') : t('buttons.copyCurrentStyling')}
                    </button>
                  </div>
                </div>

                {suggestMessage && (
                  <div className={`alert-inline ${suggestMessage === "success" ? 'alert-success' : 'alert-error'}`}>
                    <i className={suggestMessage === "success" ? "fa-solid fa-wand-magic-sparkles" : "fa-solid fa-exclamation-circle"}></i>
                    {suggestMessage === "success" ? t('messages.colorsSuggested') : t('messages.colorsFailed')}
                  </div>
                )}

                {copyMessage && (
                  <div className="alert-inline alert-info">
                    <i className="fa-solid fa-clipboard-check"></i>
                    {t('messages.copiedMessage')}
                  </div>
                )}

                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder={CSS_REFERENCE}
                  className="textarea-code"
                />

                <div className="flex flex-center gap-md mt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`btn btn-lg ${saving ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {saving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        {t('buttons.saving')}
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        {t('buttons.save')}
                      </>
                    )}
                  </button>

                  {saveMessage && (
                    <span className={`save-message ${saveMessage.includes('successfully') ? 'save-message-success' : 'save-message-error'}`}>
                      {saveMessage.includes('successfully') ? '✅' : '❌'} {saveMessage}
                      {saveMessage.includes('successfully') && onNavigateToIntegrations && (
                        <>
                          {' '}
                          <button
                            onClick={onNavigateToIntegrations}
                            className="btn-text-link"
                          >
                            {t('messages.testInIntegrations')}
                          </button>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
