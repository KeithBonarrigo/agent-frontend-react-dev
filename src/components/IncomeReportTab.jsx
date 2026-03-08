import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "./Tabs.css";

// Tiny non-interactive Leaflet map thumbnail
function MiniMap({ lat, lng, width = 80, height = 56 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      tap: false
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.circleMarker([lat, lng], { radius: 5, color: '#fff', weight: 2, fillColor: '#dc3545', fillOpacity: 1 }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; };
  }, [lat, lng]);

  return <div ref={containerRef} style={{ width, height, borderRadius: '6px', overflow: 'hidden' }} />;
}

export default function IncomeReportTab({ user, clientId }) {
  const { t } = useTranslation('incomereport');
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [propertyId, setPropertyId] = useState('');
  const [propertySource, setPropertySource] = useState('mls');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Past reports
  const [pastReports, setPastReports] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);

  // Collapsible state
  const [isLookupCollapsed, setIsLookupCollapsed] = useState(true);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);

  useEffect(() => {
    if (clientId) fetchPastReports();
  }, [clientId]);

  const fetchPastReports = async () => {
    setPastLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/str-report/reports?clientId=${clientId}&limit=20`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) setPastReports(data.reports || []);
    } catch (err) {
      console.error('Error fetching past reports:', err);
    } finally {
      setPastLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch(`${apiBaseUrl}/api/str-report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, propertyId: propertyId.trim(), source: propertySource }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const mins = Math.ceil((data.retryAfter || 3600) / 60);
          setError(t('rateLimited', { minutes: mins }));
        } else if (response.status === 404) {
          setError(data.error === 'NO_DATA' ? t('noData') : t('propertyNotFound'));
        } else {
          setError(t('generateError'));
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `str-report-${propertyId.trim()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
      fetchPastReports();
    } catch (err) {
      console.error('Error generating report:', err);
      setError(t('generateError'));
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = (reportId) => {
    window.open(`${apiBaseUrl}/api/str-report/reports/${reportId}/pdf?clientId=${clientId}`, '_blank');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!clientId) {
    return <div className="tab-empty-state"><p>{t('noClient')}</p></div>;
  }

  return (
    <div className="tab-container">
      {/* Property Report Lookup Section */}
      <div className="section" style={{ marginBottom: '1.5em' }}>
        <div
          onClick={() => setIsLookupCollapsed(!isLookupCollapsed)}
          className={`section-header ${!isLookupCollapsed ? 'section-header-expanded' : ''}`}
        >
          <h2 className="section-title">
            <i className="fa-solid fa-building"></i> {t('form.title')}
          </h2>
          <i className={`fa-solid fa-chevron-${isLookupCollapsed ? 'down' : 'up'} section-chevron`}></i>
        </div>

        {!isLookupCollapsed && (
          <>
            <p className="tab-description" style={{ marginBottom: '1.25em' }}>{t('description')}</p>

            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5em'
            }}>
              <div style={{ display: 'flex', gap: '1.25em', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 160px' }}>
                  <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>{t('form.source')}</label>
                  <select
                    className="form-input form-input-sm"
                    value={propertySource}
                    onChange={e => setPropertySource(e.target.value)}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    <option value="mls">MLS</option>
                    <option value="easybroker">EasyBroker</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>{t('form.propertyId')}</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    value={propertyId}
                    onChange={e => setPropertyId(e.target.value)}
                    placeholder={propertySource === 'mls' ? t('form.placeholderMls') : t('form.placeholderEb')}
                    disabled={loading}
                    style={{ width: '100%' }}
                  />
                </div>
                <button className="btn btn-primary" disabled={!propertyId.trim() || loading} onClick={generateReport} style={{ whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                  {loading ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> {t('generating')}</>
                  ) : (
                    <><i className="fa-solid fa-file-pdf"></i> {t('form.submit')}</>
                  )}
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {error && <div className="alert alert-error" style={{ marginTop: '1em' }}>{error}</div>}
            {loading && (
              <div className="tab-loading-state" style={{ marginTop: '1em' }}>
                <p><i className="fa-solid fa-spinner fa-spin"></i> {t('generatingMsg')}</p>
                <p className="text-muted text-small">{t('generatingHint')}</p>
              </div>
            )}
            {success && (
              <div className="alert alert-success" style={{ marginTop: '1em' }}>
                <i className="fa-solid fa-check-circle"></i> {t('downloadSuccess')}
              </div>
            )}
          </>
        )}
      </div>

      {/* Income Report History Section */}
      <div className="section" style={{ marginBottom: '1.5em' }}>
        <div
          onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
          className={`section-header ${!isHistoryCollapsed ? 'section-header-expanded' : ''}`}
        >
          <h2 className="section-title">
            <i className="fa-solid fa-file-lines"></i> {t('pastReports.title')}
            {pastLoading && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '0.7em', marginLeft: '0.5em', color: '#999' }}></i>}
          </h2>
          <i className={`fa-solid fa-chevron-${isHistoryCollapsed ? 'down' : 'up'} section-chevron`}></i>
        </div>

        {!isHistoryCollapsed && (
          <>
            {!pastLoading && pastReports.length === 0 && (
              <p className="text-muted text-small" style={{ marginTop: '1em', textAlign: 'center' }}>{t('pastReports.empty')}</p>
            )}

            {pastReports.length > 0 && (
              <div className="table-container" style={{ marginTop: '1em' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>{t('pastReports.date')}</th>
                      <th>{t('pastReports.property')}</th>
                      <th>{t('pastReports.name')}</th>
                      <th>{t('pastReports.price')}</th>
                      <th>{t('pastReports.type')}</th>
                      <th>{t('pastReports.source')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastReports.map(r => (
                      <tr key={r.id}>
                        <td style={{ padding: '0.4em' }}>
                          <div style={{ display: 'flex', gap: '0.35em' }}>
                            {r.image_url ? (
                              <img src={r.image_url} alt="" style={{ width: '80px', height: '56px', objectFit: 'cover', borderRadius: '6px', display: 'block', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '80px', height: '56px', borderRadius: '6px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="fa-solid fa-image" style={{ color: '#adb5bd', fontSize: '1.1em' }}></i>
                              </div>
                            )}
                            {r.latitude && r.longitude ? (
                              <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', flexShrink: 0, cursor: 'pointer' }}>
                                <MiniMap lat={Number(r.latitude)} lng={Number(r.longitude)} />
                              </a>
                            ) : (
                              <div style={{ width: '80px', height: '56px', borderRadius: '6px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="fa-solid fa-map" style={{ color: '#adb5bd', fontSize: '0.9em' }}></i>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{formatDate(r.created_at)}</td>
                        <td style={{ fontWeight: 500 }}>{r.property_id}</td>
                        <td>{r.property_name || '—'}</td>
                        <td>{r.price ? `$${Number(r.price).toLocaleString()}` : '—'}</td>
                        <td>{r.property_type || '—'}</td>
                        <td>
                          <span className="badge" style={{
                            backgroundColor: r.source === 'easybroker' ? '#e7f3ff' : '#f3e8ff',
                            color: r.source === 'easybroker' ? '#0066cc' : '#6f42c1'
                          }}>
                            {r.source === 'easybroker' ? 'EasyBroker' : 'MLS'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-info btn-sm" onClick={() => downloadPdf(r.id)}>
                            <i className="fa-solid fa-file-pdf"></i> {t('pastReports.download')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
