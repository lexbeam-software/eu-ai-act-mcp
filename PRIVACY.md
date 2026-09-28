# Privacy Policy: EU AI Act MCP Server (hosted endpoint)

Last updated: 28 September 2026

This policy covers the hosted endpoint `https://mcp.lexbeam.com/mcp` (and its health check
`https://mcp.lexbeam.com/health`), including use through the Lexbeam plugins that connect to it. If you run
the server yourself from npm or from this repository, it runs on your machine and sends nothing to Lexbeam.

## Controller

Werner Plutat, Lexbeam Software, Speditionstraße 15A, 40221 Düsseldorf, Germany.
Email: info@lexbeam.com

## What the endpoint receives

- **Tool arguments:** the values your AI assistant sends with each tool call, for example a description of
  an AI system to classify or an article number.
- **Request data:** the technical data of each HTTPS request, namely IP address, time, requested URL and user
  agent.

The tools need no personal, confidential or privileged information. Do not include such information in the
descriptions you ask your assistant to submit.

## How the data is used and stored

The server uses the tool arguments only to compute the result, which it returns in the same response. It
runs statelessly: it keeps no sessions, stores no tool arguments or results, sets no cookies and runs no
analytics or tracking. The server code does not log request contents.

## Hosting and third parties

The endpoint is hosted by Railway (Railway Corporation, San Francisco, USA). As part of hosting, Railway
processes server log data (IP address, time, URL, user agent). For service providers in the USA, the
transfer is based on an adequacy decision (Art. 45 GDPR) or appropriate safeguards (Art. 46 GDPR, in
particular standard contractual clauses).

Lexbeam shares the data with no one else. Your AI assistant's provider processes your conversation under its
own terms; Lexbeam receives only the tool arguments the assistant sends.

## Retention

Lexbeam keeps no tool arguments or results. Server logs are kept according to the hosting provider's
standard retention periods.

## Legal basis

Art. 6(1)(f) GDPR: the legitimate interest in answering the requests sent to the endpoint and in operating
and securing the service.

## Automated decisions

There is no automated decision-making within the meaning of Art. 22 GDPR. The results are general guidance,
not legal advice.

## Your rights

Where the legal conditions are met, you have the right of access (Art. 15 GDPR), rectification (Art. 16),
erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection
(Art. 21). You also have the right to lodge a complaint with a data protection supervisory authority, in
particular in the Member State of your habitual residence (Art. 77 GDPR).

## Contact

info@lexbeam.com. The privacy policy for Lexbeam's websites (German) is at
https://www.lexbeam.com/datenschutz.
