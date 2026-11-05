import { useState } from "react";
import { refineDescription } from "../services/gemini";

export default function RefineWithGemini({ text, onAccept }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true); setError(""); setResult(null);
    try {
      const next = await refineDescription(text);
      if (!next?.refined?.trim()) throw new Error("Gemini returned an empty suggestion. Try again.");
      setResult(next);
    } catch (e) {
      setError(e.message || "Could not refine this description.");
    } finally { setBusy(false); }
  };
  const accept = () => { onAccept(result); setResult(null); };

  return <section className="tr-gemini-refine" aria-label="AI writing assistant">
    <div className="tr-gemini-refine-head"><span className="tr-gemini-spark">✦</span><div><strong>Make your story clearer</strong><p>Gemini can help shape your words without changing what you mean.</p></div></div>
    {!result ? <div className="tr-gemini-refine-actions">
      <button className="tr-gemini-refine-run" onClick={run} disabled={busy || text.trim().length<10}>{busy?<><span className="tr-ai-spinner"/> Working on it…</>:"Refine with Gemini ↗"}</button>
      <span>{text.trim().length<10?"Add at least 10 characters to get a suggestion.":"You stay in control. Nothing is saved until you accept."}</span>
    </div> : <div className="tr-gemini-review">
      <div className="tr-gemini-original"><span>YOUR WORDS</span><p>{text}</p></div>
      <div className="tr-gemini-suggestion"><span>AN EDIT TO CONSIDER</span><p>{result.refined}</p></div>
      <div className="tr-gemini-extracted">
        {result.skills?.length>0&&<div><small>Skills identified</small><p>{result.skills.join(" · ")}</p></div>}
        {result.needs?.length>0&&<div><small>What you need</small><p>{result.needs.join(" · ")}</p></div>}
        <div><small>Suggested direction</small><p>{result.category} <span>·</span> {result.type==="showcase"?"Portfolio / showcase":"Service"}</p></div>
      </div>
      <div className="tr-gemini-review-actions"><button className="tr-gemini-accept" onClick={accept}>Use this suggestion</button><button className="tr-gemini-reject" onClick={()=>setResult(null)}>Keep editing</button></div>
    </div>}
    {error&&<p className="tr-gemini-error" role="alert">{error}</p>}
  </section>;
}
