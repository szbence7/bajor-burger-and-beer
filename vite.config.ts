import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { imagetools } from "vite-imagetools";

export default defineConfig(({ command, mode }) => {
  // Runtime server vars (SUPABASE_*, SMTP_*, NOTIFY_*, NOINDEX) come from the environment in
  // production. In dev, .env wins over the shell: a stale export left in the terminal (e.g. an
  // old SMTP_HOST) must not silently override what the developer just wrote in .env.
  if (command === "serve") {
    const prefixes = ["SUPABASE_", "SMTP_", "NOTIFY_", "NOINDEX"];
    const shellValues = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => prefixes.some((p) => key.startsWith(p))),
    );
    // loadEnv itself prioritises process.env, so hide matching shell values while reading files.
    for (const key of Object.keys(shellValues)) delete process.env[key];
    try {
      Object.assign(process.env, shellValues, loadEnv(mode, process.cwd(), prefixes));
    } finally {
      for (const [key, value] of Object.entries(shellValues)) process.env[key] ??= value;
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
