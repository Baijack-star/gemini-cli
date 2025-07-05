/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fetch from 'node-fetch'; // Using node-fetch for Node.js environment
import { Content, GenerateContentResponse } from '@google/gemini-cli-core';

// These would typically come from settings or environment variables
const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL;
const AGENT_SERVER_API_KEY = process.env.AGENT_SERVER_API_KEY;

interface AgentChatResponse {
  response: GenerateContentResponse | null;
  toolRequests?: any[] | null; // Define more specific type if available from server
  history: Content[];
}

interface AgentRunResponse {
  // Define based on what /run endpoint will return
  finalAnswer?: string;
  history?: Content[];
  error?: string;
}

if (!AGENT_SERVER_URL) {
  // This check is also in gemini.tsx, but good for direct use of this module
  console.warn(
    'AGENT_SERVER_URL is not set. API calls to agent server will fail.',
  );
}
if (!AGENT_SERVER_API_KEY) {
  console.warn(
    'AGENT_SERVER_API_KEY is not set. API calls to agent server will fail.',
  );
}

async function post<T>(endpoint: string, body: object): Promise<T> {
  if (!AGENT_SERVER_URL || !AGENT_SERVER_API_KEY) {
    throw new Error(
      'Agent server URL or API key is not configured. Please set AGENT_SERVER_URL and AGENT_SERVER_API_KEY.',
    );
  }

  const response = await fetch(`${AGENT_SERVER_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-API-Key': AGENT_SERVER_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Agent server request failed: ${response.status} ${response.statusText} - ${errorBody}`,
    );
  }
  return response.json() as Promise<T>;
}

export async function agentChat(
  prompt: string | Part | (string | Part)[],
  history?: Content[],
): Promise<AgentChatResponse> {
  return post<AgentChatResponse>('/chat', { prompt, history });
}

export async function agentExecuteToolCall(
  toolCallId: string, // Or the full tool call object
  toolResponse: unknown, // Specific Part for tool response, e.g., FunctionResponsePart
): Promise<AgentChatResponse> {
  // Endpoint might need to be /execute_tool_call or similar
  return post<AgentChatResponse>('/execute_tool_call', {
    toolCallId,
    toolResponse,
  });
}

export async function agentRun(prompt: string): Promise<AgentRunResponse> {
  return post<AgentRunResponse>('/run', { prompt });
}

// Add types for Part if not already globally available via core
type Part = { text?: string; inlineData?: unknown; functionCall?: unknown, toolCall?: unknown };
