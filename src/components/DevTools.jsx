import { useState } from "react";
import { seedDemoUsers, DEMO_USERS } from "../services/seed";
import { findMatches } from "../services/matching";
import { findCircles } from "../services/circles";
import { proposeCircle } from "../services/exchanges";

export default function DevTools() {
  const [who, setWho] = useState("demo-ella");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [found, setFound] = useState(null);

  const seed = async () => {
    setMsg("Seeding…");
    try { setMsg("Seeded " + (await seedDemoUsers()) + " demo students."); }
    catch (e) { setMsg("Error: " + e.message); }
  };

  const runMatches = async () => {
    setBusy(true); setMsg(""); setResults([]);
    try { setResults(await findMatches(who)); }
    catch (e) { setMsg("Error: " + e.message); }
    finally { setBusy(false); }
  };

  const runCircles = async () => {
    setBusy(true); setMsg(""); setFound(null);
    try { setFound(await findCircles(who)); }
    catch (e) { setMsg("Error: " + e.message); }
    finally { setBusy(false); }
  };

  const propose = async (circle) => {
    setMsg("Estimating values and saving…");
    try { setMsg("Saved circle! Exchange id: " + (await proposeCircle({ circle, people: found.people }))); }
    catch (e) { setMsg("Error: " + e.message); }
  };

  const name = (id) => found?.people[id]?.name?.split(" ")[0] || id;
  const legText = (l) => `${name(l.providerId)} gives ${l.offer} to ${name(l.receiverId)}`;

  return (
    <div className="card">
      <strong>Matching and circles test</strong>
      <button className="btn" style={{ margin: "8px 0" }} onClick={seed}>Add demo students</button>
      <select value={who} onChange={(e) => setWho(e.target.value)}>
        {DEMO_USERS.map((u) => <option key={u.id} value={u.id}>Act as {u.name}</option>)}
      </select>
      <button className="btn" onClick={runMatches} disabled={busy}>{busy ? "Working…" : "Find my matches"}</button>
      <button className="btn" style={{ marginTop: 8 }} onClick={runCircles} disabled={busy}>Find swaps and circles</button>
      {msg && <p>{msg}</p>}

      {results.map((r) => (
        <div className="card" key={r.userId} style={{ marginTop: 8 }}>
          <strong>{r.person.name}</strong>
          <p style={{ margin: "4px 0" }}>
            You get: {r.theyOffer}{r.direct ? ` · You give: ${r.iOffer}` : " · No direct swap yet"}
          </p>
          <p style={{ margin: 0 }}>{r.reason}</p>
        </div>
      ))}

      {found && (
        <div>
          <p><strong>Direct swaps: {found.direct.length} · 3-person circles: {found.circles.length}</strong></p>
          <p style={{ fontSize: 12 }}>
            Students: {found.debug.people} · Links found by code: {found.debug.byCode} · by Gemini: {found.debug.byGemini}
            {found.debug.geminiError && " · Gemini error: " + found.debug.geminiError}
          </p>
          {found.direct.map((d, i) => (
            <div className="card" key={"d" + i}>
              <p style={{ margin: 0 }}>{d.legs.map(legText).join(" · ")}</p>
            </div>
          ))}
          {found.circles.map((c, i) => (
            <div className="card" key={"c" + i}>
              {c.legs.map((l, j) => <p key={j} style={{ margin: "0 0 4px" }}>{legText(l)}</p>)}
              <button className="btn" onClick={() => propose(c)}>Propose this circle</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}