import express from 'express';
import http from 'http';
import {
  Config,
  AuthType,
  GeminiChat,
  Content,
  GenerateContentResponse,
  CoreToolScheduler, // Assuming this is the correct import
  // Potentially other imports from core like ToolResponsePart, etc.
} from '@google/gemini-cli-core';

// Environment variable loading
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_SERVER_API_KEY = process.env.AGENT_SERVER_API_KEY;
const PORT = process.env.PORT || 3000;

if (!GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY environment variable is not set.');
  process.exit(1);
}

if (!AGENT_SERVER_API_KEY) {
  console.error('FATAL ERROR: AGENT_SERVER_API_KEY environment variable is not set.');
  process.exit(1);
}

const app = express();
app.use(express.json());

// --- Core Logic Initialization ---
// TODO: Initialize Config, GeminiChat, CoreToolScheduler
// This is a placeholder, actual initialization will be more involved
let coreConfig: Config;
let geminiChat: GeminiChat;
let toolScheduler: CoreToolScheduler; // Define type if not already

async function initializeCoreLogic() {
  try {
    // These are illustrative parameters; adjust as needed for server context
    const configParams = {
      sessionId: `server-session-${Date.now()}`, // Server might manage sessions differently
      model: process.env.GEMINI_MODEL || 'gemini-pro', // Or your default model
      targetDir: process.cwd(), // Server's working directory or a configured one
      debugMode: process.env.DEBUG === 'true',
      cwd: process.cwd(),
      // Other parameters like toolDiscoveryCommand might be null or configured differently
    };
    coreConfig = new Config(configParams);

    // This will use the modified createContentGeneratorConfig which relies on GEMINI_API_KEY env var
    await coreConfig.refreshAuth(AuthType.USE_GEMINI);

    geminiChat = new GeminiChat(coreConfig, coreConfig.getGeminiClient().getGenerativeModel());
    toolScheduler = new CoreToolScheduler(coreConfig, coreConfig.getGeminiClient().getGenerativeModel());

    console.log('Core logic initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize core logic:', error);
    process.exit(1);
  }
}

// --- Authentication Middleware ---
const apiKeyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const providedApiKey = req.headers['x-agent-api-key'];
  if (!providedApiKey || providedApiKey !== AGENT_SERVER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid API key.' });
  }
  next();
};

app.use(apiKeyMiddleware); // Apply to all routes for now

// --- API Endpoints ---

// Placeholder for /chat
app.post('/chat', async (req, res) => {
  const { prompt, history } = req.body as { prompt: string | Part | (string | Part)[]; history?: Content[] };

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    if (history && Array.isArray(history)) {
      // TODO: Validate history contents if necessary
      geminiChat.setHistory(history); // Or addHistory if that's more appropriate
    }

    const result = await geminiChat.sendMessage({ message: prompt });

    // Check for tool calls / function calls
    const candidate = result.candidates?.[0];
    let toolRequests;

    if (candidate?.finishReason === 'TOOL_CODE' && candidate.content?.parts) {
      toolRequests = candidate.content.parts.filter(part => 'functionCall' in part);
    } else if (candidate?.finishReason === 'MODEL_REQUESTED_TOOL_CALLS' && candidate.content?.parts) { // Check for new property name
      toolRequests = candidate.content.parts.filter(part => 'toolCall' in part);
    }


    if (toolRequests && toolRequests.length > 0) {
      // Assuming the session/history is managed by GeminiChat instance
      // The client will need to call /execute_tool_call with the responses
      res.json({ response: null, toolRequests: toolRequests, history: geminiChat.getHistory() });
    } else {
      res.json({ response: result, toolRequests: null, history: geminiChat.getHistory() });
    }
  } catch (error) {
    console.error('Error in /chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

// Placeholder for /execute_tool_call
app.post('/execute_tool_call', async (req, res) => {
  // const { toolCallId, toolResponse } = req.body;
  // TODO: Implement tool execution logic using toolScheduler and GeminiChat
  res.status(501).json({ error: 'Not Implemented' });
});

// Placeholder for /run
app.post('/run', async (req, res) => {
  // const { prompt } = req.body;
  // TODO: Implement full non-interactive run logic
  res.status(501).json({ error: 'Not Implemented' });
});


// --- Server Initialization ---
const server = http.createServer(app);

async function startServer() {
  await initializeCoreLogic();
  server.listen(PORT, () => {
    console.log(`Agent server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default server; // For potential testing or programmatic use
