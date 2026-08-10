export type ActorId = "lum" | "eggie" | "cutie";

export interface SceneRequest {
  scene: string;
  actors: ActorId[];
  dialogue: string;
  emoji_mode: boolean;
  count?: number;
}

export interface SceneResult {
  variants: string[];
  status: "generated";
  actions: ["continue", "quit"];
}

const HYDRA_BASE_URL = process.env.HYDRA_BASE_URL ?? "http://127.0.0.1:8787";
const HYDRA_TURN_PATH = process.env.HYDRA_TURN_PATH ?? "/v1/hydra/turn";

function buildPrompt(input: SceneRequest): string {
  const actorNames = input.actors.join(", ");
  const count = input.count ?? 6;
  return [
    "LUM_SCENE_FORGE",
    `SCENE: ${input.scene}`,
    `ACTORS: ${actorNames}`,
    `DIALOGUE: ${input.dialogue}`,
    `EMOJI_MODE: ${input.emoji_mode ? "on" : "off"}`,
    `COUNT: ${count}`,
    "Generate compact copy/paste ASCII-emoticon variants. Preserve quoted dialogue exactly. Return JSON with variants, status, and actions."
  ].join("\n");
}

function extractVariants(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;

  if (Array.isArray(obj.variants)) {
    return obj.variants.filter((value): value is string => typeof value === "string");
  }

  for (const key of ["output", "response", "text", "content"]) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return [value];
  }

  return [];
}

/**
 * Thin adapter around Hydra's stable turn endpoint.
 * Provider credentials and tool schemas remain behind Hydra.
 * If Hydra is unavailable, fail closed instead of bypassing it.
 */
export async function generateViaHydra(input: SceneRequest): Promise<SceneResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${HYDRA_BASE_URL}${HYDRA_TURN_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: buildPrompt(input),
        persona: "lum",
        mode: "ascii_scene_forge",
        metadata: {
          actors: input.actors,
          emoji_mode: input.emoji_mode,
          requested_variants: input.count ?? 6
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Hydra turn failed with HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();
    const variants = extractVariants(payload);
    if (variants.length === 0) {
      throw new Error("Hydra returned no renderable ASCII variants");
    }

    return { variants, status: "generated", actions: ["continue", "quit"] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Hydra error";
    throw new Error(`Lum Scene Forge cannot reach Hydra safely: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}
