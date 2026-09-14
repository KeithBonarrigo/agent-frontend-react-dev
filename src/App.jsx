import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import HomeLayout from "./components/HomeLayout";
import Layout from "./components/Layout"; // Make sure the path is correct
import LanguageSelector from "./components/LanguageSelector";

import Home from "./Pages/Home";
import DataDeletion from "./Pages/DataDeletion";
import CookiePolicy from "./Pages/CookiePolicy";
import TermsAndConditions from "./Pages/TermsAndConditions";
import Privacy from "./Pages/Privacy";

import Checkout from "./Pages/Checkout";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import PasswordResetRequest from "./Pages/PasswordResetRequest";
import PasswordResetCheckEmail from "./Pages/PasswordResetCheckEmail";
import PasswordResetConfirm from "./Pages/PasswordResetConfirm";
import OAuthCallback from "./Pages/OAuthCallback";
import Agent from "./Pages/Agent";
import HomeV3 from "./Pages/HomeV3";
import LoginV3 from "./Pages/LoginV3";
import { UserProvider } from './contexts/UserContext';
import { DomainProvider, useDomain } from './contexts/DomainContext';

function AppRoutes() {
  const { domainInfo } = useDomain();
  const hostname = domainInfo?.hostname || window.location.hostname;
  const isPropel = hostname?.includes('propel');
  // Same AI Bridge test as DomainContext / getApiUrl. The V3 pages are
  // BotWerx-branded, so AI Bridge and Propel domains keep their existing pages.
  const isAIBridge = hostname?.includes('aibridge.global') || hostname?.includes('base');
  const useV3 = !isPropel && !isAIBridge;

  return (
    <>
      <LanguageSelector fixed={true} />
      <Routes>
        <Route element={<HomeLayout />}>
          <Route path="/" element={isPropel ? <Agent /> : useV3 ? <HomeV3 /> : <Home />} />
          {/* The pre-V3 home and login pages, kept for comparison and rollback
              (robots.txt keeps /legacy/ out of search). Rollback = point / and
              /login back at Home and Login. */}
          <Route path="/legacy/home" element={<Home />} />
          <Route path="/legacy/login" element={<Login />} />
          {/* Old preview addresses from the redesign, now live */}
          <Route path="/preview/home-v3" element={<Navigate to="/" replace />} />
          <Route path="/preview/login-v3" element={<Navigate to="/login" replace />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<Privacy />} />
        </Route>
        <Route element={<HomeLayout />}>
          <Route path="/login" element={useV3 ? <LoginV3 /> : <Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/payment" element={<Checkout />} />
          <Route path="/password-reset/request" element={<PasswordResetRequest />} />
          <Route path="/password-reset/check-email" element={<PasswordResetCheckEmail />} />
          <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/oauth/:provider/callback" element={<OAuthCallback />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <DomainProvider>
        <UserProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </UserProvider>
      </DomainProvider>
    </HelmetProvider>
  );
}

export default App;
