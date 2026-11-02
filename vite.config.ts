import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { imagetools } from "vite-imagetools";

export default defineConfig(({ command, mode }) => {
  // Runtime server vars (SUPABASE_*, SMTP_*, NOTIFY_*, NOINDEX) come from the environment in
  // production. In dev, fill them from .env so `bun run dev` works without exporting them.
  if (command === "serve") {
    for (const [key, value] of Object.entries(
      loadEnv(mode, process.cwd(), ["SUPABASE_", "SMTP_", "NOTIFY_", "NOINDEX"]),
    )) {
      process.env[key] ??= value;
    }
  }
  return config(command);
});

const config = (command: "build" | "serve") => ({
  server: { port: 8080 },
  build: {
    // Never inline fonts: small subsets (e.g. Share latin-ext) would land in the render-blocking
    // stylesheet as data URIs, even though the browser fetches them only when a page needs them.
    assetsInlineLimit: (file: string) => (/\.woff2?$/.test(file) ? false : undefined),
  },
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
  plugins: [
    tailwindcss(),
    // Responsive AVIF/WebP variants for imports with an imagetools query (see src/data/images.ts).
    imagetools(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Keep server-only modules out of the client bundle.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    // Nitro produces the production Node server (.output/server/index.mjs); dev uses Vite's SSR.
    command === "build" && nitro({ preset: "node-server", compressPublicAssets: true }),
    viteReact(),
  ],
});
