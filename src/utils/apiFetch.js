// apiFetch.js
// fetch for calls to our own API (getApiUrl()). It always sends the login session
// cookie (credentials: 'include'): the backend rejects dashboard calls without a
// valid session. A 401 from our API while someone is logged in means that session
// has ended, so it fires SESSION_EXPIRED_EVENT: UserContext forgets the stored user
// and App.jsx sends the visitor to /login.
// Calls to other hosts (Google, Facebook, Stripe) and the public pre-login calls
// (contact form, sign-up, password reset) keep using fetch directly.

import { getApiUrl } from './getApiUrl';

export const SESSION_EXPIRED_EVENT = 'botwerx:session-expired';

function hasStoredUser() {
  try {
    return !!localStorage.getItem('user');
  } catch {
    return false;
  }
}

export async function apiFetch(input, init = {}) {
  const res = await fetch(input, { ...init, credentials: 'include' });
  if (res.status === 401 && hasStoredUser()) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url || '';
    if (url.startsWith(getApiUrl())) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  return res;
}

export default apiFetch;
