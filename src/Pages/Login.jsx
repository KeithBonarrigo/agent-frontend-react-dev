import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext"; // Add this import

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [itemNames, setItemNames] = useState({});
  
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
  const { login, selectClient } = useUser(); // ✅ Get login and selectClient from context

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setAccounts([]);
    setSelectedClient(null);
    setItemNames({});

    try {
      // ✅ Use context login instead of direct fetch
      const data = await login(email, password);

      if (data.accounts.length === 1) {
        // Single account - navigate directly to dashboard
        navigate("/dashboard");
      } else {
        // Multiple accounts - show selection
        setAccounts(data.accounts);

        const lookups = await Promise.all(
          data.accounts.map(async (acc) => {
            const resp = await fetch(`${API_URL}/api/item-name?id=${acc.item_id}`);
            const json = await resp.json();
            return { item_id: acc.item_id, name: json.item_name };
          })
        );

        const namesMap = {};
        lookups.forEach((n) => {
          namesMap[n.item_id] = n.name;
        });

        setItemNames(namesMap);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "❌ Server error.");
    }
  };

  const handleSelect = async () => {
    if (selectedClient) {
      try {
        // ✅ Use context selectClient instead of localStorage
        await selectClient(selectedClient);
        navigate("/dashboard");
      } catch (err) {
        console.error("Client selection error:", err);
        setError(err.message || "Failed to select account");
      }
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

        {accounts.length > 1 && (
          <div style={{ marginTop: "2em" }}>
            <h4>Select a subscription:</h4>
            {accounts.map((acc, i) => (
              <div key={i} style={{ padding: "0.5em 0" }}>
                <label
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    alignItems: "center",
                    gap: "0.75em",
                    fontSize: "1rem"
                  }}
                >
                  <input
                    type="radio"
                    name="client"
                    value={acc.client_id}
                    onChange={() => setSelectedClient(acc.client_id)}
                    style={{ transform: "scale(1.2)", margin: 0 }}
                  />
                  <span>{itemNames[acc.item_id] || `Item ${acc.item_id}`}</span>
                </label>
              </div>
            ))}
            <button onClick={handleSelect} disabled={!selectedClient} style={{ marginTop: "1em" }}>
              Continue
            </button>
          </div>
        )}
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