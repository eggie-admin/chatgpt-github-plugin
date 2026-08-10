import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const RESOURCE_URI = "ui://lum-pet-cathedral/v3/mcp-app.html";
const DIST_HTML = path.join(process.cwd(), "dist", "mcp-app.html");

const presetSchema = z.enum([
  "blank",
  "whisky-logan",
  "hold-him-back",
  "shy-logan",
  "professor-chaos",
]);

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Lum Pet Cathedral",
    version: "0.3.0",
  });

  registerAppTool(
    server,
    "open_lum_pet_cathedral",
    {
      title: "Open Lum Pet Cathedral",
      description:
        "Open the Lum Pet Cathedral three-step wizard for compact ASCII/emoticon scenes with Lum, Eggie/Wolverine, and Cutie/Copilot. The widget sends the completed scene back into the host conversation for native generation.",
      inputSchema: {
        preset: presetSchema.optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI,
          visibility: ["model", "app"],
        },
        "openai/toolInvocation/invoking": "Opening Lum Pet Cathedral…",
        "openai/toolInvocation/invoked": "Lum Pet Cathedral is ready.",
      },
    },
    async ({ preset }) => ({
      content: [
        {
          type: "text",
          text: "Lum Pet Cathedral is open. Complete the wizard to send the scene into the host chat for generation.",
        },
      ],
      structuredContent: {
        status: "collecting",
        preset: preset ?? "blank",
        executionMode: "host-model",
        providerKeyRequired: false,
      },
    }),
  );

  registerAppResource(
    server,
    "Lum Pet Cathedral UI",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(DIST_HTML, "utf-8");

      return {
        contents: [
          {
            uri: RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                prefersBorder: true,
                csp: {
                  connectDomains: [],
                  resourceDomains: [],
                },
              },
            },
          },
        ],
      };
    },
  );

  return server;
}

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.HOST ?? "0.0.0.0";
const app = createMcpExpressApp({ host });
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "lum-pet-cathedral",
    version: "0.3.0",
    executionMode: "host-model",
    providerKeyRequired: false,
  });
});

app.all("/mcp", async (req: Request, res: Response) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.listen(port, host, () => {
  console.log(`Lum Pet Cathedral MCP listening on http://${host}:${port}/mcp`);
});
