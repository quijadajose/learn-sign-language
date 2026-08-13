import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import flowbiteReact from "flowbite-react/plugin/vite";

const hmrClientPort = process.env.VITE_HMR_CLIENT_PORT
  ? Number(process.env.VITE_HMR_CLIENT_PORT)
  : undefined;

const dockerWs = hmrClientPort
  ? {
      protocol: "ws" as const,
      host: "localhost",
      clientPort: hmrClientPort,
    }
  : undefined;

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), flowbiteReact()],
  // Relative base is for the nginx production build; in dev it breaks HMR URLs.
  base: command === "build" ? "./" : "/",
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@tensorflow")) {
            return "tfjs";
          }
          if (id.includes("node_modules/@mediapipe")) {
            return "mediapipe";
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Docker / Firefox send Host localhost:8080; Vite 8 otherwise 403s some WS upgrades.
    allowedHosts: true,
    watch: {
      ignored: ["**/.flowbite-react/class-list.json"],
    },
    ws: dockerWs,
    proxy: {
      // Mirrors nginx.conf so /api works in docker-compose (Vite) local.
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
}));
