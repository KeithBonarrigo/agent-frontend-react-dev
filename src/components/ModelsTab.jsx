import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";

export default function ModelsTab({ user, clientId }) {
  const { t } = useTranslation('models');
  const [selectedModel, setSelectedModel] = useState("");
  const [currentModel, setCurrentModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fetchingCurrent, setFetchingCurrent] = useState(true);

  // Check user level for different restrictions
  const userLevel = (user?.subscription_level || user?.level || '').toLowerCase();
  const isSpecialtyLevel = userLevel === 'mls' || userLevel === 'easybroker';
  const isRestrictedLevel = userLevel === 'free' || userLevel === 'basic';

  // Debug logging
  useEffect(() => {
    console.log('===== ModelsTab DEBUG =====');
    console.log('clientId prop:', clientId);
    console.log('user:', user);
    console.log('===========================');
  }, [user, clientId]);

  // Fetch current model on mount - USE clientId PROP
  useEffect(() => {
    if (clientId) {
      fetchCurrentModel();
    }
  }, [clientId]);

  const fetchCurrentModel = async () => {
    setFetchingCurrent(true);
    setError("");

    try {
      const apiBaseUrl = getApiUrl();
      console.log(`📡 Fetching model for client ${clientId}`);
      const response = await fetch(`${apiBaseUrl}/api/model/${clientId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch current model');
      }

      const data = await response.json();
      console.log('✅ Model received:', data);
      
      if (data.model) {
        setCurrentModel(data.model);
        setSelectedModel(data.model);
      } else {
        // No model set, default to gpt-5
        setCurrentModel('Not set (will use gpt-5 as default)');
        setSelectedModel('gpt-5');
      }
    } catch (err) {
      console.error('Error fetching current model:', err);
      setError(t('errors.failedToFetch'));
    } finally {
      setFetchingCurrent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!clientId) {
      setError(t('errors.noClient'));
      setLoading(false);
      return;
    }

    if (!selectedModel) {
      setError(t('errors.selectModel'));
      setLoading(false);
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

      const data = await response.json();
      console.log('Model updated successfully:', data);
      
      setCurrentModel(selectedModel);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Error updating model:', err);
      setError(err.message || 'Failed to update model');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (currentModel.includes('Not set')) {
      setSelectedModel('gpt-5');
    } else {
      setSelectedModel(currentModel || 'gpt-5');
    }
    setError("");
    setSuccess(false);
  };

  const isModelUnchanged = () => {
    if (currentModel.includes('Not set')) {
      return selectedModel === 'gpt-5';
    }
    return selectedModel === currentModel;
  };

  if (!clientId) {
    return (
      <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
        <p>{t('noSubscription')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      <h2 style={{ marginBottom: "1em", color: "#333" }}>{t('title')}</h2>

      {fetchingCurrent ? (
        <div style={{ textAlign: "center", padding: "2em", color: "#666" }}>
          <p>{t('common:buttons.loading')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
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
                {t('currentModel')}
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
                    src={getModelLogo(currentModel)}
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
                  {t('selectModel')}:
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
                  <option value="">{t('selectModelPlaceholder')}</option>

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
          {error && (
            <div style={{
              padding: "12px",
              backgroundColor: "#f8d7da",
              color: "#721c24",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #f5c6cb",
              fontSize: "14px"
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              padding: "12px",
              backgroundColor: "#d4edda",
              color: "#155724",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #c3e6cb",
              fontSize: "14px"
            }}>
              ✅ {t('success.modelUpdated')}
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
                  {t('restricted.title')}
                </div>
                <div>
                  {t('restricted.message')}
                  <br />
                  <strong>{t('restricted.upgradePrompt')}</strong>
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
                <strong>{t('note.title')}</strong> {t('note.message')}
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
                onClick={handleCancel}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {t('common:buttons.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !selectedModel || isModelUnchanged()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: selectedModel && !isModelUnchanged() ? "#007bff" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading || !selectedModel || isModelUnchanged() ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading || !selectedModel || isModelUnchanged() ? 0.6 : 1
                }}
              >
                {loading ? t('updating') : t('updateModel')}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// Helper function to get the logo path for a model
function getModelLogo(model) {
  if (!model) return null;

  if (model.toLowerCase().includes('claude')) {
    return '/img/logos/claude.png';
  }
  if (model.toLowerCase().includes('gpt')) {
    return '/img/logos/openAi.png';
  }

  return null;
}