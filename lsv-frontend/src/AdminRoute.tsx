import { Navigate } from "react-router-dom";

type Props = {
  children: JSX.Element;
};

interface StoredUser {
  id: string;
  email: string;
  role?: string;
}

export function AdminRoute({ children }: Props) {
  const token = localStorage.getItem("auth");
  const userString = localStorage.getItem("user");

  if (!token || token === 'undefined') {
    return <Navigate to="/login" />;
  }

  let user: StoredUser | null = null;
  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error);
      localStorage.removeItem("auth");
      localStorage.removeItem("user");
      return <Navigate to="/login" />;
    }
  }

  if (user && user.role === "admin") {
    return children;
  } else {
    console.warn("AdminRoute: Access denied. User is not an admin or user data is invalid.");
    return <Navigate to="/dashboard" />;
  }
}
