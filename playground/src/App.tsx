import { stepHistory, type NarrationHistory } from "@drincs/pixi-vn";
import {
  ai,
  DEFAULT_DIALOG_TEMPLATE,
  PromptBuilder,
  type DialogGenerateOptions,
} from "@drincs/pixi-vn-ai";
import { useEffect, useState } from "react";
import { runIntroLabel } from "./labels/introLabel";

const SPEAKER = { name: "King", mood: "anxious" };
const LISTENER = { name: "Advisor" };

function renderDialogueLine(item: NarrationHistory, index: number) {
  if (!item.dialogue) {
    return null;
  }
  const text = Array.isArray(item.dialogue.text)
    ? item.dialogue.text.join("")
    : item.dialogue.text;
  return (
    <p key={index}>
      <strong>{String(item.dialogue.character ?? "")}</strong>: {text}
    </p>
  );
}

export default function App() {
  const [history, setHistory] = useState<NarrationHistory[]>([]);

  const [loadingModel, setLoadingModel] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  const [request, setRequest] = useState(
    "Generate a short line of dialogue where the advisor reassures the king.",
  );
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeSpeaker, setIncludeSpeaker] = useState(true);
  const [includeListeners, setIncludeListeners] = useState(true);
  const [scene, setScene] = useState(
    "The throne room, late at night, lit by torches.",
  );
  const [style, setStyle] = useState("");
  const [language, setLanguage] = useState("");
  const [context, setContext] = useState("");

  const [promptPreview, setPromptPreview] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    runIntroLabel().then(() => setHistory(stepHistory.currentLabelHistory));
  }, []);

  function buildOptions(): DialogGenerateOptions {
    return {
      history: includeHistory,
      speaker: includeSpeaker ? SPEAKER : undefined,
      listeners: includeListeners ? [LISTENER] : undefined,
      scene: scene || undefined,
      style: style || undefined,
      language: language || undefined,
      context: context || undefined,
    };
  }

  async function handleInitAI() {
    setLoadingModel(true);
    setError("");
    try {
      await ai.init();
      setModelReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingModel(false);
    }
  }

  function handlePreviewPrompt() {
    setPromptPreview(
      PromptBuilder.build(DEFAULT_DIALOG_TEMPLATE, request, buildOptions()),
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setResult("");
    try {
      const text = await ai.dialog.generate(request, buildOptions());
      setResult(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        padding: 24,
        fontFamily: "sans-serif",
      }}
    >
      <section style={{ flex: "0 0 280px" }}>
        <h2>Story so far</h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          Played automatically on load via Pixi'VN's narration, this is the
          narrative history `ai.dialog.generate` can inject when `history:
          true`.
        </p>
        {history.map(renderDialogueLine)}
      </section>

      <section style={{ flex: 1, maxWidth: 640 }}>
        <h2>@drincs/pixi-vn-ai playground</h2>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>1. Initialize AI</legend>
          <p style={{ fontSize: 13, color: "#666" }}>
            No provider configured: `ai.init()` downloads and loads a small
            local WebLLM model the first time it runs.
          </p>
          <button
            type="button"
            onClick={handleInitAI}
            disabled={loadingModel || modelReady}
          >
            {modelReady
              ? "AI ready"
              : loadingModel
                ? "Loading…"
                : "Initialize AI"}
          </button>
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>2. Developer request</legend>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            rows={2}
            style={{ width: "100%" }}
          />
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>3. Generate options</legend>
          <label>
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
            />{" "}
            Include narrative history
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={includeSpeaker}
              onChange={(e) => setIncludeSpeaker(e.target.checked)}
            />{" "}
            Speaker: {JSON.stringify(SPEAKER)}
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={includeListeners}
              onChange={(e) => setIncludeListeners(e.target.checked)}
            />{" "}
            Listeners: {JSON.stringify([LISTENER])}
          </label>
          <br />
          <label>
            Scene:{" "}
            <input
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <br />
          <label>
            Style:{" "}
            <input value={style} onChange={(e) => setStyle(e.target.value)} />
          </label>{" "}
          <label>
            Language:{" "}
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </label>
          <br />
          <label>
            Context:{" "}
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </fieldset>

        <div style={{ marginBottom: 16 }}>
          <button type="button" onClick={handlePreviewPrompt}>
            Preview prompt
          </button>{" "}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!modelReady || generating}
          >
            {generating ? "Generating…" : "Generate dialogue"}
          </button>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {promptPreview && (
          <>
            <h3>Prompt sent to the provider</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f4f4f4",
                padding: 12,
              }}
            >
              {promptPreview}
            </pre>
          </>
        )}

        {result && (
          <>
            <h3>Generated dialogue</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f4f4f4",
                padding: 12,
              }}
            >
              {result}
            </pre>
          </>
        )}
      </section>
    </div>
  );
}
