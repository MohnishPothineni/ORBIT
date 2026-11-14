import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// FastAPI serves the SPA and /api/* over local HTTPS on the same origin.
// In development, Vite proxies /api (including WebSocket / WebRTC signaling) to it.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://localhost:8443",
        secure: false,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
  },
});
