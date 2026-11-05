import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getListings } from "../../services/listings";
import ListingCard from "../../components/ListingCard";

const TABS = [
  ["all", "All"],
  ["service", "Services"],
  ["showcase", "Talents"],
  ["free", "Free"],
];

const VALID_TABS = new Set(TABS.map(([key]) => key));

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState(null);

  // Read search and tab directly from the URL.
  const tabFromURL = searchParams.get("tab") || "all";
  const tab = VALID_TABS.has(tabFromURL) ? tabFromURL : "all";
  const q = searchParams.get("q") || "";

  // Fetch listings.
  useEffect(() => {
    getListings().then(setList);
  }, []);

  // Update search without losing the selected tab.
  function handleSearchChange(value) {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams, { replace: true });
  }

  // Update tab without losing the search query.
  function handleTabChange(value) {
    const nextParams = new URLSearchParams(searchParams);

    if (value === "all") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", value);
    }

    setSearchParams(nextParams);
  }

  if (!list) return <p>Loading…</p>;

  const normalizedQuery = q.trim().toLowerCase();

  const shown = list.filter((l) => {
    if (tab === "service" && l.type !== "service") return false;
    if (tab === "showcase" && l.type !== "showcase") return false;
    if (tab === "free" && Number(l.price) > 0) return false;

    const searchableText = [l.title, l.description, l.category, l.ownerName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  return (
    <main className="tr-browse-page">
      <header className="tr-browse-heading"><div><span className="tr-eyebrow">THE TALENT DIRECTORY</span><h1>Find your <em>next thing.</em></h1><p>Discover people, services and creative work from your campus community.</p></div><Link className="tr-browse-create" to="/listings/new">＋ Create listing</Link></header>
      <section className="tr-browse-tools">

      <input
        placeholder="Search skills, services…"
        value={q}
        onChange={(e) => handleSearchChange(e.target.value)}
        aria-label="Search listings"
      />

      <div className="row tr-browse-tabs" style={{ marginBottom: 12 }}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            className={"tab" + (tab === key ? " on" : "")}
            onClick={() => handleTabChange(key)}
            aria-pressed={tab === key}
          >
            {label}
          </button>
        ))}
      </div>

      </section>
      <div className="tr-browse-results-head"><span>{shown.length} {shown.length === 1 ? "result" : "results"}</span><span>Newest first</span></div>
      {shown.length === 0 && <div className="tr-browse-empty"><span>✳</span><h2>No matches just yet.</h2><p>Try a different search or create the first listing in this space.</p><Link to="/listings/new">Create a listing ↗</Link></div>}
      <div className="grid2 tr-browse-grid">
        {shown.map((l) => (
          <ListingCard key={l.id} l={l} />
        ))}
      </div>

    </main>
  );
}
