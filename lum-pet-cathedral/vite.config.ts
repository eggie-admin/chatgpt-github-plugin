import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const input = process.env.INPUT;
if (!input) throw new Error("INPUT environment variable is required");

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    rollupOptions: { input },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
  },
});
