import { useState, useEffect } from "react";

export default function MetricsTab({ clientId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (clientId) {
      fetchMetrics();
    }
  }, [clientId]);

  const fetchMetrics = async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/admin/metrics?clientId=${clientId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) {
    return (
      <div style={{ padding: '2em', textAlign: 'center', color: '#666' }}>
        <p>Please select a subscription to view metrics.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      <h2 style={{ margin: '0 0 1em 0', textAlign: 'center' }}>Metrics</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
          <p>Loading metrics...</p>
        </div>
      ) : error ? (
        <div style={{
          padding: '1em',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1em'
        }}>
          {/* Placeholder metrics cards */}
          <div style={{
            padding: '1.5em',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 0.5em 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
              Total Conversations
            </h3>
            <p style={{ margin: 0, fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>
              {metrics?.totalConversations ?? '—'}
            </p>
          </div>

          <div style={{
            padding: '1.5em',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 0.5em 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
              Total Messages
            </h3>
            <p style={{ margin: 0, fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>
              {metrics?.totalMessages ?? '—'}
            </p>
          </div>

          <div style={{
            padding: '1.5em',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 0.5em 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
              Total Tokens Used
            </h3>
            <p style={{ margin: 0, fontSize: '2em', fontWeight: 'bold', color: '#6f42c1' }}>
              {metrics?.totalTokens?.toLocaleString() ?? '—'}
            </p>
          </div>

          <div style={{
            padding: '1.5em',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 0.5em 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
              Active Users (Now)
            </h3>
            <p style={{ margin: 0, fontSize: '2em', fontWeight: 'bold', color: '#fd7e14' }}>
              {metrics?.activeUsers ?? '—'}
            </p>
          </div>

          <div style={{
            padding: '1.5em',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 0.5em 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
              Avg. Messages per Conversation
            </h3>
            <p style={{ margin: 0, fontSize: '2em', fontWeight: 'bold', color: '#17a2b8' }}>
              {metrics?.avgMessagesPerConversation?.toFixed(1) ?? '—'}
            </p>
          </div>

          <div style={{
            padding: '1.5em',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 0.5em 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
              Avg. Tokens per Message
            </h3>
            <p style={{ margin: 0, fontSize: '2em', fontWeight: 'bold', color: '#dc3545' }}>
              {metrics?.avgTokensPerMessage?.toFixed(0) ?? '—'}
            </p>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '2em',
        padding: '1.5em',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b8daff',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, color: '#004085' }}>
          More detailed metrics and analytics coming soon.
        </p>
      </div>
    </div>
  );
}
