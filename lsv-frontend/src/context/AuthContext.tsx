import { createContext, useContext } from "react";
import { UserData } from "../types/user";

export interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (userData: UserData, token?: string) => void;
  logout: () => void;
  updateUser: (userData: UserData) => void;
  /** Re-fetch /users/me and refresh client role/permissions. Authorization still enforced by API. */
  refreshUser: () => Promise<UserData | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
