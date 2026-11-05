import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getListing, getMyListings } from "../../services/listings";
import { proposeExchange } from "../../services/exchanges";

export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [l, setL] = useState(undefined);
  const [mine, setMine] = useState([]);
  const [pick, setPick] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getListing(id).then(setL);
    getMyListings(user.uid).then((list) => {
      const services = list.filter((x) => x.type === "service");
      setMine(services);
      if (services[0]) setPick(services[0].id);
    });
  }, [id, user.uid]);

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

  return (
    <div>
      <h1>{l.title}</h1>

      <p className="muted">
        {l.ownerName} · {l.category}
      </p>

      {/* Portfolio image gallery */}
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

      {isMine && <div className="card">This is your listing.</div>}

      {!isMine && ["service", "product"].includes(l.type) && (
        <div className="card">
          <strong>Propose an exchange</strong>

          <p className="muted" style={{ margin: "4px 0 12px" }}>
            Trade one of your services or products for this one.
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
