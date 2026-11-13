import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {fileURLToPath} from "node:url";

export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: { input: {course:"dev.html",cms:"cms-dev.html"} },
  },
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
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
        if (pathname === "/" || pathname === "/index.html" || pathname === "/cms/" || pathname === "/cms/index.html") {
          req.url = (pathname.startsWith("/cms/") ? "/cms-dev.html" : "/dev.html") + (query === undefined ? "" : "?" + query);
        }
        next();
      });
    },
  }],
});
