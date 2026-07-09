import { Edge, Node } from "@xyflow/react";

/**
 * AI Provider types for tree generation
 */
export type AIProvider = "gemini" | "openai" | "deepseek" | "claude";

/**
 * AI Configuration for tree generation
 */
export interface AIConfig {
  /**
   * The AI provider to use
   * @default "gemini"
   */
  provider?: AIProvider;
  /**
   * API key for the selected provider
   */
  apiKey: string;
  /**
   * Optional model name override
   * - Gemini: "gemini-2.5-flash" (default), "gemini-2.5-pro-preview-03-25"
   * - OpenAI: "gpt-4o-mini" (default), "gpt-4o", "gpt-3.5-turbo"
   * - DeepSeek: "deepseek-chat" (default)
   * - Claude: "claude-opus-4-8" (default), "claude-sonnet-5", "claude-haiku-4-5"
   */
  model?: string;
  /**
   * Temperature for generation (0-1, default: 0.7)
   */
  temperature?: number;
}

/**
 * AI Generation request
 */
export interface AIGenerationRequest {
  /**
   * User prompt describing the desired tree/form
   */
  prompt: string;
  /**
   * AI configuration
   */
  config: AIConfig;
}

/**
 * AI Generation response
 */
export interface AIGenerationResponse {
  /**
   * Generated nodes
   */
  nodes: Node[];
  /**
   * Generated edges
   */
  edges: Edge[];
  /**
   * Optional explanation or metadata
   */
  metadata?: {
    explanation?: string;
    nodesCount?: number;
    edgesCount?: number;
  };
}
