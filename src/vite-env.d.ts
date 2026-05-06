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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
