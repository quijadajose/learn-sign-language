import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./AuthContext";

const getMe = vi.fn();

vi.mock("../services/api", () => ({
  unwrapApiData: <T,>(data: T) => data,
  userApi: {
    getMe: (...args: unknown[]) => getMe(...args),
  },
}));

function Probe() {
  const { isAuthenticated, isHydrating, user } = useAuth();
  return (
    <div>
      <span data-testid="hydrating">{String(isHydrating)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    getMe.mockReset();
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
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("starts unauthenticated without token", async () => {
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
    expect(getMe).not.toHaveBeenCalled();
  });

  it("hydrates user when token exists without cached user", async () => {
    localStorage.setItem("auth", "jwt-token");
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
  });

  it("clears session after hydrate failures", async () => {
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
});
