# Gemini CLI Authentication Setup

The Gemini CLI now operates in a client-server model. The CLI (client) communicates with a separate Agent Server, which in turn interacts with Google's AI services. This section details how to configure authentication for both the Agent Server and the CLI client.

## Agent Server Configuration

The Agent Server requires two primary pieces of authentication configuration, typically set as environment variables on the machine where the server is running:

1.  **`GEMINI_API_KEY` (for Google AI Services)**:
    *   This API key is used by the Agent Server to authenticate its requests to the Google Gemini API.
    *   Obtain your API key from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
    *   Set this environment variable on the server machine:
        ```bash
        export GEMINI_API_KEY="YOUR_GEMINI_API_KEY_FROM_AI_STUDIO"
        ```

2.  **`AGENT_SERVER_API_KEY` (for Client to Server Authentication)**:
    *   This is a secret key that you define. The Agent Server uses it to authenticate incoming requests from Gemini CLI clients (or any other programmatic clients).
    *   Choose a strong, unique key.
    *   Set this environment variable on the server machine:
        ```bash
        export AGENT_SERVER_API_KEY="YOUR_CHOSEN_SECRET_KEY_FOR_SERVER_ACCESS"
        ```
    *   **Important**: Any client wishing to connect to this Agent Server will need to use this key.

## Gemini CLI (Client) Configuration

The Gemini CLI client needs to know how to connect and authenticate to your running Agent Server. This is configured by setting the following, typically as environment variables or in a `.gemini/.env` file (see below):

1.  **`AGENT_SERVER_URL`**:
    *   The full URL of your deployed Agent Server (e.g., `http://localhost:3000` if running locally, or `https://your-agent-server.example.com` if deployed).
    *   Example:
        ```bash
        export AGENT_SERVER_URL="http://localhost:3000"
        ```

2.  **`AGENT_SERVER_API_KEY`**:
    *   The secret key that the Agent Server expects for client authentication. This **must match** the `AGENT_SERVER_API_KEY` configured on the Agent Server.
    *   Example:
        ```bash
        export AGENT_SERVER_API_KEY="YOUR_CHOSEN_SECRET_KEY_FOR_SERVER_ACCESS"
        ```

### Persisting Client Configuration with `.env` Files

For convenience, you can store the `AGENT_SERVER_URL` and `AGENT_SERVER_API_KEY` in a `.gemini/.env` file. This saves you from having to set environment variables in every new shell session.

Gemini CLI automatically loads these variables from the **first** `.env` file it finds, using the following search order:

1.  Starting in the **current directory** and moving upward toward `/`, for each directory it checks:
    1.  `.gemini/.env`
    2.  `.env` (a plain `.env` file also works, but `.gemini/.env` is recommended for Gemini-specific variables)
2.  If no file is found in the current directory hierarchy, it falls back to your **home directory**:
    *   `~/.gemini/.env`
    *   `~/.env`

> **Important:** The search stops at the **first** file encountered—variables are **not merged** across multiple files.

#### Example `.gemini/.env` file for the CLI:

Create or edit the file (e.g., `~/.gemini/.env` for user-wide settings, or `./.gemini/.env` for project-specific settings):

```env
AGENT_SERVER_URL="http://localhost:3000"
AGENT_SERVER_API_KEY="YOUR_CHOSEN_SECRET_KEY_FOR_SERVER_ACCESS"
```

## Deprecated Authentication Methods

Previous versions of the Gemini CLI supported direct authentication to Google's AI services using methods such as:

*   Login with Google (OAuth-based flow)
*   Direct `GEMINI_API_KEY` usage by the CLI
*   Vertex AI authentication (ADC or Vertex-specific API keys)

**These direct authentication methods within the CLI are now deprecated and no longer used.** The CLI exclusively connects to an Agent Server, and the Agent Server is responsible for authenticating with the Gemini API (using its own `GEMINI_API_KEY`). Ensure your Agent Server is configured as described above.
