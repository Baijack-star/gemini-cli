/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadEnvironment } from './config.js';

/**
 * Validates if the CLI is configured to connect to the Agent Server.
 * It checks for AGENT_SERVER_URL and AGENT_SERVER_API_KEY.
 * The `authMethod` parameter is kept for now for compatibility with existing call sites,
 * but it's no longer used to select different auth strategies within the CLI itself.
 */
export const validateAuthMethod = (_authMethod?: string): string | null => {
  loadEnvironment(); // Ensures .env files are loaded

  const agentServerUrl = process.env.AGENT_SERVER_URL;
  const agentServerApiKey = process.env.AGENT_SERVER_API_KEY;

  if (!agentServerUrl) {
    return 'AGENT_SERVER_URL environment variable not found. Please set it to the URL of your agent server (e.g., http://localhost:3000).';
  }

  try {
    // Basic URL validation
    new URL(agentServerUrl);
  } catch (e) {
    return 'AGENT_SERVER_URL is not a valid URL.';
  }

  if (!agentServerApiKey) {
    return 'AGENT_SERVER_API_KEY environment variable not found. This key is required to authenticate with the agent server.';
  }

  // All checks passed, CLI is configured to connect to the agent server.
  return null;
};
