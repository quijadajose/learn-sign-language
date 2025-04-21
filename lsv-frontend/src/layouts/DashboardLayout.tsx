import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, DarkThemeToggle, Dropdown, Navbar } from "flowbite-react";
import { BACKEND_BASE_URL } from "../config";

interface Props {
  children: ReactNode;
}
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

const DashboardLayout = ({ children }: Props) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("auth");
  
      if (!token || token === "undefined") {
        console.warn(
          `Invalid or missing auth token ('${token}') found in DashboardLayout. Logging out.`
        );
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
            console.warn("Stored user data is invalid. Clearing and fetching.");
            localStorage.removeItem("user");
          }
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
          localStorage.removeItem("user");
        }
      }
  
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (response.ok) {
          const data: UserData = await response.json();
          setUserData(data);
          localStorage.setItem("user", JSON.stringify(data));
        } else {
          if (response.status === 401 || response.status === 403) {
            console.warn("Token rejected by backend. Logging out.");
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
  
    fetchUserData();
  }, [navigate]);
  

  const avatarImgSrc =
    userData?.id && !avatarError
      ? `${BACKEND_BASE_URL}/images/user/${userData?.id}?size=sm&v=${Date.now()}`
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
                        console.warn(`Failed to load avatar: ${avatarImgSrc}`);
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
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
            </Dropdown>
          ) : (
             <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          )}
          <Navbar.Toggle />
        </div>
        <Navbar.Collapse>
          <Navbar.Link href="/dashboard" active={location.pathname === '/dashboard'}>
            Dashboard
          </Navbar.Link>
          <Navbar.Link href="/lessons" active={location.pathname.startsWith('/lessons')}>
            Lessons
          </Navbar.Link>
        </Navbar.Collapse>
      </Navbar>
      {userData ? (
         <main className="min-h-screen p-4 dark:bg-gray-800">{children}</main>
      ) : (
        <div className="flex min-h-screen items-center justify-center dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      )}
    </>
  );
};

export default DashboardLayout;
