// pages/PasswordResetRequest.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";

export default function PasswordResetRequest() {
  const { t } = useTranslation('login');
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${getApiUrl()}/api/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('errors.resetFailed'));
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(t('errors.serverErrorRetry'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
        <h2>{t('passwordReset.checkEmailTitle')}</h2>
        <p>
          <Trans i18nKey="passwordReset.checkEmailMessage" ns="login" values={{ email }}>
            If an account exists for <strong>{{ email }}</strong>, you'll receive a password reset link shortly.
          </Trans>
        </p>
        <p style={{ color: "#666", fontSize: "14px" }}>
          {t('passwordReset.checkSpam')}
        </p>
        <Link to="/login" style={{ color: "#1e3a8a" }}>{t('links.backToLogin')}</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
      <h2>{t('passwordReset.title')}</h2>
      <p style={{ color: "#666" }}>{t('passwordReset.description')}</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t('placeholders.email')}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1em" }}
        />

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <div style={{ textAlign: "center", marginTop: "1em" }}>
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ display: "inline-block", width: "auto" }}
          >
            {loading ? t('buttons.sending') : t('buttons.sendResetLink')}
          </button>
        </div>
      </form>

      <div style={{ marginTop: "1em", textAlign: "center" }}>
        <Link to="/login" style={{ color: "#1e3a8a" }}>{t('links.backToLogin')}</Link>
      </div>
    </div>
  );
}