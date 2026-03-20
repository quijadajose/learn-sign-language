import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "flowbite-react";
import { ThemeInit } from "../.flowbite-react/init";

import Login from "./Login";
import ForgoPassword from "./ForgotPasswordComponent";
import ResetPassword from "./ResetPasswordComponent";
import LandingPageComponent from "./LandingPageComponent";
import FormularioMultiPaso from "./register/Register";
import Profile from "./Profile";
import DashboardLayout from "./layouts/DashboardLayout";
import { AdminRoute } from "./AdminRoute";
import { ManagementRoute } from "./ManagementRoute";
import LanguageCards from "./LanguageCards";
import LanguageManagement from "./admin/LanguageManagement";
import LessonManagement from "./admin/LessonManagement";
import QuizManagement from "./admin/QuizManagement";
import RegionManagement from "./admin/RegionManagement";
import ModeratorManagement from "./admin/ModeratorManagement";
import { ToastProvider } from "./components/ToastProvider";
import LessonView from "./LessonView";
import QuizView from "./QuizView";
import StageManagement from "./admin/stageForm";
import LeaderboardView from "./LeaderboardView";
import LessonListView from "./LessonListView";
import PrivacyPolicy from "./PrivacyPolicy";

import { AuthProvider, useAuth } from "./context/AuthContext";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <ThemeInit />
      <ThemeProvider>
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 transition-colors duration-500 dark:from-gray-900 dark:to-gray-800">
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
                path="/lesson/:lessonId"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <LessonView />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/quiz/:lessonId"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <QuizView />
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
                path="/leaderboard"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <LeaderboardView />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/stages"
                element={
                  <ManagementRoute>
                    <DashboardLayout>
                      <StageManagement />
                    </DashboardLayout>
                  </ManagementRoute>
                }
              />
              <Route
                path="/admin/languages"
                element={
                  <ManagementRoute>
                    <DashboardLayout>
                      <LanguageManagement />
                    </DashboardLayout>
                  </ManagementRoute>
                }
              />
              <Route
                path="/admin/lessons"
                element={
                  <ManagementRoute>
                    <DashboardLayout>
                      <LessonManagement />
                    </DashboardLayout>
                  </ManagementRoute>
                }
              />
              <Route
                path="/admin/lessons/:lessonId/quizzes"
                element={
                  <ManagementRoute>
                    <DashboardLayout>
                      <QuizManagement />
                    </DashboardLayout>
                  </ManagementRoute>
                }
              />
              <Route
                path="/admin/regions"
                element={
                  <ManagementRoute>
                    <DashboardLayout>
                      <RegionManagement />
                    </DashboardLayout>
                  </ManagementRoute>
                }
              />
              <Route
                path="/admin/moderators"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ModeratorManagement />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Routes>
          </ToastProvider>
        </main>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
