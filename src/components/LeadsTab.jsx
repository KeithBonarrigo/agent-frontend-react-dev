import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

export default function LeadsTab({ clientId }) {
  const { t, i18n } = useTranslation('leads');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (clientId) {
      fetchLeads();
    }
  }, [clientId]);

  const fetchLeads = async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/leads?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CREATE_USER_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }

      const data = await response.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lead.first_name?.toLowerCase().includes(search) ||
      lead.last_name?.toLowerCase().includes(search) ||
      lead.email?.toLowerCase().includes(search) ||
      lead.phone_number?.toLowerCase().includes(search) ||
      lead.service_desired?.toLowerCase().includes(search)
    );
  });

  if (!clientId) {
    return (
      <div className="tab-empty-state">
        <p>{t('noSubscription')}</p>
      </div>
    );
  }

  return (
    <div className="tab-container">
      <h2 className="section-title section-title-centered" style={{ marginBottom: "1em" }}>
        <i className="fa-solid fa-address-book"></i>
        {t('title')}
      </h2>

      <div className="toolbar mb-3">
        <div className="flex flex-center gap-sm">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ minWidth: '200px' }}
          />
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="btn btn-primary btn-sm"
          >
            {loading ? t('buttons.loading') : t('buttons.refresh')}
          </button>
        </div>
      </div>

      {loading && leads.length === 0 ? (
        <div className="tab-loading-state">
          <p>{t('loadingLeads')}</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <strong>{t('error')}</strong> {error}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="card text-center" style={{ padding: '3em' }}>
          <p className="text-muted mb-0" style={{ fontSize: '1.1em' }}>
            {searchTerm ? t('empty.noMatch') : t('empty.noLeads')}
          </p>
          <p className="text-small mt-1" style={{ color: '#999' }}>
            {t('empty.hint')}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('table.name')}</th>
                <th>{t('table.email')}</th>
                <th>{t('table.phone')}</th>
                <th>{t('table.preferredContact')}</th>
                <th>{t('table.serviceDesired')}</th>
                <th>{t('table.created')}</th>
                <th>{t('table.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.leadid}>
                  <td>
                    <strong>{lead.first_name} {lead.last_name}</strong>
                  </td>
                  <td>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="table-link">
                        {lead.email}
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    {lead.phone_number ? (
                      <a href={`tel:${lead.phone_number}`} className="table-link">
                        {lead.phone_number}
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    {lead.preferred_contact ? (
                      <span className="table-badge">
                        {lead.preferred_contact}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {lead.service_desired || '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }} className="text-xs text-muted">
                    {formatDate(lead.date_created)}
                  </td>
                  <td>
                    {lead.notes ? (
                      <span className="table-notes" title={lead.notes}>
                        {lead.notes}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            {t('showingCount', { filtered: filteredLeads.length, total: leads.length })}
          </div>
        </div>
      )}
    </div>
  );
}
