// Shared by the dashboard and the StoreConnect setup panel (kept out of the
// component file so React Fast Refresh keeps working for it).

export const STORECONNECT_LEVEL = 'storeconnect';

// Agents on the "StoreConnect Store Assistant" plan get the store connection
// panel; every other plan is unaffected.
export function isStoreConnectAgent(agent) {
  const level = agent?.level || agent?.subscription_level;
  return String(level || '').toLowerCase() === STORECONNECT_LEVEL;
}

// sessionStorage key: the agent being connected, saved before the redirect to
// Salesforce and read by Dashboard.jsx when the merchant comes back, because
// the backend's return URL carries no query of its own.
export const RETURN_SELECTION_KEY = 'storeconnect_return';
