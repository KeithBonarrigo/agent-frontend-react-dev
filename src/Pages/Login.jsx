import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser } from "../contexts/UserContext";
import { getApiUrl } from "../utils/getApiUrl";

export default function Login() {
  const { t } = useTranslation('login');

  // Debug logging for environment configuration
  useEffect(() => {
    console.log('🔧 ============ LOGIN PAGE ENV CONFIG ============');
    console.log('🔧 API_URL being used:', getApiUrl());
    console.log('🔧 Current hostname:', window.location.hostname);
    console.log('🔧 Current origin:', window.location.origin);
    console.log('🔧 ==============================================');
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });
  const [signupSuccess, setSignupSuccess] = useState(false);

  const navigate = useNavigate();
  const { login } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      // Always navigate to dashboard - subscription selection happens there
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || t('errors.serverError'));
    }
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (signupData.password !== signupData.confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
          first_name: signupData.firstName,
          last_name: signupData.lastName
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('errors.signupFailed'));
        return;
      }

      setSignupSuccess(true);
      setTimeout(() => {
        setShowSignup(false);
        setSignupSuccess(false);
        setSignupData({
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: ""
        });
      }, 2000);

    } catch (err) {
      console.error("Signup error:", err);
      setError(t('errors.serverError'));
    }
  };

  const toggleSignup = () => {
    setShowSignup(!showSignup);
    setError("");
    setSignupSuccess(false);
  };

  return (
    <div className="container" id="login-container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
      <h2>{showSignup ? t('pageTitle.createAccount') : t('pageTitle.login')}</h2>
      
      <div style={{
        maxHeight: showSignup ? "0" : "1000px",
        overflow: "hidden",
        transition: "max-height 0.5s ease-in-out",
        opacity: showSignup ? 0 : 1,
        transitionProperty: "max-height, opacity"
      }}>
        <form onSubmit={handleLogin}>
          <input
            id="email"
            type="email"
            name="email"
            placeholder={t('placeholders.email')}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            id="password"
            type="password"
            name="password"
            placeholder={t('placeholders.password')}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

          <div style={{ textAlign: "center", marginTop: "1em" }}>
            <a href="/password-reset/request" className="forgot">{t('links.forgotPassword')}</a>
          </div>

          <div style={{ textAlign: "center", marginTop: "1em" }}>
            <button className="btn" type="submit" style={{ display: "inline-block", width: "auto" }}>{t('buttons.logIn')}</button>
          </div>
        </form>
      </div>

      <div style={{
        maxHeight: showSignup ? "1000px" : "0",
        overflow: "hidden",
        transition: "max-height 0.5s ease-in-out",
        opacity: showSignup ? 1 : 0,
        transitionProperty: "max-height, opacity"
      }}>
        {signupSuccess ? (
          <div style={{ textAlign: "center", padding: "2em 0" }}>
            <h3 style={{ color: "green" }}>{t('success.accountCreated')}</h3>
            <p>{t('success.switchingToLogin')}</p>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <input
              type="text"
              name="firstName"
              placeholder={t('placeholders.firstName')}
              required
              value={signupData.firstName}
              onChange={handleSignupChange}
            />

            <input
              type="text"
              name="lastName"
              placeholder={t('placeholders.lastName')}
              required
              value={signupData.lastName}
              onChange={handleSignupChange}
            />

            <input
              type="email"
              name="email"
              placeholder={t('placeholders.email')}
              required
              value={signupData.email}
              onChange={handleSignupChange}
            />

            <input
              type="password"
              name="password"
              placeholder={t('placeholders.password')}
              required
              value={signupData.password}
              onChange={handleSignupChange}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder={t('placeholders.confirmPassword')}
              required
              value={signupData.confirmPassword}
              onChange={handleSignupChange}
            />

            {error && <p style={{ color: "red" }}>{error}</p>}

            <br /><button className="btn" type="submit">{t('buttons.createAccount')}</button>
          </form>
        )}
      </div>

      <div style={{ marginTop: "1em", textAlign: "center" }}>
        <span>{showSignup ? t('prompts.hasAccount') + " " : t('prompts.noAccount') + " "}</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            toggleSignup();
          }}
          style={{ cursor: "pointer", textDecoration: "underline" }}
        >
          {showSignup ? t('buttons.logIn') : t('buttons.createAccount')}
        </a>
      </div>
    </div>
  );
}