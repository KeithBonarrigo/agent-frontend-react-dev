import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validatePassword = (pwd) => {
    return (
      pwd.length >= 12 &&
      /[A-Za-z]/.test(pwd) &&
      /\d/.test(pwd) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("❌ Passwords do not match.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("❌ Password must be at least 12 characters and include letters, numbers, and symbols.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "❌ Error resetting password.");
        return;
      }

      setSuccess("✅ Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError("❌ Server error.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
      <h2>🔑 Reset Your Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button className="btn" type="submit">Reset Password</button>
      </form>
      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
