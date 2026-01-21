import { useState, useEffect } from "react";

export default function ModelsTab({ user, clientId }) {
  const [selectedModel, setSelectedModel] = useState("");
  const [currentModel, setCurrentModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fetchingCurrent, setFetchingCurrent] = useState(true);

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
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
      setError('Failed to load current model');
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
      setError("No client ID available. Please log in.");
      setLoading(false);
      return;
    }

    if (!selectedModel) {
      setError("Please select a model.");
      setLoading(false);
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
        <p>Please select a subscription to configure models.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      <h2 style={{ marginBottom: "1em", color: "#333" }}>Model Configuration</h2>
      
      {fetchingCurrent ? (
        <div style={{ textAlign: "center", padding: "2em", color: "#666" }}>
          <p>Loading current model...</p>
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
                Current Active Model
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

            {/* Model Selection */}
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
                <option value="">-- Select a Model --</option>

                <optgroup label="Claude (Anthropic)">
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet (Most Popular)</option>
                  <option value="claude-3-7-sonnet">claude-3-7-sonnet (Newest - Sonnet 4)</option>
                  <option value="claude-3-5-haiku">claude-3-5-haiku (Fast & Cheap)</option>
                  <option value="claude-3-opus">claude-3-opus (Most Capable)</option>
                </optgroup>

                <optgroup label="OpenAI">
                  <option value="gpt-5">gpt-5</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                  <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
                <option value="gpt-3.5-turbo-1106">gpt-3.5-turbo-1106</option>
              </optgroup>
            </select>
            </div>
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
              ✅ Model updated successfully!
            </div>
          )}

          {/* Info Note */}
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
            <strong>Note:</strong> Changing your model will affect all future conversations.
            Your current conversations will not be affected.
          </div>

          {/* Buttons */}
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
              Cancel
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
              {loading ? "Updating..." : "Update Model"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Helper function to get model descriptions
function getModelDescription(model) {
  const descriptions = {
    'claude-3-5-sonnet': ' - Balanced performance and speed',
    'claude-3-7-sonnet': ' - Latest and most advanced',
    'claude-3-5-haiku': ' - Optimized for speed and cost',
    'claude-3-opus': ' - Highest intelligence and reasoning',
    'gpt-5': ' - Latest OpenAI model',
    'gpt-4-turbo': ' - Fast GPT-4 variant',
    'gpt-3.5-turbo-0125': ' - Updated GPT-3.5',
    'gpt-3.5-turbo-1106': ' - GPT-3.5 November 2023'
  };

  return descriptions[model] || '';
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