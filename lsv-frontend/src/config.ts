export const BACKEND_BASE_URL = resolveSpaApiBase(import.meta.env.VITE_API_URL);

export function resolveSpaApiBase(fromEnv: string | undefined): string {
  const value = fromEnv?.trim();
  if (!value) return "/api";
  // Direct :3000 is a different origin from the SPA on :8080/:5173.
  // Cookie + JSON POST then requires CORS preflight and fails in the browser.
  if (/^https?:\/\/(localhost|127\.0\.0\.1):3000\/?$/i.test(value)) {
    return "/api";
  }
  return value.replace(/\/$/, "");
}

export function getSocketIoClientOptions(): { url: string; path: string } {
  const base = BACKEND_BASE_URL.replace(/\/$/, "");
  if (/^https?:\/\//i.test(base)) {
    return {
      url: base.replace(/\/api$/i, ""),
      path: "/socket.io",
    };
  }
  return {
    url: typeof window === "undefined" ? "" : window.location.origin,
    path: "/api/socket.io",
  };
}
