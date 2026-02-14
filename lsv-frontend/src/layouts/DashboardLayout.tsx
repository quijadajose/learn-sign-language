import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, DarkThemeToggle, Dropdown, Navbar } from "flowbite-react";
import { HiTranslate } from "react-icons/hi";
import { BACKEND_BASE_URL } from "../config";
import { userApi } from "../services/api";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
}

interface Language {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const DashboardLayout = ({ children }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshUser, token } = useAuth();
  const [avatarError, setAvatarError] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false);
  const {
    isAdmin,
    isModerator,
    hasAnyLanguagePermission,
  } = usePermissions();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLanguageChanged = (_language: Language) => {
    window.location.reload();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token || token === "undefined") {
        handleLogout();
        return;
      }

      if (!user) {
        try {
          const response = await userApi.getMe();
          if (response.success && response.data) {
            refreshUser(); // Esto forzará al AuthContext a leer de nuevo o podemos extenderlo
          } else if (response.status === 401 || response.status === 403) {
            handleLogout();
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [navigate, token, user]);

  useEffect(() => {
    setAvatarTimestamp(Date.now());
    setAvatarError(false);
  }, [user?.id]);

  const avatarImgSrc =
    user?.id && !avatarError
      ? `${BACKEND_BASE_URL}/images/user/${user?.id}?size=sm&v=${avatarTimestamp}`
      : "/user.svg";

  return (
    <>
      <Navbar fluid rounded>
        <Navbar.Brand href="/dashboard">
          <img src="/LogoLogin.png" className="mr-3 h-6 sm:h-9" alt="Logo" />
        </Navbar.Brand>
        <div className="flex md:order-2">
          <DarkThemeToggle />

          {user ? (
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <Avatar
                  className="text-gray-800 dark:text-white"
                  alt="User settings"
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
              <Dropdown.Header>
                <span className="block text-sm">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="block truncate text-sm font-medium">
                  {user?.email}
                </span>
              </Dropdown.Header>
              <Dropdown.Item onClick={() => navigate("/dashboard")}>
                Dashboard
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/profile")}>
                Profile
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowLanguageSwitcher(true)}>
                <HiTranslate className="mr-2 size-4" />
                Cambiar Idioma
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
            </Dropdown>
          ) : (
            <div className="size-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
          )}
          <Navbar.Toggle />
        </div>
        <Navbar.Collapse>
          <Navbar.Link
            href="/dashboard"
            active={location.pathname === "/dashboard"}
          >
            Dashboard
          </Navbar.Link>
          <Navbar.Link
            href="/leaderboard"
            active={location.pathname === "/leaderboard"}
          >
            Leaderboard
          </Navbar.Link>
          {(isAdmin || isModerator) && (
            <Dropdown
              arrowIcon={true}
              inline
              label={
                <span className="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-white">
                  Gestión
                </span>
              }
            >
              {hasAnyLanguagePermission() && (
                <>

                  <Dropdown.Item
                    onClick={() => navigate("/admin/languages")}
                    className={
                      location.pathname.startsWith("/admin/languages")
                        ? "bg-blue-50 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Languages
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => navigate("/admin/stages")}
                    className={
                      location.pathname.startsWith("/admin/stages")
                        ? "bg-blue-50 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Stages
                  </Dropdown.Item>
                </>
              )}
              <Dropdown.Item
                onClick={() => navigate("/admin/lessons")}
                className={
                  location.pathname.startsWith("/admin/lessons")
                    ? "bg-blue-50 dark:bg-gray-700"
                    : ""
                }
              >
                Lessons
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => navigate("/admin/regions")}
                className={
                  location.pathname.startsWith("/admin/regions")
                    ? "bg-blue-50 dark:bg-gray-700"
                    : ""
                }
              >
                Regions
              </Dropdown.Item>
              {isAdmin && (
                <Dropdown.Item
                  onClick={() => navigate("/admin/moderators")}
                  className={
                    location.pathname.startsWith("/admin/moderators")
                      ? "bg-blue-50 dark:bg-gray-700"
                      : ""
                  }
                >
                  Moderators
                </Dropdown.Item>
              )}
            </Dropdown>
          )}
        </Navbar.Collapse>
      </Navbar>
      {user ? (
        <main className="min-h-screen p-4 dark:bg-gray-800">{children}</main>
      ) : (
        <div className="flex min-h-screen items-center justify-center dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      )}

      <LanguageSwitcher
        isOpen={showLanguageSwitcher}
        onClose={() => setShowLanguageSwitcher(false)}
        onLanguageChanged={handleLanguageChanged}
      />
    </>
  );
};

export default DashboardLayout;
