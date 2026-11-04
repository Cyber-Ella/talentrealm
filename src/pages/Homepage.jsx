import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getListings } from "../services/listings";
import Avatar from "../components/Avatar";
import ListingCard from "../components/ListingCard";
import DevTools from "../components/DevTools";
import DevExchange from "../components/DevExchange";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [people, setPeople] = useState([]);

  useEffect(() => {
    getListings().then((list) => setPeople(list.filter((l) => l.ownerId !== user.uid).slice(0, 4)));
  }, [user.uid]);

  const search = (e) => {
    e.preventDefault();
    navigate("/browse?q=" + encodeURIComponent(q));
  };

  return (
    <div>
      <h1>Hello, {(user.displayName || "there").split(" ")[0]}! 👋</h1>
      <p className="muted">Explore talents, services and opportunities around you.</p>

      <form onSubmit={search}>
        <input placeholder="Search skills, services…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      </form>

      <div className="tiles">
        <Link to="/browse?tab=showcase" className="tile t1"><strong>Browse talents</strong><span>See what people can do</span></Link>
        <Link to="/browse?tab=service" className="tile t2"><strong>Find services</strong><span>Request what you need</span></Link>
        <Link to="/exchanges/new" className="tile t3"><strong>Service exchange</strong><span>Swap skills, no cash</span></Link>
        <Link to="/listings/new" className="tile t4"><strong>Showcase your skill</strong><span>Create a listing</span></Link>
      </div>

      <div className="banner">
        <div className="stack">
          <Avatar name="Ella" size={36} /><Avatar name="Amaka" size={36} /><Avatar name="David" size={36} />
        </div>
        <h3>3-Person Exchange</h3>
        <p>Hair · Design · Photography</p>
        <Link className="btn" to="/exchanges/new">Find my circle →</Link>
      </div>

      <div className="row" style={{ justifyContent: "space-between", margin: "20px 0 8px" }}>
        <strong style={{ fontSize: 18 }}>People you should meet</strong>
        <Link to="/browse">See all</Link>
      </div>
      {people.length === 0 ? (
        <p className="muted">No listings yet. Create the first one!</p>
      ) : (
        <div className="grid2">{people.map((l) => <ListingCard key={l.id} l={l} />)}</div>
      )}

      <details style={{ marginTop: 24 }}>
        <summary className="muted">Demo tools (remove before the pitch)</summary>
        <DevTools />
        <DevExchange />
      </details>
    </div>
  );
}