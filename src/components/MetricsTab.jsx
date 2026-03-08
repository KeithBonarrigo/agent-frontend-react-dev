import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

export default function MetricsTab({ clientId, subscription, tokensUsed, user, onNavigateToConversations, onNavigateToActiveUsers, onNavigateToLeads, onNavigateToCollaborations }) {
  const { t } = useTranslation('metrics');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [leadsCount, setLeadsCount] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collaboration metrics (EasyBroker only)
  const [collabCount, setCollabCount] = useState(null);
  const [collabTotalCommission, setCollabTotalCommission] = useState(null);

  // Check user level for MLS-specific metrics
  const userLevel = (user?.level || user?.subscription_level || '').toLowerCase();
  const isMlsLevel = userLevel === 'mls';
  const isEasyBrokerLevel = userLevel === 'easybroker';

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
      if (isEasyBrokerLevel) fetchCollaborationMetrics();
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
        credentials: 'include',
        body: JSON.stringify({ clientId, includeLocation: true })
      });

      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || {};
        // Aggregate locations by country (same logic as LiveMap)
        const locationCounts = {};
        Object.values(sessions).forEach(session => {
          if (session?.location?.lat && session?.location?.lng) {
            const country = session.location.countryName || session.location.country || '';
            const city = session.location.city || '';
            const key = city && country ? `${city}, ${country}` : (country || city);
            if (key) {
              locationCounts[key] = (locationCounts[key] || 0) + 1;
            }
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

  const fetchCollaborationMetrics = async () => {
    if (!clientId) return;
    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/leads/${clientId}/collaborations`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CREATE_USER_TOKEN}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const properties = data.properties || [];
        setCollabCount(properties.length);
        // Sum commission_on_price values (strip currency symbols and parse)
        let total = 0;
        for (const prop of properties) {
          if (prop.commission_on_price && prop.commission_on_price !== 'Unknown' && prop.commission_on_price !== 'None/Not Shared') {
            const num = parseFloat(String(prop.commission_on_price).replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) total += num;
          }
        }
        setCollabTotalCommission(total);
      }
    } catch (err) {
      console.error('Error fetching collaboration metrics:', err);
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
    <div className="section" style={{ marginBottom: '1.5em' }}>
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`section-header ${!isCollapsed ? 'section-header-expanded' : ''}`}
      >
        <h2 className="section-title">
          <i className="fa-solid fa-chart-line"></i> {t('title')}
        </h2>
        <i className={`fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'} section-chevron`}></i>
      </div>

      {!isCollapsed && <>
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
          <div className="metric-card" onClick={onNavigateToActiveUsers} style={{ cursor: 'pointer' }}>
            <h3 className="metric-label metric-label-link">
              <i className="fa-solid fa-users" style={{ marginRight: '0.5em' }}></i>
              {t('cards.activeUsers')}
            </h3>
            <p className="metric-value">
              {metrics?.activeUsers ?? '—'}
            </p>
          </div>

          {/* EasyBroker Collaboration metrics */}
          {isEasyBrokerLevel && collabCount !== null && (
            <div className="metric-card" onClick={onNavigateToCollaborations} style={{ border: '1px solid #28a745', background: '#f6fff8', cursor: 'pointer' }}>
              <h3 className="metric-label metric-label-link">
                <i className="fa-solid fa-handshake" style={{ marginRight: '0.5em' }}></i>
                {t('cards.collaborations')}
              </h3>
              <p className="metric-value">
                {collabCount}
              </p>
              <div style={{ marginTop: '0.5em', borderTop: '1px solid #e0e0e0', paddingTop: '0.5em' }}>
                <span style={{ fontSize: '0.75em', color: '#666', display: 'block' }}>
                  {t('cards.totalCommission')}
                </span>
                <span style={{ fontSize: '1.6em', fontWeight: 'bold', color: '#28a745' }}>
                  ${collabTotalCommission?.toLocaleString() ?? '0'}
                </span>
              </div>
            </div>
          )}

          <div className="metric-card" onClick={onNavigateToLeads} style={{ cursor: 'pointer' }}>
            <h3 className="metric-label metric-label-link">
              <i className="fa-solid fa-user-plus" style={{ marginRight: '0.5em' }}></i>
              {t('cards.totalLeads')}
            </h3>
            <p className="metric-value">
              {leadsCount ?? '—'}
            </p>
          </div>

          {locations.length > 0 && (
            <div className="metric-card">
              <h3 className="metric-label">
                <i className="fa-solid fa-earth-americas" style={{ marginRight: '0.5em' }}></i>
                {t('cards.uniqueLocations')}
              </h3>
              <p className="metric-value">
                {locations.length}
              </p>
            </div>
          )}

          <div className="metric-card" onClick={onNavigateToConversations} style={{ cursor: 'pointer' }}>
            <h3 className="metric-label metric-label-link">
              <i className="fa-solid fa-comments" style={{ marginRight: '0.5em' }}></i>
              {t('cards.totalConversations')}
            </h3>
            <p className="metric-value">
              {metrics?.totalConversations ?? '—'}
            </p>
          </div>

          <div className="metric-card" onClick={onNavigateToConversations} style={{ cursor: 'pointer' }}>
            <h3 className="metric-label metric-label-link">
              <i className="fa-solid fa-envelope" style={{ marginRight: '0.5em' }}></i>
              {t('cards.totalMessages')}
            </h3>
            <p className="metric-value">
              {metrics?.totalMessages ?? '—'}
            </p>
          </div>

          <div className="metric-card" onClick={onNavigateToConversations} style={{ cursor: 'pointer' }}>
            <h3 className="metric-label metric-label-link">
              <i className="fa-solid fa-chart-bar" style={{ marginRight: '0.5em' }}></i>
              {t('cards.avgMessagesPerConversation')}
            </h3>
            <p className="metric-value">
              {metrics?.avgMessagesPerConversation?.toFixed(1) ?? '—'}
            </p>
          </div>

          {!isMlsLevel && (
            <div className="metric-card" onClick={onNavigateToConversations} style={{ cursor: 'pointer' }}>
              <h3 className="metric-label metric-label-link">
                <i className="fa-solid fa-coins" style={{ marginRight: '0.5em' }}></i>
                {t('cards.avgTokensPerMessage')}
              </h3>
              <p className="metric-value">
                {metrics?.avgTokensPerMessage?.toFixed(0) ?? '—'}
              </p>
            </div>
          )}

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

          {!isMlsLevel && (
            <div className="metric-card" onClick={onNavigateToConversations} style={{ cursor: 'pointer' }}>
              <h3 className="metric-label metric-label-link">
                <i className="fa-solid fa-microchip" style={{ marginRight: '0.5em' }}></i>
                {t('cards.totalTokens')}
              </h3>
              <p className="metric-value">
                {metrics?.totalTokens?.toLocaleString() ?? '—'}
              </p>
              {showTokenUsage && (
                <div style={{ marginTop: '0.5em', borderTop: '1px solid #e0e0e0', paddingTop: '0.5em' }}>
                  <span style={{ fontSize: '0.85em', color: getUsageColor(usagePercentage) }}>
                    {formatNumber(tokensUsed)}
                  </span>
                  <span style={{ fontSize: '0.75em', color: '#666' }}>
                    {' '}/ {subscription.token_limit ? formatNumber(subscription.token_limit) : '∞'}
                  </span>
                  {subscription.token_limit && (
                    <div className="progress-bar" style={{ marginTop: '0.4em' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${usagePercentage}%`,
                          backgroundColor: getUsageColor(usagePercentage)
                        }}
                      />
                    </div>
                  )}
                  <p style={{ fontSize: '0.7em', color: '#666', margin: '0.3em 0 0', textAlign: 'center' }}>
                    {subscription.token_limit
                      ? t('tokenUsage.percentUsed', { percent: usagePercentage.toFixed(1) })
                      : t('tokenUsage.unlimited')}
                  </p>
                </div>
              )}
            </div>
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
      </>}
    </div>
  );
}
