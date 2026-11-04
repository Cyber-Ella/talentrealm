import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { proposeExchange } from "../../services/exchanges";

export default function ProposeExchange() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const listingId = params.get("listing");

  const [wanted, setWanted] = useState(null);
  const [mine, setMine] = useState([]);
  const [pickedId, setPickedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    async function load() {
      if (listingId) {
        const snap = await getDoc(doc(db, "listings", listingId));
        if (snap.exists()) setWanted({ id: snap.id, ...snap.data() });
      }
      const q = query(collection(db, "listings"), where("ownerId", "==", user.uid));
      const res = await getDocs(q);
      const list = res.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMine(list);
      if (list.length) setPickedId(list[0].id);
    }
    load();
  }, [user, listingId]);

  async function send() {
    const offered = mine.find((l) => l.id === pickedId);
    if (!wanted || !offered) return;
    setBusy(true);
    setError("");
    try {
      const newId = await proposeExchange({
        proposer: { uid: user.uid, name: user.displayName || user.email },
        receiver: { uid: wanted.ownerId, name: wanted.ownerName },
        offered: { listingId: offered.id, title: offered.title },
        requested: { listingId: wanted.id, title: wanted.title },
      });
      navigate(`/exchanges/${newId}`);
    } catch (e) {
      setError("Could not send the proposal. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const card = { background: "white", borderRadius: 14, padding: 14, marginBottom: 12 };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", background: "#f1edfb", minHeight: "100vh" }}>
      <div style={{ background: "#25104f", color: "white", padding: 16, fontWeight: 700 }}>
        Propose an exchange
      </div>

      <div style={{ padding: 16 }}>
        <h3 style={{ color: "#25104f" }}>Offer a skill in return</h3>

        {!wanted ? (
          <p style={{ color: "#777" }}>No listing selected yet.</p>
        ) : (
          <div style={card}>
            <small>You want</small>
            <div style={{ fontWeight: 700 }}>{wanted.title}</div>
            <div style={{ fontSize: 13, color: "#777" }}>{wanted.ownerName}</div>
          </div>
        )}

        <h4 style={{ color: "#25104f" }}>What can you offer in return?</h4>
        {mine.length === 0 && <p style={{ color: "#777" }}>You have no listings to offer yet.</p>}
        {mine.map((l) => (
          <label
            key={l.id}
            style={{ ...card, display: "block", marginBottom: 8, border: pickedId === l.id ? "2px solid #5b2fb5" : "1px solid #ddd" }}
          >
            <input type="radio" checked={pickedId === l.id} onChange={() => setPickedId(l.id)} />{" "}
            <strong>{l.title}</strong>
            <div style={{ fontSize: 12, color: "#777" }}>{l.category}</div>
          </label>
        ))}

        {error && <p style={{ color: "#a12a2a" }}>{error}</p>}

        <button
          onClick={send}
          disabled={busy || !wanted || !pickedId}
          style={{ width: "100%", padding: 14, border: "none", borderRadius: 12, background: "#ffb92e", color: "#25104f", fontWeight: 700 }}
        >
          {busy ? "Sending..." : "Send exchange proposal"}
        </button>
        <p style={{ fontSize: 12, color: "#777" }}>
          Both students must agree before an exchange is confirmed.
        </p>
      </div>
    </div>
  );
}