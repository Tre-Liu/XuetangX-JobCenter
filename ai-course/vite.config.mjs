import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: { input: "dev.html" },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), {
    name: "ai-course-dev-entry",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [pathname, query] = (req.url || "/").split("?");
        if (pathname === "/" || pathname === "/index.html") {
          req.url = "/dev.html" + (query === undefined ? "" : "?" + query);
        }
        next();
      });
    },
  }],
});
