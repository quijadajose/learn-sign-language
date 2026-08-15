import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import flowbiteReact from "flowbite-react/plugin/vite";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

const MEDIAPIPE_MODEL_PROXY: Record<string, string> = {
  "/mediapipe/models/pose_landmarker_heavy.task":
    "/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
  "/mediapipe/models/hand_landmarker.task":
    "/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
};

function copyMediapipeWasm(): void {
  const src = resolve(
    frontendRoot,
    "node_modules/@mediapipe/tasks-vision/wasm",
  );
  const dest = resolve(frontendRoot, "public/mediapipe/wasm");
  if (!existsSync(src)) {
    throw new Error(
      "Missing @mediapipe/tasks-vision/wasm. Run npm install in lsv-frontend.",
    );
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

function mediapipeWasmPlugin(): Plugin {
  return {
    name: "copy-mediapipe-wasm",
    buildStart() {
      copyMediapipeWasm();
    },
  };
}

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
  plugins: [mediapipeWasmPlugin(), react(), tailwindcss(), flowbiteReact()],
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
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/mediapipe/models": {
        target: "https://storage.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => MEDIAPIPE_MODEL_PROXY[path] ?? path,
      },
    },
  },
}));
