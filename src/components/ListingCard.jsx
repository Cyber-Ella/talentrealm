import { useState } from "react";
import { Link } from "react-router-dom";
import { photoFor } from "./Avatar";

export default function ListingCard({ l }) {
  const [broken, setBroken] = useState(false);
  const src = photoFor(l.ownerName);
  const initials = String(l.ownerName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const price = l.type === "showcase" ? null : Number(l.price) > 0 ? "₦" + Number(l.price).toLocaleString() : "Free";
  return (
    <Link to={`/listings/${l.id}`} className="lcard">
      <div className="ph">
        {src && !broken ? <img src={src} alt={l.ownerName} onError={() => setBroken(true)} /> : initials}
      </div>
      <strong>{l.title}</strong>
      <div className="muted" style={{ fontSize: 12 }}>{l.ownerName} · {l.category}</div>
      <div className="row" style={{ marginTop: 6, gap: 6 }}>
        {price && <span style={{ fontSize: 13, fontWeight: 600 }}>{price}</span>}
        <span className={"tag" + (l.type === "showcase" ? " talent" : "")}>{l.type === "showcase" ? "Talent" : "Offer"}</span>
      </div>
    </Link>
  );
}