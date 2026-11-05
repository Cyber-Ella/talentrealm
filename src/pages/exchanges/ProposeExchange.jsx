import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getListings, getMyListings } from "../../services/listings";
import { rankListingMatches } from "../../services/gemini";
import { proposeExchange, proposePurchase } from "../../services/exchanges";

const money = (n) => Number(n || 0) ? `₦${Number(n).toLocaleString()}` : "Open to exchange / free";

export default function ProposeExchange() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [need, setNeed] = useState("");
  const [offeredId, setOfferedId] = useState("");
  const [mode, setMode] = useState("barter");
  const [mine, setMine] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getMyListings(user.uid), getListings()])
      .then(([own, all]) => {
        setMine(own.filter((x) => x.type === "service"));
        setCatalogue(all.filter((x) => ["service", "product"].includes(x.type)));
      })
      .catch((e) => setMessage(e.message));
  }, [user.uid]);

  const offered = useMemo(() => mine.find((x) => x.id === offeredId), [mine, offeredId]);

  const search = async (e) => {
    e.preventDefault();
    if (!need.trim()) return setMessage("Tell us what service or product you need first.");
    if (mode === "barter" && !offered) return setMessage("Choose one of your service listings to offer.");
    setBusy(true); setMessage(""); setMatches(null);
    try {
      const ranked = await rankListingMatches({ need: need.trim(), offeredListing: offered, listings: catalogue, uid: user.uid });
      setMatches(ranked);
      if (!ranked.length) setMessage("No close catalogue match yet. Try a different description or browse all listings.");
    } catch (e) { setMessage(e.message || "Matching couldn't complete. Try again."); }
    finally { setBusy(false); }
  };

  const propose = async (listing) => {
    if (mode === "buy") {
      setBusy(true); setMessage("Sending purchase request…");
      try {
        const id = await proposePurchase({ buyer: { uid: user.uid, name: user.displayName }, seller: { uid: listing.ownerId, name: listing.ownerName }, listing });
        navigate(`/exchanges/${id}`);
      } catch (e) { setMessage("Couldn't send request: " + e.message); setBusy(false); }
      return;
    }
    if (!offered) return;
    setBusy(true); setMessage("Preparing your exchange proposal…");
    try {
      const id = await proposeExchange({
        proposer: { uid: user.uid, name: user.displayName },
        receiver: { uid: listing.ownerId, name: listing.ownerName },
        offered: { listingId: offered.id, title: offered.title, price: Number(offered.price || 0) },
        requested: { listingId: listing.id, title: listing.title, price: Number(listing.price || 0) },
      });
      navigate(`/exchanges/${id}`);
    } catch (e) { setMessage("Couldn't create proposal: " + e.message); setBusy(false); }
  };

  return <main className="tr-match-page tr-smart-exchange">
    <header className="tr-match-heading">
      <span className="tr-eyebrow">A BETTER WAY TO TRADE TALENT</span>
      <h1>What are you <em>looking for?</em></h1>
      <p>Tell us what you need. We'll search real TalentRealm listings and bring back people whose offers fit—not made-up matches or prices.</p>
      <p className="tr-match-profile-note">Your own offers live in <Link to="/listings">your listings</Link>. Add one before proposing a barter.</p>
    </header>

    <form className="tr-smart-search" onSubmit={search}>
      <label className="tr-listing-label">I need
        <input value={need} onChange={(e)=>setNeed(e.target.value)} placeholder="e.g. makeup for a birthday, braids, a logo…" required />
      </label>
      <div className="tr-smart-mode" role="group" aria-label="Exchange type">
        <button type="button" className={mode==="barter"?"active":""} onClick={()=>setMode("barter")}>Barter / exchange</button>
        <button type="button" className={mode==="buy"?"active":""} onClick={()=>setMode("buy")}>Direct transaction</button>
      </div>
      {mode==="barter" && <label className="tr-listing-label">I can offer in return
        <select value={offeredId} onChange={(e)=>setOfferedId(e.target.value)}>
          <option value="">Choose one of my service listings</option>
          {mine.map(x=><option key={x.id} value={x.id}>{x.title} · {money(x.price)}</option>)}
        </select>
        {!mine.length && <span className="tr-listing-field-note">You don't have a service listing yet. <Link to="/listings/new">Create one ↗</Link></span>}
      </label>}
      <button className="tr-match-search-button" disabled={busy}>{busy?"Finding relevant listings…":mode==="buy"?"Find listings to buy ↗":"Find exchange matches ↗"}</button>
    </form>

    {message && <p className="tr-match-message" role="status">{message}</p>}
    {matches && <section className="tr-match-results-section">
      <div className="tr-section-heading"><div><span className="tr-eyebrow">FROM THE TALENTREALM CATALOGUE</span><h2>Possible matches <small>({matches.length})</small></h2></div></div>
      <p className="tr-smart-disclaimer">Gemini ranks these real listings. Listed prices are supplied by their owners; any exchange value or top-up is only a suggestion until everyone agrees.</p>
      <div className="tr-match-results">
        {matches.map(({listing,reason,reciprocal,reciprocalNeed})=><article className="tr-match-card tr-smart-match-card" key={listing.id}>
          <div className="tr-smart-match-images">{listing.imageUrls?.[0]?<img src={listing.imageUrls[0]} alt={listing.title}/>:<div className="tr-smart-image-placeholder">✳</div>}</div>
          <div className="tr-smart-match-content">
            <span className="tr-match-type">{listing.category || "TALENT"} · {listing.ownerName || "Student"}</span>
            <h3>{listing.title}</h3>
            <p>{listing.description}</p>
            <strong className="tr-smart-price">{money(listing.price)}</strong>
            <p className="tr-smart-reason">✦ {reason}</p>
            {reciprocal && <span className="tr-smart-reciprocal">Possible two-way fit{reciprocalNeed?`: they need ${reciprocalNeed}`:""}</span>}
            <div className="tr-smart-card-actions">
              {mode==="barter"?<button className="tr-match-propose" onClick={()=>propose(listing)} disabled={busy||!offered}>Propose this barter ↗</button>:<button className="tr-match-propose" onClick={()=>propose(listing)} disabled={busy}>Request direct purchase ↗</button>}
              <Link className="tr-smart-view-link" to={`/listings/${listing.id}`}>View listing</Link>
            </div>
          </div>
        </article>)}
      </div>
    </section>}
  </main>;
}
