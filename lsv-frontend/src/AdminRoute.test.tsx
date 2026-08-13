import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";
import type { UserData } from "./types/user";

const authState = {
  user: null as UserData | null,
  token: null as string | null,
  isHydrating: false,
  refreshUser: vi.fn().mockResolvedValue(null),
};

vi.mock("./context/AuthContext", () => ({
  useAuth: () => authState,
}));

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/dashboard" element={<div>dashboard-page</div>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div>admin-content</div>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminRoute", () => {
  beforeEach(() => {
    authState.user = null;
    authState.token = null;
    authState.isHydrating = false;
    authState.refreshUser.mockClear();
  });

  it("redirects moderators away from admin-only routes", () => {
    authState.token = "jwt";
    authState.user = {
      id: "1",
      email: "m@test.com",
      firstName: "Mod",
      lastName: "User",
      role: "moderator",
    };
    renderAdmin();
    expect(screen.getByText("dashboard-page")).toBeTruthy();
  });

  it("allows admins", () => {
    authState.token = "jwt";
    authState.user = {
      id: "1",
      email: "a@test.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    };
    renderAdmin();
    expect(screen.getByText("admin-content")).toBeTruthy();
  });
});
