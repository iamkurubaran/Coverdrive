import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev requests to /api are proxied to the Coverdrive Node server.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
