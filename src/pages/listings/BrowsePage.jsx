import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getListings } from "../../services/listings";
import ListingCard from "../../components/ListingCard";

const TABS = [["all", "All"], ["service", "Services"], ["showcase", "Talents"], ["free", "Free"]];

export default function BrowsePage() {
  const [params] = useSearchParams();
  const [list, setList] = useState(null);
  const [tab, setTab] = useState(params.get("tab") || "all");
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => { getListings().then(setList); }, []);
  if (!list) return <p>Loading…</p>;

  const shown = list.filter((l) => {
    if (tab === "service" && l.type !== "service") return false;
    if (tab === "showcase" && l.type !== "showcase") return false;
    if (tab === "free" && Number(l.price) > 0) return false;
    return `${l.title} ${l.description} ${l.category} ${l.ownerName}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div>
      <h1>Browse</h1>
      <input placeholder="Search skills, services…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      <div className="row" style={{ marginBottom: 12 }}>
        {TABS.map(([k, label]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {shown.length === 0 && <p className="muted">Nothing here yet. <Link to="/listings/new">Create a listing</Link>.</p>}
      <div className="grid2">{shown.map((l) => <ListingCard key={l.id} l={l} />)}</div>
      <Link className="btn" to="/listings/new" style={{ marginTop: 16 }}>Create a listing</Link>
    </div>
  );
}