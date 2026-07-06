import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const projectRoot = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  build: {
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              priority: 50,
              test: /node_modules[\\/](react|react-dom|react-router)[\\/]/,
            },
            {
              name: "radix-vendor",
              priority: 40,
              test: /node_modules[\\/](radix-ui|@radix-ui)[\\/]/,
            },
            {
              name: "data-vendor",
              priority: 30,
              test: /node_modules[\\/](@supabase|@tanstack)[\\/]/,
            },
            {
              name: "forms-vendor",
              priority: 20,
              test: /node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
            },
            {
              name: "ui-vendor",
              priority: 10,
              test: /node_modules[\\/](lucide-react|sonner|cmdk|class-variance-authority|clsx|tailwind-merge)[\\/]/,
            },
            {
              name: "vendor",
              priority: 1,
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
  },
})
