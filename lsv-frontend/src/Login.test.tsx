import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "./Login";

const login = vi.fn();
const addToast = vi.fn();
const authLogin = vi.fn();

vi.mock("./context/AuthContext", () => ({
  useAuth: () => ({
    login,
    isAuthenticated: false,
  }),
}));

vi.mock("./components/ToastProvider", () => ({
  useToast: () => addToast,
}));

vi.mock("./hooks/useLocalStorage", () => ({
  useLocalStorage: (key: string, initial: unknown) => {
    const store: Record<string, unknown> = {};
    return [
      store[key] ?? initial,
      (value: unknown) => {
        store[key] = value;
      },
    ];
  },
}));

vi.mock("./services/api", () => ({
  unwrapApiData: <T,>(data: T) => data,
  authApi: {
    login: (...args: unknown[]) => authLogin(...args),
    exchangeGoogleCode: vi.fn(),
  },
  userApi: {
    getMe: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>dashboard-page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Login", () => {
  beforeEach(() => {
    login.mockReset();
    addToast.mockReset();
    authLogin.mockReset();
    localStorage.clear();
  });

  it("logs in without persisting the JWT in localStorage", async () => {
    const user = {
      id: "1",
      email: "a@test.com",
      firstName: "A",
      lastName: "B",
      role: "user",
    };
    authLogin.mockResolvedValue({
      success: true,
      data: { user },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText("login.email"), {
      target: { value: "a@test.com" },
    });
    fireEvent.change(screen.getByLabelText("login.password"), {
      target: { value: "secret-pass" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "login.submit" }));

    await waitFor(() => {
      expect(authLogin).toHaveBeenCalledWith("a@test.com", "secret-pass");
      expect(login).toHaveBeenCalledWith(user);
    });

    expect(localStorage.getItem("auth")).toBeNull();
    await screen.findByText("dashboard-page");
  });

  it("marks the page as main content and sets login autocomplete", () => {
    renderLogin();
    expect(document.getElementById("main-content")?.tagName).toBe("MAIN");
    expect(document.getElementById("email")?.getAttribute("autocomplete")).toBe(
      "username",
    );
    expect(
      document.getElementById("password")?.getAttribute("autocomplete"),
    ).toBe("current-password");
  });
});
