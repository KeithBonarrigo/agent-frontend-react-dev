import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import { useUser } from "../contexts/UserContext";
import "./Tabs.css";

export default function LeadsTab({ user, clientId, expandShare, onShareExpanded, expandCollaborations, onCollaborationsExpanded }) {
  const { t, i18n } = useTranslation('leads');
  const { user: adminUser } = useUser();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Collaborations state (EasyBroker only)
  const isEasyBrokerLevel = (user?.level || user?.subscription_level || '').toLowerCase() === 'easybroker';
  const [isCollaborationsCollapsed, setIsCollaborationsCollapsed] = useState(true);
  const [collabProperties, setCollabProperties] = useState([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabError, setCollabError] = useState(null);
  const [selectedCollabs, setSelectedCollabs] = useState(new Set());
  const [collabSaving, setCollabSaving] = useState(false);
  const [collabFilter, setCollabFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Lead searches state
  const [expandedLeadSearches, setExpandedLeadSearches] = useState(null);
  const [leadSearches, setLeadSearches] = useState([]);
  const [searchesLoading, setSearchesLoading] = useState(false);
  const [showSqlId, setShowSqlId] = useState(null);
  const [repeatSchedules, setRepeatSchedules] = useState({}); // { searchId: { interval: 1, unit: 'days' } }
  const [repeatSaving, setRepeatSaving] = useState(null);
  const [repeatSaved, setRepeatSaved] = useState(null);

  // Service desired expanded state
  const [expandedServiceLead, setExpandedServiceLead] = useState(null);

  // Leads section collapsed state
  const [isLeadsCollapsed, setIsLeadsCollapsed] = useState(true);

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
      if (isEasyBrokerLevel) fetchCollaborations();
    }
  }, [clientId]);

  const fetchCollaborations = async () => {
    if (!clientId) return;
    setCollabLoading(true);
    setCollabError(null);

    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/leads/${clientId}/collaborations`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CREATE_USER_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collaborations: ${response.status}`);
      }

      const data = await response.json();
      setCollabProperties(data.properties || []);
    } catch (err) {
      console.error('Error fetching collaborations:', err);
      setCollabError(err.message);
    } finally {
      setCollabLoading(false);
    }
  };

  const toggleCollabSelected = (propertyId) => {
    setSelectedCollabs(prev => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
  };

  const toggleSelectAllCollabs = () => {
    if (selectedCollabs.size === filteredCollabs.length) {
      setSelectedCollabs(new Set());
    } else {
      setSelectedCollabs(new Set(filteredCollabs.map(p => p.property_id)));
    }
  };

  const bulkSetCollabActive = async (active) => {
    if (selectedCollabs.size === 0) return;
    setCollabSaving(true);

    const propertyIds = [...selectedCollabs];

    try {
      const apiBaseUrl = getApiUrl();
      await fetch(`${apiBaseUrl}/api/leads/${clientId}/collaborations/bulk-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_CREATE_USER_TOKEN}`
        },
        body: JSON.stringify({ propertyIds, active })
      });

      const updated = collabProperties.map(prop =>
        selectedCollabs.has(prop.property_id) ? { ...prop, active_colab: active } : prop
      );
      setCollabProperties(updated);
      setSelectedCollabs(new Set());
    } catch (err) {
      console.error('Error updating collaboration active status:', err);
    } finally {
      setCollabSaving(false);
    }
  };

  // Auto-expand share section when navigated from invite banner
  useEffect(() => {
    if (expandShare) {
      setIsShareCollapsed(false);
      onShareExpanded?.();
    }
  }, [expandShare]);

  // Auto-expand collaborations section when navigated from metrics tile
  useEffect(() => {
    if (expandCollaborations && isEasyBrokerLevel) {
      setIsCollaborationsCollapsed(false);
      onCollaborationsExpanded?.();
    }
  }, [expandCollaborations]);

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

  const fetchLeadSearches = async (leadid) => {
    if (!clientId || !leadid) return;
    setSearchesLoading(true);
    try {
      const apiBaseUrl = getApiUrl();
      const response = await fetch(`${apiBaseUrl}/api/leads/${clientId}/searches?ebcId=${leadid}`, {
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_CREATE_USER_TOKEN}` }
      });
      if (response.ok) {
        const data = await response.json();
        const searches = data.searches || [];
        setLeadSearches(searches);
        // Seed repeat schedules from existing data
        const schedules = {};
        searches.forEach(s => {
          schedules[s.id] = {
            enabled: s.repeat_enabled || false,
            interval: s.repeat_interval || 1,
            unit: s.repeat_unit || 'days'
          };
        });
        setRepeatSchedules(prev => ({ ...prev, ...schedules }));
      } else {
        setLeadSearches([]);
      }
    } catch (err) {
      console.error('Error fetching lead searches:', err);
      setLeadSearches([]);
    } finally {
      setSearchesLoading(false);
    }
  };

  const toggleLeadSearches = (leadid) => {
    if (expandedLeadSearches === leadid) {
      setExpandedLeadSearches(null);
      setLeadSearches([]);
      setShowSqlId(null);
    } else {
      setExpandedLeadSearches(leadid);
      setShowSqlId(null);
      fetchLeadSearches(leadid);
    }
  };

  const getSearchSchedule = (searchId) => {
    return repeatSchedules[searchId] || { enabled: false, interval: 1, unit: 'days' };
  };

  const updateSearchSchedule = (searchId, field, value) => {
    setRepeatSchedules(prev => ({
      ...prev,
      [searchId]: {
        ...getSearchSchedule(searchId),
        [field]: field === 'interval' ? Number(value) : field === 'enabled' ? Boolean(value) : value
      }
    }));
  };

  const saveRepeatSearch = async (searchId) => {
    const schedule = getSearchSchedule(searchId);
    setRepeatSaving(searchId);
    try {
      const apiBaseUrl = getApiUrl();
      await fetch(`${apiBaseUrl}/api/leads/${clientId}/searches/${searchId}/repeat`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CREATE_USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ repeat_enabled: schedule.enabled, interval: schedule.interval, unit: schedule.unit })
      });
      setRepeatSaved(searchId);
      setTimeout(() => setRepeatSaved(null), 3000);
    } catch (err) {
      console.error('Error saving repeat schedule:', err);
    } finally {
      setRepeatSaving(null);
    }
  };

  const renderSqlParams = (params) => {
    if (!params || typeof params !== 'object') return null;
    const tags = [];

    // Operation type
    if (params.opType) {
      const opLabels = { sale: 'For Sale', rent: 'For Rent' };
      tags.push({ icon: 'fa-tag', label: opLabels[params.opType] || params.opType });
    }

    // Property type
    if (params.propertyType) {
      tags.push({ icon: 'fa-house', label: params.propertyType });
    }

    // Location
    if (params.placeLike) {
      tags.push({ icon: 'fa-location-dot', label: params.placeLike });
    }

    // Bedrooms
    if (params.bedrooms) {
      tags.push({ icon: 'fa-bed', label: `${params.bedrooms}+ beds` });
    }

    // Bathrooms
    if (params.bathrooms) {
      tags.push({ icon: 'fa-bath', label: `${params.bathrooms}+ baths` });
    }

    // Price range
    if (params.minPrice || params.maxPrice) {
      const cur = params.currency || 'MXN';
      const fmt = (v) => `$${Number(v).toLocaleString()}`;
      let priceLabel = '';
      if (params.minPrice && params.maxPrice) {
        priceLabel = `${fmt(params.minPrice)} – ${fmt(params.maxPrice)} ${cur}`;
      } else if (params.minPrice) {
        priceLabel = `${fmt(params.minPrice)}+ ${cur}`;
      } else {
        priceLabel = `Up to ${fmt(params.maxPrice)} ${cur}`;
      }
      tags.push({ icon: 'fa-dollar-sign', label: priceLabel });
    }

    // Beachfront
    if (params.likeBeach) {
      tags.push({ icon: 'fa-umbrella-beach', label: 'Beachfront' });
    }

    if (tags.length === 0) return null;
    return tags.map((tag, i) => (
      <span key={i} className="search-param-tag">
        <i className={`fa-solid ${tag.icon}`} style={{ marginRight: '0.3em' }}></i>
        {tag.label}
      </span>
    ));
  };

  const renderServiceDesired = (leadId, text) => {
    if (!text) return '—';
    const entries = text.split(';').map(s => s.trim()).filter(Boolean);
    if (entries.length <= 1) return text;
    const isExpanded = expandedServiceLead === leadId;
    return (
      <div>
        <ul style={{ margin: 0, paddingLeft: '1.2em', fontSize: '0.9em', listStyle: 'disc' }}>
          <li>{entries[0]}</li>
          {isExpanded && entries.slice(1).map((entry, i) => (
            <li key={i} style={{ marginTop: '0.2em' }}>{entry}</li>
          ))}
        </ul>
        {!isExpanded && (
          <a
            href="#"
            className="table-link"
            style={{ fontSize: '0.85em', marginTop: '0.2em', display: 'inline-block' }}
            onClick={(e) => { e.preventDefault(); setExpandedServiceLead(leadId); }}
          >
            +{entries.length - 1} more
          </a>
        )}
        {isExpanded && (
          <a
            href="#"
            className="table-link"
            style={{ fontSize: '0.85em', marginTop: '0.2em', display: 'inline-block' }}
            onClick={(e) => { e.preventDefault(); setExpandedServiceLead(null); }}
          >
            Show less
          </a>
        )}
      </div>
    );
  };

  const scrollToLead = (contactName) => {
    if (!contactName) return;
    const match = leads.find(lead => {
      const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim().toLowerCase();
      return fullName === contactName.trim().toLowerCase();
    });
    if (match) {
      setSearchTerm('');
      setTimeout(() => {
        const row = document.getElementById(`lead-row-${match.leadid}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('highlight-row');
          setTimeout(() => row.classList.remove('highlight-row'), 2000);
        }
      }, 50);
    }
  };

  const filteredCollabs = collabProperties.filter(prop => {
    if (collabFilter === 'active') return prop.active_colab !== false;
    if (collabFilter === 'inactive') return prop.active_colab === false;
    return true;
  });

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

            {/* wa.me Direct Link — hidden for now
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
            */}

            <div style={{ display: 'grid', gridTemplateColumns: hasActiveWhatsApp ? 'repeat(auto-fit, minmax(340px, 1fr))' : '1fr', gap: '1.5em', maxWidth: '900px', margin: '0 auto' }}>

              {/* Email Sharing Card */}
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5em'
              }}>
                <h3 style={{ fontSize: '1.05em', color: '#333', marginTop: 0, marginBottom: '1.25em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                  <i className="fa-solid fa-envelope" style={{ color: '#007bff', fontSize: '1.2em' }}></i>
                  {t('share.emailTitle')}
                </h3>
                <div style={{ marginBottom: '1em' }}>
                  <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>
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
                <div style={{ marginBottom: '1em' }}>
                  <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>
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
                <div style={{ marginBottom: '1em' }}>
                  <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>
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

              {/* WhatsApp Sharing Card (only if WhatsApp is active) */}
              {hasActiveWhatsApp && (
                <div style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5em'
                }}>
                  <h3 style={{ fontSize: '1.05em', color: '#333', marginTop: 0, marginBottom: '1.25em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                    <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', fontSize: '1.2em' }}></i>
                    {t('share.wspTitle')}
                  </h3>
                  <div style={{ marginBottom: '1em' }}>
                    <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>
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
                  <div style={{ marginBottom: '1em' }}>
                    <label style={{ display: 'block', fontSize: '0.8em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5em' }}>
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
          </div>
        )}
      </div>

      {/* Leads Section - Collapsible */}
      <div className="section" style={{ marginBottom: '1.5em' }}>
        <div
          onClick={() => setIsLeadsCollapsed(!isLeadsCollapsed)}
          className={`section-header ${!isLeadsCollapsed ? 'section-header-expanded' : ''}`}
        >
          <h2 className="section-title">
            <i className="fa-solid fa-address-book"></i>
            {t('title')}
            {leads.length > 0 && (
              <span className="section-count-badge">{leads.length}</span>
            )}
          </h2>
          <i className={`fa-solid fa-chevron-${isLeadsCollapsed ? 'down' : 'up'} section-chevron`}></i>
        </div>

        {!isLeadsCollapsed && (
          <div style={{ padding: '1em 0' }}>
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
                      <React.Fragment key={lead.leadid}>
                        <tr id={`lead-row-${lead.leadid}`}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                              <strong>{lead.first_name} {lead.last_name}</strong>
                              <span style={{ fontSize: '0.75em', color: '#999' }}>#{lead.ebc_id}</span>
                              <i
                                className="fa-solid fa-magnifying-glass"
                                style={{ color: expandedLeadSearches === lead.ebc_id ? '#007bff' : '#999', cursor: 'pointer', fontSize: '0.8em' }}
                                title={t('searches.title')}
                                onClick={() => toggleLeadSearches(lead.ebc_id)}
                              ></i>
                            </div>
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
                            {renderServiceDesired(lead.leadid, lead.service_desired)}
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
                        {expandedLeadSearches === lead.ebc_id && (
                          <tr className="lead-searches-row">
                            <td colSpan={7}>
                              {searchesLoading ? (
                                <p className="text-muted" style={{ padding: '0.75em 0', fontSize: '0.9em' }}>
                                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5em' }}></i>
                                  {t('searches.loading')}
                                </p>
                              ) : leadSearches.length === 0 ? (
                                <p className="text-muted" style={{ padding: '0.75em 0', fontSize: '0.9em' }}>
                                  {t('searches.noSearches')}
                                </p>
                              ) : (
                                <div className="lead-searches-container">
                                  <div style={{ fontSize: '0.85em', fontWeight: 600, marginBottom: '0.5em', color: '#555' }}>
                                    <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '0.4em' }}></i>
                                    {t('searches.title')} ({leadSearches.length})
                                  </div>
                                  {leadSearches.map((search) => (
                                    <div key={search.id} className="search-card">
                                      {search.sql_params && (
                                        <div className="search-params">
                                          {renderSqlParams(search.sql_params)}
                                        </div>
                                      )}
                                      <div className="search-meta">
                                        <span>
                                          <i className="fa-solid fa-calendar-plus" style={{ marginRight: '0.3em' }}></i>
                                          {t('searches.created')}: {formatDate(search.created_on)}
                                        </span>
                                        {search.last_run && (
                                          <span>
                                            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '0.3em' }}></i>
                                            {t('searches.lastRun')}: {formatDate(search.last_run)}
                                          </span>
                                        )}
                                        <a
                                          href="#"
                                          className="table-link"
                                          style={{ fontSize: '0.85em' }}
                                          onClick={(e) => { e.preventDefault(); setShowSqlId(showSqlId === search.id ? null : search.id); }}
                                        >
                                          {showSqlId === search.id ? t('searches.hideSql') : t('searches.viewSql')}
                                        </a>
                                      </div>
                                      <div className="search-repeat">
                                        <label className="repeat-toggle">
                                          <input
                                            type="checkbox"
                                            checked={getSearchSchedule(search.id).enabled}
                                            onChange={(e) => updateSearchSchedule(search.id, 'enabled', e.target.checked)}
                                          />
                                          <span style={{ fontSize: '0.85em', fontWeight: 600 }}>{t('searches.repeatSearch')}</span>
                                        </label>
                                        <span style={{ margin: '0 0.4em', color: '#666', fontSize: '0.85em' }}>{t('searches.every')}</span>
                                        <select
                                          className="repeat-select"
                                          value={getSearchSchedule(search.id).interval}
                                          onChange={(e) => updateSearchSchedule(search.id, 'interval', e.target.value)}
                                          disabled={!getSearchSchedule(search.id).enabled}
                                        >
                                          {[1, 2, 3, 4].map(n => (
                                            <option key={n} value={n}>{n}</option>
                                          ))}
                                        </select>
                                        <select
                                          className="repeat-select"
                                          value={getSearchSchedule(search.id).unit}
                                          onChange={(e) => updateSearchSchedule(search.id, 'unit', e.target.value)}
                                          disabled={!getSearchSchedule(search.id).enabled}
                                        >
                                          <option value="days">{t('searches.days')}</option>
                                          <option value="weeks">{t('searches.weeks')}</option>
                                        </select>
                                        <button
                                          className="btn-repeat-search"
                                          disabled={repeatSaving === search.id || !getSearchSchedule(search.id).enabled}
                                          onClick={() => saveRepeatSearch(search.id)}
                                        >
                                          <i className="fa-solid fa-floppy-disk" style={{ marginRight: '0.3em' }}></i>
                                          {repeatSaving === search.id ? t('searches.saving') : t('searches.save')}
                                        </button>
                                        {repeatSaved === search.id && (
                                          <span style={{ color: '#28a745', fontSize: '0.85em', fontWeight: 600 }}>
                                            <i className="fa-solid fa-circle-check" style={{ marginRight: '0.3em' }}></i>
                                            Saved!
                                          </span>
                                        )}
                                      </div>
                                      {showSqlId === search.id && search.sql && (
                                        <pre className="search-sql">{search.sql}</pre>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                <div className="table-footer">
                  {t('showingCount', { filtered: filteredLeads.length, total: leads.length })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collaborations Section - EasyBroker only */}
      {isEasyBrokerLevel && (
        <div className="section" style={{ marginBottom: '1.5em' }}>
          <div
            onClick={() => setIsCollaborationsCollapsed(!isCollaborationsCollapsed)}
            className={`section-header ${!isCollaborationsCollapsed ? 'section-header-expanded' : ''}`}
          >
            <h2 className="section-title">
              <i className="fa-solid fa-handshake"></i>
              {t('collaborations.title')}
              {collabProperties.length > 0 && (
                <span className="section-count-badge">{collabProperties.length}</span>
              )}
            </h2>
            <i className={`fa-solid fa-chevron-${isCollaborationsCollapsed ? 'down' : 'up'} section-chevron`}></i>
          </div>

          {!isCollaborationsCollapsed && (
            <div style={{ padding: '1em 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75em' }}>
                <p className="section-description" style={{ margin: 0 }}>{t('collaborations.description')}</p>
                <select
                  value={collabFilter}
                  onChange={(e) => { setCollabFilter(e.target.value); setSelectedCollabs(new Set()); }}
                  className="input"
                  style={{ width: 'auto', minWidth: '120px', fontSize: '0.85em' }}
                >
                  <option value="all">{t('collaborations.filterAll')}</option>
                  <option value="active">{t('collaborations.filterActive')}</option>
                  <option value="inactive">{t('collaborations.filterInactive')}</option>
                </select>
              </div>

              {collabLoading ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '1em 0' }}>{t('collaborations.loading')}</p>
              ) : collabError ? (
                <div className="alert alert-error">
                  <strong>{t('error')}</strong> {collabError}
                </div>
              ) : collabProperties.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '2em 0', fontSize: '0.9em' }}>
                  {t('collaborations.empty')}
                </p>
              ) : (
                <div className="table-container">
                  <table className="table collab-table">
                    <thead>
                      <tr>
                        <th>{t('collaborations.table.property')}</th>
                        <th>{t('collaborations.table.officeId')}</th>
                        <th>{t('collaborations.table.contact')}</th>
                        <th>{t('collaborations.table.priceCommission')}</th>
                        <th>{t('collaborations.table.date')}</th>
                        <th style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={filteredCollabs.length > 0 && selectedCollabs.size === filteredCollabs.length}
                            onChange={toggleSelectAllCollabs}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCollabs.map((prop, idx) => (
                        <tr key={prop.property_id + '-' + idx}>
                          <td>
                            <div>
                              {prop.public_url ? (
                                <a href={prop.public_url} target="_blank" rel="noopener noreferrer" className="table-link">
                                  {prop.property_id}
                                </a>
                              ) : <span>{prop.property_id}</span>}
                              {prop.property_type && (
                                <span className="table-badge" style={{ marginLeft: '0.5em', fontSize: '0.75em' }}>{prop.property_type}</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.9em', color: '#555', marginTop: '0.2em' }}>
                              {prop.title || '—'}
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong style={{ fontSize: '1.1em' }}>{prop.office_name || prop.office_id || '—'}</strong>
                              {prop.office_owner && (
                                <div style={{ fontSize: '1em', color: '#555', marginTop: '0.2em' }}>
                                  <i className="fa-solid fa-user" style={{ marginRight: '0.3em', fontSize: '0.85em' }}></i>
                                  {prop.office_owner}
                                </div>
                              )}
                              {prop.office_phone && (() => {
                                const phone = prop.office_phone.replace(/[^0-9+]/g, '');
                                const firstName = adminUser?.first_name || '';
                                const lastName = adminUser?.last_name || '';
                                const company = user?.company || '';
                                const propertyLink = prop.public_url || '';
                                const propertyId = prop.property_id || '';
                                const propertyTitle = prop.title || '';
                                const waMsg = encodeURIComponent(
                                  `Hola,\nMi nombre es ${firstName} ${lastName} de ${company}\n\nMe gustaría hablar contigo de su propiedad:\n${propertyId} - ${propertyTitle}\n${propertyLink}\n\nGracias\n\n---\n\nHi,\nMy name is ${firstName} ${lastName} from ${company}\n\nI would like to talk to you about property:\n${propertyId} - ${propertyTitle}\n${propertyLink}\n\nThank you`
                                );
                                return (
                                  <div style={{ fontSize: '1em', marginTop: '0.15em' }}>
                                    <a href={`https://wa.me/${phone}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="table-link">
                                      <i className="fa-brands fa-whatsapp" style={{ marginRight: '0.3em', fontSize: '0.95em', color: '#25D366' }}></i>
                                      {prop.office_phone}
                                    </a>
                                  </div>
                                );
                              })()}
                              {prop.office_email && (
                                <div style={{ fontSize: '1em', marginTop: '0.15em' }}>
                                  <i className="fa-solid fa-envelope" style={{ marginRight: '0.3em', fontSize: '0.85em', color: '#666' }}></i>
                                  <a href={`mailto:${prop.office_email}`} className="table-link">{prop.office_email}</a>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {prop.contact_name ? (
                              <a
                                href="#"
                                className="table-link"
                                onClick={(e) => { e.preventDefault(); scrollToLead(prop.contact_name); }}
                              >
                                {prop.contact_name}
                              </a>
                            ) : '—'}
                          </td>
                          <td>
                            <div>
                              {prop.price ? `$${Number(prop.price).toLocaleString()} ${prop.currency || 'MXN'}` : '—'}
                            </div>
                            <div style={{ color: '#28a745', fontWeight: 600, marginTop: '0.2em' }}>
                              {(() => {
                                if (!prop.commission_on_price || prop.commission_on_price === 'Unknown' || prop.commission_on_price === 'None/Not Shared') return '—';
                                const commVal = Number(String(prop.commission_on_price).replace(/[^0-9.-]/g, ''));
                                return (
                                  <>
                                    ${commVal.toLocaleString()} {prop.currency || 'MXN'}
                                    {commVal >= 50000 && <i className="fa-solid fa-fire" style={{ color: '#ff6600', marginLeft: '0.4em' }}></i>}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }} className="text-xs text-muted">
                            {formatDate(prop.date_run)?.split(',')[0] || '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4em' }}>
                              <input
                                type="checkbox"
                                checked={selectedCollabs.has(prop.property_id)}
                                onChange={() => toggleCollabSelected(prop.property_id)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              {prop.active_colab === false
                                ? <i className="fa-solid fa-eye-slash" style={{ color: '#dc3545', fontSize: '0.95em' }}></i>
                                : <i className="fa-solid fa-eye" style={{ color: '#28a745', fontSize: '0.95em' }}></i>
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('collaborations.showingCount', { count: filteredCollabs.length })}</span>
                    {selectedCollabs.size > 0 && (
                      <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85em', color: '#666' }}>
                          {t('collaborations.selected', { count: selectedCollabs.size })}
                        </span>
                        <button
                          onClick={() => bulkSetCollabActive(true)}
                          disabled={collabSaving}
                          className="btn btn-sm"
                          style={{ backgroundColor: '#28a745', color: '#fff', border: 'none' }}
                        >
                          {t('collaborations.activate')}
                        </button>
                        <button
                          onClick={() => bulkSetCollabActive(false)}
                          disabled={collabSaving}
                          className="btn btn-sm"
                          style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none' }}
                        >
                          {t('collaborations.deactivate')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={fetchCollaborations}
                disabled={collabLoading}
                className={`btn btn-sm ${collabLoading ? 'btn-secondary' : 'btn-primary'}`}
                style={{ marginTop: '0.75em' }}
              >
                {collabLoading ? t('buttons.loading') : t('buttons.refresh')}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
