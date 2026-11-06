import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { watchMyListings, deleteListing } from "../services/listings";
import { SkeletonGrid } from "./Skeleton";

export default function MyListings() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => watchMyListings(user.uid, setList, (e) => {
    setList([]);
    setMsg("Could not load your listings: " + e.message);
  }), [user.uid]);

  const remove = async (l) => {
    setBusyId(l.id);
    setMsg("");
    try {
      await deleteListing(l.id, user.uid);
      setMsg(`"${l.title}" was deleted.`);
      setConfirmId(null);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="xp-mine-section">
      <span className="tr-eyebrow">YOUR CREATIVE SPACE</span>
      <h2>Your listings.</h2>

      {msg && <p role="status" className="muted">{msg}</p>}

      {list === null && <SkeletonGrid count={2} />}

      {list && list.length === 0 && (
        <div className="xp-mine-row">
          <div className="xp-mine-info">
            <strong>You haven't listed anything yet.</strong>
            <span className="muted">Share a service or showcase your work so people can find you.</span>
          </div>
          <Link className="xp-btn small" to="/listings/new">Create a listing ↗</Link>
        </div>
      )}

      {list && list.length > 0 && (
        <div className="xp-mine">
          {list.map((l) => (
            <div key={l.id}>
              <div className="xp-mine-row">
                <div className="xp-mine-thumb">
                  {l.imageUrls?.[0] ? <img src={l.imageUrls[0]} alt="" /> : (l.title || "?")[0].toUpperCase()}
                </div>
                <div className="xp-mine-info">
                  <strong>{l.title}</strong>
                  <span className="muted">
                    {l.type === "showcase" ? "Talent showcase" : Number(l.price) > 0 ? "₦" + Number(l.price).toLocaleString() : "Free"}
                    {l.category ? " · " + l.category : ""}
                  </span>
                </div>
                <div className="xp-mine-actions">
                  <Link className="xp-btn small ghost" to={`/listings/${l.id}`}>View</Link>
                  <button className="xp-btn small danger" onClick={() => setConfirmId(l.id)} disabled={busyId === l.id}>
                    Delete
                  </button>
                </div>
              </div>

              {confirmId === l.id && (
                <div className="xp-confirm" role="alertdialog" aria-label={`Confirm deleting ${l.title}`} style={{ marginTop: 8 }}>
                  <p><strong>Delete "{l.title}"?</strong> This can't be undone.</p>
                  <div className="xp-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="xp-btn small danger" onClick={() => remove(l)} disabled={busyId === l.id}>
                      {busyId === l.id ? "Deleting…" : "Yes, delete it"}
                    </button>
                    <button className="xp-btn small ghost" onClick={() => setConfirmId(null)}>Keep it</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}