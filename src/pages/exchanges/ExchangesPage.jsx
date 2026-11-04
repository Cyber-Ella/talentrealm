import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { watchMyExchanges } from "../../services/exchanges";
import StatusChip from "../../components/StatusChip";

const OPEN = ["pending_approval", "accepted", "in_progress", "awaiting_confirmation"];

export default function ExchangesPage() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [tab, setTab] = useState("open");

  useEffect(() => watchMyExchanges(user.uid, setList), [user.uid]);
  if (!list) return <p>Loading…</p>;

  const shown = list.filter((x) => (tab === "open" ? OPEN.includes(x.status) : !OPEN.includes(x.status)));
  const names = (x) => x.participants.filter((p) => p !== user.uid).map((p) => (x.participantNames?.[p] || "Student").split(" ")[0]).join(" and ");

  return (
    <div>
      <h1>Exchanges</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={"tab" + (tab === "open" ? " on" : "")} onClick={() => setTab("open")}>Ongoing</button>
        <button className={"tab" + (tab === "done" ? " on" : "")} onClick={() => setTab("done")}>Completed or cancelled</button>
      </div>
      {shown.length === 0 && <p className="muted">Nothing here yet.</p>}
      {shown.map((x) => (
        <Link key={x.id} to={"/exchanges/" + x.id} className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{x.type === "circle" ? "3-person circle" : "Direct swap"} with {names(x)}</strong>
            <StatusChip status={x.status} />
          </div>
          <p className="muted" style={{ margin: "4px 0 0" }}>{x.items.map((i) => i.title).join(" · ")}</p>
        </Link>
      ))}
      <Link className="btn" to="/exchanges/new" style={{ marginTop: 12 }}>Find new matches</Link>
    </div>
  );
}