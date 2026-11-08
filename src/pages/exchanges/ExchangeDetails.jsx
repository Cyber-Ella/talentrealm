import { firstName } from "../../services/names";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  watchExchange,
  respondToExchange,
  counterTopUp,
  startExchange,
  markDelivered,
  confirmDelivery,
  cancelExchange,
  reportProblem,
  submitArrangement,
  reviewArrangement,
} from "../../services/exchanges";
import StatusChip from "../../components/StatusChip";
import Confetti from "../../components/Confetti";

const money = (n) => "₦" + Number(n || 0).toLocaleString();
const OPEN = [
  "pending_approval",
  "accepted",
  "in_progress",
  "awaiting_confirmation",
];

export default function ExchangeDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ex, setEx] = useState(undefined);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [counter, setCounter] = useState("");
  const [report, setReport] = useState("");
  const [meeting, setMeeting] = useState({ location: "", venue: "", dateTime: "", notes: "" });
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => watchExchange(id, setEx), [id]);

  if (ex === undefined) return <p>Loading…</p>;
  if (ex === null) return <p>Exchange not found.</p>;

  const uid = user.uid;
  const first = (u) => firstName(ex.participantNames?.[u]);
  const who = (u) => (u === uid ? "You" : first(u));
  const toWho = (u) => (u === uid ? "you" : first(u));
  const verb = (u) => (u === uid ? "give" : "gives");
  const act = async (fn, ok) => {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      setMsg(ok || "Done.");
    } catch (e) {
      setMsg("Error: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const mine = ex.approvals?.[uid];
  const toDeliver = ex.items.find((i) => i.providerId === uid && !i.delivered);
  const toConfirm = ex.items.find(
    (i) => i.receiverId === uid && i.delivered && !i.confirmed,
  );

  return (
    <main className="tr-exchange-detail">
      <header className="tr-exchange-detail-heading"><div><span className="tr-eyebrow">YOUR AGREEMENT</span><h1>
          {ex.type === "circle" ? "3-person circle" : ex.type === "purchase" ? "Purchase request" : "Direct swap"}
        </h1><p>Review the terms, keep each other updated, and confirm each step as it happens.</p></div><StatusChip status={ex.status} /></header>

      <h2 className="tr-detail-section-title">The trade</h2>
      <p className="ai-note" style={{ margin: "0 0 8px" }}>
        ✦ {ex.type === "purchase" ? "Owner-listed price; payment is handled directly." : ex.items.every((item) => item.reason === "Owner-listed price.") ? "Values come from listing owners." : "Any Gemini valuation is an estimate, not a fixed price."}
      </p>
      {ex.items.map((it, i) => (
        <div className="tr-detail-item" key={i}>
          <strong>
            {who(it.providerId)} {verb(it.providerId)} {it.title} to{" "}
            {toWho(it.receiverId)}
          </strong>
          <p style={{ margin: "4px 0 0" }}>
            Estimated value: {money(it.estimatedValue)}
          </p>
          {it.reason && (
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {it.reason}
            </p>
          )}
          {(it.delivered || it.confirmed) && (
            <p style={{ margin: "4px 0 0" }}>
              {it.delivered ? "Delivered" : ""}
              {it.confirmed ? " · Confirmed" : ""}
            </p>
          )}
        </div>
      ))}

      {ex.type !== "purchase" && <h2 className="tr-detail-section-title">Value balance</h2>}
      {ex.type !== "purchase" && <div className="tr-detail-panel">
        {ex.type === "direct" &&
          (ex.topUp?.amount > 0 ? (
            <p style={{ margin: 0 }}>
              {who(ex.topUp.payerId)}{" "}
              {ex.topUp.payerId === uid ? "pay" : "pays"}{" "}
              {toWho(ex.topUp.payeeId)}{" "}
              <strong>{money(ex.topUp.amount)}</strong> ({ex.topUp.status})
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              No top-up needed. The values are balanced.
            </p>
          ))}
        {ex.type === "circle" &&
          ((ex.transfers || []).length ? (
            ex.transfers.map((t, i) => (
              <p key={i} style={{ margin: "0 0 4px" }}>
                {who(t.from)} {t.from === uid ? "pay" : "pays"} {toWho(t.to)}{" "}
                <strong>{money(t.amount)}</strong>
              </p>
            ))
          ) : (
            <p style={{ margin: 0 }}>
              No top-up needed. The values are balanced.
            </p>
          ))}
      </div>}
      {ex.type === "purchase" && <div className="tr-detail-panel"><strong>Listed price: {money(ex.topUp?.amount)}</strong><p>Payment is arranged directly between buyer and seller. TalentRealm does not process payment yet.</p></div>}

      <h2 className="tr-detail-section-title">Agreement</h2>
      <div className="tr-detail-panel tr-approval-list">
        {ex.participants.map((p) => (
          <p key={p} style={{ margin: "0 0 4px" }}>
            {who(p)}: {ex.approvals?.[p] || "pending"}
          </p>
        ))}
      </div>

      {ex.status === "pending_approval" && mine === "pending" && (
        <>
          <button
            className="btn btn-accent"
            disabled={busy}
            onClick={() =>
              act(() => respondToExchange(id, uid, "accepted"), "You accepted.")
            }
          >
            Accept terms
          </button>
          <button
            className="btn btn-outline"
            disabled={busy}
            onClick={() =>
              act(() => respondToExchange(id, uid, "declined"), "You declined.")
            }
          >
            Decline and cancel
          </button>
        </>
      )}
      {ex.status === "pending_approval" && ex.type === "direct" && (
        <div className="tr-detail-panel tr-counter-panel">
          <strong>Suggest a different top-up</strong>
          <input
            type="number"
            min="0"
            placeholder="Amount in ₦"
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
            style={{ marginTop: 8 }}
          />
          <button
            className="btn btn-outline"
            disabled={busy || !counter}
            onClick={() =>
              act(() => counterTopUp(id, uid, counter), "Counter-offer sent.")
            }
          >
            Send counter-offer
          </button>
        </div>
      )}
      {ex.status === "awaiting_arrangement" && (() => {
        const arranger = ex.items.find((item) => item.listingId && item.providerId !== ex.createdBy)?.providerId || ex.participants.find((p) => p !== ex.createdBy);
        return arranger === uid ? <section className="tr-detail-panel" style={{ marginTop: 16 }}>
          <h3>Arrange your meeting</h3><p className="muted">Share a proposed location and time. The other student must confirm before the exchange can begin.</p>
          <label>General location (area/campus) *</label><input value={meeting.location} onChange={(e) => setMeeting({ ...meeting, location: e.target.value })} placeholder="e.g. UNIZIK Awka campus" />
          <label>Specific meeting place *</label><input value={meeting.venue} onChange={(e) => setMeeting({ ...meeting, venue: e.target.value })} placeholder="e.g. Library entrance" />
          <label>Proposed date and time *</label><input type="datetime-local" value={meeting.dateTime} onChange={(e) => setMeeting({ ...meeting, dateTime: e.target.value })} />
          <label>Additional instructions (optional)</label><textarea rows={3} value={meeting.notes} onChange={(e) => setMeeting({ ...meeting, notes: e.target.value })} placeholder="Any details the other student should know" />
          <button className="btn btn-accent" disabled={busy || !meeting.location.trim() || !meeting.venue.trim() || !meeting.dateTime} onClick={() => act(() => submitArrangement(id, meeting), "Arrangement sent for confirmation.")}>Submit arrangement</button>
        </section> : <p className="ai-note">Waiting for the listing owner to submit the meeting arrangement.</p>;
      })()}
      {ex.status === "awaiting_confirmation" && ex.arrangement && <section className="tr-detail-panel" style={{ marginTop: 16 }}>
        <h3>Proposed meeting arrangement</h3><p><strong>Location:</strong> {ex.arrangement.location}</p><p><strong>Place:</strong> {ex.arrangement.venue}</p><p><strong>Date & time:</strong> {ex.arrangement.dateTime}</p>{ex.arrangement.notes && <p><strong>Notes:</strong> {ex.arrangement.notes}</p>}
        {ex.arrangement.feedback && <p className="muted">Review note: {ex.arrangement.feedback}</p>}
        {ex.arrangement.submittedBy !== uid ? <><label>Request changes (optional note)</label><textarea rows={2} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="What should be adjusted?"/><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn btn-accent" disabled={busy} onClick={() => act(() => reviewArrangement(id, uid, "confirm"), "Arrangement confirmed. You can now begin the exchange.")}>Confirm arrangement</button><button className="btn btn-outline" disabled={busy} onClick={() => act(() => reviewArrangement(id, uid, "changes", reviewNote), "Changes requested.")}>Request changes</button></div></> : <p className="muted">Waiting for the other participant to confirm these details.</p>}
      </section>}
      {ex.status === "accepted" && (
        <button
          className="btn btn-accent"
          disabled={busy}
          onClick={() => act(() => startExchange(id, uid), "Exchange started.")}
        >
          {ex.type === "purchase" ? "Confirm order & begin fulfillment" : "Start exchange"}
        </button>
      )}
      {toDeliver &&
        ["in_progress", "awaiting_confirmation"].includes(ex.status) && (
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              act(() => markDelivered(id, uid), "Marked as delivered.")
            }
          >
            I have delivered {toDeliver.title}
          </button>
        )}
      {toConfirm && (
        <button
          className="btn btn-accent"
          disabled={busy}
          onClick={() => act(() => confirmDelivery(id, uid), "Confirmed.")}
        >
          I received {toConfirm.title}
        </button>
      )}
      {ex.status === "completed" && <Confetti />}

      {OPEN.includes(ex.status) && (
        <button
          className="btn btn-outline"
          disabled={busy}
          onClick={() =>
            act(() => cancelExchange(id, uid), "Exchange cancelled.")
          }
          style={{ marginTop: 12 }}
        >
          Cancel this exchange
        </button>
      )}

      <h2 className="tr-detail-section-title">Need help?</h2>
      <textarea
        rows={2}
        placeholder="What went wrong?"
        value={report}
        onChange={(e) => setReport(e.target.value)}
      />
      <button
        className="btn btn-outline"
        disabled={busy || !report.trim()}
        onClick={() =>
          act(async () => {
            await reportProblem(id, uid, report);
            setReport("");
          }, "Report sent.")
        }
      >
        Send report
      </button>

      {msg && <p>{msg}</p>}
    </main>
  );
}
