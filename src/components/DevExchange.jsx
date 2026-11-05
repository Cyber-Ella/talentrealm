import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { DEMO_USERS } from "../services/seed";
import {
  respondToExchange,
  startExchange,
  markDelivered,
  confirmDelivery,
  cancelExchange,
  watchExchange,
} from "../services/exchanges";
import { watchNotifications } from "../services/notifications";

export default function DevExchange() {
  const { user } = useAuth();
  const people = [
    { id: user.uid, name: "Me (" + user.displayName + ")" },
    ...DEMO_USERS,
  ];
  const [exId, setExId] = useState("");
  const [actor, setActor] = useState(user.uid);
  const [ex, setEx] = useState(null);
  const [notes, setNotes] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!exId.trim()) {
      setEx(null);
      return;
    }
    return watchExchange(exId.trim(), setEx);
  }, [exId]);

  useEffect(() => watchNotifications(actor, setNotes), [actor]);

  const act = (fn) => async () => {
    setMsg("");
    try {
      await fn();
      setMsg("Done.");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  };
  const id = exId.trim();

  return (
    <div className="card">
      <strong>Exchange actions test</strong>
      <input
        placeholder="Paste an exchange id"
        value={exId}
        onChange={(e) => setExId(e.target.value)}
      />
      <select value={actor} onChange={(e) => setActor(e.target.value)}>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            Act as {p.name}
          </option>
        ))}
      </select>
      <div style={{ display: "grid", gap: 8 }}>
        <button
          className="btn"
          onClick={act(() => respondToExchange(id, actor, "accepted"))}
        >
          Accept
        </button>
        <button
          className="btn"
          onClick={act(() => respondToExchange(id, actor, "declined"))}
        >
          Decline
        </button>
        <button className="btn" onClick={act(() => startExchange(id, actor))}>
          Start exchange
        </button>
        <button className="btn" onClick={act(() => markDelivered(id, actor))}>
          Mark my service delivered
        </button>
        <button className="btn" onClick={act(() => confirmDelivery(id, actor))}>
          Confirm I received my service
        </button>
        <button className="btn" onClick={act(() => cancelExchange(id, actor))}>
          Cancel exchange
        </button>
      </div>
      {msg && <p>{msg}</p>}

      {ex && (
        <div className="card" style={{ marginTop: 12 }}>
          <p style={{ margin: 0 }}>
            <strong>Status: {ex.status}</strong> · {ex.type}
          </p>
          <p style={{ margin: "4px 0" }}>
            Approvals:{" "}
            {Object.entries(ex.approvals)
              .map(([k, v]) => `${k.replace("demo-", "")}: ${v}`)
              .join(" · ")}
          </p>
          {ex.items.map((it, i) => (
            <p key={i} style={{ margin: "2px 0" }}>
              {it.title}: {it.delivered ? "delivered" : "not delivered"},{" "}
              {it.confirmed ? "confirmed" : "not confirmed"}
            </p>
          ))}
        </div>
      )}

      <p style={{ marginBottom: 4 }}>
        <strong>Notifications for this person ({notes.length})</strong>
      </p>
      {notes.slice(0, 6).map((n) => (
        <p key={n.id} style={{ margin: "2px 0", fontSize: 13 }}>
          • {n.title}: {n.body}
        </p>
      ))}
    </div>
  );
}
