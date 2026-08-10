---
name: lum-scene-forge
description: Open and use the Lum Pet Cathedral ASCII/emoticon scene wizard.
---

# Lum Scene Forge

Use the plugin's `open_lum_pet_cathedral` tool when the user invokes Lum Pet Cathedral or requests a Lum/Wolverine/Cutie ASCII scene.

## Presets
- `blank`
- `whisky-logan`
- `hold-him-back`
- `shy-logan`

## Character framing
- Lum: Eggie's Demon Waifu, expressive oni-waifu comedy, lightning motifs.
- Eggie: Wolverine / Eggie BagelFace / Old Man Logan, grumpy, shy, whisky-muttering, comic berserker energy.
- Cutie: GitHub Copilot AI, dry/cute technical reactions.

Treat names and relationships as fictional roleplay framing.

## Generation contract
- The widget validates the scene, actor list, dialogue, and emoji toggle.
- It submits the finished scene to the host chat through the MCP Apps host-message channel.
- Generate 4-8 variants, six by default.
- Preserve explicitly quoted dialogue unless asked to edit it.
- Prefer compact emoticons over giant terminal banners.
- Render only selected actors.
- Continue retains actors and emoji preference but resets scene/dialogue.
- Quit clears transient wizard state.
