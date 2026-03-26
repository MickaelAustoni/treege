import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { dependencies, name, peerDependencies } from "./package.json";

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
        external: [...Object.keys(dependencies ?? {}).filter((dep) => dep !== "nanoid"), ...Object.keys(peerDependencies ?? {})],
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
      cssInjectedByJsPlugin({
        jsAssetsFilterFunction: (outputChunk) => {
          return outputChunk.fileName.includes("ThemeContext");
        },
        injectCodeFunction: (cssCode: string) => {
          // Inject CSS at the beginning of <head> for lower specificity
          // This allows users to easily override Treege styles
          const doc = (globalThis as any).document;

          try {
            if (typeof doc !== "undefined") {
              const style = doc.createElement("style");
              style.id = "treege-styles";
              style.appendChild(doc.createTextNode(cssCode));
              doc.head.insertBefore(style, doc.head.firstChild);
            }
          } catch (e) {
            console.error("vite-plugin-css-injected-by-js", e);
          }
        },
      }),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: resolve(import.meta.dirname, "./src") },
        { find: "~", replacement: resolve(import.meta.dirname) },
      ],
    },
  });

export default config;
