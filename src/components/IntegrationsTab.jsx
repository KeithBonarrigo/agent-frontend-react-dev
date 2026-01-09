import { useEffect } from "react";

export default function IntegrationsTab({ user, clientId }) {
  // Debug logging
  useEffect(() => {
    console.log('===== IntegrationsTab DEBUG =====');
    console.log('clientId prop:', clientId);
    console.log('user:', user);
    console.log('=================================');
  }, [user, clientId]);

  if (!clientId) {
    return (
      <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
        <p>Please select a subscription to configure integrations.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2em", textAlign: "center", color: "#666" }}>
      <h2>Integrations</h2>
      <p style={{ marginBottom: "1em" }}>
        Subscription ID: <strong>{clientId}</strong>
      </p>
      <p>Integration settings coming soon...</p>
    </div>
  );
}