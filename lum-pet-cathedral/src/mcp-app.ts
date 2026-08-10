import { App } from "@modelcontextprotocol/ext-apps";
import { buildSceneMessage, type ActorId } from "./scene-message";
import "./styles.css";

type Preset =
  | "blank"
  | "whisky-logan"
  | "hold-him-back"
  | "shy-logan"
  | "professor-chaos";

type Step = 0 | 1 | 2;

interface InitialResult {
  preset?: Preset;
}

interface State {
  step: Step;
  scene: string;
  actors: ActorId[];
  dialogue: string;
  emojiMode: boolean;
  submitted: boolean;
  busy: boolean;
  closed: boolean;
  error: string | null;
}

const actorLabels: Record<ActorId, string> = {
  lum: "⚡ Lum",
  eggie: "🥃 Eggie / Wolverine",
  cutie: "💻 Cutie / Copilot",
};

const presets: Record<
  Preset,
  Pick<State, "scene" | "actors" | "dialogue" | "emojiMode">
> = {
  blank: {
    scene: "",
    actors: ["lum", "eggie"],
    dialogue: "",
    emojiMode: true,
  },
  "whisky-logan": {
    scene: "Old Man Logan at the bar with whisky, squinting at modern internet slang.",
    actors: ["eggie"],
    dialogue: "",
    emojiMode: true,
  },
  "hold-him-back": {
    scene: "Lum holds back a cartoon berserker-rage Wolverine while he tries to charge into the argument.",
    actors: ["lum", "eggie"],
    dialogue: "",
    emojiMode: true,
  },
  "shy-logan": {
    scene: "A shy Old Man Logan tries to answer while avoiding eye contact.",
    actors: ["eggie"],
    dialogue: "",
    emojiMode: true,
  },
  "professor-chaos": {
    scene: "Drunk Old Man Logan storms into Threads while Lum holds him back and Cutie watches the server logs.",
    actors: ["lum", "eggie", "cutie"],
    dialogue: "",
    emojiMode: true,
  },
};

const state: State = {
  step: 0,
  scene: "",
  actors: ["lum", "eggie"],
  dialogue: "",
  emojiMode: true,
  submitted: false,
  busy: false,
  closed: false,
  error: null,
};

const root = document.querySelector<HTMLElement>("#app")!;
if (!root) throw new Error("Missing #app root");

const app = new App(
  { name: "Lum Pet Cathedral", version: "0.3.0" },
  {},
  { strict: true },
);

let connected = false;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyPreset(preset: Preset): void {
  const next = presets[preset];
  state.scene = next.scene;
  state.actors = [...next.actors];
  state.dialogue = next.dialogue;
  state.emojiMode = next.emojiMode;
}

function renderProgress(): string {
  const labels = ["Scene", "Actors", "Dialogue"];
  return `<div class="progress">${labels
    .map((label, index) => {
      const className =
        index === state.step ? "active" : index < state.step ? "done" : "";
      return `<span class="step-pill ${className}">${index + 1}. ${label}</span>`;
    })
    .join("")}</div>`;
}

function render(): void {
  if (state.closed) {
    root.innerHTML = `
      <section class="cathedral closed">
        <div class="sigil">⚡</div>
        <h2>Forge sealed</h2>
        <p>Invoke <strong>@Lum Pet Cathedral</strong> when you want another scene.</p>
      </section>`;
    return;
  }

  if (state.submitted) {
    root.innerHTML = `
      <section class="cathedral">
        <header class="masthead">
          <div><span class="kicker">⚡ LUM PET CATHEDRAL</span><h2>Scene sent to chat</h2></div>
          <span class="mode-badge">HOST MODEL</span>
        </header>
        <div class="success-card">
          <div class="sigil">⚡</div>
          <strong>The forge request is in the conversation.</strong>
          <p>Your six ASCII variants should arrive as the next assistant response.</p>
        </div>
        <footer class="actions">
          <button id="continue" class="primary" type="button">Continue</button>
          <button id="quit" class="danger" type="button">Quit</button>
        </footer>
      </section>`;
    root.querySelector<HTMLButtonElement>("#continue")?.addEventListener("click", continueWizard);
    root.querySelector<HTMLButtonElement>("#quit")?.addEventListener("click", quitWizard);
    return;
  }

  let body = "";
  if (state.step === 0) {
    body = `
      <label class="field">
        <span>Scene settings</span>
        <textarea id="scene" rows="5" placeholder="Old Man Logan storms into Threads…">${escapeHtml(state.scene)}</textarea>
      </label>
      <p class="hint">Required. Blank input stays on this step.</p>`;
  } else if (state.step === 1) {
    body = `
      <fieldset class="field">
        <legend>Choose actors</legend>
        <div class="actor-grid">
          ${(Object.keys(actorLabels) as ActorId[])
            .map(
              (actor) => `<label class="actor-card">
                <input type="checkbox" value="${actor}" ${state.actors.includes(actor) ? "checked" : ""} />
                <span>${actorLabels[actor]}</span>
              </label>`,
            )
            .join("")}
        </div>
      </fieldset>
      <p class="hint">Choose at least one actor.</p>`;
  } else {
    body = `
      <label class="field">
        <span>Dialogue / exact line</span>
        <textarea id="dialogue" rows="6" placeholder='"REALLY REALLY REAL!"'>${escapeHtml(state.dialogue)}</textarea>
      </label>
      <label class="toggle-card">
        <span><strong>Emoji mode</strong><small>Lightning, whisky, claws, hearts, robot glyphs.</small></span>
        <input id="emojiMode" type="checkbox" ${state.emojiMode ? "checked" : ""} />
      </label>`;
  }

  root.innerHTML = `
    <section class="cathedral">
      <header class="masthead">
        <div><span class="kicker">⚡ PROFESSOR GREEN</span><h2>Lum Pet Cathedral</h2></div>
        <span class="mode-badge">HOST MODEL</span>
      </header>
      ${renderProgress()}
      ${state.error ? `<div class="error">${escapeHtml(state.error)}</div>` : ""}
      ${body}
      <footer class="actions">
        ${state.step > 0 ? '<button id="back" class="secondary" type="button">Back</button>' : ""}
        <button id="next" class="primary" type="button" ${state.busy ? "disabled" : ""}>
          ${state.step === 2 ? (state.busy ? "Forging…" : "Generate") : "Next"}
        </button>
        <button id="quit" class="danger" type="button">Quit</button>
      </footer>
    </section>`;

  root.querySelector<HTMLButtonElement>("#back")?.addEventListener("click", () => {
    state.error = null;
    state.step = (state.step - 1) as Step;
    render();
  });
  root.querySelector<HTMLButtonElement>("#next")?.addEventListener("click", () => void next());
  root.querySelector<HTMLButtonElement>("#quit")?.addEventListener("click", quitWizard);
}

function readCurrentStep(): void {
  if (state.step === 0) {
    state.scene = root.querySelector<HTMLTextAreaElement>("#scene")?.value.trim() ?? "";
    return;
  }
  if (state.step === 1) {
    state.actors = Array.from(
      root.querySelectorAll<HTMLInputElement>('.actor-card input:checked'),
    ).map((input) => input.value as ActorId);
    return;
  }
  state.dialogue = root.querySelector<HTMLTextAreaElement>("#dialogue")?.value.trim() ?? "";
  state.emojiMode = root.querySelector<HTMLInputElement>("#emojiMode")?.checked ?? true;
}

async function next(): Promise<void> {
  readCurrentStep();
  state.error = null;

  if (state.step === 0 && !state.scene) {
    state.error = "Scene settings cannot be blank.";
    render();
    return;
  }
  if (state.step === 1 && state.actors.length === 0) {
    state.error = "Choose at least one actor.";
    render();
    return;
  }
  if (state.step === 2 && !state.dialogue) {
    state.error = "Dialogue cannot be blank.";
    render();
    return;
  }

  if (state.step < 2) {
    state.step = (state.step + 1) as Step;
    render();
    return;
  }

  state.busy = true;
  render();
  try {
    const prompt = buildSceneMessage({
      scene: state.scene,
      actors: state.actors,
      dialogue: state.dialogue,
      emojiMode: state.emojiMode,
      count: 6,
    });
    const result = await app.sendMessage({
      role: "user",
      content: [{ type: "text", text: prompt }],
    });
    if (result.isError) throw new Error("The chat host rejected the scene message.");
    state.submitted = true;
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Scene submission failed.";
  } finally {
    state.busy = false;
    render();
  }
}

function continueWizard(): void {
  state.step = 0;
  state.scene = "";
  state.dialogue = "";
  state.submitted = false;
  state.error = null;
  state.busy = false;
  render();
}

function clearTransientState(): void {
  state.step = 0;
  state.scene = "";
  state.actors = [];
  state.dialogue = "";
  state.emojiMode = true;
  state.submitted = false;
  state.error = null;
  state.busy = false;
}

function quitWizard(): void {
  clearTransientState();
  state.closed = true;
  render();
  if (connected) void app.requestTeardown();
}

app.ontoolresult = (result) => {
  const initial = result.structuredContent as InitialResult | undefined;
  if (initial?.preset) applyPreset(initial.preset);
  if (connected) render();
};

app.onteardown = async () => {
  clearTransientState();
  state.closed = true;
  return {};
};

root.innerHTML = `
  <section class="cathedral closed">
    <div class="sigil">⚡</div>
    <h2>Opening Lum Pet Cathedral…</h2>
    <p>Negotiating the MCP Apps handshake.</p>
  </section>`;

void (async () => {
  try {
    await app.connect();
    connected = true;
    render();
  } catch (error) {
    const message = error instanceof Error ? error.message : "MCP Apps handshake failed.";
    root.innerHTML = `
      <section class="cathedral closed">
        <div class="sigil">⚠️</div>
        <h2>Cathedral handshake failed</h2>
        <p>${escapeHtml(message)}</p>
      </section>`;
  }
})();
