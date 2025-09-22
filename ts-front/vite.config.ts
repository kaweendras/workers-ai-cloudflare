import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4001",
        changeOrigin: true,
      },
    },
    port: 3000,
    host: true, // Allow external access
    allowedHosts: [
      "imagegen.duckdns.org",
      "localhost",
      "127.0.0.1",
      ".duckdns.org" // Allow all duckdns.org subdomains
    ],
    hmr: {
      overlay: false,
    },
  },
});
