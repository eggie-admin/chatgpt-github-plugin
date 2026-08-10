import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";
import { createServer } from "./server.js";

async function startStdio(create: () => McpServer): Promise<void> {
  await create().connect(new StdioServerTransport());
}

async function startHttp(create: () => McpServer): Promise<void> {
  const port = Number.parseInt(process.env.PORT ?? "3001", 10);
  const host = process.env.HOST ?? "0.0.0.0";
  const app = createMcpExpressApp({ host });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: "lum-pet-cathedral",
      executionMode: "host-model",
      providerKeyRequired: false,
    });
  });

  app.all("/mcp", async (req: Request, res: Response) => {
    const server = create();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close().catch(() => undefined);
      server.close().catch(() => undefined);
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const httpServer = app.listen(port, host, () => {
    console.log(`Lum Pet Cathedral MCP: http://${host}:${port}/mcp`);
    console.log(`Health: http://${host}:${port}/health`);
  });

  const shutdown = (): void => {
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main(): Promise<void> {
  if (process.argv.includes("--stdio")) {
    await startStdio(createServer);
    return;
  }

  await startHttp(createServer);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
