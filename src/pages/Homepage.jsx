import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DevTools from "../components/DevTools";
import DevExchange from "../components/DevExchange";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Hello, {user.displayName}</h1>
      <p className="muted">Trade skills with fellow UNIZIK students. Offer what you can do, get what you need.</p>

      <div className="card" style={{ background: "var(--color-bg-ai)", borderColor: "var(--color-border-ai)" }}>
        <p className="ai-note" style={{ margin: "0 0 8px" }}>✦ Suggested by Gemini</p>
        <p style={{ margin: "0 0 12px" }}>Let Gemini find swaps and 3-person circles that work for you.</p>
        <Link className="btn" to="/exchanges/new">Find my matches</Link>
      </div>

      <h2>Quick actions</h2>
      <Link className="btn btn-outline" to="/browse">Browse talents and services</Link>
      <Link className="btn btn-outline" to="/listings/new">Create a listing</Link>
      <Link className="btn btn-outline" to="/profile">Update my offers and needs</Link>

      <details style={{ marginTop: 24 }}>
        <summary className="muted">Demo tools (remove before the pitch)</summary>
        <DevTools />
        <DevExchange />
      </details>
    </div>
  );
}