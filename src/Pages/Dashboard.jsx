import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading, logout } = useUser();

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
    <div style={{ padding: "2em", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "2em"
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

      <p>Welcome, {user.first_name} {user.last_name}!</p>
      <p>Email: {user.email}</p>
      <p>Client ID: {user.client_id}</p>
      <p>Level: {user.level}</p>
      
      {user.accounts && user.accounts.length > 1 && (
        <div style={{ marginTop: "2em" }}>
          <h3>Your Accounts:</h3>
          <ul>
            {user.accounts.map(acc => (
              <li key={acc.client_id}>
                {acc.level} - {acc.email}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}