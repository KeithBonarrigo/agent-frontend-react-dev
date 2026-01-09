import { useState, useEffect } from "react";

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

export default function ConfigurationsTab({ clientId }: ConfigurationsTabProps) {
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [loadingInstructions, setLoadingInstructions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch client instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      if (!clientId) {
        console.warn('No clientId provided to ConfigurationsTab');
        setLoadingInstructions(false);
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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

  return (
    <div>
      {/* Client Instructions Form */}
      <div>
        <h2>Add Your Agent Instructions</h2>
        
        {loadingInstructions ? (
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

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={handleAddInstruction}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                + Add Instruction
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
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                {saving ? "Saving..." : "Save Instructions"}
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
        )}
      </div>
    </div>
  );
}