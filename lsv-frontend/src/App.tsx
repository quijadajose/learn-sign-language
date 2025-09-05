import { Routes, Route, Navigate } from "react-router-dom";
import { Flowbite } from "flowbite-react";

import Login from "./Login";
import ForgoPassword from "./ForgotPasswordComponent";
import ResetPassword from "./ResetPasswordComponent";
import LandingPageComponent from "./LandingPageComponent";
import FormularioMultiPaso from "./register/Register";
import Profile from "./Profile";
import DashboardLayout from "./layouts/DashboardLayout";
import { AdminRoute } from "./AdminRoute";
import LanguageCards from "./LanguageCards";
import LanguageManagement from "./admin/LanguageManagement";
import LessonManagement from "./admin/LessonManagement";
import { ToastProvider } from "./components/ToastProvider";
import LessonListView from "./LessonListView";
import StageManagement from "./admin/stageForm";

function PrivateRoute({ children }: { children: JSX.Element }) {
  return localStorage.getItem("auth") ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Flowbite>
      <main className="h-screen bg-gray-50 dark:bg-gray-900">
        <ToastProvider>
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
                      <LanguageCards></LanguageCards>
                    </div>
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/lessons/stage/:stageId"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <LessonListView />
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
            <Route
              path="/admin/stages"
              element={
                <AdminRoute>
                  <DashboardLayout>
                    <StageManagement />
                  </DashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/languages"
              element={
                <AdminRoute>
                  <DashboardLayout>
                    <LanguageManagement />
                  </DashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/lessons"
              element={
                <AdminRoute>
                  <DashboardLayout>
                    <LessonManagement />
                  </DashboardLayout>
                </AdminRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </main>
    </Flowbite>
  );
}

export default App;
