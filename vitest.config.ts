import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Mirrors tsconfig.json `paths`: "@/*" -> "./src/*"
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
