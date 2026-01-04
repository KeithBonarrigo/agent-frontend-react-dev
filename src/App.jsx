import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeLayout from "./components/HomeLayout";
import Layout from "./components/Layout"; // Make sure the path is correct

import Home from "./Pages/Home";
import Checkout from "./Pages/Checkout";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import PasswordResetRequest from "./Pages/PasswordResetRequest";
import PasswordResetCheckEmail from "./Pages/PasswordResetCheckEmail";
import PasswordResetConfirm from "./Pages/PasswordResetConfirm";
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<HomeLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route element={<HomeLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payment" element={<Checkout />} />
            <Route path="/password-reset/request" element={<PasswordResetRequest />} />
            <Route path="/password-reset/check-email" element={<PasswordResetCheckEmail />} />
            <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
