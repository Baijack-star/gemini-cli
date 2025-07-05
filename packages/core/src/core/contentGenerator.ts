/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
  GoogleGenAI,
} from '@google/genai';
import { createCodeAssistContentGenerator } from '../code_assist/codeAssist.js';
import { DEFAULT_GEMINI_MODEL } from '../config/models.js';
import { getEffectiveModel } from './modelCheck.js';

/**
 * Interface abstracting the core functionalities for generating content and counting tokens.
 */
export interface ContentGenerator {
  generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse>;

  generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;

  countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;

  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;
}

export enum AuthType {
  // LOGIN_WITH_GOOGLE = 'oauth-personal', // Removed
  USE_GEMINI = 'gemini-api-key',
  // USE_VERTEX_AI = 'vertex-ai', // Removed
}

export type ContentGeneratorConfig = {
  model: string;
  apiKey?: string;
  // vertexai?: boolean; // Removed
  authType?: AuthType | undefined; // Will always be USE_GEMINI or undefined then defaulted
};

export async function createContentGeneratorConfig(
  model: string | undefined,
  authType: AuthType | undefined, // This will effectively always be USE_GEMINI
  config?: { getModel?: () => string },
): Promise<ContentGeneratorConfig> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required and not set.',
    );
  }

  // Use runtime model from config if available, otherwise fallback to parameter or default
  const effectiveModel = config?.getModel?.() || model || DEFAULT_GEMINI_MODEL;

  const contentGeneratorConfig: ContentGeneratorConfig = {
    model: effectiveModel,
    authType: AuthType.USE_GEMINI, // Force USE_GEMINI
    apiKey: geminiApiKey,
  };

  contentGeneratorConfig.model = await getEffectiveModel(
    contentGeneratorConfig.apiKey,
    contentGeneratorConfig.model,
  );

  return contentGeneratorConfig;
}

export async function createContentGenerator(
  config: ContentGeneratorConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sessionId?: string, // sessionId might not be needed if CodeAssist path is removed
): Promise<ContentGenerator> {
  const version = process.env.CLI_VERSION || process.version;
  const httpOptions = {
    headers: {
      'User-Agent': `GeminiCLI/${version} (${process.platform}; ${process.arch})`,
    },
  };

  if (config.authType === AuthType.USE_GEMINI) {
    if (!config.apiKey) {
      throw new Error(
        'GEMINI_API_KEY is missing in contentGeneratorConfig for USE_GEMINI auth type.',
      );
    }
    const googleGenAI = new GoogleGenAI({
      apiKey: config.apiKey,
      // vertexai: config.vertexai, // Removed
      httpOptions,
    });

    return googleGenAI.models;
  }

  // Fallback or error if authType is somehow not USE_GEMINI
  // Given createContentGeneratorConfig now forces USE_GEMINI, this path should ideally not be hit.
  throw new Error(
    `Error creating contentGenerator: Unsupported or misconfigured authType. Expected AuthType.USE_GEMINI. Received: ${config.authType}`,
  );
}
