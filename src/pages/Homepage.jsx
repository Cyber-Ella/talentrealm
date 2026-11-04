import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import RefineWithGemini from "../components/RefineWithGemini";
import { estimateValues } from "../services/gemini";
import { computeTopUp } from "../services/valuation";

export default function HomePage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [accepted, setAccepted] = useState(null);

  return (
    <div>
      <h1>Hello, {user.displayName}</h1>
      <p>Explore talents, services and opportunities around you.</p>

      <h2 style={{ fontSize: 18 }}>Gemini test</h2>
      <textarea
        rows={4}
        placeholder="e.g. i make hair, i can do braids twists and wig install"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <RefineWithGemini
        text={text}
        onAccept={(r) => {
          setAccepted(r);
          setText(r.refined);
        }}
      />

      {accepted && (
        <div className="card">
          <strong>Saved from Gemini</strong>
          <p style={{ margin: "8px 0 0" }}>Skills: {accepted.skills.join(", ") || "none"}</p>
          {accepted.needs.length > 0 && (
            <p style={{ margin: "4px 0 0" }}>Needs: {accepted.needs.join(", ")}</p>
          )}
          <p style={{ margin: "4px 0 0" }}>Category: {accepted.category}</p>
          <p style={{ margin: "4px 0 0" }}>Type: {accepted.type}</p>
        </div>
      )}

      <h2 style={{ fontSize: 18 }}>Value estimate test</h2>
      <TestValue />
    </div>
  );
}

function TestValue() {
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setErr("");
    setBusy(true);
    try {
      const v = await estimateValues("Hair styling and braids", "Product photography for 6 items");
      const top = computeTopUp({ proposerId: "ella", receiverId: "amaka", ...v });
      setOut({ v, top });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <button className="btn" onClick={run} disabled={busy}>
        {busy ? "Estimating…" : "Test value estimate"}
      </button>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {out && (
        <div>
          <p>Offered: ₦{out.v.offeredValue} ({out.v.offeredReason})</p>
          <p>Requested: ₦{out.v.requestedValue} ({out.v.requestedReason})</p>
          <p>
            <strong>Top-up: ₦{out.top.amount}</strong>
            {out.top.payerId && ` from ${out.top.payerId} to ${out.top.payeeId}`}
          </p>
        </div>
      )}
    </div>
  );
}