import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
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
      cssInjectedByJsPlugin({
        // Attach the injection to every web entry chunk so the <style> lands
        // before React mounts. Attaching it to a shared lazy chunk (the
        // previous setup) caused a FOUC while that chunk was still in flight.
        // renderer-native is excluded — React Native has no document.
        jsAssetsFilterFunction: (outputChunk) => outputChunk.isEntry && outputChunk.fileName !== "renderer-native.js",
        injectCodeFunction: (cssCode: string) => {
          // Inject at the top of <head> so the consumer's stylesheet comes
          // later in the cascade and can override Treege's tg:-prefixed
          // utilities without needing !important.
          const doc = (globalThis as any).document;

          try {
            if (typeof doc === "undefined" || doc.getElementById("treege-styles")) {
              return;
            }
            const style = doc.createElement("style");
            style.id = "treege-styles";
            style.appendChild(doc.createTextNode(cssCode));
            doc.head.insertBefore(style, doc.head.firstChild);
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
