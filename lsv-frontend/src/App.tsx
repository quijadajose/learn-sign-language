import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "flowbite-react";
import { MotionConfig } from "motion/react";
import { ThemeInit } from "../.flowbite-react/init";

import Login from "./Login";
import ForgotPassword from "./ForgotPasswordComponent";
import ResetPassword from "./ResetPasswordComponent";
import LandingPageComponent from "./LandingPageComponent";
import FormularioMultiPaso from "./register/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import { AdminRoute } from "./AdminRoute";
import { ManagementRoute } from "./ManagementRoute";
import { PrivateRoute } from "./PrivateRoute";
import LanguageCards from "./LanguageCards";
import { ToastProvider } from "./components/ToastProvider";
import { SkipLink } from "./components/SkipLink";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { DocumentTitle } from "./hooks/useDocumentTitle";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import { AuthProvider } from "./context/AuthProvider";

const Profile = lazy(() => import("./Profile"));
const LanguageManagement = lazy(() => import("./admin/LanguageManagement"));
const LanguageWorkspace = lazy(() => import("./admin/LanguageWorkspace"));
const LessonManagement = lazy(
  () => import("./admin/LessonManagement/LessonManagement"),
);
const QuizManagement = lazy(() => import("./admin/QuizManagement"));
const RegionManagement = lazy(() => import("./admin/RegionManagement"));
const ModeratorManagement = lazy(() => import("./admin/ModeratorManagement"));
const LessonView = lazy(() => import("./LessonView"));
const QuizView = lazy(() => import("./QuizView"));
const StageManagement = lazy(() => import("./admin/stageForm"));
const LeaderboardView = lazy(() => import("./LeaderboardView"));
const LessonListView = lazy(() => import("./LessonListView"));
const SignStudio = lazy(() => import("./moderator/SignStudio/SignStudio"));
const SignExam = lazy(() => import("./SignExam"));

function RouteFallback() {
  return <LoadingSpinner />;
}

function App() {
  return (
    <AuthProvider>
      <ThemeInit />
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <SkipLink />
          <DocumentTitle />
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 transition-colors duration-500 dark:from-gray-900 dark:to-gray-800">
            <ToastProvider>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                <Route path="/" element={<LandingPageComponent />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<FormularioMultiPaso />} />
                <Route path="/forgotPassword" element={<ForgotPassword />} />
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
                  path="/lesson/:lessonId/practice"
                  element={
                    <PrivateRoute>
                      <DashboardLayout>
                        <SignExam />
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
                    <PrivateRoute>
                      <DashboardLayout>
                        <Profile />
                      </DashboardLayout>
                    </PrivateRoute>
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
                  path="/admin/languages/:languageId"
                  element={
                    <ManagementRoute>
                      <DashboardLayout>
                        <LanguageWorkspace />
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
                <Route
                  path="/admin/sign-studio"
                  element={
                    <ManagementRoute>
                      <DashboardLayout>
                        <SignStudio />
                      </DashboardLayout>
                    </ManagementRoute>
                  }
                />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
              </Routes>
            </Suspense>
          </ToastProvider>
          </div>
        </MotionConfig>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
