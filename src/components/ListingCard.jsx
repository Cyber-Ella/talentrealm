import { useState } from "react";
import { Link } from "react-router-dom";
import { photoFor } from "./Avatar";

export default function ListingCard({ l }) {
  const [broken, setBroken] = useState(false);

  const avatar = photoFor(l.ownerName);

  // Prefer a listing image; fall back to the owner's avatar.
  const image =
    l.imageUrls?.[0] || l.imageUrl || l.coverImage || l.serviceImage || avatar;

  const initials = String(l.ownerName || "?")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isTalent = l.type === "showcase";
  const typeLabel = isTalent ? "Talent" : l.type === "product" ? "Product" : "Service";

  const price = isTalent
    ? null
    : Number(l.price) > 0
      ? `₦${Number(l.price).toLocaleString()}`
      : "Free";

  const description = l.description?.trim();

  return (
    <Link to={`/listings/${l.id}`} className="lcard">
      <div className="lcard-image">
        {image && !broken ? (
          <img src={image} alt={l.title} onError={() => setBroken(true)} />
        ) : (
          <div className="lcard-fallback">{initials}</div>
        )}

        <span className={`lcard-type ${isTalent ? "talent" : ""}`}>
          {typeLabel}
        </span>
      </div>

      <div className="lcard-content">
        <span className="lcard-category">{l.category || "Other"}</span>

        <h3 className="lcard-title">{l.title}</h3>

        {description && <p className="lcard-description">{description}</p>}

        <div className="lcard-owner">
          {avatar && <img src={avatar} alt="" className="lcard-avatar" />}

          <span>{l.ownerName || "TalentRealm member"}</span>
        </div>

        <div className="lcard-footer">
          {price && <span className="lcard-price">{price}</span>}

          <span className="lcard-view">
            View details <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
