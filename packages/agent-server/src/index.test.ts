import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
// Import the server instance or the app
// Assuming your src/index.ts exports the server or app:
import server from './index'; // Adjust if your export is different, e.g., app
import { GeminiChat, Config, AuthType, CoreToolScheduler } from '@google/gemini-cli-core';

// Mock environment variables for testing
const TEST_AGENT_SERVER_API_KEY = 'test-secret-key';
const TEST_GEMINI_API_KEY = 'test-gemini-key';

vi.mock('@google/gemini-cli-core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@google/gemini-cli-core')>();
  return {
    ...original,
    GeminiChat: vi.fn().mockImplementation(() => ({
      sendMessage: vi.fn().mockResolvedValue({
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Test response' }], role: 'model' } }],
        // Mock other necessary fields if your server uses them
      }),
      getHistory: vi.fn().mockReturnValue([]),
      setHistory: vi.fn(),
    })),
    Config: vi.fn().mockImplementation(() => ({
      refreshAuth: vi.fn().mockResolvedValue(undefined),
      getGeminiClient: vi.fn().mockReturnValue({
        getGenerativeModel: vi.fn().mockReturnValue({}), // Mock further if needed
      }),
      // Mock other Config methods used during server initialization
    })),
    CoreToolScheduler: vi.fn(), // Mock if used directly,
    AuthType: original.AuthType, // Keep original AuthType
  };
});


describe('Agent Server API', () => {
  beforeAll(async () => {
    process.env.AGENT_SERVER_API_KEY = TEST_AGENT_SERVER_API_KEY;
    process.env.GEMINI_API_KEY = TEST_GEMINI_API_KEY; // Needed for server to start
    // Ensure server is started or app is available for supertest
    // If your server starts automatically on import and initialization is async,
    // you might need a mechanism to wait for it.
    // For supertest, often passing the app instance is enough.
    // If server is not already listening, you might need:
    // await new Promise(resolve => server.listen(0, resolve)); // Listen on a random port for tests
  });

  afterAll(async () => {
    // server.close(); // Close server if you started it manually
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if X-Agent-API-Key header is missing', async () => {
      const response = await request(server).post('/chat').send({ prompt: 'hello' });
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should return 401 if X-Agent-API-Key header is incorrect', async () => {
      const response = await request(server)
        .post('/chat')
        .set('X-Agent-API-Key', 'wrong-key')
        .send({ prompt: 'hello' });
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });
  });

  describe('POST /chat', () => {
    it('should return 400 if prompt is missing', async () => {
      const response = await request(server)
        .post('/chat')
        .set('X-Agent-API-Key', TEST_AGENT_SERVER_API_KEY)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Prompt is required');
    });

    it('should return a mocked response for a valid chat request', async () => {
      const mockedSendMessage = vi.mocked(GeminiChat.prototype.sendMessage);
      mockedSendMessage.mockResolvedValueOnce({
         // @ts-ignore
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Mocked chat response' }], role: 'model' } }],
        usageMetadata: { totalTokenCount: 10 }
      });

      const response = await request(server)
        .post('/chat')
        .set('X-Agent-API-Key', TEST_AGENT_SERVER_API_KEY)
        .send({ prompt: 'Test prompt' });

      expect(response.status).toBe(200);
      expect(mockedSendMessage).toHaveBeenCalledWith({ message: 'Test prompt' });
      expect(response.body.response.candidates[0].content.parts[0].text).toBe('Mocked chat response');
      expect(response.body.toolRequests).toBeNull();
    });

    it('should correctly identify and return tool_code requests', async () => {
      const toolCallPart = { functionCall: { name: 'test_tool', args: { param1: 'value1' } } };
      const mockedSendMessageWithToolCall = vi.mocked(GeminiChat.prototype.sendMessage);
      mockedSendMessageWithToolCall.mockResolvedValueOnce({
        // @ts-ignore
        candidates: [{ finishReason: 'TOOL_CODE', content: { parts: [toolCallPart], role: 'model' } }],
      });

      const response = await request(server)
        .post('/chat')
        .set('X-Agent-API-Key', TEST_AGENT_SERVER_API_KEY)
        .send({ prompt: 'Call a tool' });

      expect(response.status).toBe(200);
      expect(response.body.response).toBeNull();
      expect(response.body.toolRequests).toEqual([toolCallPart]);
      expect(vi.mocked(GeminiChat.prototype.getHistory)).toHaveBeenCalled();
    });
  });

  // Add more tests for /execute_tool_call and /run when implemented
});
