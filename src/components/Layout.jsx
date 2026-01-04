import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import footerLogo from "../assets/aibridge-logo-transparent.png";

export default function Layout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const navigate = useNavigate();

  useEffect(() => {
    const cid = localStorage.getItem("client_id");
    setIsLoggedIn(!!cid);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("client_id");
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/logout`, {
      method: "POST",
    });
    navigate("/login");
  };

  const navStyle = {
    color: "white",
    textDecoration: "none",
    padding: "0.4em 0.8em",      // ⬅️ smaller padding
    borderRadius: "4px",
    border: "1px solid white",
    backgroundColor: "transparent",
    fontWeight: "500",           // ⬅️ slightly lighter than bold
    fontSize: "0.9rem",          // ⬅️ smaller font
    lineHeight: "1",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "2.2em",             // ⬅️ reduced height
    boxSizing: "border-box",
    cursor: "pointer",
    transition: "background-color 0.3s ease"
  };
  

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header id="layout_header">
        <span>🌎&nbsp;TravelChatColombia</span>

        <nav
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "1em",
            alignItems: "center",
            justifyContent: "right",
            width: "100%"
          }}
        >
          <Link className="nav-button" to="/payment" style={navStyle}>Payment</Link>

          {isLoggedIn && (
            <button className="nav-button"
              onClick={() => {
                const cid = localStorage.getItem("client_id");
                navigate(`/dashboard?client_id=${cid}`);
              }}
            >
              Dashboard
            </button>
          )}

          {isLoggedIn ? (
            <button className="nav-button" onClick={handleLogout}>Log Out</button>
          ) : (
            <Link className="nav-button" to="/login">Log In</Link>
          )}
        </nav>
      </header>

      <main
        style={{
          width: "80%",
          maxWidth: "1100px",
          margin: "0 auto",
          marginTop: "2em",
          marginBottom: "2em",
          padding: "2em 1em",
          flex: "1",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff"
        }}
      >
        <Outlet />
      </main>

      <footer style={{
        width: "100%",
        padding: "1em",
        backgroundColor: "#FFF",
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#666",
        borderTop: "3px solid #0a3d62",
        background: "linear-gradient(to bottom, #f0f0f0, #ffffff)"
      }}>
        <div style={{ marginBottom: "0.5em" }}>
          &copy; {new Date().getFullYear()} Powered By{" "}
          <a target="_blank" href="https://aibridge.global"><img
            src={footerLogo}
            alt="TravelChatColombia Logo"
            style={{
              height: "40px",
              objectFit: "contain",
              verticalAlign: "middle"
            }}
          /></a>{" "}
          All rights reserved.
        </div>
      </footer>
    </div>
  );
}
