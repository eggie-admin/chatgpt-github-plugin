import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const DIST_DIR = path.join(import.meta.dirname, "dist");
const RESOURCE_URI = "ui://lum-pet-cathedral/v2/mcp-app.html";

const presetSchema = z.enum([
  "blank",
  "whisky-logan",
  "hold-him-back",
  "shy-logan",
]);

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Lum Pet Cathedral",
    version: "0.2.0",
  });

  registerAppTool(
    server,
    "open_lum_pet_cathedral",
    {
      title: "Open Lum Pet Cathedral",
      description:
        "Open a three-step in-chat wizard for Lum, Eggie/Wolverine, and Cutie/Copilot ASCII-emoticon scenes. The completed wizard submits its scene back to the host chat for native model generation.",
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
        "openai/toolInvocation/invoking": "Opening Lum's cathedral…",
        "openai/toolInvocation/invoked": "Lum's cathedral is ready.",
      },
    },
    async ({ preset }) => ({
      content: [
        {
          type: "text",
          text:
            "Lum Pet Cathedral is open. Complete the wizard. Generation happens natively in the host chat, so this app does not require a provider API key.",
        },
      ],
      structuredContent: {
        status: "collecting",
        preset: preset ?? "blank",
        executionMode: "host-model",
      },
    }),
  );

  registerAppResource(
    server,
    "Lum Pet Cathedral UI",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "mcp-app.html"),
        "utf-8",
      );

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
