import { useState } from "react";
import { seedDemoUsers, DEMO_USERS } from "../services/seed";
import { findMatches } from "../services/matching";

export default function DevTools() {
  const [who, setWho] = useState("demo-ella");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);

  const seed = async () => {
    setMsg("Seeding…");
    try { setMsg("Seeded " + (await seedDemoUsers()) + " demo students."); }
    catch (e) { setMsg("Error: " + e.message); }
  };

  const run = async () => {
    setBusy(true); setMsg(""); setResults([]);
    try { setResults(await findMatches(who)); }
    catch (e) { setMsg("Error: " + e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="card">
      <strong>Matching test</strong>
      <button className="btn" style={{ margin: "8px 0" }} onClick={seed}>Add demo students</button>
      <select value={who} onChange={(e) => setWho(e.target.value)}>
        {DEMO_USERS.map((u) => <option key={u.id} value={u.id}>Act as {u.name}</option>)}
      </select>
      <button className="btn" onClick={run} disabled={busy}>{busy ? "Matching…" : "Find my matches"}</button>
      {msg && <p>{msg}</p>}
    {results.map((r) => (
  <div className="card" key={r.userId} style={{ marginTop: 8 }}>
    <strong>{r.person.name}</strong>
    <p style={{ margin: "4px 0" }}>
      You get: {r.theyOffer}
      {r.direct ? ` · You give: ${r.iOffer}` : " · No direct swap yet"}
    </p>
    <p style={{ margin: 0 }}>{r.reason}</p>
  </div>
))}  
    </div>
  );
}