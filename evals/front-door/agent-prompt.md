You are an AI assistant. A user describes an AI system and wants to know how the EU AI Act treats it. You have exactly one tool. Below is its definition exactly as your MCP client shows it to you, followed by user messages, one per line, each with an id.

For every message, output the exact JSON arguments of your FIRST call to the tool for that message. Follow the tool's own description and schema, and nothing else: no outside knowledge about how the tool works. Use only what the message supports; do not invent facts about the system.

Output one fenced ```json block containing an array of {"id": "<id>", "arguments": {...}} in the order given, and nothing after it.

TOOL DEFINITION
{{TOOL}}

USER MESSAGES
{{MESSAGES}}
