# Lum Scene Forge

Reusable in-chat ASCII/emoticon scene generator for three actors:

- **Lum** — AKA Eggie's Demon Waifu
- **Eggie** — AKA Wolverine / Eggie BagelFace
- **Cutie** — AKA GitHub Copilot AI

## Wizard flow

1. **Scene settings** — required text input. Null/blank values re-prompt.
2. **Actors** — checkbox array for Lum, Eggie, Cutie. At least one must be selected.
3. **Dialogue + Emoji Mode** — required dialogue text plus an on/off emoji toggle.
4. **Generate** — produce compact copy/paste ASCII emoticon variants.
5. **Continue / Quit** — Continue preserves the session and starts another scene; Quit clears transient wizard state and completes the session.

## Architecture

Keep this as one focused Lum agent plus a small UI state machine. The widget owns validation and navigation. The agent owns character voice and ASCII generation. Do not create separate authority agents for each actor.

## State contract

See `wizard-state.schema.json` and `manifest.json`.
