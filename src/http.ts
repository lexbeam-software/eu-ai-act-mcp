#!/usr/bin/env node

/**
 * Streamable HTTP transport for Smithery / hosted deployments.
 *
 * Start with: node dist/http.js
 * Env: PORT (default 3000), OPENAI_APPS_CHALLENGE (optional, OpenAI's domain token)
 *
 * Stateless mode - each request is independent, no session tracking.
 * The request handling, including the error boundary, lives in http-handler.ts.
 */

import { createServer as createHttpServer } from "node:http";
import { createRequestHandler } from "./http-handler.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

const httpServer = createHttpServer(createRequestHandler());

httpServer.listen(PORT, () => {
  console.log(`EU AI Act MCP Server (HTTP) listening on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
