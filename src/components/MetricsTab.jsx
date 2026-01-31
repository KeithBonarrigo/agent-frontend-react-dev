import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

export default function MetricsTab({ clientId, subscription, tokensUsed }) {
  const { t } = useTranslation('metrics');
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
      <div className="tab-empty-state">
        <p>{t('noSubscription')}</p>
      </div>
    );
  }

  const usagePercentage = getUsagePercentage(tokensUsed, subscription?.token_limit);

  return (
    <div className="tab-container">
      <h2 className="tab-title">{t('title')}</h2>

      {/* Token Usage Section */}
      {subscription && (
        <div className="card" style={{ marginBottom: '1.5em' }}>
          <div className="card-header">
            {t('tokenUsage.title')}
          </div>
          <div className="card-body">
            <div className="token-usage-display">
              <span className="token-usage-value" style={{ color: getUsageColor(usagePercentage) }}>
                {formatNumber(tokensUsed)}
              </span>
              <span className="token-usage-limit">
                / {subscription.token_limit ? formatNumber(subscription.token_limit) : '∞'}
              </span>
            </div>
            {subscription.token_limit && (
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${usagePercentage}%`,
                    backgroundColor: getUsageColor(usagePercentage)
                  }}
                />
              </div>
            )}
            <p className="text-center text-muted text-small mt-1 mb-0">
              {subscription.token_limit
                ? t('tokenUsage.percentUsed', { percent: usagePercentage.toFixed(1) })
                : t('tokenUsage.unlimited')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="tab-loading-state">
          <p>{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <strong>{t('error')}</strong> {error}
        </div>
      ) : (
        <div className="grid grid-metrics">
          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.totalConversations')}
            </h3>
            <p className="metric-value metric-value-blue">
              {metrics?.totalConversations ?? '—'}
            </p>
          </div>

          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.totalMessages')}
            </h3>
            <p className="metric-value metric-value-green">
              {metrics?.totalMessages ?? '—'}
            </p>
          </div>

          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.totalTokens')}
            </h3>
            <p className="metric-value metric-value-purple">
              {metrics?.totalTokens?.toLocaleString() ?? '—'}
            </p>
          </div>

          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.activeUsers')}
            </h3>
            <p className="metric-value metric-value-orange">
              {metrics?.activeUsers ?? '—'}
            </p>
          </div>

          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.avgMessagesPerConversation')}
            </h3>
            <p className="metric-value metric-value-cyan">
              {metrics?.avgMessagesPerConversation?.toFixed(1) ?? '—'}
            </p>
          </div>

          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.avgTokensPerMessage')}
            </h3>
            <p className="metric-value metric-value-red">
              {metrics?.avgTokensPerMessage?.toFixed(0) ?? '—'}
            </p>
          </div>
        </div>
      )}

      <div className="info-box info-box-info">
        <p>{t('comingSoon')}</p>
      </div>
    </div>
  );
}
