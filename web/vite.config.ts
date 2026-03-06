import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import http from "http";
import https from "https";
import path from "path";
import { defineConfig, type Plugin } from "vite";

function giteaProxyPlugin(): Plugin {
  return {
    name: "gitea-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/gitea-api/")) {
          return next();
        }

        const baseUrl = req.headers["x-gitea-base-url"] as string | undefined;
        if (!baseUrl) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Missing X-Gitea-Base-Url header" }));
          return;
        }

        // Rewrite path: /gitea-api/v1/... -> /api/v1/...
        const targetPath = req.url.replace(/^\/gitea-api/, "/api");

        let targetUrl: URL;
        try {
          targetUrl = new URL(targetPath, baseUrl);
        }
        catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Invalid Gitea URL" }));
          return;
        }

        const isHttps = targetUrl.protocol === "https:";
        const lib = isHttps ? https : http;

        const headers: Record<string, string | string[] | undefined> = { ...req.headers, host: targetUrl.host };
        delete headers["x-gitea-base-url"];

        const proxyReq = lib.request(
          targetUrl.href,
          { method: req.method, headers },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
            proxyRes.pipe(res);
          },
        );

        proxyReq.on("error", () => {
          if (!res.headersSent) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Cannot connect to Gitea server" }));
          }
        });

        req.pipe(proxyReq);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    giteaProxyPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
