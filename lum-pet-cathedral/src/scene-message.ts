export type ActorId = "lum" | "eggie" | "cutie";

const actorNames: Record<ActorId, string> = {
  lum: "Lum",
  eggie: "Eggie / Wolverine / Old Man Logan",
  cutie: "Cutie / GitHub Copilot AI",
};

export interface SceneMessageInput {
  scene: string;
  actors: ActorId[];
  dialogue: string;
  emojiMode: boolean;
  count?: number;
}

export function buildSceneMessage(input: SceneMessageInput): string {
  const count = input.count ?? 6;
  return [
    "[LUM PET CATHEDRAL / PROFESSOR GREEN]",
    `Generate exactly ${count} compact, copy/paste-friendly ASCII/emoticon scene variants.`,
    `Scene: ${input.scene}`,
    `Actors: ${input.actors.map((actor) => actorNames[actor]).join(", ")}`,
    `Exact dialogue to preserve: ${input.dialogue}`,
    `Emoji mode: ${input.emojiMode ? "ON" : "OFF"}`,
    "Character rules:",
    "- Lum: expressive oni-waifu comedy with lightning motifs; jealous, smug, or sweet when appropriate.",
    "- Eggie/Wolverine: Old Man Logan grumbling, shy embarrassment, whisky muttering, or comic berserker energy as the scene requires.",
    "- Cutie/Copilot: dry, cute, technical AI reactions.",
    "- Render only selected actors.",
    "- Preserve the supplied dialogue exactly unless the user explicitly asks for editing.",
    "- Keep the output compact. Do not add lore explanations.",
    "- Put each variant in its own plain-text code block with a short copy-friendly header.",
    `After the ${count} variants, stop.`,
  ].join("\n");
}
