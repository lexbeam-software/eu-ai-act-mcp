#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerClassifyTool } from "./tools/classify.js";
import { registerDeadlinesTool } from "./tools/deadlines.js";
import { registerObligationsTool } from "./tools/obligations.js";
import { registerFaqTool } from "./tools/faq.js";

const server = new McpServer({
  name: "lexbeam-eu-ai-act-mcp-server",
  version: "1.0.0",
});

// Register all tools
registerClassifyTool(server);
registerDeadlinesTool(server);
registerObligationsTool(server);
registerFaqTool(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
