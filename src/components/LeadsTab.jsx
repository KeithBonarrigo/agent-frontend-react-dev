import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import "./Tabs.css";

export default function LeadsTab({ user, clientId, expandShare, onShareExpanded }) {
  const { t, i18n } = useTranslation('leads');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Share / Invite state
  const [isShareCollapsed, setIsShareCollapsed] = useState(true);
  const [emailAddresses, setEmailAddresses] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [wspNumbers, setWspNumbers] = useState('');
  const [wspMessage, setWspMessage] = useState('');
  const [wspSending, setWspSending] = useState(false);
  const [wspShareSuccess, setWspShareSuccess] = useState('');
  const [wspShareError, setWspShareError] = useState('');
  const [waMeLinkCopied, setWaMeLinkCopied] = useState(false);

  // Derived values
  const hasActiveWhatsApp = user?.office_wsp_phone && user?.wsp_status === 'active';
  const hasWhatsAppPhone = !!user?.office_wsp_phone;
  const waMeLink = hasWhatsAppPhone
    ? `https://wa.me/${user.office_wsp_phone.replace(/[^0-9]/g, '')}`
    : '';

  // Pre-fill default messages when user data loads (level-specific templates)
  useEffect(() => {
    if (user) {
      const domain = user.domain_to_install_bot || '';
      const level = (user.level || user.subscription_level || '').toLowerCase();
      const subjectKey = `share.${level}.emailDefaultSubject`;
      const messageKey = `share.${level}.emailDefaultMessage`;
      const wspKey = `share.${level}.wspDefaultMessage`;
      setEmailSubject(t(subjectKey, { defaultValue: '' }));
      setEmailMessage(t(messageKey, { domain, defaultValue: '' }));
      setWspMessage(t(wspKey, { domain, defaultValue: '' }));
    }
  }, [user, t]);

  useEffect(() => {
    if (clientId) {
      fetchLeads();
    }
  }, [clientId]);

  // Auto-expand share section when navigated from invite banner
  useEffect(() => {
    if (expandShare) {
      setIsShareCollapsed(false);
      onShareExpanded?.();
    }
  }, [expandShare]);

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

  // Share handlers
  const handleShareEmail = async () => {
    if (!emailAddresses.trim()) return;
    setEmailSending(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/share-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emails: emailAddresses.split(',').map(e => e.trim()).filter(Boolean),
          subject: emailSubject,
          message: emailMessage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('share.emailSendError'));

      setEmailSuccess(t('share.emailSentSuccess'));
      setEmailAddresses('');
      setTimeout(() => setEmailSuccess(''), 5000);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailSending(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!wspNumbers.trim()) return;
    setWspSending(true);
    setWspShareError('');
    setWspShareSuccess('');

    try {
      const apiBaseUrl = getApiUrl();
      const res = await fetch(`${apiBaseUrl}/api/clients/${clientId}/share-invite-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone_numbers: wspNumbers.split(',').map(p => p.trim()).filter(Boolean),
          message: wspMessage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('share.wspSendError'));

      setWspShareSuccess(t('share.wspSentSuccess'));
      setWspNumbers('');
      setTimeout(() => setWspShareSuccess(''), 5000);
    } catch (err) {
      setWspShareError(err.message);
    } finally {
      setWspSending(false);
    }
  };

  const handleCopyWaMeLink = () => {
    navigator.clipboard.writeText(waMeLink);
    setWaMeLinkCopied(true);
    setTimeout(() => setWaMeLinkCopied(false), 2000);
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

      {/* Share / Invite Section */}
      <div className="section" style={{ marginBottom: '1.5em' }}>
        <div
          onClick={() => setIsShareCollapsed(!isShareCollapsed)}
          className={`section-header ${!isShareCollapsed ? 'section-header-expanded' : ''}`}
        >
          <h2 className="section-title">
            <i className="fa-solid fa-share-nodes"></i>
            {t('share.title')}
          </h2>
          <i className={`fa-solid fa-chevron-${isShareCollapsed ? 'down' : 'up'} section-chevron`}></i>
        </div>

        {!isShareCollapsed && (
          <div style={{ padding: '1em 0' }}>
            <p className="section-description">{t('share.description')}</p>

            {/* wa.me Direct Link */}
            {hasWhatsAppPhone && (
              <div style={{ width: '70%', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1.5em' }}>
                <label style={{ display: 'block', fontSize: '0.85em', color: '#555', marginBottom: '0.4em', fontWeight: '600' }}>
                  <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', marginRight: '0.4em' }}></i>
                  {t('share.waMeLabel')}
                </label>
                <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={waMeLink}
                    className="form-input"
                    style={{ flex: 1, backgroundColor: '#f0f0f0' }}
                  />
                  <button
                    onClick={handleCopyWaMeLink}
                    className="btn btn-sm"
                    style={{ backgroundColor: waMeLinkCopied ? '#28a745' : '#007bff', color: 'white', border: 'none' }}
                  >
                    {waMeLinkCopied ? t('share.copied') : t('share.copy')}
                  </button>
                </div>
                <p style={{ fontSize: '0.8em', color: '#888', marginTop: '0.4em', marginBottom: 0 }}>
                  {t('share.waMeHelper')}
                </p>
              </div>
            )}

            {/* Email Sharing */}
            <div style={{ width: '70%', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1.5em' }}>
              <h3 style={{ fontSize: '1em', color: '#333', marginBottom: '0.75em' }}>
                <i className="fa-solid fa-envelope" style={{ color: '#007bff', marginRight: '0.4em' }}></i>
                {t('share.emailTitle')}
              </h3>
              <div style={{ marginBottom: '0.75em' }}>
                <label style={{ display: 'block', fontSize: '0.85em', color: '#555', marginBottom: '0.4em', fontWeight: '600' }}>
                  {t('share.emailAddressesLabel')}
                </label>
                <textarea
                  value={emailAddresses}
                  onChange={(e) => setEmailAddresses(e.target.value)}
                  placeholder={t('share.emailAddressesPlaceholder')}
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                  disabled={emailSending}
                />
              </div>
              <div style={{ marginBottom: '0.75em' }}>
                <label style={{ display: 'block', fontSize: '0.85em', color: '#555', marginBottom: '0.4em', fontWeight: '600' }}>
                  {t('share.emailSubjectLabel')}
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={t('share.emailSubjectPlaceholder')}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  disabled={emailSending}
                />
              </div>
              <div style={{ marginBottom: '0.75em' }}>
                <label style={{ display: 'block', fontSize: '0.85em', color: '#555', marginBottom: '0.4em', fontWeight: '600' }}>
                  {t('share.messageLabel')}
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                  disabled={emailSending}
                />
              </div>
              <button
                onClick={handleShareEmail}
                disabled={!emailAddresses.trim() || emailSending}
                className={`btn ${!emailAddresses.trim() || emailSending ? 'btn-secondary' : 'btn-primary'}`}
              >
                {emailSending ? t('share.sending') : t('share.sendEmail')}
              </button>
              {emailSuccess && <p style={{ color: '#28a745', marginTop: '0.5em', fontWeight: '600', fontSize: '0.85em' }}>{emailSuccess}</p>}
              {emailError && <p style={{ color: '#dc3545', marginTop: '0.5em', fontWeight: '600', fontSize: '0.85em' }}>{emailError}</p>}
            </div>

            {/* WhatsApp Sharing (only if WhatsApp is active) */}
            {hasActiveWhatsApp && (
              <div style={{ width: '70%', marginLeft: 'auto', marginRight: 'auto', borderTop: '1px solid #ddd', paddingTop: '1.5em' }}>
                <h3 style={{ fontSize: '1em', color: '#333', marginBottom: '0.75em' }}>
                  <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', marginRight: '0.4em' }}></i>
                  {t('share.wspTitle')}
                </h3>
                <div style={{ marginBottom: '0.75em' }}>
                  <label style={{ display: 'block', fontSize: '0.85em', color: '#555', marginBottom: '0.4em', fontWeight: '600' }}>
                    {t('share.wspNumbersLabel')}
                  </label>
                  <textarea
                    value={wspNumbers}
                    onChange={(e) => setWspNumbers(e.target.value)}
                    placeholder={t('share.wspNumbersPlaceholder')}
                    className="form-input"
                    style={{ minHeight: '60px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    disabled={wspSending}
                  />
                </div>
                <div style={{ marginBottom: '0.75em' }}>
                  <label style={{ display: 'block', fontSize: '0.85em', color: '#555', marginBottom: '0.4em', fontWeight: '600' }}>
                    {t('share.messageLabel')}
                  </label>
                  <textarea
                    value={wspMessage}
                    onChange={(e) => setWspMessage(e.target.value)}
                    className="form-input"
                    style={{ minHeight: '100px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    disabled={wspSending}
                  />
                </div>
                <button
                  onClick={handleShareWhatsApp}
                  disabled={!wspNumbers.trim() || wspSending}
                  className={`btn ${!wspNumbers.trim() || wspSending ? 'btn-secondary' : 'btn-success'}`}
                >
                  {wspSending ? t('share.sending') : t('share.sendWhatsApp')}
                </button>
                {wspShareSuccess && <p style={{ color: '#28a745', marginTop: '0.5em', fontWeight: '600', fontSize: '0.85em' }}>{wspShareSuccess}</p>}
                {wspShareError && <p style={{ color: '#dc3545', marginTop: '0.5em', fontWeight: '600', fontSize: '0.85em' }}>{wspShareError}</p>}
              </div>
            )}
          </div>
        )}
      </div>

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
