/**
 * Request handler for the hosted endpoint (Streamable HTTP, stateless).
 *
 * Kept apart from http.ts, which only binds the port, so the behavior suite can run the
 * handler in-process: the error boundary, the health check and the OpenAI domain check.
 * Our tools are pure read-only knowledge lookups; each request gets its own MCP server.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { SERVER_VERSION } from "./constants.js";

/** Where OpenAI's plugin directory checks domain control (developers.openai.com/plugins/deploy/submission). */
export const OPENAI_CHALLENGE_PATH = "/.well-known/openai-apps-challenge";

export interface RequestHandlerOptions {
  /** Builds the MCP server for one request; injectable so a test can force a failure. */
  createMcpServer?: () => McpServer;
  /** Receives the one log line a failed request writes; injectable so a test can read it. */
  logError?: (line: string) => void;
}

export function createRequestHandler(options: RequestHandlerOptions = {}) {
  const buildServer = options.createMcpServer ?? createServer;
  const logError = options.logError ?? ((line: string) => console.error(line));

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
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
      res.end(JSON.stringify({ status: "ok", server: "lexbeam-eu-ai-act-mcp", version: SERVER_VERSION }));
      return;
    }

    // OpenAI domain verification: the token OpenAI's submission form shows, set on the host as
    // OPENAI_APPS_CHALLENGE. Without it the path is unknown like any other and answers 404.
    if (req.method === "GET" && req.url === OPENAI_CHALLENGE_PATH) {
      const token = process.env.OPENAI_APPS_CHALLENGE?.trim();
      if (token) {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(token);
        return;
      }
    }

    // MCP endpoint
    if (req.url === "/mcp") {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
      });
      const server = buildServer();
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res);
      return;
    }

    // Fallback
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use /mcp for the MCP endpoint or /health for status." }));
  }

  // Error boundary: a request that throws answers 500 and the process keeps serving. Without it,
  // the rejected promise of the async handler ended the process. The log line names the error
  // type only, never its message, because a message can quote submitted input.
  return (req: IncomingMessage, res: ServerResponse): void => {
    handle(req, res).catch((error: unknown) => {
      const kind = error instanceof Error ? error.name : typeof error;
      logError(`[eu-ai-act-mcp] request failed: ${kind}`);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal error. The request was not processed." }));
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  };
}
