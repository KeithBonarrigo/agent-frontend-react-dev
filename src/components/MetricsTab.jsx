import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

export default function MetricsTab({ clientId, subscription, tokensUsed, user }) {
  const { t } = useTranslation('metrics');
  const [metrics, setMetrics] = useState(null);
  const [leadsCount, setLeadsCount] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check user level for MLS-specific metrics
  const userLevel = (user?.level || user?.subscription_level || '').toLowerCase();
  const isMlsLevel = userLevel === 'mls';

  const showTokenUsage = subscription && !isMlsLevel;

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
      fetchLeadsCount();
      fetchLocations();
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

  const fetchLeadsCount = async () => {
    if (!clientId) return;

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/leads?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CREATE_USER_TOKEN}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeadsCount(data.leads?.length ?? 0);
      }
    } catch (err) {
      console.error('Error fetching leads count:', err);
      setLeadsCount(0);
    }
  };

  const fetchLocations = async () => {
    if (!clientId) return;

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/admin/session-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Aggregate locations by country
        const locationCounts = {};
        Object.values(data.sessions || data || {}).forEach(session => {
          const country = session?.location?.countryName || session?.location?.country;
          if (country) {
            const city = session.location.city || '';
            const key = city ? `${city}, ${country}` : country;
            locationCounts[key] = (locationCounts[key] || 0) + 1;
          }
        });
        // Convert to sorted array
        const sortedLocations = Object.entries(locationCounts)
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count);
        setLocations(sortedLocations);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setLocations([]);
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
      <h2 className="section-title section-title-centered" style={{ marginBottom: "1em" }}>
        <i className="fa-solid fa-chart-line"></i>
        {t('title')}
      </h2>

      {/* Token Usage Section - hidden for MLS level */}
      {showTokenUsage && (
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
            <p className="metric-value">
              {metrics?.totalConversations ?? '—'}
            </p>
          </div>

          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.totalMessages')}
            </h3>
            <p className="metric-value">
              {metrics?.totalMessages ?? '—'}
            </p>
          </div>

          {!isMlsLevel && (
            <div className="metric-card">
              <h3 className="metric-label">
                {t('cards.totalTokens')}
              </h3>
              <p className="metric-value">
                {metrics?.totalTokens?.toLocaleString() ?? '—'}
              </p>
            </div>
          )}

          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.activeUsers')}
            </h3>
            <p className="metric-value">
              {metrics?.activeUsers ?? '—'}
            </p>
          </div>

          <div className="metric-card">
            <h3 className="metric-label">
              {t('cards.avgMessagesPerConversation')}
            </h3>
            <p className="metric-value">
              {metrics?.avgMessagesPerConversation?.toFixed(1) ?? '—'}
            </p>
          </div>

          {!isMlsLevel && (
            <div className="metric-card">
              <h3 className="metric-label">
                {t('cards.avgTokensPerMessage')}
              </h3>
              <p className="metric-value">
                {metrics?.avgTokensPerMessage?.toFixed(0) ?? '—'}
              </p>
            </div>
          )}

          <div className="metric-card">
            <h3 className="metric-label">
              <i className="fa-solid fa-user-plus" style={{ marginRight: '0.5em' }}></i>
              {t('cards.totalLeads')}
            </h3>
            <p className="metric-value">
              {leadsCount ?? '—'}
            </p>
          </div>

          {/* MLS-specific metrics */}
          {isMlsLevel && (
            <>
              <div className="metric-card">
                <h3 className="metric-label">
                  <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '0.5em' }}></i>
                  {t('cards.totalSearches')}
                </h3>
                <p className="metric-value">
                  {metrics?.totalSearches ?? '—'}
                </p>
              </div>

              <div className="metric-card">
                <h3 className="metric-label">
                  <i className="fa-solid fa-calendar-check" style={{ marginRight: '0.5em' }}></i>
                  {t('cards.viewingsScheduled')}
                </h3>
                <p className="metric-value">
                  {metrics?.viewingsScheduled ?? '—'}
                </p>
              </div>

              <div className="metric-card">
                <h3 className="metric-label">
                  <i className="fa-solid fa-house-flag" style={{ marginRight: '0.5em' }}></i>
                  {t('cards.openHousesScheduled')}
                </h3>
                <p className="metric-value">
                  {metrics?.openHousesScheduled ?? '—'}
                </p>
              </div>

              <div className="metric-card">
                <h3 className="metric-label">
                  <i className="fa-solid fa-handshake" style={{ marginRight: '0.5em' }}></i>
                  {t('cards.consultationsScheduled')}
                </h3>
                <p className="metric-value">
                  {metrics?.consultationsScheduled ?? '—'}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Geographic Locations */}
      {locations.length > 0 && (
        <div className="card" style={{ marginTop: '1.5em' }}>
          <div className="card-header">
            <i className="fa-solid fa-globe" style={{ marginRight: '0.5em' }}></i>
            {t('locations.title')}
          </div>
          <div className="card-body">
            <div className="location-list">
              {locations.slice(0, 10).map((loc, idx) => (
                <div key={idx} className="location-item">
                  <span className="location-name">
                    <i className="fa-solid fa-location-dot" style={{ marginRight: '0.5em', color: '#666' }}></i>
                    {loc.location}
                  </span>
                  <span className="location-count">{loc.count}</span>
                </div>
              ))}
              {locations.length > 10 && (
                <div className="location-more">
                  {t('locations.andMore', { count: locations.length - 10 })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="info-box info-box-info">
        <p>{t('comingSoon')}</p>
      </div>
    </div>
  );
}
