#!/usr/bin/env node

/**
 * Streamable HTTP transport for Smithery / hosted deployments.
 * 
 * Start with: node dist/http.js
 * Env: PORT (default 3000)
 * 
 * Stateless mode - each request is independent, no session tracking.
 * Our tools are pure read-only knowledge lookups.
 */

import { createServer as createHttpServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

const httpServer = createHttpServer(async (req, res) => {
  // CORS headers for Smithery proxy
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", server: "lexbeam-eu-ai-act-mcp", version: "1.1.2" }));
    return;
  }

  // MCP endpoint
  if (req.url === "/mcp") {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    const server = createServer();
    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  // Fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found. Use /mcp for the MCP endpoint or /health for status." }));
});

httpServer.listen(PORT, () => {
  console.log(`EU AI Act MCP Server (HTTP) listening on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
