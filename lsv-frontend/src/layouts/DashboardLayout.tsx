import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, DarkThemeToggle, Dropdown, Navbar } from "flowbite-react";
import { HiTranslate } from "react-icons/hi";
import { BACKEND_BASE_URL } from "../config";
import { userApi } from "../services/api";
import LanguageSwitcher from "../components/LanguageSwitcher";

interface Props {
  children: ReactNode;
}
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
  role?: string;
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedRegionId");
    localStorage.removeItem("selectedLanguageId");
    navigate("/login");
  };

  const handleLanguageChanged = (_language: Language) => {
    window.location.reload();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("auth");

      if (!token || token === "undefined") {
        handleLogout();
        return;
      }

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id && parsedUser.email) {
            setUserData(parsedUser);
            return;
          } else {
            localStorage.removeItem("user");
          }
        } catch (error) {
          localStorage.removeItem("user");
        }
      }

      try {
        const response = await userApi.getMe();

        if (response.success && response.data) {
          const data: UserData = response.data;
          setUserData(data);
          localStorage.setItem("user", JSON.stringify(data));
        } else {
          if (response.status === 401 || response.status === 403) {
            handleLogout();
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          if (updatedUser && updatedUser.id) {
            setUserData(updatedUser);
            setAvatarTimestamp(Date.now());
            setAvatarError(false);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("Error parsing updated user data:", error);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const handleCustomStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const updatedUser = JSON.parse(storedUser);
          if (updatedUser && updatedUser.id) {
            setUserData(updatedUser);
            setAvatarTimestamp(Date.now());
            setAvatarError(false);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("Error parsing updated user data:", error);
          }
        }
      }
    };

    window.addEventListener("userDataUpdated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userDataUpdated", handleCustomStorageChange);
    };
  }, []);

  const avatarImgSrc =
    userData?.id && !avatarError
      ? `${BACKEND_BASE_URL}/images/user/${userData?.id}?size=sm&v=${avatarTimestamp}`
      : "/user.svg";

  return (
    <>
      <Navbar fluid rounded>
        <Navbar.Brand href="/dashboard">
          <img src="/LogoLogin.png" className="mr-3 h-6 sm:h-9" alt="Logo" />
        </Navbar.Brand>
        <div className="flex md:order-2">
          <DarkThemeToggle />

          {userData ? (
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
                  {userData?.firstName} {userData?.lastName}
                </span>
                <span className="block truncate text-sm font-medium">
                  {userData?.email}
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
          {userData?.role === "admin" && (
            <Dropdown
              arrowIcon={true}
              inline
              label={
                <span className="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-white">
                  Admin
                </span>
              }
            >
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
            </Dropdown>
          )}
        </Navbar.Collapse>
      </Navbar>
      {userData ? (
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
