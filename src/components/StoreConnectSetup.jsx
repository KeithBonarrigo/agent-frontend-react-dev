import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../utils/getApiUrl";
import { RETURN_SELECTION_KEY } from "../utils/storeconnect";
import "./Tabs.css";

// StoreConnectSetup - connects a "StoreConnect Store Assistant" agent to the
// merchant's Salesforce org. Shown at the top of the Configurations tab for
// agents on the `storeconnect` level only: like the MLS / EasyBroker API keys,
// this belongs to the plan, not to a selectable add-on.
//
// Backend: endpointRoutes/storeConnect.js in the API. Every call sends the
// login session (credentials: 'include'); the routes reject requests without it.
//   GET    /api/clients/:id/storeconnect/status   → status, app, callback_url, salesforce, store, sync,
//            in_chat_payment (the store's API key is saved), api_base_url (never the key),
//            share_coupon_codes, api_checkout_physical
//   PUT    /api/clients/:id/storeconnect/app      step 1: the merchant's own External Client App
//   GET    /api/clients/:id/storeconnect/connect  step 2: { url } → Salesforce consent. Salesforce
//            returns to /dashboard?oauth=success|error&provider=storeconnect
//            &storeconnect=connected|choose_store|error&reason=… (the return URL keeps no query
//            of its own, so the agent being connected is remembered in sessionStorage)
//   GET    /api/clients/:id/storeconnect/stores   step 3, only when the org has several stores
//   POST   /api/clients/:id/storeconnect/store
//   POST   /api/clients/:id/storeconnect/sync     ready: re-sync now (202), then poll the status
//   DELETE /api/clients/:id/storeconnect          ready: revoke access; the saved app is kept
//   PUT    /api/clients/:id/storeconnect/settings ready: { share_coupon_codes } or { api_checkout_physical }
//            → { success, settings }; the physical-goods switch shows only when in_chat_payment is true
//   PUT    /api/clients/:id/storeconnect/api-key  ready: { api_key, api_base_url? } → { success, in_chat_payment,
//            api_store, api_base_url }. Without a base URL the backend detects it; api_key "" removes the key
// Shown only when utils/storeconnect.js's isStoreConnectAgent(agent) is true.

const LOGO = '/img/add-ons/storeconnect-logo.webp';
const POLL_MS = 10000;
const OAUTH_PARAMS = ['oauth', 'provider', 'message', 'storeconnect', 'reason', 'tab'];
const EMPTY_APP_FORM = { client_id: '', client_secret: '', environment: 'production', login_url: '' };
const EMPTY_KEY_FORM = { api_key: '', api_base_url: '' };
// Saved-setting banners: storeconnect.ready.<name>On / <name>Off
const SETTING_MESSAGES = { share_coupon_codes: 'coupons', api_checkout_physical: 'physical' };

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { /* no JSON body */ }
  return { ok: res.ok, status: res.status, data: data || {} };
}

// The backend answers with short error codes (client_id_required, app_required, …)
// that have translations, or with a readable sentence for unexpected failures.
function errorText(t, res) {
  const code = res.data?.error;
  const known = code ? t(`storeconnect.errors.${code}`, { defaultValue: '' }) : '';
  return known || res.data?.message || code || t('storeconnect.errors.generic', { status: res.status });
}

function stepStates(status) {
  const s = status?.status;
  const appDone = !!status?.app?.configured;
  const connected = s === 'choose_store' || s === 'ready';
  return {
    app: appDone ? 'done' : 'current',
    connect: !appDone ? 'pending' : connected ? 'done' : 'current',
    store: s === 'choose_store' ? 'current' : status?.store ? 'done' : 'pending',
  };
}

function Step({ n, state, title, children }) {
  const color = state === 'done' ? '#28a745' : state === 'current' ? 'var(--hv3-brand, #007bff)' : '#adb5bd';
  return (
    <li style={{ display: 'flex', gap: '0.9em', padding: '0.9em 0', borderTop: '1px solid #e2e8f0', opacity: state === 'pending' ? 0.65 : 1 }}>
      <span aria-hidden="true" style={{ flex: 'none', width: 28, height: 28, borderRadius: '50%', backgroundColor: color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85em' }}>
        {state === 'done' ? <i className="fa-solid fa-check"></i> : n}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.35em' }}>{title}</div>
        {children}
      </div>
    </li>
  );
}

const labelStyle = { display: 'block', fontWeight: 600, color: '#333', fontSize: '0.85em', marginBottom: '0.25em' };
const inputStyle = { width: '100%', boxSizing: 'border-box' };
const mutedStyle = { color: '#666', fontSize: '0.9em', margin: 0 };
// min(220px, 100%): on phones the single column fits the box instead of overflowing it
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '0.75em' };
const errorStyle = { color: '#dc3545', fontSize: '0.85em', fontWeight: 600, margin: '0.5em 0 0' };
// White boxes under the steps; their padding is in Tabs.css (.sc-box) so phones can tighten it
const boxStyle = { marginTop: '0.75em', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 };
const ruleStyle = { marginTop: '1em', paddingTop: '1em', borderTop: '1px solid #e2e8f0' };
const pillStyle = (on) => ({ display: 'inline-block', padding: '0.1em 0.6em', borderRadius: 999, fontSize: '0.8em', fontWeight: 600,
  color: on ? '#1e7e34' : '#555', backgroundColor: on ? '#e6f4ea' : '#eef0f2' });

// A labelled on/off switch (Tabs.css .toggle-switch)
function SettingSwitch({ id, checked, saving, label, help, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6em 0.9em', alignItems: 'flex-start' }}>
      <button type="button" id={id} role="switch" aria-checked={checked} aria-describedby={`${id}-help`}
        className={`toggle-switch ${checked ? 'active' : 'inactive'}`} onClick={onToggle} disabled={saving}>
        <span className={`toggle-knob ${checked ? 'active' : 'inactive'}`}>
          {saving && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '0.7em', color: '#999' }}></i>}
        </span>
      </button>
      {/* 220px basis: on phones the text drops below the switch instead of a narrow column */}
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <label htmlFor={id} style={{ fontWeight: 600, color: '#333', cursor: 'pointer' }}>{label}</label>
        <p id={`${id}-help`} style={{ ...mutedStyle, fontSize: '0.85em', marginTop: '0.2em' }}>{help}</p>
      </div>
    </div>
  );
}

export default function StoreConnectSetup({ clientId, agent }) {
  const { t } = useTranslation('configurations');
  const sc = (key, opts) => t(`storeconnect.${key}`, opts);
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', text }
  const bannerTimer = useRef(null);

  // Step 1: the Salesforce app
  const [editingApp, setEditingApp] = useState(false);
  const [appForm, setAppForm] = useState(EMPTY_APP_FORM);
  const [appSaving, setAppSaving] = useState(false);
  const [appError, setAppError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Step 2: connect
  const [connecting, setConnecting] = useState(false);

  // Step 3: choose the store
  const [chooserOpen, setChooserOpen] = useState(false);
  const [stores, setStores] = useState(null);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState(null);
  const [storeChoice, setStoreChoice] = useState('');
  const [storefrontUrl, setStorefrontUrl] = useState('');
  const [storeSaving, setStoreSaving] = useState(false);

  // Ready
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Assistant settings: the setting being saved, and the store's Commerce API key
  const [settingSaving, setSettingSaving] = useState(null);
  const [keyFormOpen, setKeyFormOpen] = useState(false);
  const [keyForm, setKeyForm] = useState(EMPTY_KEY_FORM);
  const [keySaving, setKeySaving] = useState(false);
  const [keyError, setKeyError] = useState(null);

  const showBanner = (type, text, ms = 6000) => {
    clearTimeout(bannerTimer.current);
    setBanner({ type, text });
    bannerTimer.current = setTimeout(() => setBanner(null), ms);
  };
  useEffect(() => () => clearTimeout(bannerTimer.current), []);

  const loadStatus = useCallback(async ({ silent = false } = {}) => {
    if (!clientId) return null;
    if (!silent) setStatusLoading(true);
    try {
      const res = await api(`/api/clients/${clientId}/storeconnect/status`);
      if (!res.ok) throw new Error(errorText(t, res));
      setStatus(res.data);
      setStatusError(null);
      return res.data;
    } catch (err) {
      setStatusError(err.message);
      return null;
    } finally {
      if (!silent) setStatusLoading(false);
    }
  }, [clientId, t]);

  // Load on mount and whenever the selected agent changes
  useEffect(() => {
    setStatus(null);
    setStatusError(null);
    setEditingApp(false);
    setChooserOpen(false);
    setStores(null);
    setKeyFormOpen(false);
    setKeyForm(EMPTY_KEY_FORM);
    setKeyError(null);
    loadStatus();
  }, [loadStatus]);

  // Back from Salesforce: show the outcome, reload, and open step 3 when the
  // org has several stores. The params are consumed so a refresh doesn't repeat it.
  useEffect(() => {
    if (searchParams.get('provider') !== 'storeconnect') return;
    const outcome = searchParams.get('storeconnect');
    const message = searchParams.get('message');
    if (searchParams.get('oauth') === 'success' && outcome !== 'error') {
      showBanner('success', outcome === 'choose_store' ? sc('messages.chooseStore') : sc('messages.connected'));
      if (outcome === 'choose_store') setChooserOpen(true);
    } else {
      showBanner('error', message || sc('messages.connectFailed'), 10000);
    }
    const next = new URLSearchParams(searchParams);
    OAUTH_PARAMS.forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
    loadStatus({ silent: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Step 3 opens by itself while a store still has to be chosen
  useEffect(() => {
    if (status?.status === 'choose_store') setChooserOpen(true);
  }, [status?.status]);

  // Read the org's stores whenever the chooser is open
  useEffect(() => {
    if (!chooserOpen || !clientId) return;
    let cancelled = false;
    (async () => {
      setStoresLoading(true);
      setStoresError(null);
      const res = await api(`/api/clients/${clientId}/storeconnect/stores`);
      if (cancelled) return;
      if (!res.ok) {
        setStores([]);
        setStoresError(errorText(t, res));
      } else {
        const list = res.data.stores || [];
        setStores(list);
        setStoreChoice(res.data.selected || list[0]?.id || '');
      }
      setStoresLoading(false);
    })();
    return () => { cancelled = true; };
  }, [chooserOpen, clientId, t]);

  // Poll while a sync runs (and briefly after "Sync now", until the run shows up)
  const running = status?.sync?.lastRun?.status === 'running';
  useEffect(() => {
    if (!running && !syncing) return;
    const id = setTimeout(async () => {
      const next = await loadStatus({ silent: true });
      if (next && next.sync?.lastRun?.status !== 'running') setSyncing(false);
    }, running ? POLL_MS : 2500);
    return () => clearTimeout(id);
  }, [running, syncing, status, loadStatus]);

  // ---------------- Step 1 ----------------
  const startEditApp = () => {
    const env = status?.app?.environment || 'production';
    setAppForm({ ...EMPTY_APP_FORM, environment: env, login_url: env === 'custom' ? (status?.app?.login_url || '') : '' });
    setAppError(null);
    setEditingApp(true);
  };

  const saveApp = async (e) => {
    e.preventDefault();
    setAppError(null);
    const env = appForm.environment;
    const body = {
      client_id: appForm.client_id.trim(),
      client_secret: appForm.client_secret.trim(),
      environment: env === 'sandbox' ? 'sandbox' : 'production',
    };
    if (env === 'custom') {
      if (!appForm.login_url.trim()) {
        setAppError(sc('errors.login_url_required'));
        return;
      }
      body.login_url = appForm.login_url.trim();
    }
    setAppSaving(true);
    const res = await api(`/api/clients/${clientId}/storeconnect/app`, { method: 'PUT', body });
    setAppSaving(false);
    if (!res.ok) {
      setAppError(errorText(t, res));
      return;
    }
    setEditingApp(false);
    setAppForm(EMPTY_APP_FORM);
    if (res.data.reconnect_needed) showBanner('error', sc('app.reconnectNeeded'), 10000);
    else showBanner('success', sc('app.savedMessage'));
    loadStatus({ silent: true });
  };

  const copyCallback = async () => {
    const url = status?.callback_url || '';
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(sc('app.copyFallback'), url);
    }
  };

  // ---------------- Step 2 ----------------
  const connect = async () => {
    setConnecting(true);
    try {
      sessionStorage.setItem(RETURN_SELECTION_KEY, JSON.stringify({ clientId, subscriptionId: agent?.subscriptionid ?? null }));
    } catch { /* storage unavailable: the dashboard falls back to its first agent */ }
    const returnTo = encodeURIComponent(`${window.location.origin}/dashboard`);
    const res = await api(`/api/clients/${clientId}/storeconnect/connect?returnTo=${returnTo}`);
    if (!res.ok || !res.data.url) {
      setConnecting(false);
      if (res.data?.error === 'app_required') setEditingApp(true);
      showBanner('error', errorText(t, res), 10000);
      return;
    }
    window.location.href = res.data.url;
  };

  // ---------------- Step 3 ----------------
  const chosenStore = stores?.find((s) => s.id === storeChoice);
  const needsStorefrontUrl = !!chosenStore && !chosenStore.url;

  const saveStore = async (e) => {
    e.preventDefault();
    if (!storeChoice) return;
    setStoreSaving(true);
    setStoresError(null);
    const body = { store_sfid: storeChoice };
    if (needsStorefrontUrl) body.storefront_url = storefrontUrl.trim();
    const res = await api(`/api/clients/${clientId}/storeconnect/store`, { method: 'POST', body });
    setStoreSaving(false);
    if (!res.ok) {
      setStoresError(errorText(t, res));
      return;
    }
    setChooserOpen(false);
    setSyncing(true);
    showBanner('success', sc('store.saved'));
    loadStatus({ silent: true });
  };

  // ---------------- Ready ----------------
  const syncNow = async () => {
    setSyncing(true);
    const res = await api(`/api/clients/${clientId}/storeconnect/sync`, { method: 'POST', body: { full: true } });
    if (!res.ok) {
      setSyncing(false);
      showBanner('error', errorText(t, res), 10000);
      return;
    }
    showBanner('success', sc('ready.syncStarted'));
  };

  const disconnect = async () => {
    if (!window.confirm(sc('ready.confirmDisconnect'))) return;
    setDisconnecting(true);
    const res = await api(`/api/clients/${clientId}/storeconnect`, { method: 'DELETE' });
    setDisconnecting(false);
    if (!res.ok) {
      showBanner('error', errorText(t, res), 10000);
      return;
    }
    setChooserOpen(false);
    setStores(null);
    setSyncing(false);
    showBanner('success', sc('ready.disconnected'));
    loadStatus({ silent: true });
  };

  // ---------------- Assistant settings ----------------
  // share_coupon_codes: may the assistant quote promotion coupon codes (default no).
  // api_checkout_physical: the store's API doesn't price shipping, so the backend keeps
  // chat orders to digital/virtual products unless this is on.
  const saveSetting = async (key, value) => {
    setSettingSaving(key);
    const res = await api(`/api/clients/${clientId}/storeconnect/settings`, { method: 'PUT', body: { [key]: value } });
    setSettingSaving(null);
    if (!res.ok) {
      showBanner('error', errorText(t, res), 10000);
      return;
    }
    const settings = res.data.settings || { [key]: value };
    setStatus((prev) => (prev ? { ...prev, ...settings } : prev));
    showBanner('success', sc(`ready.${SETTING_MESSAGES[key]}${settings[key] ? 'On' : 'Off'}`));
  };

  // The store's Commerce API key turns on in-chat ordering. The merchant creates it as the
  // api.auth_key store variable on their Store record; the backend adds the store id itself.
  const openKeyForm = () => {
    setKeyForm(EMPTY_KEY_FORM);
    setKeyError(null);
    setKeyFormOpen(true);
  };

  // A failed check lists the API addresses the backend tried
  const keyErrorText = (res) => {
    const tried = Array.isArray(res.data?.tried) ? res.data.tried.filter(Boolean) : [];
    return tried.length ? `${errorText(t, res)} ${sc('ordering.tried', { urls: tried.join(', ') })}` : errorText(t, res);
  };

  const saveKey = async (e) => {
    e.preventDefault();
    const apiKey = keyForm.api_key.trim();
    // An empty key would remove the saved one; removing has its own button
    if (!apiKey) {
      setKeyError(sc('errors.api_key_required'));
      return;
    }
    setKeyError(null);
    setKeySaving(true);
    const body = { api_key: apiKey };
    if (keyForm.api_base_url.trim()) body.api_base_url = keyForm.api_base_url.trim();
    const res = await api(`/api/clients/${clientId}/storeconnect/api-key`, { method: 'PUT', body });
    setKeySaving(false);
    if (!res.ok) {
      setKeyError(keyErrorText(res));
      return;
    }
    setKeyFormOpen(false);
    setKeyForm(EMPTY_KEY_FORM);
    setStatus((prev) => (prev ? { ...prev, in_chat_payment: !!res.data.in_chat_payment, api_base_url: res.data.api_base_url ?? prev.api_base_url } : prev));
    const store = res.data.api_store?.name;
    showBanner('success', store ? sc('ordering.savedFor', { store }) : sc('ordering.saved'));
    loadStatus({ silent: true });
  };

  const removeKey = async () => {
    if (!window.confirm(sc('ordering.confirmRemove'))) return;
    setKeySaving(true);
    const res = await api(`/api/clients/${clientId}/storeconnect/api-key`, { method: 'PUT', body: { api_key: '' } });
    setKeySaving(false);
    if (!res.ok) {
      showBanner('error', errorText(t, res), 10000);
      return;
    }
    setKeyFormOpen(false);
    setStatus((prev) => (prev ? { ...prev, in_chat_payment: false } : prev));
    showBanner('success', sc('ordering.removed'));
    loadStatus({ silent: true });
  };

  if (!clientId) return null;

  const s = status?.status;
  const app = status?.app;
  const steps = stepStates(status);
  const envLabel = (env) => sc(`app.${env === 'sandbox' ? 'sandbox' : env === 'custom' ? 'custom' : 'production'}`);
  const lastRun = status?.sync?.lastRun;
  const contentEntries = Object.entries(status?.sync?.content || {});
  const busy = (label) => <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.4em' }}></i>{label}</>;

  return (
    <div className="section sc-setup" style={{ marginBottom: '1.5em' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1em', flexWrap: 'wrap' }}>
        <h2 className="section-title">
          <img src={LOGO} alt="StoreConnect" style={{ height: '28px', width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
          {sc('title')}
        </h2>
        {s === 'ready' && (
          <span style={{ color: '#28a745', fontWeight: 600, fontSize: '0.9em' }}>
            <i className="fa-solid fa-check-circle" style={{ marginRight: '0.4em' }}></i>{t('storeconnect.ready.connected')}
          </span>
        )}
      </div>
      <p className="section-description" style={{ textAlign: 'left', margin: '0.5em 0 1em' }}>{sc('intro')}</p>

      {banner && (
        <div className={`alert ${banner.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status">
          <i className={`fa-solid ${banner.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} style={{ marginRight: '0.5em' }}></i>
          {banner.text}
        </div>
      )}

      {statusLoading && !status ? (
        <p style={mutedStyle}>{busy(sc('loading'))}</p>
      ) : !status ? (
        <div className="alert alert-error">
          <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>
          {statusError || sc('loadError')}{' '}
          <button type="button" className="btn-link" onClick={() => loadStatus()}>{sc('retry')}</button>
        </div>
      ) : (
        <>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {/* ---------------- Step 1: the merchant's Salesforce app ---------------- */}
            <Step n={1} state={steps.app} title={sc('steps.app')}>
              {app?.configured && !editingApp ? (
                <p style={mutedStyle}>
                  {sc('app.saved', { hint: app.client_id_hint, environment: envLabel(app.environment) })}{' '}
                  <button type="button" className="btn-link" onClick={startEditApp}>{sc('app.edit')}</button>
                </p>
              ) : (
                <>
                  <ol style={{ paddingLeft: '1.2em', margin: '0 0 0.75em', color: '#555', fontSize: '0.9em', lineHeight: 1.5 }}>
                    <li>
                      {sc('app.instructions.intro')}
                      <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center', margin: '0.4em 0', flexWrap: 'wrap' }}>
                        <code style={{ flex: 1, minWidth: 0, padding: '0.45em 0.6em', backgroundColor: '#fff', border: '1px solid #ced4da', borderRadius: 4, fontSize: '0.85em', overflowWrap: 'anywhere' }}>
                          {status.callback_url}
                        </code>
                        <button type="button" className="btn btn-secondary" onClick={copyCallback}>
                          <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i> {copied ? sc('app.copied') : sc('app.copy')}
                        </button>
                      </div>
                    </li>
                    <li>{sc('app.instructions.scopes')}</li>
                    <li>{sc('app.instructions.policies')}</li>
                    <li>{sc('app.instructions.keys')}</li>
                  </ol>

                  <form onSubmit={saveApp}>
                    <div style={gridStyle}>
                      <div>
                        <label htmlFor="sc-client-id" style={labelStyle}>{sc('app.consumerKey')}</label>
                        <input id="sc-client-id" className="input" style={inputStyle} type="text" autoComplete="off" spellCheck="false"
                          value={appForm.client_id} placeholder={editingApp ? app?.client_id_hint || '' : ''}
                          onChange={(e) => setAppForm((f) => ({ ...f, client_id: e.target.value }))} />
                      </div>
                      <div>
                        <label htmlFor="sc-client-secret" style={labelStyle}>{sc('app.consumerSecret')}</label>
                        <input id="sc-client-secret" className="input" style={inputStyle} type="password" autoComplete="new-password"
                          value={appForm.client_secret}
                          onChange={(e) => setAppForm((f) => ({ ...f, client_secret: e.target.value }))} />
                        {editingApp && <div style={{ ...mutedStyle, fontSize: '0.8em', marginTop: '0.25em' }}>{sc('app.secretKeepHint')}</div>}
                      </div>
                      <div>
                        <label htmlFor="sc-environment" style={labelStyle}>{sc('app.orgType')}</label>
                        <select id="sc-environment" className="input" style={inputStyle} value={appForm.environment}
                          onChange={(e) => setAppForm((f) => ({ ...f, environment: e.target.value }))}>
                          <option value="production">{sc('app.production')}</option>
                          <option value="sandbox">{sc('app.sandbox')}</option>
                          <option value="custom">{sc('app.custom')}</option>
                        </select>
                      </div>
                      {appForm.environment === 'custom' && (
                        <div>
                          <label htmlFor="sc-login-url" style={labelStyle}>{sc('app.loginUrl')}</label>
                          <input id="sc-login-url" className="input" style={inputStyle} type="url" placeholder={sc('app.loginUrlPlaceholder')}
                            value={appForm.login_url}
                            onChange={(e) => setAppForm((f) => ({ ...f, login_url: e.target.value }))} />
                        </div>
                      )}
                    </div>
                    {appError && <p style={{ color: '#dc3545', fontSize: '0.85em', fontWeight: 600, margin: '0.5em 0 0' }}>{appError}</p>}
                    <div style={{ display: 'flex', gap: '0.5em', marginTop: '0.75em', flexWrap: 'wrap' }}>
                      <button type="submit" className="btn btn-primary" disabled={appSaving}>
                        {appSaving ? busy(sc('app.saving')) : sc('app.save')}
                      </button>
                      {editingApp && (
                        <button type="button" className="btn btn-secondary" onClick={() => setEditingApp(false)} disabled={appSaving}>
                          {sc('app.cancel')}
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </Step>

            {/* ---------------- Step 2: Salesforce consent ---------------- */}
            <Step n={2} state={steps.connect} title={sc('steps.connect')}>
              {steps.connect === 'pending' ? (
                <p style={mutedStyle}>{sc('connect.needsApp')}</p>
              ) : steps.connect === 'done' ? (
                <p style={{ ...mutedStyle, color: '#28a745', fontWeight: 600 }}>
                  <i className="fa-solid fa-check-circle" style={{ marginRight: '0.4em' }}></i>
                  {status.salesforce?.username
                    ? sc('connect.connectedAs', { username: status.salesforce.username })
                    : sc('connect.connectedOn', { date: status.salesforce?.connected_at ? new Date(status.salesforce.connected_at).toLocaleDateString() : '' })}
                </p>
              ) : (
                <>
                  {s === 'reconnect_required' ? (
                    <div className="alert alert-warning" style={{ marginBottom: '0.75em' }}>
                      <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>{sc('connect.reconnectNotice')}
                    </div>
                  ) : (
                    <p style={{ ...mutedStyle, marginBottom: '0.6em' }}>{sc('connect.ready')}</p>
                  )}
                  <button type="button" className="btn btn-primary" onClick={connect} disabled={connecting}>
                    {connecting ? busy(sc('connect.connecting')) : (
                      <><i className="fa-brands fa-salesforce"></i> {s === 'reconnect_required' ? sc('connect.reconnect') : sc('connect.button')}</>
                    )}
                  </button>
                </>
              )}
            </Step>

            {/* ---------------- Step 3: the store ---------------- */}
            <Step n={3} state={steps.store} title={sc('steps.store')}>
              {chooserOpen && steps.connect === 'done' ? (
                storesLoading ? (
                  <p style={mutedStyle}>{busy(sc('store.loading'))}</p>
                ) : (
                  <form onSubmit={saveStore}>
                    {stores && stores.length > 0 ? (
                      <>
                        <p style={{ ...mutedStyle, marginBottom: '0.5em' }}>{sc('store.pick')}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em', marginBottom: '0.6em' }}>
                          {stores.map((store) => (
                            <label key={store.id} style={{ display: 'flex', gap: '0.6em', alignItems: 'baseline', cursor: 'pointer', fontSize: '0.95em' }}>
                              <input type="radio" name="sc-store" value={store.id} checked={storeChoice === store.id}
                                onChange={() => { setStoreChoice(store.id); setStoresError(null); }} />
                              <span>
                                <strong>{store.name || store.id}</strong>
                                {store.url && <span style={{ color: '#666', marginLeft: '0.5em', fontSize: '0.9em' }}>{store.url}</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                        {needsStorefrontUrl && (
                          <div style={{ marginBottom: '0.6em', maxWidth: 420 }}>
                            <label htmlFor="sc-storefront-url" style={labelStyle}>{sc('store.noUrl')}</label>
                            <input id="sc-storefront-url" className="input" style={inputStyle} type="url" required placeholder="https://shop.example.com"
                              value={storefrontUrl} onChange={(e) => setStorefrontUrl(e.target.value)} />
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={mutedStyle}>{sc('store.none')}</p>
                    )}
                    {storesError && <p style={{ color: '#dc3545', fontSize: '0.85em', fontWeight: 600, margin: '0 0 0.5em' }}>{storesError}</p>}
                    <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
                      {stores && stores.length > 0 && (
                        <button type="submit" className="btn btn-primary" disabled={storeSaving || !storeChoice}>
                          {storeSaving ? busy(sc('store.saving')) : sc('store.use')}
                        </button>
                      )}
                      {s === 'ready' && (
                        <button type="button" className="btn btn-secondary" onClick={() => setChooserOpen(false)} disabled={storeSaving}>
                          {sc('store.cancel')}
                        </button>
                      )}
                    </div>
                  </form>
                )
              ) : status.store ? (
                <p style={mutedStyle}>
                  <strong style={{ color: '#333' }}>{status.store.name || status.store.url}</strong>{' '}
                  {steps.connect === 'done' && (
                    <button type="button" className="btn-link" onClick={() => setChooserOpen(true)}>{sc('store.change')}</button>
                  )}
                </p>
              ) : (
                <p style={mutedStyle}>{sc('store.pending')}</p>
              )}
            </Step>
          </ol>

          {/* ---------------- Ready: store, sync, actions ---------------- */}
          {s === 'ready' && (<>
            <div className="sc-box" style={{ ...boxStyle, marginTop: '0.5em' }}>
              <div style={gridStyle}>
                <div>
                  <div style={labelStyle}>{sc('ready.store')}</div>
                  {status.store?.url
                    ? <a href={status.store.url} target="_blank" rel="noopener noreferrer">{status.store.name || status.store.url} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.8em' }}></i></a>
                    : <span>{status.store?.name}</span>}
                </div>
                <div>
                  <div style={labelStyle}>{sc('ready.lastSync')}</div>
                  <span>
                    {running || (syncing && !lastRun) ? busy(sc('ready.running'))
                      : !lastRun ? sc('ready.never')
                      : <>{sc(`ready.status.${lastRun.status === 'ok' ? 'ok' : lastRun.status === 'error' ? 'error' : 'running'}`)} · {new Date(lastRun.finished_at || lastRun.started_at).toLocaleString()}</>}
                  </span>
                </div>
                <div>
                  <div style={labelStyle}>{sc('ready.productsLabel')}</div>
                  <span>
                    {sc('ready.products', { n: status.sync?.products?.active ?? 0 })}
                    {status.sync?.products?.bookable > 0 && <> · {sc('ready.bookable', { n: status.sync.products.bookable })}</>}
                  </span>
                </div>
                <div>
                  <div style={labelStyle}>{sc('ready.content')}</div>
                  <span>
                    {contentEntries.length === 0
                      ? sc('ready.contentNone')
                      : contentEntries.map(([type, c]) => `${c.sources} ${sc(`ready.sources.${type}`, { defaultValue: type })}`).join(' · ')}
                  </span>
                </div>
              </div>
              {lastRun?.status === 'error' && lastRun.error && (
                <div className="alert alert-error" style={{ marginTop: '0.75em', marginBottom: 0 }}>
                  <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5em' }}></i>{sc('ready.syncError', { error: lastRun.error })}
                </div>
              )}
              <div className="sc-actions" style={{ display: 'flex', gap: '0.5em', marginTop: '0.9em', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={syncNow} disabled={running || syncing}>
                  {running || syncing ? busy(sc('ready.running')) : <><i className="fa-solid fa-rotate"></i> {sc('ready.syncNow')}</>}
                </button>
                <button type="button" className="btn btn-danger" onClick={disconnect} disabled={disconnecting}>
                  {disconnecting ? busy(sc('ready.disconnecting')) : <><i className="fa-solid fa-unlink"></i> {sc('ready.disconnect')}</>}
                </button>
              </div>
            </div>

            {/* ---------------- Ready: assistant settings ---------------- */}
            <div className="sc-box" style={boxStyle}>
              <div style={{ ...labelStyle, fontSize: '0.95em', marginBottom: '0.75em' }}>{sc('ready.settings')}</div>
              <SettingSwitch id="sc-coupons" checked={!!status.share_coupon_codes} saving={settingSaving === 'share_coupon_codes'}
                label={sc('ready.coupons')} help={sc('ready.couponsHelp')}
                onToggle={() => saveSetting('share_coupon_codes', !status.share_coupon_codes)} />

              {/* In-chat ordering: on once the store's Commerce API key is saved */}
              <div style={ruleStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#333' }}>{sc('ordering.title')}</span>
                  <span style={pillStyle(status.in_chat_payment)}>{status.in_chat_payment ? sc('ordering.on') : sc('ordering.off')}</span>
                </div>
                <p style={{ ...mutedStyle, fontSize: '0.85em', marginTop: '0.3em' }}>{sc('ordering.help')}</p>

                {keyFormOpen ? (
                  <form onSubmit={saveKey} style={{ marginTop: '0.75em' }}>
                    <div style={gridStyle}>
                      <div>
                        <label htmlFor="sc-api-key" style={labelStyle}>{sc('ordering.key')}</label>
                        <input id="sc-api-key" className="input" style={inputStyle} type="password" autoComplete="new-password" spellCheck="false"
                          value={keyForm.api_key} onChange={(e) => setKeyForm((f) => ({ ...f, api_key: e.target.value }))} />
                      </div>
                      <div>
                        <label htmlFor="sc-api-url" style={labelStyle}>{sc('ordering.baseUrl')}</label>
                        <input id="sc-api-url" className="input" style={inputStyle} type="url" placeholder={sc('ordering.baseUrlPlaceholder')}
                          value={keyForm.api_base_url} onChange={(e) => setKeyForm((f) => ({ ...f, api_base_url: e.target.value }))} />
                        {status.in_chat_payment && status.api_base_url && (
                          <div style={{ ...mutedStyle, fontSize: '0.8em', marginTop: '0.25em', overflowWrap: 'anywhere' }}>{sc('ordering.inUse', { url: status.api_base_url })}</div>
                        )}
                      </div>
                    </div>
                    {keyError && <p style={errorStyle}>{keyError}</p>}
                    <div className="sc-actions" style={{ display: 'flex', gap: '0.5em', marginTop: '0.75em', flexWrap: 'wrap' }}>
                      <button type="submit" className="btn btn-primary" disabled={keySaving}>
                        {keySaving ? busy(sc('ordering.saving')) : sc('ordering.save')}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setKeyFormOpen(false)} disabled={keySaving}>
                        {sc('ordering.cancel')}
                      </button>
                    </div>
                  </form>
                ) : status.in_chat_payment ? (
                  <div style={{ marginTop: '0.6em' }}>
                    {status.api_base_url && (
                      <p style={{ ...mutedStyle, overflowWrap: 'anywhere' }}>{sc('ordering.apiUrl')} <code style={{ fontSize: '0.9em' }}>{status.api_base_url}</code></p>
                    )}
                    {/* .btn-link is display:flex, so the two links share a row here */}
                    <div style={{ display: 'flex', gap: '1.25em', flexWrap: 'wrap', marginTop: '0.4em' }}>
                      <button type="button" className="btn-link" onClick={openKeyForm} disabled={keySaving}>{sc('ordering.replace')}</button>
                      <button type="button" className="btn-link" onClick={removeKey} disabled={keySaving}>
                        {keySaving ? busy(sc('ordering.removing')) : sc('ordering.remove')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="sc-actions" style={{ display: 'flex', marginTop: '0.75em' }}>
                    <button type="button" className="btn btn-secondary" onClick={openKeyForm}>
                      <i className="fa-solid fa-key"></i> {sc('ordering.add')}
                    </button>
                  </div>
                )}

                {status.in_chat_payment && (
                  <div style={{ marginTop: '1em' }}>
                    <SettingSwitch id="sc-physical" checked={!!status.api_checkout_physical} saving={settingSaving === 'api_checkout_physical'}
                      label={sc('ready.physical')} help={sc('ready.physicalHelp')}
                      onToggle={() => saveSetting('api_checkout_physical', !status.api_checkout_physical)} />
                  </div>
                )}
              </div>
            </div>
          </>)}
        </>
      )}
    </div>
  );
}
