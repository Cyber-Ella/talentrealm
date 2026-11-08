import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="xp-404">
      <h1>404</h1>
      <p className="muted">This corner of the realm doesn't exist yet.</p>
      <Link className="xp-btn" to="/">Take me home ↗</Link>
    </main>
  );
}
