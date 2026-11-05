import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getListing } from "../services/listings";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/public-discover.css";
export default function PublicTalentProfile() {
  const { id } = useParams();
  const [listing, setListing] = useState(undefined);
  useEffect(() => {
    getListing(id)
      .then(setListing)
      .catch(() => setListing(null));
  }, [id]);
  if (listing === undefined)
    return <main className="ptp-page">Loading talent…</main>;
  if (!listing)
    return (
      <main className="ptp-page">
        <Link to="/discover">← Back to discover</Link>
        <h1>Talent not found</h1>
      </main>
    );
  const images =
    listing.imageUrls ||
    [listing.imageUrl || listing.coverImage].filter(Boolean);
  return (
    <main className="ptp-page">
      <header className="pd-top">
        <Link className="pd-logo" to="/welcome">
          TALENT<span>REALM</span>
          <i>®</i>
        </Link>
        <div className="pd-top-actions">
          <ThemeToggle />
          <Link to="/discover">Discover</Link>
          <Link className="pd-join" to="/signup">Join ↗</Link>
        </div>
      </header>
      <Link className="ptp-back" to="/discover">
        ← Back to discovery
      </Link>
      <section className="ptp-main">
        <p className="pd-eyebrow">
          {listing.category || "STUDENT TALENT"} ·{" "}
          {listing.type === "showcase" ? "PORTFOLIO" : "SERVICE"}
        </p>
        <h1>{listing.title}</h1>
        <p className="ptp-owner">
          Shared by <strong>{listing.ownerName || "TalentRealm member"}</strong>
        </p>
        <p className="ptp-description">{listing.description || "A student creator sharing what they do best. Join TalentRealm to connect, collaborate or support their work."}</p>
        <div className="ptp-meta-row">
          <span>✦ Student talent</span>
          <span>{listing.category || "Creative"}</span>
          <span>{listing.type === "showcase" ? "Portfolio" : "Service"}</span>
        </div>
        {Number(listing.price) > 0 && (
          <p className="ptp-price">
            ₦{Number(listing.price).toLocaleString()}{" "}
            <small>starting price</small>
          </p>
        )}
        <div className="ptp-gallery">
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${listing.title} portfolio ${i + 1}`}
            />
          ))}
        </div>
        <div className="ptp-actions">
          <Link to="/signup">Book / propose an exchange ↗</Link>
          <span>Join TalentRealm to connect with this creator.</span>
        </div>
      </section>
    </main>
  );
}
