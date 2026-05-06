/// <reference types="vite/client" />

declare module "*.svg";

interface ImportMetaEnv {
  /** API key for the AI tree generator (Gemini / OpenAI / DeepSeek / Claude). */
  readonly VITE_AI_API_KEY?: string;
  /**
   * Optional Bearer token for the example app's renderer. When set, the
   * example seeds its global headers with `Authorization: Bearer <token>`.
   */
  readonly VITE_BEARER_TOKEN?: string;
  /**
   * Optional URL to an OpenAPI 3.x document. When set, the example passes
   * it to `TreegeEditor` so the editor auto-loads it on mount.
   */
  readonly VITE_OPENAPI_URL?: string;
  /**
   * Optional base URL override for the OpenAPI document. Useful when the
   * spec's declared servers point at a different environment than the one
   * the user wants to call (e.g. staging vs prod).
   */
  readonly VITE_OPENAPI_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
