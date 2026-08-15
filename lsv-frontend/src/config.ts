export const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || "/api";

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
