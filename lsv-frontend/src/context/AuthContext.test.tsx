import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./AuthContext";

import { authApi } from "../services/api";

const getMe = vi.fn();

vi.mock("../services/api", () => ({
  unwrapApiData: <T,>(data: T) => data,
  userApi: {
    getMe: (...args: unknown[]) => getMe(...args),
  },
  authApi: {
    logout: vi.fn(),
  },
  setMemoryAccessToken: vi.fn(),
  markSessionActive: vi.fn(),
}));

function Probe() {
  const { isAuthenticated, isHydrating, user, logout } = useAuth();
  return (
    <div>
      <span data-testid="hydrating">{String(isHydrating)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <button type="button" onClick={() => logout()}>
        sign-out
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    getMe.mockReset();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("hydrates from the session cookie via getMe", async () => {
    getMe.mockResolvedValue({
      success: true,
      data: {
        id: "1",
        email: "a@test.com",
        firstName: "A",
        lastName: "B",
        role: "user",
      },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("a@test.com");
    });
    expect(screen.getByTestId("auth").textContent).toBe("true");
    expect(getMe).toHaveBeenCalled();
    expect(localStorage.getItem("auth")).toBeNull();
  });

  it("stays unauthenticated when getMe returns 401", async () => {
    getMe.mockResolvedValue({
      success: false,
      message: "unauthorized",
      status: 401,
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("hydrating").textContent).toBe("false");
    });
    expect(screen.getByTestId("auth").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(getMe).toHaveBeenCalled();
  });

  it("clears leftover localStorage auth and session after hydrate failures", async () => {
    localStorage.setItem("auth", "jwt-token");
    getMe.mockResolvedValue({
      success: false,
      message: "network",
      status: 500,
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(
      () => {
        expect(screen.getByTestId("hydrating").textContent).toBe("false");
        expect(screen.getByTestId("auth").textContent).toBe("false");
        expect(screen.getByTestId("user").textContent).toBe("none");
      },
      { timeout: 5000 },
    );
    expect(localStorage.getItem("auth")).toBeNull();
  });

  it("logout clears the session and does not keep a JWT in localStorage", async () => {
    getMe.mockResolvedValue({
      success: true,
      data: {
        id: "1",
        email: "a@test.com",
        firstName: "A",
        lastName: "B",
        role: "user",
      },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("a@test.com");
    });

    localStorage.setItem("selectedLanguageId", "lang-1");
    localStorage.setItem("selectedRegionId", "region-1");
    localStorage.setItem("selectedStageId_lang-1", "stage-a");
    localStorage.setItem("selectedStageExplicit_lang-1", "true");
    localStorage.setItem("lsv.uiLocale", "es");

    screen.getByRole("button", { name: "sign-out" }).click();

    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("false");
      expect(screen.getByTestId("user").textContent).toBe("none");
    });
    expect(authApi.logout).toHaveBeenCalled();
    expect(localStorage.getItem("auth")).toBeNull();
    expect(localStorage.getItem("selectedLanguageId")).toBeNull();
    expect(localStorage.getItem("selectedRegionId")).toBeNull();
    expect(localStorage.getItem("selectedStageId_lang-1")).toBeNull();
    expect(localStorage.getItem("selectedStageExplicit_lang-1")).toBeNull();
    expect(localStorage.getItem("lsv.uiLocale")).toBe("es");
  });
});
