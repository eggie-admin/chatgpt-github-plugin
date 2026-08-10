import assert from "node:assert/strict";
import test from "node:test";
import { buildSceneMessage } from "../src/scene-message";

test("preserves dialogue and selected actors", () => {
  const output = buildSceneMessage({
    scene: "Old Man Logan storms into Threads.",
    actors: ["lum", "eggie", "cutie"],
    dialogue: '"REALLY REALLY REAL!"',
    emojiMode: true,
    count: 6,
  });

  assert.match(output, /Generate exactly 6/);
  assert.match(output, /Lum, Eggie \/ Wolverine \/ Old Man Logan, Cutie \/ GitHub Copilot AI/);
  assert.match(output, /Exact dialogue to preserve: "REALLY REALLY REAL!"/);
  assert.match(output, /Emoji mode: ON/);
});

test("renders only selected actor names", () => {
  const output = buildSceneMessage({
    scene: "Shy Logan at the bar.",
    actors: ["eggie"],
    dialogue: '"Nope."',
    emojiMode: false,
  });

  assert.match(output, /Actors: Eggie \/ Wolverine \/ Old Man Logan/);
  assert.doesNotMatch(output, /Actors: .*Lum/);
  assert.match(output, /Emoji mode: OFF/);
});
