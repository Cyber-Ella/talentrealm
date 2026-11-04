import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProfile, saveProfile } from "../../services/profile";
import RefineWithGemini from "../../components/RefineWithGemini";

const toList = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [bio, setBio] = useState("");
  const [offers, setOffers] = useState("");
  const [needs, setNeeds] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getProfile(user.uid).then((d) => {
      setP(d || {});
      setBio(d?.bio || "");
      setOffers((d?.offers || []).join(", "));
      setNeeds((d?.needs || []).join(", "));
    });
  }, [user.uid]);

  const save = async () => {
    setMsg("");
    try {
      await saveProfile(user.uid, { bio, offers: toList(offers), needs: toList(needs) });
      setMsg("Saved.");
    } catch (e) { setMsg("Error: " + e.message); }
  };

  if (!p) return <p>Loading…</p>;

  return (
    <div>
      <h1>{user.displayName}</h1>
      <p className="muted">
        {p.department || "Department not set"} · Level {p.level || "?"} · {p.verified ? "UNIZIK verified" : "Not verified yet"}
      </p>

      <h2>Tell us about you</h2>
      <textarea rows={4} placeholder="Write naturally about what you can do and what you need…" value={bio} onChange={(e) => setBio(e.target.value)} />
      <RefineWithGemini
        text={bio}
        onAccept={(r) => { setBio(r.refined); setOffers(r.skills.join(", ")); setNeeds(r.needs.join(", ")); }}
      />

      <h2>What I offer</h2>
      <input placeholder="e.g. Hair styling, Braids" value={offers} onChange={(e) => setOffers(e.target.value)} />
      <h2>What I need</h2>
      <input placeholder="e.g. Fashion design" value={needs} onChange={(e) => setNeeds(e.target.value)} />
      <p className="muted">Separate items with commas. Matching uses these two lists.</p>

      <button className="btn" onClick={save}>Save profile</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}