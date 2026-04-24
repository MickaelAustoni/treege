import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";
import { dependencies, name, peerDependencies } from "./package.json";

const external = [
  ...Object.keys(dependencies ?? {}).filter((dep) => dep !== "nanoid"),
  ...Object.keys(peerDependencies ?? {}),
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
];

// https://vitejs.dev/config/
const config = () =>
  defineConfig({
    build: {
      cssCodeSplit: false,
      lib: {
        entry: {
          editor: resolve(import.meta.dirname, "src/editor/index.ts"),
          main: resolve(import.meta.dirname, "src/main.ts"),
          renderer: resolve(import.meta.dirname, "src/renderer/index.ts"),
          "renderer-native": resolve(import.meta.dirname, "src/renderer/index.native.ts"),
        },
        fileName: "[name]",
        formats: ["es"],
        name,
      },
      rolldownOptions: {
        external,
      },
    },
    plugins: [
      dts({
        exclude: [
          "src/App.tsx",
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/stories/**/*",
          "**/*.stories.tsx",
          "**/*.stories.ts",
          "vite.config.ts",
        ],
        insertTypesEntry: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: resolve(import.meta.dirname, "./src") },
        { find: "~", replacement: resolve(import.meta.dirname) },
      ],
    },
  });

export default config;
