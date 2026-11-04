import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createListing } from "../../services/listings";
import RefineWithGemini from "../../components/RefineWithGemini";

const CATEGORIES = ["Beauty", "Fashion", "Photography", "Food", "Music", "Technology", "Academics", "Creative", "Other"];

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState("service");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [price, setPrice] = useState("");
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const id = await createListing({
        ownerId: user.uid, ownerName: user.displayName, type, title: title.trim(), description: description.trim(),
        category, price: type === "showcase" ? 0 : Math.max(0, Number(price) || 0), skills: skills.length ? skills : [title.trim()],
      });
      navigate("/listings/" + id);
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <form onSubmit={submit}>
      <h1>Create listing</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <button type="button" className={"tab" + (type === "service" ? " on" : "")} onClick={() => setType("service")}>Service</button>
        <button type="button" className={"tab" + (type === "showcase" ? " on" : "")} onClick={() => setType("showcase")}>Talent showcase</button>
      </div>
      <p className="muted">
        {type === "service" ? "Others can request it or propose an exchange. Set a price, or leave it blank for free." : "Share your work so people can find you. No bookings needed."}
      </p>
      <input placeholder="Title, e.g. Product photography" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <textarea rows={4} placeholder="Describe what you offer, in your own words" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <RefineWithGemini
        text={description}
        onAccept={(r) => { setDescription(r.refined); setCategory(r.category); setType(r.type); setSkills(r.skills); if (!title.trim() && r.skills[0]) setTitle(r.skills[0]); }}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      {type === "service" && (
        <input type="number" min="0" placeholder="Price in ₦ (blank = free)" value={price} onChange={(e) => setPrice(e.target.value)} />
      )}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      <button disabled={busy}>{busy ? "Publishing…" : "Publish listing"}</button>
    </form>
  );
}