import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getListings } from "../../services/listings";

const TABS = [["all", "All"], ["service", "Services"], ["showcase", "Talents"], ["free", "Free"]];

export default function BrowsePage() {
  const [list, setList] = useState(null);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => { getListings().then(setList); }, []);
  if (!list) return <p>Loading…</p>;

  const shown = list.filter((l) => {
    if (tab === "service" && l.type !== "service") return false;
    if (tab === "showcase" && l.type !== "showcase") return false;
    if (tab === "free" && Number(l.price) > 0) return false;
    const text = `${l.title} ${l.description} ${l.category} ${l.ownerName}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  return (
    <div>
      <h1>Browse</h1>
      <input placeholder="Search skills, services…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="row" style={{ marginBottom: 12 }}>
        {TABS.map(([k, label]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {shown.length === 0 && <p className="muted">Nothing here yet. Be the first to <Link to="/listings/new">create a listing</Link>.</p>}
      {shown.map((l) => (
        <Link key={l.id} to={`/listings/${l.id}`} className="card">
          <strong>{l.title}</strong>
          <p className="muted" style={{ margin: "2px 0" }}>{l.ownerName} · {l.category}</p>
          <p style={{ margin: "4px 0 0" }}>
            {l.type === "showcase" ? "Talent showcase · free to view" : Number(l.price) > 0 ? "₦" + Number(l.price).toLocaleString() : "Free"}
          </p>
        </Link>
      ))}
      <Link className="btn" to="/listings/new" style={{ marginTop: 12 }}>Create a listing</Link>
    </div>
  );
}