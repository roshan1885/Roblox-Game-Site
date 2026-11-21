import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const define: Record<string, string> = {};
  if (env["SUPABASE_URL"]) {
    define["import.meta.env.SUPABASE_URL"] = JSON.stringify(env["SUPABASE_URL"]);
  }
  if (env["SUPABASE_PUBLISHABLE_KEY"]) {
    define["import.meta.env.SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(env["SUPABASE_PUBLISHABLE_KEY"]);
  }

  return {
    plugins: [
      viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
      ...tanstackStart(),
      viteReact(),
      tailwindcss(),
      nitro({ preset: "vercel" }),
    ],
    environments: {
      ssr: { build: { rollupOptions: { input: "./src/server.ts" } } },
    },
    define,
  };
});
