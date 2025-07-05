# Gemini Agent Server

## Overview

The Gemini Agent Server is a Node.js application that acts as an intermediary between the Gemini CLI (and other potential clients) and Google's AI services (Gemini API). It manages conversations, handles tool execution requests from the Gemini model, and provides a stable API endpoint for clients. This allows the core agent logic to run in a persistent server environment.

## Configuration

The Agent Server is configured using environment variables:

*   **`PORT`**: The port on which the server will listen.
    *   Default: `3000`
    *   Example: `export PORT=3001`

*   **`GEMINI_API_KEY`**: **Required.** The API key for authenticating with the Google Gemini API.
    *   The server uses this key to make calls to Google's AI services.
    *   Obtain this key from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
    *   Example: `export GEMINI_API_KEY="YOUR_GEMINI_API_KEY_FROM_AI_STUDIO"`

*   **`AGENT_SERVER_API_KEY`**: **Required.** A secret key used to protect the Agent Server itself.
    *   Clients (like the Gemini CLI) must provide this key in the `X-Agent-API-Key` header to authenticate their requests to this server.
    *   Choose a strong, unique key.
    *   Example: `export AGENT_SERVER_API_KEY="YOUR_STRONG_SECRET_KEY"`

*   **`GEMINI_MODEL`**: Optional. The default Gemini model to be used by the server.
    *   Default: `gemini-pro` (or as defined in the server's core configuration)
    *   Example: `export GEMINI_MODEL="gemini-1.5-flash"`

*   **`DEBUG`**: Optional. Set to `true` to enable debug mode features if implemented in the server.
    *   Example: `export DEBUG=true`


## API Endpoints

The Agent Server exposes the following HTTP API endpoints. All endpoints require an `X-Agent-API-Key` header for authentication.

### `POST /chat`

Initiates or continues a chat conversation with the agent.

*   **Request Body**:
    ```json
    {
      "prompt": "Your message to the agent" | Part | (string | Part)[], // User's input
      "history": Content[] // Optional: Existing conversation history (array of Content objects from @google/gemini-cli-core)
    }
    ```
    *(See `@google/gemini-cli-core` for `Part` and `Content` type definitions)*

*   **Response Body (Success)**:
    *   If a direct text/rich response from the model:
        ```json
        {
          "response": GenerateContentResponse, // Full response from Gemini API
          "toolRequests": null,
          "history": Content[] // Updated conversation history
        }
        ```
    *   If the model requests a tool call:
        ```json
        {
          "response": null,
          "toolRequests": [FunctionCallPart | ToolCallPart], // Array of tool/function call requests
          "history": Content[] // Updated conversation history (including the model's request for tool use)
        }
        ```
        *(See `@google/generative-ai` or `@google/gemini-cli-core` for `GenerateContentResponse`, `FunctionCallPart`, `ToolCallPart` definitions)*

*   **Response Body (Error)**:
    ```json
    {
      "error": "Error message string"
    }
    ```
    (Status codes: `400` for bad request, `401` for unauthorized, `500` for server errors)

### `POST /execute_tool_call`

*(Note: This endpoint's full implementation is pending in the reference server code.)*

Sends the result of a tool execution (requested by the model in a previous `/chat` response) back to the agent.

*   **Request Body (Anticipated)**:
    ```json
    {
      "toolCallId": "string", // The ID of the tool call from the toolRequests array
      "toolResponse": Part // The FunctionResponsePart or ToolResponsePart containing the tool's output
    }
    ```

*   **Response Body (Anticipated)**: Similar to `/chat`, returning the agent's next response or further tool requests.

### `POST /run`

*(Note: This endpoint's full implementation is pending in the reference server code.)*

Executes a prompt non-interactively, allowing the agent to perform multiple steps (chat turns, tool executions) autonomously until a final answer is reached.

*   **Request Body (Anticipated)**:
    ```json
    {
      "prompt": "Your initial prompt for the non-interactive run"
    }
    ```

*   **Response Body (Anticipated)**:
    ```json
    {
      "finalAnswer": "The final textual answer from the agent",
      "history": Content[], // Complete conversation history of the run
      "error": "Optional error message if the run failed"
    }
    ```

## Deployment

The Agent Server is a Node.js application. To run it:

1.  Ensure Node.js and npm/yarn are installed.
2.  Clone the repository (if applicable) or navigate to the `packages/agent-server` directory.
3.  Install dependencies: `npm install` or `yarn install`.
4.  Set the required environment variables (`GEMINI_API_KEY`, `AGENT_SERVER_API_KEY`, `PORT`, etc.).
5.  Build the TypeScript code: `npm run build`.
6.  Start the server: `npm run start`.

Consider using process managers like PM2 for running the server in a production-like environment.

## Security Considerations

*   **`GEMINI_API_KEY`**: This key grants access to your Google AI services. Keep it confidential and secure. Do not embed it directly in client-side code or commit it to version control.
*   **`AGENT_SERVER_API_KEY`**: This key protects your Agent Server from unauthorized access. Keep it confidential.
*   **Network Security**: Deploy the Agent Server in a secure network environment. If exposing it to the internet, consider using HTTPS (e.g., via a reverse proxy like Nginx or Caddy) and firewall rules.
*   **Input Validation**: While the reference server has basic input handling, robust input validation should be added if extending the server for production use, especially for tool arguments.
