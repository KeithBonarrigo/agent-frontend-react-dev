import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { UserProvider } from './contexts/UserContext';
import { DomainProvider, useDomain } from './contexts/DomainContext';

function AppRoutes() {
  const { domainInfo } = useDomain();
  const hostname = domainInfo?.hostname || window.location.hostname;
  const isPropel = hostname === 'localhost' || hostname?.includes('propel');

  return (
    <>
      <LanguageSelector fixed={true} />
      <Routes>
        <Route element={<HomeLayout />}>
          <Route path="/" element={isPropel ? <Agent /> : <Home />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<Privacy />} />
        </Route>
        <Route element={<HomeLayout />}>
          <Route path="/login" element={<Login />} />
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
    <DomainProvider>
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </DomainProvider>
  );
}

export default App;
