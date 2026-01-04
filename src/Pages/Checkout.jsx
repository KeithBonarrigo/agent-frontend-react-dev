import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import CountrySelect from "../components/CountrySelect";
import stripeLogo from "../assets/stripe-logo.png";

axios.defaults.withCredentials = true;

export default function Checkout() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("p__Yth0n@#@#");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("2068527019");
  const [usesWhatsapp, setUsesWhatsapp] = useState(false);
  const [usesMessenger, setUsesMessenger] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [linkResult, setLinkResult] = useState("");
  const [itemCost, setItemCost] = useState(null);
  const [billingCycle, setBillingCycle] = useState(null);
  const [billingCycleCount, setBillingCycleCount] = useState(null);

  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("service_id") || "206";
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || window.BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    if (serviceId === "206") {
      setUsesWhatsapp(true);
    }
  }, [serviceId]);

  useEffect(() => {
    if (accountType === "new") setConfirmPassword("");
  }, [accountType]);

  useEffect(() => {
    const loadSessionUser = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/session-user`, { withCredentials: true });
        if (res.data.first_name) setFirstName(res.data.first_name);
        if (res.data.last_name) setLastName(res.data.last_name);
      } catch (err) {
        console.log("No user session or failed to load:", err);
      }
    };

    loadSessionUser();
  }, []);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/item-name?id=${serviceId}`);
        if (res.data.first_name) setFirstName(res.data.first_name);
        if (res.data.last_name) setLastName(res.data.last_name);
        setItemCost(res.data.cost_in_usd);
        setBillingCycle(res.data.billing_cycle);
        setBillingCycleCount(res.data.billing_cycle_count);
      } catch (err) {
        console.error("Error fetching item details:", err);
        setError("❌ Unable to fetch pricing details.");
      }
    };

    fetchItemDetails();
  }, [serviceId]);

  useEffect(() => {
    const tryPopulateFromSessionOrStorage = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/session-user`, {
          withCredentials: true,
        });

        if (res.data.email) {
          setEmail(res.data.email);
          localStorage.setItem("email", res.data.email);
          console.log("📥 session email", res.data.email);
        }

        if (res.data.first_name) {
          setFirstName(res.data.first_name);
          localStorage.setItem("first_name", res.data.first_name);
        }

        if (res.data.last_name) {
          setLastName(res.data.last_name);
          localStorage.setItem("last_name", res.data.last_name);
        }
      } catch {
        if (typeof window !== "undefined") {
          const storedEmail = localStorage.getItem("email");
          const storedFirst = localStorage.getItem("first_name");
          const storedLast = localStorage.getItem("last_name");

          if (storedEmail) setEmail(storedEmail);
          if (storedFirst) setFirstName(storedFirst);
          if (storedLast) setLastName(storedLast);
        }
      }
    };

    tryPopulateFromSessionOrStorage();
  }, []);

  const validatePassword = (pwd) =>
    pwd.length >= 12 &&
    /[A-Za-z]/.test(pwd) &&
    /\d/.test(pwd) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

  const handleSubmit = async () => {
  setError("");
  setLinkResult("");
  let validatedClientId = null; // ✅ Moved to the top

  if (serviceId === "206" && !usesWhatsapp) {
    setError("❌ You must agree to WhatsApp communication for this service.");
    return;
  }

  if (!accountType || !email || !password || !phone || !countryCode) {
    setError("❌ All fields are required.");
    return;
  }

  if (!acceptedTerms) {
    setError("❌ You must accept the terms and conditions.");
    return;
  }

  if (accountType === "new") {
    if (!confirmPassword) {
      setError("❌ Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("❌ Passwords do not match.");
      return;
    }

    if (!validatePassword(password)) {
      setError("❌ Password must be at least 12 characters with symbols and numbers.");
      return;
    }

    try {
      const res = await axios.post(`${BACKEND_URL}/api/check-or-create-account`, {
        email,
        item: serviceId,
        phone: `${countryCode}${phone.replace(/\D/g, "")}`,
        password,
        uses_whatsapp: usesWhatsapp,
        first_name: firstName,
        last_name: lastName,
      });

      if (res.data.exists) {
        setError("⚠️ An account already exists with this email. Try logging in.");
        return;
      } else {
        console.log("✅ New account created with ID:", res.data.client_id);
        validatedClientId = res.data.client_id;
      }
    } catch (err) {
      console.error("❌ Error creating account:", err);
      setError("❌ Unable to create account. Try again later.");
      return;
    }
  }

  //let validatedClientId = null;

  if (accountType === "existing") {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/validate-user`, {
        email,
        password,
        item: serviceId,
      });

      if (!res.data.success) {
        if (!res.data.item_ok) setAccountType("new");
        setError(`❌ ${res.data.error || "Invalid login."}`);
        return;
      }

      validatedClientId = res.data.client_id;
    } catch (err) {
      console.error("Validation error:", err);
      setError("❌ Error validating user.");
      return;
    }
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const cleanPhone = phone.replace(/\D/g, "");
  const userPhone = `${countryCode}${cleanPhone}`;

  const payload = {
    email,
    password_hash: hashHex,
    phone: userPhone,
    uses_whatsapp: usesWhatsapp,
    uses_messenger: usesMessenger,
    item_name: "TravelChatColombia Access",
    service_id: serviceId,
    amount: itemCost ? Math.round(itemCost * 100) : 1000,
    first_name: firstName,
    last_name: lastName,
  };

  if (validatedClientId) payload.client_id = validatedClientId;

  console.log("🚀 Payload to Stripe:", payload);

  try {
    const res = await axios.post(`${BACKEND_URL}/create-checkout-session`, payload);
    if (res.data?.url) {
      setLinkResult(
        <a
          href={res.data.url}
          target="_blank"
          rel="noreferrer"
          style={{ color: "green", fontWeight: "bold" }}
        >
          ✅ Click here to pay securely
        </a>
      );
    } else {
      setError("❌ No payment link received.");
    }
  } catch (err) {
    console.error("Checkout error:", err);
    setError("❌ Payment failed.");
  }
};

  return (
    <div id="checkout-container">
      <div id="checkout-upper-header"><h2 id="checkout-title">TravelChat Colombia</h2></div>
      <div style={{ display: "flex", alignItems: "center", textAlign: "center", margin: "auto" }} id="payment_title"><h3 style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>Secure Checkout with <img style={{ width: "80px", marginTop: ".5em" }} alt="Payments with Stripe" src={stripeLogo} /></h3></div>

      {itemCost && billingCycle && billingCycleCount && (
        <p id="payment_description">
          <strong>${itemCost.toFixed(2)}</strong> billed for{" "}
          <strong>
            {billingCycleCount} {billingCycleCount > 1 ? `${billingCycle}s` : billingCycle}
          </strong>{" "}
          of access
        </p>
      )}
      <hr className="checkout-hr" />
      <p className="field-fill-message">
        * All fields are required
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1em", columnGap: "1em" }}>
        <label htmlFor="accountType">This is:</label>
        <select
          id="accountType"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          required
        >
          <option value="">Select one...</option>
          <option value="existing">An existing account</option>
          <option value="new">A new account</option>
        </select>
      </div>
      <div id="name_container" className="container">
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            id="checkout_first_name"
            value={firstName}
            onChange={(e) => {
              const value = e.target.value;
              setFirstName(value);
              localStorage.setItem("first_name", value);
            }}
            required
          />

          <label>Last Name</label>
          <input
            type="text"
            id="checkout_last_name"
            value={lastName}
            onChange={(e) => {
              const value = e.target.value;
              setLastName(value);
              localStorage.setItem("last_name", value);
            }}
            required
          />
        </div>
      </div>
      <hr className="checkout-hr" />
      {/*<div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "1em" }}>
        <label htmlFor="accountType">This is:</label>
        <select
          id="accountType"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          required
        >
          <option value="">Select one...</option>
          <option value="existing">An existing account</option>
          <option value="new">A new account</option>
        </select>
      </div>
      */}
      <div className="container">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            id="checkout_email"
            value={email}
            onChange={(e) => {
              const value = e.target.value;
              setEmail(value);
              if (typeof window !== "undefined") {
                localStorage.setItem("email", value);
              }
            }}
            required
          />
        </div>
      </div>

      <div className="container">
        <div className="form-group">
          <label>Password</label>
          <input
            id="checkout_password"
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        
        {accountType === "new" && (
          <div className="form-group">
            <label id="confirm_pass_label">Confirm<br />Password</label>
            <input
              id="checkout_password_confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}
        
      </div>

      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            className="checkout"
            checked={usesMessenger}
            onChange={() => setUsesMessenger(!usesMessenger)}
          />
          I use Messenger and agree to be contacted via Messenger
        </label>
      </div>
      <hr className="checkout-hr" />
      <div className="container">

        
            <CountrySelect id="country_selector" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} />
       

        <div className="form-group">
          <label>Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

      </div>
      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            className="checkout"
            checked={usesWhatsapp}
            onChange={() => setUsesWhatsapp(!usesWhatsapp)}
          />
          I use WhatsApp and agree to be contacted via WhatsApp
        </label>
      </div>
      <hr className="checkout-hr" />
      <div style={{ marginTop: "1em", padding: "1em" }}>
        <button
          type="button"
          onClick={() => setShowTerms(!showTerms)}
          style={{
            background: "none",
            color: "#0a3d62",
            border: "none",
            outline: "none",
            cursor: "pointer",
            padding: 0,
            marginBottom: "0.5em",
            display: "flex",
            alignItems: "center",
            gap: "0.5em",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transition: "transform 0.3s ease",
              transform: showTerms ? "rotate(90deg)" : "rotate(0deg)",
              fontSize: "1.75rem",
            }}
          >
            ►
          </span>
          <span style={{ textDecoration: "underline" }}>
            {showTerms ? "Hide Terms and Conditions" : "Read Terms and Conditions"}
          </span>
        </button>

        {showTerms && (
          <div
            style={{
              border: "1px solid #ccc",
              padding: "1em",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
              maxHeight: "300px",
              overflowY: "auto",
              marginBottom: "1em",
            }}
          >
            <h4>Terms and Conditions</h4>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque euismod...
            </p>
          </div>
        )}
      </div>

      <div className="checkbox-group" style={{ marginTop: "1em" }}>
        <label>
          <input
            type="checkbox"
            className="checkout"
            checked={acceptedTerms}
            onChange={() => setAcceptedTerms(!acceptedTerms)}
          />
          I agree to the terms and conditions
        </label>
      </div>

      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      {linkResult && <div style={{ marginTop: 10, textAlign: "center" }}>{linkResult}</div>}

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button onClick={handleSubmit}>Create Payment Link</button>
      </div>
    </div>
  );
}
