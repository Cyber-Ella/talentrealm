import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  watchExchange, respondToExchange, counterTopUp, startExchange,
  markDelivered, confirmDelivery, cancelExchange, reportProblem,
} from "../../services/exchanges";
import StatusChip from "../../components/StatusChip";

const money = (n) => "₦" + Number(n || 0).toLocaleString();
const OPEN = ["pending_approval", "accepted", "in_progress", "awaiting_confirmation"];

export default function ExchangeDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ex, setEx] = useState(undefined);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [counter, setCounter] = useState("");
  const [report, setReport] = useState("");

  useEffect(() => watchExchange(id, setEx), [id]);

  if (ex === undefined) return <p>Loading…</p>;
  if (ex === null) return <p>Exchange not found.</p>;

  const uid = user.uid;
  const first = (u) => (ex.participantNames?.[u] || "Student").split(" ")[0];
  const who = (u) => (u === uid ? "You" : first(u));
  const toWho = (u) => (u === uid ? "you" : first(u));
  const verb = (u) => (u === uid ? "give" : "gives");
  const act = async (fn, ok) => {
    setBusy(true); setMsg("");
    try { await fn(); setMsg(ok || "Done."); } catch (e) { setMsg("Error: " + e.message); } finally { setBusy(false); }
  };

  const mine = ex.approvals?.[uid];
  const toDeliver = ex.items.find((i) => i.providerId === uid && !i.delivered);
  const toConfirm = ex.items.find((i) => i.receiverId === uid && i.delivered && !i.confirmed);

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>{ex.type === "circle" ? "3-person circle" : "Direct swap"}</h1>
        <StatusChip status={ex.status} />
      </div>

      <h2>The trade</h2>
      <p className="ai-note" style={{ margin: "0 0 8px" }}>✦ Values suggested by Gemini. Estimates, not fixed prices.</p>
      {ex.items.map((it, i) => (
        <div className="card" key={i}>
          <strong>{who(it.providerId)} {verb(it.providerId)} {it.title} to {toWho(it.receiverId)}</strong>
          <p style={{ margin: "4px 0 0" }}>Estimated value: {money(it.estimatedValue)}</p>
          {it.reason && <p className="muted" style={{ margin: "4px 0 0" }}>{it.reason}</p>}
          {(it.delivered || it.confirmed) && (
            <p style={{ margin: "4px 0 0" }}>{it.delivered ? "Delivered" : ""}{it.confirmed ? " · Confirmed" : ""}</p>
          )}
        </div>
      ))}

      <h2>Top-up</h2>
      <div className="card">
        {ex.type === "direct" &&
          (ex.topUp?.amount > 0 ? (
            <p style={{ margin: 0 }}>
              {who(ex.topUp.payerId)} {ex.topUp.payerId === uid ? "pay" : "pays"} {toWho(ex.topUp.payeeId)} <strong>{money(ex.topUp.amount)}</strong> ({ex.topUp.status})
            </p>
          ) : <p style={{ margin: 0 }}>No top-up needed. The values are balanced.</p>)}
        {ex.type === "circle" &&
          ((ex.transfers || []).length ? ex.transfers.map((t, i) => (
            <p key={i} style={{ margin: "0 0 4px" }}>
              {who(t.from)} {t.from === uid ? "pay" : "pays"} {toWho(t.to)} <strong>{money(t.amount)}</strong>
            </p>
          )) : <p style={{ margin: 0 }}>No top-up needed. The values are balanced.</p>)}
      </div>

      <h2>Approvals</h2>
      <div className="card">
        {ex.participants.map((p) => (
          <p key={p} style={{ margin: "0 0 4px" }}>{who(p)}: {ex.approvals?.[p] || "pending"}</p>
        ))}
      </div>

      {ex.status === "pending_approval" && mine === "pending" && (
        <>
          <button className="btn btn-accent" disabled={busy} onClick={() => act(() => respondToExchange(id, uid, "accepted"), "You accepted.")}>
            Accept terms
          </button>
          <button className="btn btn-outline" disabled={busy} onClick={() => act(() => respondToExchange(id, uid, "declined"), "You declined.")}>
            Decline and cancel
          </button>
        </>
      )}
      {ex.status === "pending_approval" && ex.type === "direct" && (
        <div className="card" style={{ marginTop: 12 }}>
          <strong>Suggest a different top-up</strong>
          <input type="number" min="0" placeholder="Amount in ₦" value={counter} onChange={(e) => setCounter(e.target.value)} style={{ marginTop: 8 }} />
          <button className="btn btn-outline" disabled={busy || !counter} onClick={() => act(() => counterTopUp(id, uid, counter), "Counter-offer sent.")}>
            Send counter-offer
          </button>
        </div>
      )}
      {ex.status === "accepted" && (
        <button className="btn btn-accent" disabled={busy} onClick={() => act(() => startExchange(id, uid), "Exchange started.")}>Start exchange</button>
      )}
      {toDeliver && ["in_progress", "awaiting_confirmation"].includes(ex.status) && (
        <button className="btn" disabled={busy} onClick={() => act(() => markDelivered(id, uid), "Marked as delivered.")}>
          I have delivered {toDeliver.title}
        </button>
      )}
      {toConfirm && (
        <button className="btn btn-accent" disabled={busy} onClick={() => act(() => confirmDelivery(id, uid), "Confirmed.")}>
          I received {toConfirm.title}
        </button>
      )}
      {ex.status === "completed" && <div className="card">Everyone confirmed. This exchange is complete. 🎉</div>}

      {OPEN.includes(ex.status) && (
        <button className="btn btn-outline" disabled={busy} onClick={() => act(() => cancelExchange(id, uid), "Exchange cancelled.")} style={{ marginTop: 12 }}>
          Cancel this exchange
        </button>
      )}

      <h2>Report a problem</h2>
      <textarea rows={2} placeholder="What went wrong?" value={report} onChange={(e) => setReport(e.target.value)} />
      <button className="btn btn-outline" disabled={busy || !report.trim()} onClick={() => act(async () => { await reportProblem(id, uid, report); setReport(""); }, "Report sent.")}>
        Send report
      </button>

      {msg && <p>{msg}</p>}
    </div>
  );
}