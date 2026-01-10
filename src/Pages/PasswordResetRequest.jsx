// pages/PasswordResetRequest.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
        <h2>Check Your Email</h2>
        <p>If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.</p>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Don't see it? Check your spam folder.
        </p>
        <Link to="/login" style={{ color: "#1e3a8a" }}>← Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
      <h2>Reset Password</h2>
      <p style={{ color: "#666" }}>Enter your email and we'll send you a reset link.</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1em" }}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button 
          className="btn" 
          type="submit" 
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div style={{ marginTop: "1em" }}>
        <Link to="/login" style={{ color: "#1e3a8a" }}>← Back to Login</Link>
      </div>
    </div>
  );
}