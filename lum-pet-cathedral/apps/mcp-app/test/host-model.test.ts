import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSceneMessage } from "../src/scene-message.js";

test("host-model scene message preserves the user's exact dialogue", () => {
  const message = buildSceneMessage({
    scene: "Old Man Logan at the bar",
    actors: ["lum", "eggie"],
    dialogue: '"REALLY REALLY REAL!"',
    emojiMode: true,
    count: 6,
  });

  assert.match(message, /Generate exactly 6/);
  assert.match(message, /Lum/);
  assert.match(message, /Old Man Logan/);
  assert.match(message, /Exact dialogue to preserve: "REALLY REALLY REAL!"/);
  assert.match(message, /Emoji mode: ON/);
});

test("host-model scene message renders only selected actor names", () => {
  const message = buildSceneMessage({
    scene: "Cutie reacts to a build",
    actors: ["cutie"],
    dialogue: '"GREEN."',
    emojiMode: false,
  });

  const actorsLine = message.split("\n").find((line) => line.startsWith("Actors:"));
  assert.equal(actorsLine, "Actors: Cutie / GitHub Copilot AI");
  assert.match(message, /Emoji mode: OFF/);
});
