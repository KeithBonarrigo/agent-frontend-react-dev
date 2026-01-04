import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || window.BACKEND_URL || "http://localhost:8000";

export default function PasswordResetConfirm() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validatePassword = (pwd) =>
    pwd.length >= 12 &&
    /[A-Za-z]/.test(pwd) &&
    /\d/.test(pwd) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  const handleSubmit = async () => {
    setError("");
    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Password must be at least 12 characters and include letters, numbers, and symbols.");
      return;
    }

    try {
        const res = await axios.post(`${BACKEND_URL}/password-reset/confirm`, {
        token,
        new_password: newPassword,
      });
      setSuccess(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Error resetting password.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>🔑 Reset Your Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button onClick={handleSubmit}>Reset Password</button>
      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
