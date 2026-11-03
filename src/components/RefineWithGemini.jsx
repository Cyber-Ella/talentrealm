import { useState } from "react";
import { refineDescription } from "../services/gemini";

export default function RefineWithGemini({ text, onAccept }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      setResult(await refineDescription(text));
    } catch (e) {
      console.error(e);
      setError("Gemini error: " + (e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const accept = () => {
    onAccept(result);
    setResult(null);
  };

  return (
    <div className="card" style={{ background: "var(--color-bg-ai)", borderColor: "var(--color-border-ai)" }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--color-text-brand)" }}>
        ✦ Suggested by Gemini
      </p>

      {!result && (
        <>
          <p style={{ margin: "0 0 12px" }}>
            Not sure how to word it? Gemini can make it clearer. You review before saving.
          </p>
          <button className="btn" onClick={run} disabled={busy || text.trim().length < 10}>
            {busy ? "Refining…" : "Refine with Gemini"}
          </button>
          {text.trim().length < 10 && (
            <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)" }}>
              Write at least a short sentence first.
            </p>
          )}
        </>
      )}

      {result && (
        <>
          <div className="card">
            <strong>Your original</strong>
            <p style={{ margin: "4px 0 0" }}>{text}</p>
          </div>
          <div className="card" style={{ borderColor: "var(--color-primary)", borderWidth: 2 }}>
            <strong>Gemini suggestion</strong>
            <p style={{ margin: "4px 0 0" }}>{result.refined}</p>
          </div>
          <p style={{ margin: "0 0 4px" }}><strong>Skills found:</strong> {result.skills.join(", ") || "none"}</p>
          {result.needs.length > 0 && (
            <p style={{ margin: "0 0 4px" }}><strong>Needs found:</strong> {result.needs.join(", ")}</p>
          )}
          <p style={{ margin: "0 0 12px" }}>
            <strong>Suggested category:</strong> {result.category} · <strong>Type:</strong> {result.type}
          </p>
          <button className="btn" onClick={accept}>Use Gemini’s version</button>
          <button className="link-btn" style={{ width: "100%" }} onClick={() => setResult(null)}>
            Keep my original
          </button>
        </>
      )}

      {error && <p style={{ color: "var(--color-danger)", margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}