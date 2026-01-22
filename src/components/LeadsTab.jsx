import { useState, useEffect } from "react";

export default function LeadsTab({ clientId }) {
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
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
    return new Date(dateString).toLocaleDateString('en-US', {
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
      <div style={{ padding: '2em', textAlign: 'center', color: '#666' }}>
        <p>Please select a subscription to view leads.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2em", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5em', flexWrap: 'wrap', gap: '1em' }}>
        <h2 style={{ margin: 0 }}>Leads</h2>
        <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5em 1em',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '0.9em',
              minWidth: '200px'
            }}
          />
          <button
            onClick={fetchLeads}
            disabled={loading}
            style={{
              padding: '0.5em 1em',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9em'
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading && leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2em', color: '#666' }}>
          <p>Loading leads...</p>
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
      ) : filteredLeads.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3em',
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          color: '#666'
        }}>
          <p style={{ fontSize: '1.1em', margin: 0 }}>
            {searchTerm ? 'No leads match your search.' : 'No leads yet.'}
          </p>
          <p style={{ fontSize: '0.9em', marginTop: '0.5em', color: '#999' }}>
            Leads will appear here when captured by your agent.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Preferred Contact</th>
                <th style={thStyle}>Service Desired</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.leadid} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={tdStyle}>
                    <strong>{lead.first_name} {lead.last_name}</strong>
                  </td>
                  <td style={tdStyle}>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                        {lead.email}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={tdStyle}>
                    {lead.phone_number ? (
                      <a href={`tel:${lead.phone_number}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                        {lead.phone_number}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={tdStyle}>
                    {lead.preferred_contact ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25em 0.5em',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontSize: '0.85em'
                      }}>
                        {lead.preferred_contact}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={tdStyle}>
                    {lead.service_desired || '—'}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontSize: '0.85em', color: '#666' }}>
                    {formatDate(lead.date_created)}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '200px' }}>
                    {lead.notes ? (
                      <span style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={lead.notes}>
                        {lead.notes}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1em', color: '#666', fontSize: '0.9em' }}>
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '0.75em 1em',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '0.85em',
  color: '#495057'
};

const tdStyle = {
  padding: '0.75em 1em',
  fontSize: '0.9em'
};
