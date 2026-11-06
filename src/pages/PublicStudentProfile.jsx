import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicProfile } from "../services/profile";
import { getListings } from "../services/listings";
import ListingCard from "../components/ListingCard";

export default function PublicStudentProfile() {
  const { uid } = useParams();
  const [profile, setProfile] = useState(undefined);
  const [listings, setListings] = useState([]);
  useEffect(() => {
    let active = true;
    Promise.all([getPublicProfile(uid), getListings({ ownerId: uid })]).then(([p, l]) => {
      if (active) { setProfile(p); setListings(l); }
    }).catch(() => { if (active) setProfile(null); });
    return () => { active = false; };
  }, [uid]);
  if (profile === undefined) return <main className="ptp-page">Loading student profile…</main>;
  if (!profile) return <main className="ptp-page"><Link to="/browse">← Explore talents</Link><h1>Student profile not found</h1></main>;
  return <main className="ptp-page">
    <Link to="/browse">← Explore talents</Link>
    <section className="card" style={{ margin: "20px 0", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {profile.photoURL ? <img src={profile.photoURL} alt="" style={{ width: 88, height: 88, objectFit: "cover", borderRadius: "50%" }} /> : <div style={{ width: 88, height: 88, borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--color-surface, #eee)", fontSize: 28 }}>{(profile.name || "S").slice(0,1).toUpperCase()}</div>}
        <div><h1 style={{ margin: 0 }}>{profile.name || "TalentRealm student"}</h1><p className="muted">{profile.department || "UNIZIK student"}{profile.level ? ` · ${profile.level} Level` : ""}</p></div>
      </div>
      {profile.bio && <p>{profile.bio}</p>}
      {Array.isArray(profile.offers) && profile.offers.length > 0 && <p><strong>Offers:</strong> {profile.offers.join(", ")}</p>}
      {Array.isArray(profile.needs) && profile.needs.length > 0 && <p><strong>Looking for:</strong> {profile.needs.join(", ")}</p>}
    </section>
    <h2>Listings by {profile.name?.split(" ")[0] || "this student"}</h2>
    {listings.length ? <div className="listing-grid">{listings.map((l) => <ListingCard key={l.id} l={l} />)}</div> : <p className="muted">This student has not published any listings yet.</p>}
  </main>;
}
