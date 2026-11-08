import { firstName, studentName } from "../../services/names";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { findCircles } from "../../services/circles";
import { proposeExchange, proposeCircle } from "../../services/exchanges";
import CircleReveal from "../../components/CircleReveal";
import { SkeletonGrid } from "../../components/Skeleton";

export default function ProposeExchange() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async () => {
    setBusy(true);
    setMsg("");
    setFound(null);
    try {
      setFound(await findCircles(user.uid));
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const nm = (id) => firstName(found.people[id]?.name);
  const leg = (l) =>
    `${l.providerId === user.uid ? "You give" : nm(l.providerId) + " gives"} ${l.offer} to ${l.receiverId === user.uid ? "you" : nm(l.receiverId)}`;

  const proposeDirect = async (d) => {
    const [a, b] = d.legs;
    setMsg("Gemini is estimating the values…");
    try {
      const id = await proposeExchange({
        proposer: { uid: user.uid, name: user.displayName },
        receiver: { uid: a.receiverId, name: studentName(found.people[a.receiverId]?.name) },
        offered: { title: a.offer },
        requested: { title: b.offer },
      });
      navigate("/exchanges/" + id);
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  };

  const proposeCirc = async (c) => {
    setMsg("Gemini is estimating the values…");
    try {
      navigate("/exchanges/" + (await proposeCircle({ circle: c, people: found.people })));
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  };

  return (
    <div>
      <h1>Find my matches</h1>
      <p className="muted">
        We look at what you offer and what you need, find direct swaps and 3-person circles, and Gemini estimates fair values.
      </p>
      <p className="muted">
        Make sure your <Link to="/profile">offers and needs</Link> are filled in first.
      </p>
      <button className="btn" onClick={run} disabled={busy}>
        {busy ? "Searching…" : "Find swaps and circles"}
      </button>
      {msg && <p>{msg}</p>}
      {busy && <div style={{ marginTop: 16 }}><SkeletonGrid count={2} /></div>}

      {found && (
        <div>
          <section className="card" style={{margin:"18px 0",padding:16,borderLeft:"4px solid var(--primary,#9870f8)"}}>
            <strong>How matching works</strong>
            <p className="muted" style={{margin:"6px 0 0"}}>We compare your offers and needs with other students. A direct swap means you both get something you need; a circle connects three people when a direct trade is not possible. Every proposal still needs everyone's approval.</p>
          </section>
          {found.direct.length===0 && found.circles.length===0 && <section className="card" style={{padding:18}}>
            <h3>No compatible swap found yet</h3><p className="muted">Try adding specific offers and needs to your profile (for example, “product photography” rather than “creative work”). Matching improves as more students join.</p><Link className="btn" to="/profile">Update my skills ↗</Link>
          </section>}
          <h2>3-person circles ({found.circles.length})</h2>
          {found.circles.length === 0 && <p className="muted">No circle yet.</p>}
          {found.circles.map((c, i) => (
            <div className="card" key={"c" + i}>
              <CircleReveal legs={c.legs} people={found.people} meId={user.uid} />
              {c.legs.map((l, j) => (
                <p key={j} style={{ margin: "0 0 4px" }}>{leg(l)}</p>
              ))}
              <button className="btn" onClick={() => proposeCirc(c)}>Propose this circle</button>
            </div>
          ))}

          <h2>Direct swaps ({found.direct.length})</h2>
          {found.direct.length === 0 && <p className="muted">No direct swap yet.</p>}
          {found.direct.map((d, i) => (
            <div className="card" key={"d" + i}>
              {d.legs.map((l, j) => (
                <p key={j} style={{ margin: "0 0 4px" }}>{leg(l)}</p>
              ))}
              <button className="btn" onClick={() => proposeDirect(d)}>Propose this swap</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}