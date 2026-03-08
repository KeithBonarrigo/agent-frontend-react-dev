import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

export default function AudienceInsightsTab({ user, clientId }) {
  const { t } = useTranslation('audienceinsights');
  const apiBaseUrl = getApiUrl();

  const [isCollapsed, setIsCollapsed] = useState(true);

  // Report state
  const [report, setReport] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Past reports
  const [pastReports, setPastReports] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('');

  // Controls
  const [days, setDays] = useState(90);
  const [rateLimitMsg, setRateLimitMsg] = useState(null);

  // Fetch past reports on mount
  useEffect(() => {
    if (clientId) fetchPastReports();
  }, [clientId]);

  const fetchPastReports = async () => {
    setPastLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/audience-insights/reports?clientId=${clientId}&limit=10`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPastReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching past reports:', err);
    } finally {
      setPastLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setRateLimitMsg(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/audience-insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, days }),
        credentials: 'include'
      });
      const data = await response.json();

      if (response.status === 429) {
        const mins = Math.ceil((data.retryAfter || 3600) / 60);
        setRateLimitMsg(t('rateLimited', { minutes: mins }));
        return;
      }
      if (response.status === 404 || data.error === 'NO_DATA') {
        setError(t('noData'));
        return;
      }
      if (!response.ok) {
        setError(t('generateError'));
        return;
      }
      if (data.success && data.report) {
        setReport(data.report);
        setReportId(data.reportId);
        setSelectedReportId('');
        fetchPastReports(); // refresh list
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError(t('generateError'));
    } finally {
      setLoading(false);
    }
  };

  const loadPastReport = (id) => {
    setSelectedReportId(id);
    const found = pastReports.find(r => String(r.id) === String(id));
    if (found) {
      setReport(found.report);
      setReportId(found.id);
      setError(null);
      setRateLimitMsg(null);
    }
  };

  const downloadPdf = (id) => {
    window.open(
      `${apiBaseUrl}/api/audience-insights/reports/${id}/pdf?clientId=${clientId}`,
      '_blank'
    );
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!clientId) {
    return <div className="tab-empty-state"><p>{t('noClient')}</p></div>;
  }

  return (
    <div className="section" style={{ marginBottom: '1.5em' }}>
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`section-header ${!isCollapsed ? 'section-header-expanded' : ''}`}
      >
        <h2 className="section-title">
          <i className="fa-solid fa-chart-pie"></i> {t('title')}
        </h2>
        <i className={`fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'} section-chevron`}></i>
      </div>

      {!isCollapsed && <>
      <p className="tab-description">{t('description')}</p>

      {/* Controls Bar */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5em',
        marginBottom: '1.5em',
        maxWidth: 900,
        margin: '0 auto 1.5em'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25em' }}>
          {/* Days Selector */}
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>{t('timeRange')}</label>
            <select className="input" value={days} onChange={e => setDays(Number(e.target.value))} disabled={loading} style={{ minWidth: '140px' }}>
              <option value={30}>30 {t('days')}</option>
              <option value={60}>60 {t('days')}</option>
              <option value={90}>90 {t('days')}</option>
              <option value={180}>180 {t('days')}</option>
            </select>
          </div>

          {/* Past Reports Dropdown */}
          {pastReports.length > 0 && (
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>{t('pastReports')}</label>
              <select
                className="input"
                value={selectedReportId}
                onChange={e => loadPastReport(e.target.value)}
                disabled={loading}
                style={{ width: '100%' }}
              >
                <option value="">{t('selectReport')}</option>
                {pastReports.map(r => (
                  <option key={r.id} value={r.id}>
                    {formatDate(r.created_at)} ({r.days}d)
                  </option>
                ))}
              </select>
            </div>
          )}
          {pastLoading && <span className="text-muted text-small"><i className="fa-solid fa-spinner fa-spin"></i></span>}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75em', marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={generateReport} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin"></i> {t('generating')}</>
              ) : (
                <><i className="fa-solid fa-bolt"></i> {t('generateBtn')}</>
              )}
            </button>

            {reportId && !loading && (
              <button className="btn btn-info" onClick={() => downloadPdf(reportId)} style={{ whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-file-pdf"></i> {t('downloadPdf')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && <div className="alert alert-error alert-centered">{error}</div>}
      {rateLimitMsg && <div className="alert alert-warning alert-centered"><i className="fa-solid fa-clock"></i> {rateLimitMsg}</div>}
      {loading && (
        <div className="tab-loading-state">
          <p><i className="fa-solid fa-spinner fa-spin"></i> {t('generatingMsg')}</p>
          <p className="text-muted text-small">{t('generatingHint')}</p>
        </div>
      )}

      {/* Report Display */}
      {report && !loading && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Summary */}
          {report.summary && (
            <div className="subsection" style={{ marginBottom: '1.5em', borderLeft: '4px solid #007bff' }}>
              <h3 className="subsection-title"><i className="fa-solid fa-lightbulb" style={{ color: '#f59e0b' }}></i> {t('sections.summary')}</h3>
              <p style={{ color: '#444', lineHeight: 1.7, marginTop: '0.5em' }}>{report.summary}</p>
            </div>
          )}

          {/* Meta Info */}
          {report._meta && (
            <div className="flex flex-wrap gap-md" style={{ justifyContent: 'center', marginBottom: '1.5em' }}>
              <div className="metric-card" style={{ flex: '1 1 150px', maxWidth: 200 }}>
                <p className="metric-label">{t('meta.sessions')}</p>
                <p className="metric-value metric-value-blue">{report._meta.totalSessions}</p>
              </div>
              <div className="metric-card" style={{ flex: '1 1 150px', maxWidth: 200 }}>
                <p className="metric-label">{t('meta.messages')}</p>
                <p className="metric-value metric-value-purple">{report._meta.totalMessages}</p>
              </div>
              <div className="metric-card" style={{ flex: '1 1 150px', maxWidth: 200 }}>
                <p className="metric-label">{t('meta.generatedAt')}</p>
                <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5em' }}>{formatDate(report._meta.generatedAt)}</p>
              </div>
            </div>
          )}

          {/* Intent Distribution */}
          {report.intent_distribution && (
            <div className="subsection">
              <h3 className="subsection-title"><i className="fa-solid fa-signal" style={{ color: '#007bff' }}></i> {t('sections.intent')}</h3>
              <div style={{ display: 'flex', gap: '0.5em', marginTop: '1em', borderRadius: 8, overflow: 'hidden', height: 36 }}>
                {report.intent_distribution.high > 0 && (
                  <div className="ai-intent-bar ai-intent-high" style={{ flex: report.intent_distribution.high }} title={`${t('intent.high')}: ${report.intent_distribution.high}%`}>
                    {report.intent_distribution.high}%
                  </div>
                )}
                {report.intent_distribution.medium > 0 && (
                  <div className="ai-intent-bar ai-intent-medium" style={{ flex: report.intent_distribution.medium }} title={`${t('intent.medium')}: ${report.intent_distribution.medium}%`}>
                    {report.intent_distribution.medium}%
                  </div>
                )}
                {report.intent_distribution.low > 0 && (
                  <div className="ai-intent-bar ai-intent-low" style={{ flex: report.intent_distribution.low }} title={`${t('intent.low')}: ${report.intent_distribution.low}%`}>
                    {report.intent_distribution.low}%
                  </div>
                )}
              </div>
              <div className="flex gap-md" style={{ marginTop: '0.75em', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className="ai-legend-dot" style={{ backgroundColor: '#28a745' }}></span><span className="text-small">{t('intent.high')}</span>
                <span className="ai-legend-dot" style={{ backgroundColor: '#ffc107' }}></span><span className="text-small">{t('intent.medium')}</span>
                <span className="ai-legend-dot" style={{ backgroundColor: '#dee2e6' }}></span><span className="text-small">{t('intent.low')}</span>
              </div>
            </div>
          )}

          {/* Interest Clusters */}
          {report.top_interest_clusters && report.top_interest_clusters.length > 0 && (
            <div className="subsection">
              <h3 className="subsection-title"><i className="fa-solid fa-tags" style={{ color: '#6f42c1' }}></i> {t('sections.clusters')}</h3>
              <div style={{ marginTop: '1em' }}>
                {report.top_interest_clusters.map((cluster, i) => (
                  <div key={i} style={{ marginBottom: '1em' }}>
                    <div className="flex flex-between flex-center" style={{ marginBottom: '0.3em' }}>
                      <span style={{ fontWeight: 600, color: '#333' }}>{cluster.label}</span>
                      <span style={{ fontWeight: 700, color: '#6f42c1' }}>{cluster.percent}%</span>
                    </div>
                    <div className="progress-bar" style={{ maxWidth: '100%', margin: 0, height: 10 }}>
                      <div className="progress-bar-fill" style={{ width: `${cluster.percent}%`, backgroundColor: '#6f42c1', borderRadius: 5 }}></div>
                    </div>
                    {cluster.keywords && cluster.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-sm" style={{ marginTop: '0.4em' }}>
                        {cluster.keywords.map((kw, j) => (
                          <span key={j} className="search-param-tag" style={{ color: '#6f42c1', backgroundColor: '#f3e8ff', borderColor: '#6f42c1' }}>{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geographic Signals */}
          {report.geographic_signals && (
            <div className="subsection">
              <h3 className="subsection-title"><i className="fa-solid fa-globe" style={{ color: '#17a2b8' }}></i> {t('sections.geo')}</h3>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: '1em' }}>
                {/* Where they want to buy */}
                <div>
                  <h4 style={{ color: '#17a2b8', marginBottom: '0.75em', fontSize: '0.95em' }}>
                    <i className="fa-solid fa-map-pin"></i> {t('geo.interestMarkets')}
                  </h4>
                  <div className="location-list">
                    {(report.geographic_signals.top_interest_markets || []).map((loc, i) => (
                      <div key={i} className="location-item">
                        <span className="location-name">{loc.location}</span>
                        <span className="location-count">{loc.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Where they're from */}
                <div>
                  <h4 style={{ color: '#fd7e14', marginBottom: '0.75em', fontSize: '0.95em' }}>
                    <i className="fa-solid fa-location-dot"></i> {t('geo.userOrigins')}
                  </h4>
                  <div className="location-list">
                    {(report.geographic_signals.top_user_origins || []).map((loc, i) => (
                      <div key={i} className="location-item">
                        <span className="location-name">{loc.location}</span>
                        <span className="location-count">{loc.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {report.geographic_signals.relocation_signal && (
                <div className="alert alert-info" style={{ marginTop: '1em', textAlign: 'center' }}>
                  <i className="fa-solid fa-plane-departure"></i> {t('geo.relocationSignal')}
                </div>
              )}
            </div>
          )}

          {/* Seasonal Pattern + Budget Signals side by side */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '1.5em' }}>
            {/* Seasonal Pattern */}
            {report.seasonal_pattern && (
              <div className="subsection" style={{ marginBottom: 0 }}>
                <h3 className="subsection-title"><i className="fa-solid fa-calendar-days" style={{ color: '#fd7e14' }}></i> {t('sections.seasonal')}</h3>
                <div style={{ marginTop: '1em' }}>
                  <div style={{ marginBottom: '1em' }}>
                    <span className="text-muted text-small">{t('seasonal.peakMonths')}</span>
                    <div className="flex flex-wrap gap-sm" style={{ marginTop: '0.3em' }}>
                      {(report.seasonal_pattern.inquiry_peak_months || []).map((m, i) => (
                        <span key={i} className="badge" style={{ backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                  {report.seasonal_pattern.predicted_purchase_window && (
                    <div style={{ marginBottom: '1em' }}>
                      <span className="text-muted text-small">{t('seasonal.purchaseWindow')}</span>
                      <p style={{ fontWeight: 600, color: '#28a745', margin: '0.3em 0 0' }}>{report.seasonal_pattern.predicted_purchase_window}</p>
                    </div>
                  )}
                  {report.seasonal_pattern.recommended_ad_start && (
                    <div>
                      <span className="text-muted text-small">{t('seasonal.adStart')}</span>
                      <p style={{ fontWeight: 600, color: '#007bff', margin: '0.3em 0 0' }}>{report.seasonal_pattern.recommended_ad_start}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Budget Signals */}
            {report.budget_signals && (
              <div className="subsection" style={{ marginBottom: 0 }}>
                <h3 className="subsection-title"><i className="fa-solid fa-dollar-sign" style={{ color: '#28a745' }}></i> {t('sections.budget')}</h3>
                <div style={{ marginTop: '1em', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5em', flexWrap: 'wrap' }}>
                    <span className="ai-budget-value">{formatCurrency(report.budget_signals.range_low, report.budget_signals.currency)}</span>
                    <span style={{ color: '#999', fontSize: '1.2em' }}>&mdash;</span>
                    <span className="ai-budget-value">{formatCurrency(report.budget_signals.range_high, report.budget_signals.currency)}</span>
                  </div>
                  <p className="text-muted text-small" style={{ marginTop: '0.5em' }}>{report.budget_signals.currency}</p>
                </div>
              </div>
            )}
          </div>

          {/* Meta Segments */}
          {report.recommended_meta_segments && report.recommended_meta_segments.length > 0 && (
            <div className="subsection">
              <h3 className="subsection-title"><i className="fa-brands fa-meta" style={{ color: '#1877f2' }}></i> {t('sections.segments')}</h3>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: '1em' }}>
                {report.recommended_meta_segments.map((seg, i) => (
                  <div key={i} className="ai-segment-card">
                    <div className="flex flex-between flex-center" style={{ marginBottom: '0.5em' }}>
                      <h4 style={{ margin: 0, color: '#1877f2', fontSize: '0.95em' }}>{seg.name}</h4>
                      <span className="badge" style={{
                        backgroundColor: seg.size_estimate === 'large' ? '#d4edda' : seg.size_estimate === 'medium' ? '#fff3cd' : '#e7f3ff',
                        color: seg.size_estimate === 'large' ? '#155724' : seg.size_estimate === 'medium' ? '#856404' : '#004085'
                      }}>
                        {seg.size_estimate}
                      </span>
                    </div>
                    <p style={{ color: '#555', fontSize: '0.9em', lineHeight: 1.6, margin: 0 }}>{seg.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </>}
    </div>
  );
}
