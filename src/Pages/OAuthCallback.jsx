import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
import { getApiUrl } from '../utils/getApiUrl';

// OAuthCallback - Handles OAuth redirects from external providers (e.g., Google Calendar)
// Captures the authorization code and state from URL, exchanges it for tokens via backend
// Redirects user back to dashboard with success/error status
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { provider: urlProvider } = useParams(); // Get provider from URL path if available
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // Handle OAuth errors (user denied access, etc.)
      if (errorParam) {
        setStatus('error');
        setError(`Authorization failed: ${errorParam}`);
        setTimeout(() => {
          navigate('/dashboard?oauth=error&message=' + encodeURIComponent(errorParam));
        }, 2000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setError('Missing authorization code or state parameter');
        setTimeout(() => {
          navigate('/dashboard?oauth=error&message=' + encodeURIComponent('Missing parameters'));
        }, 2000);
        return;
      }

      // Decode state to get clientId (and optionally provider)
      let stateData;
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        setStatus('error');
        setError('Invalid state parameter');
        setTimeout(() => {
          navigate('/dashboard?oauth=error&message=' + encodeURIComponent('Invalid state'));
        }, 2000);
        return;
      }

      // Provider can come from URL path (e.g., /oauth/google-calendar/callback) or from state
      const provider = urlProvider || stateData.provider;
      const clientId = stateData.clientId;

      if (!provider || !clientId) {
        setStatus('error');
        setError('Invalid state data - missing provider or clientId');
        setTimeout(() => {
          navigate('/dashboard?oauth=error&message=' + encodeURIComponent('Invalid state data'));
        }, 2000);
        return;
      }

      try {
        // Exchange authorization code for tokens via backend
        const apiBaseUrl = getApiUrl();
        const response = await fetch(`${apiBaseUrl}/api/integrations/${provider}/oauth-callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, clientId }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to complete OAuth authorization');
        }

        setStatus('success');
        // Redirect back to dashboard with success message
        setTimeout(() => {
          navigate(`/dashboard?oauth=success&provider=${provider}&tab=addons`);
        }, 1500);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError(err.message);
        setTimeout(() => {
          navigate('/dashboard?oauth=error&message=' + encodeURIComponent(err.message));
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2em',
      textAlign: 'center'
    }}>
      {status === 'processing' && (
        <>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3em', color: '#007bff', marginBottom: '1em' }}></i>
          <h2 style={{ color: '#333', marginBottom: '0.5em' }}>Completing Authorization</h2>
          <p style={{ color: '#666' }}>Please wait while we connect your account...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <i className="fa-solid fa-check-circle" style={{ fontSize: '3em', color: '#28a745', marginBottom: '1em' }}></i>
          <h2 style={{ color: '#333', marginBottom: '0.5em' }}>Authorization Successful!</h2>
          <p style={{ color: '#666' }}>Redirecting you back to the dashboard...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <i className="fa-solid fa-exclamation-circle" style={{ fontSize: '3em', color: '#dc3545', marginBottom: '1em' }}></i>
          <h2 style={{ color: '#333', marginBottom: '0.5em' }}>Authorization Failed</h2>
          <p style={{ color: '#dc3545' }}>{error}</p>
          <p style={{ color: '#666', marginTop: '1em' }}>Redirecting you back to the dashboard...</p>
        </>
      )}
    </div>
  );
}
