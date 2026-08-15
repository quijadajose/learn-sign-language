import { ReactNode, useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Avatar,
  DarkThemeToggle,
  Dropdown,
  Navbar,
  NavbarToggle,
  NavbarCollapse,
  NavbarLink,
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
} from "flowbite-react";
import { useTranslation } from "react-i18next";
import { BACKEND_BASE_URL } from "../config";
import LanguageSwitcher from "../components/LanguageSwitcher";
import SignLanguageContextSwitcher from "../components/SignLanguageContextSwitcher";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../context/AuthContext";
import { MAIN_CONTENT_ID } from "../components/SkipLink";
import type { LanguageSwitcherTab } from "../components/LanguageSwitcher/types";

interface Props {
  children: ReactNode;
}

function handleLanguageChanged() {
  window.location.reload();
}

const DashboardLayout = ({ children }: Props) => {
  const { t } = useTranslation(["nav", "common"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isHydrating } = useAuth();
  const [avatarError, setAvatarError] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false);
  const [languageSwitcherTab, setLanguageSwitcherTab] =
    useState<LanguageSwitcherTab>("enroll");
  const { isAdmin, isModerator, hasAnyLanguagePermission } = usePermissions();

  const openLanguageManager = useCallback((tab: LanguageSwitcherTab) => {
    setLanguageSwitcherTab(tab);
    setShowLanguageSwitcher(true);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }
    if (!isAuthenticated || !user) {
      navigate("/login");
    }
  }, [isAuthenticated, user, isHydrating, navigate]);

  useEffect(() => {
    setAvatarTimestamp(Date.now());
    setAvatarError(false);
  }, [user?.id]);

  const avatarImgSrc =
    user?.id && !avatarError
      ? `${BACKEND_BASE_URL}/images/user/${encodeURIComponent(user?.id)}?size=sm&v=${avatarTimestamp}`
      : "/user.svg";

  return (
    <>
      <Navbar
        fluid
        rounded
        className="sticky top-0 z-60 bg-white/80 shadow-sm backdrop-blur-md dark:bg-gray-900/80"
      >
        <Link
          to="/dashboard"
          className="flex items-center"
          aria-label={t("common:a11y.home")}
        >
          <img
            src="/logo.svg"
            className="mr-3 h-6 dark:invert sm:h-9"
            alt=""
          />
        </Link>
        <div className="flex items-center gap-2 md:order-2">
          <SignLanguageContextSwitcher
            onManageEnroll={() => openLanguageManager("enroll")}
            onManageRegions={() => openLanguageManager("regions")}
            onLanguageChanged={handleLanguageChanged}
          />
          <DarkThemeToggle aria-label={t("common:a11y.toggleTheme")} />

          {user ? (
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <Avatar
                  className="text-gray-800 dark:text-white"
                  alt={t("userSettings")}
                  img={avatarImgSrc}
                  rounded
                  onError={() => {
                    if (!avatarError) {
                      setAvatarError(true);
                    }
                  }}
                />
              }
            >
              <DropdownHeader>
                <span className="block text-sm">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="block truncate text-sm font-medium">
                  {user?.email}
                </span>
              </DropdownHeader>
              <DropdownItem onClick={() => navigate("/dashboard")}>
                {t("dashboard")}
              </DropdownItem>
              <DropdownItem onClick={() => navigate("/profile")}>
                {t("profile")}
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem onClick={handleLogout}>{t("signOut")}</DropdownItem>
            </Dropdown>
          ) : (
            <div className="size-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
          )}
          <NavbarToggle />
        </div>
        <NavbarCollapse>
          <NavbarLink
            href="/dashboard"
            active={location.pathname === "/dashboard"}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              navigate("/dashboard");
            }}
          >
            {t("dashboard")}
          </NavbarLink>
          <NavbarLink
            href="/leaderboard"
            active={location.pathname === "/leaderboard"}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              navigate("/leaderboard");
            }}
          >
            {t("leaderboard")}
          </NavbarLink>
          {(isAdmin || isModerator) && (
            <Dropdown
              arrowIcon={true}
              inline
              label={
                <span className="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-white">
                  {t("management")}
                </span>
              }
            >
              {hasAnyLanguagePermission() && (
                <>
                  <DropdownItem
                    onClick={() => navigate("/admin/languages")}
                    className={
                      location.pathname.startsWith("/admin/languages")
                        ? "bg-blue-50 dark:bg-gray-700"
                        : ""
                    }
                  >
                    {t("languages")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => navigate("/admin/stages")}
                    className={
                      location.pathname.startsWith("/admin/stages")
                        ? "bg-blue-50 dark:bg-gray-700"
                        : ""
                    }
                  >
                    {t("stages")}
                  </DropdownItem>
                </>
              )}
              <DropdownItem
                onClick={() => navigate("/admin/lessons")}
                className={
                  location.pathname.startsWith("/admin/lessons")
                    ? "bg-blue-50 dark:bg-gray-700"
                    : ""
                }
              >
                {t("lessons")}
              </DropdownItem>
              <DropdownItem
                onClick={() => navigate("/admin/regions")}
                className={
                  location.pathname.startsWith("/admin/regions")
                    ? "bg-blue-50 dark:bg-gray-700"
                    : ""
                }
              >
                {t("regions")}
              </DropdownItem>
              <DropdownItem
                onClick={() => navigate("/admin/sign-studio")}
                className={
                  location.pathname.startsWith("/admin/sign-studio")
                    ? "bg-blue-50 dark:bg-gray-700"
                    : ""
                }
              >
                {t("signStudio")}
              </DropdownItem>
              {isAdmin && (
                <DropdownItem
                  onClick={() => navigate("/admin/moderators")}
                  className={
                    location.pathname.startsWith("/admin/moderators")
                      ? "bg-blue-50 dark:bg-gray-700"
                      : ""
                  }
                >
                  {t("moderators")}
                </DropdownItem>
              )}
            </Dropdown>
          )}
        </NavbarCollapse>
      </Navbar>
      {user ? (
        <main id={MAIN_CONTENT_ID} className="min-h-screen p-4 dark:bg-gray-800">
          {children}
        </main>
      ) : (
        <div className="flex min-h-screen items-center justify-center dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t("common:loading")}</p>
        </div>
      )}

      <LanguageSwitcher
        isOpen={showLanguageSwitcher}
        onClose={() => setShowLanguageSwitcher(false)}
        onLanguageChanged={handleLanguageChanged}
        initialTab={languageSwitcherTab}
      />
    </>
  );
};

export default DashboardLayout;
