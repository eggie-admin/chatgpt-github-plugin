import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { generateViaHydra, type ActorId } from "./hydra-client.js";

const DIST_DIR = path.join(import.meta.dirname, "dist");
const RESOURCE_URI = "ui://lum-scene-forge/v1/mcp-app.html";

const actorSchema = z.enum(["lum", "eggie", "cutie"]);

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Lum Scene Forge",
    version: "0.1.0"
  });

  registerAppTool(
    server,
    "lum_scene_forge",
    {
      title: "Lum Scene Forge",
      description:
        "Open the Lum Scene Forge wizard for ASCII/emoticon scenes with Lum, Eggie/Wolverine, and Cutie/GitHub Copilot. Use this when the user explicitly invokes Lum Scene Forge or asks for Lum ASCII scenes.",
      inputSchema: {
        preset: z.enum(["blank", "whisky-logan", "hold-him-back", "shy-logan"]).optional()
      },
      _meta: {
        ui: { resourceUri: RESOURCE_URI }
      }
    },
    async ({ preset }) => ({
      content: [
        {
          type: "text",
          text: "Lum Scene Forge opened. Use the wizard to choose scene, actors, dialogue, and emoji mode."
        }
      ],
      structuredContent: {
        status: "collecting",
        preset: preset ?? "blank",
        actors: ["lum", "eggie"],
        emoji_mode: true
      }
    })
  );

  registerAppTool(
    server,
    "generate_lum_scene",
    {
      title: "Generate Lum ASCII Scene",
      description: "Validate wizard state and generate a Lum Scene Forge result through the Hydra gateway.",
      inputSchema: {
        scene: z.string().trim().min(1),
        actors: z.array(actorSchema).min(1),
        dialogue: z.string().trim().min(1),
        emoji_mode: z.boolean(),
        count: z.number().int().min(1).max(8).optional()
      },
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI,
          visibility: ["app"]
        }
      }
    },
    async ({ scene, actors, dialogue, emoji_mode, count }) => {
      try {
        const result = await generateViaHydra({
          scene,
          actors: actors as ActorId[],
          dialogue,
          emoji_mode,
          count
        });

        return {
          content: [{ type: "text", text: result.variants.join("\n\n") }],
          structuredContent: result
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Lum Scene Forge failed";
        return {
          isError: true,
          content: [{ type: "text", text: message }],
          structuredContent: {
            status: "error",
            error: message,
            actions: ["continue", "quit"]
          }
        };
      }
    }
  );

  registerAppResource(
    server,
    "Lum Scene Forge UI",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
      return {
        contents: [
          {
            uri: RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html
          }
        ]
      };
    }
  );

  return server;
}
