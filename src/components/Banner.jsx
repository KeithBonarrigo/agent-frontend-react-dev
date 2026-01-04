import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Layout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const cid = localStorage.getItem("client_id");
    setIsLoggedIn(!!cid);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("client_id");
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/logout`, {
      method: "POST",
    });
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header
        style={{
          width: "100%",
          padding: "1em 2em",
          backgroundColor: "#0a3d62",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "1.2rem",
          boxSizing: "border-box",
        }}
      >
        <span>🌎 TravelChatColombia</span>
        <nav style={{ display: "flex", gap: "1em" }}>
          <Link to="/payment" style={{ color: "white", textDecoration: "none" }}>Payment</Link>
          {isLoggedIn ? (
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
              Log Out
            </button>
          ) : (
            <Link to="/login" style={{ color: "white", textDecoration: "none" }}>Log In</Link>
          )}
        </nav>
      </header>

      <main style={{ width: "80%", maxWidth: "1100px", margin: "0 auto", padding: "2em 1em", flex: "1" }}>
        <Outlet />
      </main>
    </div>
  );
}
