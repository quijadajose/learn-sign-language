import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Dashboard from "./Dashboard";
import ForgoPassword from "./ForgotPasswordComponent";
import ResetPassword from "./ResetPasswordComponent";
import LandingPageComponent from "./LandingPageComponent";
// import SignupForm from "./SingUp";
import FormularioMultiPaso from "./register/Register";

function PrivateRoute({ children }: { children: JSX.Element }) {
  return localStorage.getItem("auth") ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <main className="h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route path="/" element={<LandingPageComponent />} />
        <Route path="/login/:token?" element={<Login />} />
        <Route path="/register" element={<FormularioMultiPaso />} />
        <Route path="/forgotPassword" element={<ForgoPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </main>
  );
}

export default App;
