import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ManagementRoute } from "./ManagementRoute";
import type { UserData } from "./types/user";

const authState = {
  user: null as UserData | null,
  isAuthenticated: false,
  isHydrating: false,
  refreshUser: vi.fn().mockResolvedValue(null),
};

const permissions = {
  isAdmin: false,
  isModerator: false,
};

vi.mock("./context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("./hooks/usePermissions", () => ({
  usePermissions: () => permissions,
}));

function renderManagement() {
  return render(
    <MemoryRouter initialEntries={["/studio"]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/dashboard" element={<div>dashboard-page</div>} />
        <Route
          path="/studio"
          element={
            <ManagementRoute>
              <div>studio-content</div>
            </ManagementRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ManagementRoute", () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isHydrating = false;
    permissions.isAdmin = false;
    permissions.isModerator = false;
    authState.refreshUser.mockClear();
  });

  it("keeps regular students out of Sign Studio", () => {
    authState.isAuthenticated = true;
    authState.user = {
      id: "1",
      email: "student@test.com",
      firstName: "Stu",
      lastName: "Dent",
      role: "user",
    };
    renderManagement();
    expect(screen.getByText("dashboard-page")).toBeTruthy();
    expect(screen.queryByText("studio-content")).toBeNull();
  });

  it("allows a moderator into Sign Studio", () => {
    authState.isAuthenticated = true;
    authState.user = {
      id: "2",
      email: "mod@test.com",
      firstName: "Mod",
      lastName: "User",
      role: "moderator",
    };
    permissions.isModerator = true;
    renderManagement();
    expect(screen.getByText("studio-content")).toBeTruthy();
  });
});
