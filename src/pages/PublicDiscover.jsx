import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getListings } from "../services/listings";
import { photoFor } from "../components/Avatar";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/public-discover.css";

const sample = [
  {
    id: "sample-1",
    title: "Editorial makeup",
    ownerName: "Akunna",
    category: "Beauty",
    description: "Beauty looks for events, portraits and special moments.",
    imageUrls: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
    ],
    type: "service",
  },
  {
    id: "sample-2",
    title: "Fashion & styling",
    ownerName: "Creative studio",
    category: "Fashion",
    description: "Personal styling and fashion concepts.",
    imageUrls: [
      "https://images.unsplash.com/photo-1539102868172-9e9f6fa7f3d3?auto=format&fit=crop&w=900&q=85",
    ],
    type: "showcase",
  },
  {
    id: "sample-3",
    title: "Portrait photography",
    ownerName: "Visual storyteller",
    category: "Photography",
    description: "Portraits that tell your story.",
    imageUrls: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    ],
    type: "service",
  },
  {
    id: "sample-4",
    title: "Digital design",
    ownerName: "Digital maker",
    category: "Technology",
    description: "Designing bold digital experiences.",
    imageUrls: [
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=85",
    ],
    type: "showcase",
  },
];
export default function PublicDiscover() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getListings()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);
  const all = items.length ? items : sample;
  const categories = [
    "All",
    ...new Set(all.map((x) => x.category).filter(Boolean)),
  ];
  const filtered = useMemo(
    () =>
      all.filter(
        (x) =>
          `${x.title} ${x.ownerName} ${x.category} ${x.description}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (category === "All" || x.category === category),
      ),
    [all, query, category],
  );
  return (
    <main className="pd-page">
      <header className="pd-top">
        <Link className="pd-logo" to="/welcome">
          TALENT<span>REALM</span>
          <i>®</i>
        </Link>
        <div className="pd-top-actions">
          <ThemeToggle />
          <Link to="/login">Log in</Link>
          <Link className="pd-join" to="/signup">
            Join ↗
          </Link>
        </div>
      </header>
      <section className="pd-intro">
        <p className="pd-eyebrow">THE TALENT IS ALREADY HERE</p>
        <h1>
          Meet the people
          <br />
          behind the <em>talent.</em>
        </h1>
        <p>
          Explore student work, discover new skills and find your next collaborator.
        </p>
        <label className="pd-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try photography, design, makeup…"
            aria-label="Search people, talents or services"
          />
          <kbd>↵</kbd>
        </label>
      </section>
      <section className="pd-content">
        <div className="pd-heading">
          <div>
            <p className="pd-eyebrow">OPEN DISCOVERY</p>
            <h2>
              Explore talent <span>↘</span>
            </h2>
          </div>
          <small>
            {filtered.length} {filtered.length === 1 ? "talent" : "talents"}
          </small>
        </div>
        <div className="pd-filters">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="pd-loading">Finding talent…</div>
        ) : (
          <div className="pd-grid">
            {filtered.map((l, i) => {
              const image = l.imageUrls?.[0] || l.imageUrl || l.coverImage;
              return (
                <Link
                  to={l.id.startsWith("sample") ? "/signup" : `/talent/${l.id}`}
                  className="pd-card"
                  key={l.id}
                  aria-label={`${l.title} by ${l.ownerName || "TalentRealm member"}`}
                >
                  <div className="pd-card-image">
                    {image ? (
                      <img src={image} alt={l.title} />
                    ) : (
                      <div className="pd-no-image">
                        {(l.title || "T").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span>
                      {l.type === "showcase" ? "SHOWCASE" : "SERVICE"}
                    </span>
                    <b>↗</b>
                  </div>
                  <div className="pd-card-copy">
                    <small>{l.category || "CREATIVE"}</small>
                    <h3>{l.title}</h3>
                    <p>
                      {l.description || "A student sharing what they do best."}
                    </p>
                    <div className="pd-card-owner">
                      <img src={photoFor(l.ownerName)} alt="" />
                      <span>{l.ownerName || "TalentRealm member"}</span>
                      <i>
                        {Number(l.price) > 0
                          ? `₦${Number(l.price).toLocaleString()}`
                          : "Open to discover"}
                      </i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {filtered.length === 0 && !loading && (
          <div className="pd-empty">
            <h3>No talent found yet.</h3>
            <p>Try another search or category.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
        <div className="pd-bottom-cta">
          <div>
            <p className="pd-eyebrow">YOUR WORK DESERVES A PLACE HERE</p>
            <h2>
              What can <em>you</em> do?
            </h2>
          </div>
          <Link to="/signup">Create your talent profile ↗</Link>
        </div>
      </section>
      <footer className="pd-footer">
        <Link className="pd-logo" to="/welcome">
          TALENT<span>REALM</span>
          <i>®</i>
        </Link>
        <span>Discover. Exchange. Create.</span>
      </footer>
    </main>
  );
}
