import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import ForgoPassword from "./ForgotPasswordComponent";
import ResetPassword from "./ResetPasswordComponent";
import LandingPageComponent from "./LandingPageComponent";
// import SignupForm from "./SingUp";
import FormularioMultiPaso from "./register/Register";
import Profile from "./Profile"; // Descomenta esta línea
import DashboardLayout from "./layouts/DashboardLayout";

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
              <DashboardLayout>
                <div className="flex min-h-screen flex-col items-center justify-center dark:bg-gray-800">
                  <h1 className="text-2xl dark:text-white">Dashboard</h1>
                </div>
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          }
        />
      </Routes>
    </main>
  );
}

export default App;
