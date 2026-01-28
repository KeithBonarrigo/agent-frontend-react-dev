import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Login() {
  // Debug logging for environment configuration
  useEffect(() => {
    console.log('🔧 ============ LOGIN PAGE ENV CONFIG ============');
    console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL || '❌ NOT SET (using localhost:3000)');
    console.log('🔧 API_URL being used:', API_URL);
    console.log('🔧 Current hostname:', window.location.hostname);
    console.log('🔧 Current origin:', window.location.origin);
    console.log('🔧 MODE:', import.meta.env.MODE);
    console.log('🔧 PROD:', import.meta.env.PROD);
    console.log('🔧 DEV:', import.meta.env.DEV);
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
      setError(err.message || "❌ Server error.");
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
      setError("Passwords don't match");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/signup`, {
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
        setError(data.error || "Signup failed");
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
      setError("❌ Server error.");
    }
  };

  const toggleSignup = () => {
    setShowSignup(!showSignup);
    setError("");
    setSignupSuccess(false);
  };

  return (
    <div className="container" id="login-container" style={{ maxWidth: 400, margin: "auto", padding: "2em" }}>
      <h2>{showSignup ? "Create Account" : "Login"}</h2>
      
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
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ marginBottom: "1em" }}>
            <a href="/password-reset/request" className="forgot">Forgot password?</a>
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}
          <div id="login-submit-button-container">
            <button className="btn" type="submit">Log In</button>
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
            <h3 style={{ color: "green" }}>✅ Account Created!</h3>
            <p>Switching to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              required
              value={signupData.firstName}
              onChange={handleSignupChange}
            />

            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              required
              value={signupData.lastName}
              onChange={handleSignupChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={signupData.email}
              onChange={handleSignupChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={signupData.password}
              onChange={handleSignupChange}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              required
              value={signupData.confirmPassword}
              onChange={handleSignupChange}
            />

            {error && <p style={{ color: "red" }}>{error}</p>}

            <br /><button className="btn" type="submit">Create Account</button>
          </form>
        )}
      </div>

      <div style={{ marginTop: "1em", textAlign: "center" }}>
        <span>{showSignup ? "Already have an account? " : "Don't have an account? "}</span>
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            toggleSignup();
          }}
          style={{ cursor: "pointer", textDecoration: "underline" }}
        >
          {showSignup ? "Log In" : "Create Account"}
        </a>
      </div>
    </div>
  );
}