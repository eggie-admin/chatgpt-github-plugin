import { App } from "@modelcontextprotocol/ext-apps";
import "./global.css";

type ActorId = "lum" | "eggie" | "cutie";
type Preset = "blank" | "whisky-logan" | "hold-him-back" | "shy-logan";

interface WizardState {
  step: 0 | 1 | 2;
  scene: string;
  actors: ActorId[];
  dialogue: string;
  emojiMode: boolean;
  generating: boolean;
  variants: string[];
  error: string | null;
  closed: boolean;
}

const actorLabels: Record<ActorId, string> = {
  lum: "⚡ Lum",
  eggie: "🥃 Eggie / Wolverine",
  cutie: "💻 Cutie / Copilot"
};

const presets: Record<Preset, Partial<WizardState>> = {
  blank: {},
  "whisky-logan": {
    scene: "Old Man Logan at the bar, whisky in hand, grumbling at modern internet slang.",
    actors: ["eggie"],
    emojiMode: true
  },
  "hold-him-back": {
    scene: "Lum is holding back a comic berserker-rage Wolverine while he yells the line.",
    actors: ["lum", "eggie"],
    emojiMode: true
  },
  "shy-logan": {
    scene: "A shy, embarrassed Old Man Logan tries to respond without making eye contact.",
    actors: ["eggie"],
    emojiMode: true
  }
};

const state: WizardState = {
  step: 0,
  scene: "",
  actors: ["lum", "eggie"],
  dialogue: "",
  emojiMode: true,
  generating: false,
  variants: [],
  error: null,
  closed: false
};

const root = document.querySelector<HTMLElement>("#app")!;
const app = new App({ name: "Lum Scene Forge", version: "0.1.0" });

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyPreset(preset: Preset): void {
  const next = presets[preset] ?? {};
  if (next.scene !== undefined) state.scene = next.scene;
  if (next.actors !== undefined) state.actors = [...next.actors];
  if (next.emojiMode !== undefined) state.emojiMode = next.emojiMode;
}

function renderProgress(): string {
  const labels = ["Scene", "Actors", "Dialogue"];
  return `<div class="progress">${labels
    .map((label, index) => `<span class="pill ${index === state.step ? "active" : index < state.step ? "done" : ""}">${index + 1}. ${label}</span>`)
    .join("")}</div>`;
}

function render(): void {
  if (state.closed) {
    root.innerHTML = `
      <section class="panel closed">
        <div class="logo">⚡</div>
        <h2>Lum Scene Forge closed</h2>
        <p>Transient wizard state cleared. Invoke <code>@Lum Scene Forge</code> again when you want another round.</p>
      </section>`;
    return;
  }

  if (state.variants.length > 0) {
    root.innerHTML = `
      <section class="panel">
        <header><div><span class="eyebrow">LUM SCENE FORGE</span><h2>ASCII drop complete ⚡</h2></div></header>
        ${state.error ? `<div class="error">${escapeHtml(state.error)}</div>` : ""}
        <div class="results">
          ${state.variants.map((variant, index) => `
            <article class="variant">
              <div class="variant-head"><strong>Variant ${index + 1}</strong><button class="ghost copy" data-copy="${index}">Copy</button></div>
              <pre>${escapeHtml(variant)}</pre>
            </article>`).join("")}
        </div>
        <div class="actions">
          <button id="continue" class="primary">Continue</button>
          <button id="quit" class="danger">Quit</button>
        </div>
      </section>`;

    root.querySelectorAll<HTMLButtonElement>(".copy").forEach((button) => {
      button.addEventListener("click", async () => {
        const index = Number(button.dataset.copy);
        await navigator.clipboard.writeText(state.variants[index] ?? "");
        button.textContent = "Copied";
      });
    });
    root.querySelector<HTMLButtonElement>("#continue")!.addEventListener("click", continueWizard);
    root.querySelector<HTMLButtonElement>("#quit")!.addEventListener("click", quitWizard);
    return;
  }

  let body = "";
  if (state.step === 0) {
    body = `
      <label class="field">
        <span>Scene settings</span>
        <textarea id="scene" rows="4" placeholder="Example: Old Man Logan getting whisky and mumbling at internet slang...">${escapeHtml(state.scene)}</textarea>
      </label>
      <p class="hint">Required. Blank input stays on this step.</p>`;
  } else if (state.step === 1) {
    body = `
      <fieldset class="field">
        <legend>Who is in the scene?</legend>
        <div class="actor-grid">
          ${(Object.keys(actorLabels) as ActorId[]).map((actor) => `
            <label class="actor ${state.actors.includes(actor) ? "selected" : ""}">
              <input type="checkbox" value="${actor}" ${state.actors.includes(actor) ? "checked" : ""}/>
              <span>${actorLabels[actor]}</span>
            </label>`).join("")}
        </div>
      </fieldset>
      <p class="hint">Pick at least one actor.</p>`;
  } else {
    body = `
      <label class="field">
        <span>Dialogue / exact line</span>
        <textarea id="dialogue" rows="5" placeholder='Example: "REALLY REALLY REAL!"'>${escapeHtml(state.dialogue)}</textarea>
      </label>
      <label class="toggle-row">
        <span><strong>Emoji Lum mode</strong><small>Lightning, whisky, claws, hearts, computer glyphs</small></span>
        <input id="emoji" type="checkbox" ${state.emojiMode ? "checked" : ""}/>
      </label>`;
  }

  root.innerHTML = `
    <section class="panel">
      <header>
        <div><span class="eyebrow">⚡ PROFESSOR MODE</span><h2>Lum Scene Forge</h2></div>
        <span class="badge">Hydra-backed</span>
      </header>
      ${renderProgress()}
      ${state.error ? `<div class="error">${escapeHtml(state.error)}</div>` : ""}
      ${body}
      <div class="actions">
        ${state.step > 0 ? '<button id="back" class="ghost">Back</button>' : ""}
        <button id="next" class="primary">${state.step === 2 ? (state.generating ? "Forging…" : "Generate") : "Next"}</button>
        <button id="quit" class="danger">Quit</button>
      </div>
    </section>`;

  root.querySelector<HTMLButtonElement>("#back")?.addEventListener("click", () => {
    state.error = null;
    state.step = (state.step - 1) as 0 | 1 | 2;
    render();
  });
  root.querySelector<HTMLButtonElement>("#next")!.addEventListener("click", next);
  root.querySelector<HTMLButtonElement>("#quit")!.addEventListener("click", quitWizard);
}

function syncCurrentInputs(): void {
  if (state.step === 0) {
    state.scene = root.querySelector<HTMLTextAreaElement>("#scene")?.value.trim() ?? "";
  } else if (state.step === 1) {
    state.actors = Array.from(root.querySelectorAll<HTMLInputElement>('.actor input:checked')).map((input) => input.value as ActorId);
  } else {
    state.dialogue = root.querySelector<HTMLTextAreaElement>("#dialogue")?.value.trim() ?? "";
    state.emojiMode = root.querySelector<HTMLInputElement>("#emoji")?.checked ?? true;
  }
}

async function next(): Promise<void> {
  syncCurrentInputs();
  state.error = null;

  if (state.step === 0 && !state.scene) {
    state.error = "Scene settings cannot be blank.";
    render();
    return;
  }
  if (state.step === 1 && state.actors.length === 0) {
    state.error = "Pick at least one actor.";
    render();
    return;
  }
  if (state.step === 2 && !state.dialogue) {
    state.error = "Dialogue cannot be blank.";
    render();
    return;
  }

  if (state.step < 2) {
    state.step = (state.step + 1) as 0 | 1 | 2;
    render();
    return;
  }

  state.generating = true;
  render();
  try {
    const result = await app.callServerTool({
      name: "generate_lum_scene",
      arguments: {
        scene: state.scene,
        actors: state.actors,
        dialogue: state.dialogue,
        emoji_mode: state.emojiMode,
        count: 6
      }
    });

    const structured = result.structuredContent as { variants?: string[]; error?: string } | undefined;
    if (result.isError || !structured?.variants?.length) {
      state.error = structured?.error ?? "Hydra did not return any ASCII variants.";
    } else {
      state.variants = structured.variants;
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Scene generation failed.";
  } finally {
    state.generating = false;
    render();
  }
}

function continueWizard(): void {
  state.step = 0;
  state.scene = "";
  state.dialogue = "";
  state.variants = [];
  state.error = null;
  state.generating = false;
  render();
}

function quitWizard(): void {
  state.step = 0;
  state.scene = "";
  state.actors = [];
  state.dialogue = "";
  state.emojiMode = true;
  state.variants = [];
  state.error = null;
  state.generating = false;
  state.closed = true;
  render();
}

app.ontoolresult = (result) => {
  const initial = result.structuredContent as { preset?: Preset; actors?: ActorId[]; emoji_mode?: boolean } | undefined;
  if (initial?.preset) applyPreset(initial.preset);
  if (initial?.actors?.length) state.actors = [...initial.actors];
  if (typeof initial?.emoji_mode === "boolean") state.emojiMode = initial.emoji_mode;
  render();
};

render();
app.connect();
