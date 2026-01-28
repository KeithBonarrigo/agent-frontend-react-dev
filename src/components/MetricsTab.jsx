import { useState, useEffect } from "react";
import { getApiUrl } from "../utils/getApiUrl";

export default function MetricsTab({ clientId, subscription, tokensUsed }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatNumber = (num) => num?.toLocaleString() || '0';

  const getUsagePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return '#28a745';
    if (percentage < 80) return '#ffc107';
    return '#dc3545';
  };

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
      const apiBaseUrl = getApiUrl();
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

  const usagePercentage = getUsagePercentage(tokensUsed, subscription?.token_limit);

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      <h2 style={{ margin: '0 0 1em 0', textAlign: 'center' }}>Metrics</h2>

      {/* Token Usage Section */}
      {subscription && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '1.5em'
        }}>
          <div style={{
            fontSize: '1.17em',
            color: '#fff',
            background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 50%, #1a252f 100%)',
            padding: '10px 16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            Subscription Token Usage
          </div>
          <div style={{ padding: '1.5em' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', justifyContent: 'center' }}>
              <span style={{
                fontSize: '2.5em',
                fontWeight: 'bold',
                color: getUsageColor(usagePercentage)
              }}>
                {formatNumber(tokensUsed)}
              </span>
              <span style={{ color: '#666', fontSize: '1.2em' }}>
                / {subscription.token_limit ? formatNumber(subscription.token_limit) : '∞'}
              </span>
            </div>
            {subscription.token_limit && (
              <div style={{
                width: '100%',
                maxWidth: '400px',
                height: '12px',
                backgroundColor: '#e9ecef',
                borderRadius: '6px',
                marginTop: '12px',
                overflow: 'hidden',
                margin: '12px auto 0 auto'
              }}>
                <div style={{
                  width: `${usagePercentage}%`,
                  height: '100%',
                  backgroundColor: getUsageColor(usagePercentage),
                  transition: 'width 0.3s'
                }} />
              </div>
            )}
            <p style={{ textAlign: 'center', color: '#666', marginTop: '0.75em', marginBottom: 0, fontSize: '0.9em' }}>
              {subscription.token_limit
                ? `${usagePercentage.toFixed(1)}% of your monthly token limit used`
                : 'Unlimited tokens available'}
            </p>
          </div>
        </div>
      )}

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
