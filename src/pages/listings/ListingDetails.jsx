import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { watchListing, watchMyListings, deleteListing, getListings } from "../../services/listings";
import { getPublicProfile } from "../../services/profile";
import { proposeExchange, proposePurchase } from "../../services/exchanges";

export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [l, setL] = useState(undefined);
  const [mine, setMine] = useState([]);
  const [pick, setPick] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [ownerListings, setOwnerListings] = useState([]);

  useEffect(() => {
    setL(undefined);
    const stopListing = watchListing(id, setL, (e) => setMsg("Listing stream error: " + e.message));
    const stopMine = watchMyListings(user.uid, (list) => {
      const services = list.filter((x) => x.type === "service");
      setMine(services);
      setPick((current) => current || services[0]?.id || "");
    }, (e) => setMsg("Could not load your services: " + e.message));
    return () => { stopListing(); stopMine(); };
  }, [id, user.uid]);

  useEffect(() => {
    if (!l?.ownerId) return;
    let active = true;
    Promise.all([getPublicProfile(l.ownerId), getListings({ ownerId: l.ownerId })])
      .then(([profile, listings]) => { if (active) { setOwnerProfile(profile); setOwnerListings(listings.filter((x) => x.id !== l.id)); } })
      .catch((e) => console.warn("Could not load listing owner preview", e));
    return () => { active = false; };
  }, [l?.ownerId, l?.id]);

  if (l === undefined) return <p>Loading…</p>;
  if (l === null) return <p>Listing not found.</p>;

  const isMine = l.ownerId === user.uid;
  const offered = mine.find((x) => x.id === pick);
  const imageUrls = l.imageUrls || [];

  const propose = async () => {
    setBusy(true);
    setMsg("Gemini is estimating the values…");

    try {
      const exId = await proposeExchange({
        proposer: { uid: user.uid, name: user.displayName },
        receiver: { uid: l.ownerId, name: l.ownerName },
        offered: { listingId: offered.id, title: offered.title },
        requested: { listingId: l.id, title: l.title },
      });

      navigate("/exchanges/" + exId);
    } catch (e) {
      setMsg("Error: " + e.message);
      setBusy(false);
    }
  };

  const purchaseRequest = async () => {
    setBusy(true); setMsg("Sending service request…");
    try {
      const exId = await proposePurchase({ buyer: user, seller: { uid: l.ownerId }, listing: l });
      navigate("/exchanges/" + exId);
    } catch (e) { setMsg("Error: " + e.message); setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    setMsg("");
    try {
      await deleteListing(l.id, user.uid);
      navigate("/profile");
    } catch (e) {
      setMsg(e.message);
      setBusy(false);
    }
  };

  return (
    <div>
      <h1>{l.title}</h1>

      <p className="muted">{l.category}</p>

      <section className="card" style={{ display: "flex", gap: 14, alignItems: "center", margin: "16px 0" }}>
        {ownerProfile?.photoURL ? <img src={ownerProfile.photoURL} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} /> : <div aria-hidden="true" style={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--color-surface, #eee)", fontSize: 22 }}>{(ownerProfile?.name || l.ownerName || "T").slice(0,1).toUpperCase()}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{ownerProfile?.name || l.ownerName || "TalentRealm member"}</strong>
          <p className="muted" style={{ margin: "4px 0" }}>{ownerProfile?.department || "UNIZIK student"}{ownerProfile?.level ? ` · ${ownerProfile.level} Level` : ""}</p>
          {ownerProfile?.bio && <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>{ownerProfile.bio}</p>}
          <Link to={`/students/${l.ownerId}`}>View full profile ↗</Link>
        </div>
      </section>
      {ownerListings.length > 0 && <section style={{ margin: "20px 0" }}>
        <h2>More from {ownerProfile?.name?.split(" ")[0] || l.ownerName?.split(" ")[0]}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          {ownerListings.slice(0,4).map((item) => <Link key={item.id} to={`/listings/${item.id}`} className="card" style={{ textDecoration: "none" }}>
            {item.imageUrls?.[0] && <img src={item.imageUrls[0]} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />}
            <strong>{item.title}</strong><p className="muted" style={{ margin: "4px 0" }}>{item.category || item.type}</p>
          </Link>)}
        </div>
      </section>}

      {imageUrls.length > 0 && (
        <div className="listing-gallery">
          {imageUrls.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={`${l.title} portfolio ${index + 1}`}
              className="listing-gallery-image"
            />
          ))}
        </div>
      )}

      <p>{l.description}</p>

      <p>
        <strong>
          {l.type === "showcase"
            ? "Talent showcase · free to view"
            : Number(l.price) > 0
              ? "₦" + Number(l.price).toLocaleString()
              : "Free"}
        </strong>
      </p>

      {isMine && (
        <div className="card">
          <strong>This is your listing.</strong>

          {!confirming ? (
            <button
              className="btn btn-outline"
              style={{ marginTop: 12 }}
              onClick={() => setConfirming(true)}
            >
              Delete this listing
            </button>
          ) : (
            <div className="xp-confirm" role="alertdialog" aria-label="Confirm delete" style={{ marginTop: 12 }}>
              <p>Delete this listing for good? This can't be undone.</p>
              <button className="btn" onClick={remove} disabled={busy}>
                {busy ? "Deleting…" : "Yes, delete it"}
              </button>
              <button className="btn btn-outline" onClick={() => setConfirming(false)} disabled={busy}>
                Keep it
              </button>
            </div>
          )}

          {msg && <p>{msg}</p>}
        </div>
      )}

      {!isMine && l.type === "service" && (
        <div className="card">
          {Number(l.price) > 0 && <div style={{marginBottom:12}}>
            <strong>Want to book this service?</strong>
            <p className="muted" style={{margin:"4px 0 8px"}}>Send a request at the listed price. Payment is arranged directly with the provider; TalentRealm does not process payments.</p>
            <button className="btn btn-accent" onClick={purchaseRequest} disabled={busy}>{busy ? "Sending…" : `Request service · ₦${Number(l.price).toLocaleString()}`}</button>
          </div>}
          <strong>Or propose an exchange</strong>

          <p className="muted" style={{ margin: "4px 0 12px" }}>
            Trade one of your services for this one.
          </p>

          {mine.length === 0 ? (
            <p>
              You have no services yet.{" "}
              <Link to="/listings/new">Create one first</Link>.
            </p>
          ) : (
            <>
              <label>What will you give?</label>

              <select value={pick} onChange={(e) => setPick(e.target.value)}>
                {mine.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>

              <button className="btn" onClick={propose} disabled={busy}>
                {busy ? "Working…" : "Propose exchange"}
              </button>
            </>
          )}

          {msg && <p>{msg}</p>}
        </div>
      )}
    </div>
  );
}