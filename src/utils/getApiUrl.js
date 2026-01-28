// getApiUrl.js
// Utility function to get the correct API URL based on the current domain

export function getApiUrl() {
  const hostname = window.location.hostname;

  // Check for AIBridge domains
  if (hostname.includes('aibridge.global') || hostname.includes('base')) {
    return 'https://chat.aibridge.global';
  }

  // Check for local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Allow override from env for local dev
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  // Check for BotWerx domains
  if (hostname.includes('botwerx.ai')) {
    // Dev environment
    if (hostname.includes('dev.botwerx.ai')) {
      return 'https://chatdev.botwerx.ai';
    }
    // Staging environment
    if (hostname.includes('staging.botwerx.ai')) {
      return 'https://chatstaging.botwerx.ai';
    }
    // Production (www, portal, etc.)
    return 'https://chat.botwerx.ai';
  }

  // Default fallback - try env var, then botwerx
  return import.meta.env.VITE_API_URL || 'https://chat.botwerx.ai';
}

export default getApiUrl;
