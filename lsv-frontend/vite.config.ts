import {
  createWriteStream,
  cpSync,
  existsSync,
  mkdirSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import https from "node:https";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import flowbiteReact from "flowbite-react/plugin/vite";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

const MEDIAPIPE_MODELS: ReadonlyArray<{ file: string; url: string }> = [
  {
    file: "pose_landmarker_heavy.task",
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
  },
  {
    file: "hand_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  },
];

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

function downloadHttps(url: string, dest: string): Promise<void> {
  return new Promise((resolveDownload, reject) => {
    const request = https.get(url, (response) => {
      const status = response.statusCode ?? 0;
      const redirect = response.headers.location;
      if (status >= 300 && status < 400 && redirect) {
        response.resume();
        downloadHttps(redirect, dest).then(resolveDownload, reject);
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new Error(`GET ${url} -> ${status}`));
        return;
      }
      const tmp = `${dest}.tmp`;
      const out = createWriteStream(tmp);
      pipeline(response, out)
        .then(() => {
          renameSync(tmp, dest);
          resolveDownload();
        })
        .catch((error: unknown) => {
          try {
            unlinkSync(tmp);
          } catch {
            /* ignore incomplete tmp */
          }
          reject(error);
        });
    });
    request.on("error", reject);
  });
}

async function ensureMediapipeModels(): Promise<void> {
  const destDir = resolve(frontendRoot, "public/mediapipe/models");
  mkdirSync(destDir, { recursive: true });
  await Promise.all(
    MEDIAPIPE_MODELS.map(async ({ file, url }) => {
      const dest = resolve(destDir, file);
      if (existsSync(dest)) {
        return;
      }
      try {
        await downloadHttps(url, dest);
      } catch (error) {
        throw new Error(
          `Failed to download ${file} from Google Storage. ` +
            `If you are in Docker with Cloudflare WARP, DNS inside the container often fails; ` +
            `download the file on the host into public/mediapipe/models/. ` +
            `(${error instanceof Error ? error.message : String(error)})`,
        );
      }
    }),
  );
}

function mediapipeAssetsPlugin(): Plugin {
  return {
    name: "mediapipe-assets",
    async buildStart() {
      copyMediapipeWasm();
      await ensureMediapipeModels();
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
  plugins: [mediapipeAssetsPlugin(), react(), tailwindcss(), flowbiteReact()],
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
    },
  },
}));
