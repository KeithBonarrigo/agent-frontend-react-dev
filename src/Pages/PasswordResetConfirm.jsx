// pages/PasswordResetConfirm.jsx
import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function PasswordResetConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return (
      <div className="container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
        <h2>Invalid Link</h2>
        <p>This password reset link is invalid or has expired.</p>
        <Link to="/password-reset/request" style={{ color: "#1e3a8a" }}>
          Request a new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
        <h2 style={{ color: "green" }}>✅ Password Reset!</h2>
        <p>Your password has been updated successfully.</p>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
      <h2>Set New Password</h2>
      <p style={{ color: "#666" }}>Enter your new password below.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1em" }}
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1em" }}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button 
          className="btn" 
          type="submit" 
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}