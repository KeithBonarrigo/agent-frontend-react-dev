import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import ConfigurationsTab from '../components/ConfigurationsTab';
import ModelsTab from '../components/ModelsTab';
import IntegrationsTab from '../components/IntegrationsTab';
import ConversationsTab from '../components/ConversationsTab';
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading, logout } = useUser();
  const [activeTab, setActiveTab] = useState('configurations');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Tab styles
  const tabContainerStyle = {
    display: 'flex',
    borderBottom: '2px solid #ddd',
    marginTop: '2em',
    marginBottom: '2em'
  };

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    backgroundColor: isActive ? '#007bff' : 'transparent',
    color: isActive ? 'white' : '#333',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.3s ease',
    marginRight: '4px'
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ padding: "2em", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render if not logged in (will redirect)
  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <div style={{ padding: "2em", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "1em"
      }}>
        <h1>Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: "0.5em 1.5em",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      <p><strong>Welcome, {user.first_name} {user.last_name}!</strong></p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Client ID:</strong> {user.client_id}</p>
      <p><strong>Service Level:</strong> <span className="capitalize">{user.level}</span></p>

      {/* Tabs Navigation */}
      <div style={tabContainerStyle}>
        <button 
          style={tabStyle(activeTab === 'configurations')}
          onClick={() => setActiveTab('configurations')}
        >
          Configurations
        </button>
        <button 
          style={tabStyle(activeTab === 'models')}
          onClick={() => setActiveTab('models')}
        >
          Models
        </button>
        <button 
          style={tabStyle(activeTab === 'integrations')}
          onClick={() => setActiveTab('integrations')}
        >
          Integrations
        </button>
        <button 
          style={tabStyle(activeTab === 'conversations')}
          onClick={() => setActiveTab('conversations')}
        >
          Conversations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'configurations' && <ConfigurationsTab user={user} />}
      {activeTab === 'models' && <ModelsTab />}
      {activeTab === 'integrations' && <IntegrationsTab />}
      {activeTab === 'conversations' && <ConversationsTab />}
    </div>
  );
}
