/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Config, // Config might still be used for non-API related settings
  shutdownTelemetry,
  isTelemetrySdkInitialized,
} from '@google/gemini-cli-core';
// import {
//   Content,
//   Part,
//   FunctionCall,
//   GenerateContentResponse,
// } from '@google/genai'; // No longer directly interacting with GenAI types here

import { parseAndFormatApiError } from './ui/utils/errorParsing.js';
import { agentRun } from './utils/agentClient.js'; // Import the new agent client

export async function runNonInteractive(
  // config: Config, // Config may not be needed, or only for specific settings
  _config: Config, // Marking as unused for now
  input: string,
): Promise<void> {
  // Handle EPIPE errors when the output is piped to a command that closes early.
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') {
      // Exit gracefully if the pipe is closed.
      process.exit(0);
    }
  });

  try {
    const result = await agentRun(input);

    if (result.error) {
      console.error(`Error during non-interactive run: ${result.error}`);
      // Attempt to parse and format if it's a known API error structure,
      // otherwise print the raw error.
      // The error structure from agentRun might differ from direct API errors.
      console.error(parseAndFormatApiError(result.error));
      process.exit(1);
    }

    if (result.finalAnswer) {
      process.stdout.write(result.finalAnswer);
      // Ensure a final newline if the server doesn't guarantee it.
      if (!result.finalAnswer.endsWith('\n')) {
        process.stdout.write('\n');
      }
    } else {
      // Handle cases where there's no error but also no final answer
      // This might indicate an issue with the server's /run endpoint logic
      console.warn("Non-interactive run completed without a final answer.");
    }

  } catch (error) {
    // This will catch errors from agentRun (e.g., network issues, server 500s)
    // or unexpected errors in this function.
    console.error(parseAndFormatApiError(error));
    process.exit(1);
  } finally {
    if (isTelemetrySdkInitialized()) {
      await shutdownTelemetry();
    }
  }
}
