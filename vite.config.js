import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      // "@/components" 처럼 src 기준 절대경로로 import (../../ 방지)
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      // VITE_USE_MOCK=false 로 개발할 때 CORS 없이 백엔드로 넘긴다
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY ?? "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
