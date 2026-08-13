import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";

const authState = {
  isAuthenticated: false,
  token: null as string | null,
  user: null as { id: string; email: string } | null,
  isHydrating: false,
};

vi.mock("./context/AuthContext", () => ({
  useAuth: () => authState,
}));

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route
          path="/private"
          element={
            <PrivateRoute>
              <div>private-content</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PrivateRoute", () => {
  beforeEach(() => {
    cleanup();
    authState.isAuthenticated = false;
    authState.token = null;
    authState.user = null;
    authState.isHydrating = false;
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects to login when there is no token", () => {
    renderWithRouter();
    expect(screen.getByText("login-page")).toBeTruthy();
  });

  it("shows a spinner while hydrating", () => {
    authState.token = "jwt";
    authState.isHydrating = true;
    const { container } = renderWithRouter();
    expect(
      container.querySelector('[role="status"], .animate-spin, svg'),
    ).toBeTruthy();
    expect(screen.queryByText("private-content")).toBeNull();
  });

  it("redirects when token exists but user was not hydrated", () => {
    authState.token = "jwt";
    authState.isAuthenticated = false;
    authState.user = null;
    authState.isHydrating = false;
    renderWithRouter();
    expect(screen.getByText("login-page")).toBeTruthy();
  });

  it("renders children when authenticated", () => {
    authState.token = "jwt";
    authState.user = { id: "1", email: "a@test.com" };
    authState.isAuthenticated = true;
    authState.isHydrating = false;
    renderWithRouter();
    expect(screen.getByText("private-content")).toBeTruthy();
  });
});
