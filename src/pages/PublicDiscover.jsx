import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { watchListings } from "../services/listings";
import { photoFor } from "../components/Avatar";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/public-discover.css";
import "../styles/dynamic-experience.css";

export default function PublicDiscover() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState("recent");
  useEffect(() => watchListings((results) => {
    setItems(results); setLoading(false);
  }, () => { setError(true); setLoading(false); }), []);
  const all = items;
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
        <div className="pd-toolbar">
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
          <label className="pd-sort">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort talent">
              <option value="recent">Recently added</option>
              <option value="title">Name A–Z</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>
        {loading ? (
          <div className="pd-grid pd-grid--loading" aria-live="polite">
            {Array.from({ length: 8 }, (_, index) => <div className="pd-card-skeleton" key={index} />)}
          </div>
        ) : error ? (
          <div className="pd-empty pd-state-error" role="alert">
            <h3>We couldn't load discovery.</h3>
            <p>Please refresh the page or try again in a moment.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="pd-empty pd-state-empty">
            <h3>The talent directory is just getting started.</h3>
            <p>Be among the first students to share a skill or service.</p>
            <Link to="/signup">Create your talent profile ↗</Link>
          </div>
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
                      <img src={image} alt={l.title} loading="lazy" decoding="async" />
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
          
        </Link>
        <span>Discover. Exchange. Create.</span>
      </footer>
    </main>
  );
}
