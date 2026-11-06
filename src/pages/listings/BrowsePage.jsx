import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { watchListings } from "../../services/listings";
import ListingCard from "../../components/ListingCard";
import "../../styles/listing-phase5.css";

const TABS = [["all", "Everything"], ["service", "Services"], ["product", "Products"], ["showcase", "Showcases"], ["free", "Free / barter"]];
const VALID = new Set(TABS.map(([key]) => key));

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("recent");
  const tabValue = params.get("tab") || "all";
  const tab = VALID.has(tabValue) ? tabValue : "all";
  const q = params.get("q") || "";

  useEffect(() => watchListings((items) => { setList(items); setError(""); }, (e) => { setError(e.message || "Could not load listings."); setList([]); }), []);
  const categories = useMemo(() => ["All categories", ...new Set((list || []).map((x) => x.category).filter(Boolean))], [list]);
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rows = (list || []).filter((item) => {
      if (tab === "free" && Number(item.price) > 0) return false;
      if (tab !== "all" && tab !== "free" && item.type !== tab) return false;
      if (category !== "All categories" && item.category !== category) return false;
      return [item.title, item.description, item.category, item.ownerName, ...(item.skills || [])].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
    if (sort === "price-low") rows.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sort === "price-high") rows.sort((a,b) => (Number(b.price)||0) - (Number(a.price)||0));
    if (sort === "title") rows.sort((a,b) => (a.title||"").localeCompare(b.title||""));
    return rows;
  }, [list, q, tab, category, sort]);
  const changeQuery = (value) => { const next = new URLSearchParams(params); value ? next.set("q", value) : next.delete("q"); setParams(next, { replace: true }); };
  const changeTab = (value) => { const next = new URLSearchParams(params); value === "all" ? next.delete("tab") : next.set("tab", value); setParams(next); };

  return <main className="l5-browse-page">
    <header className="l5-browse-hero"><div><span className="tr-eyebrow">TALENT, SERVICES & CREATIVE WORK</span><h1>Find something<br/><em>worth discovering.</em></h1><p>Browse what UNIZIK students make, know and do. Request it, book it or exchange skills.</p></div><Link to="/listings/new" className="l5-create-cta">＋ Publish your talent</Link></header>
    <section className="l5-browse-controls"><label className="l5-search"><span>⌕</span><input value={q} onChange={(e) => changeQuery(e.target.value)} placeholder="Search photography, makeup, design…" aria-label="Search listings"/><kbd>⌘ K</kbd></label><div className="l5-filter-row"><div className="l5-tabs" role="tablist">{TABS.map(([key,label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => changeTab(key)} aria-pressed={tab === key}>{label}</button>)}</div><div className="l5-selects"><label><span>Category</span><select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label><label><span>Sort</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recent">Newest</option><option value="price-low">Price: low first</option><option value="price-high">Price: high first</option><option value="title">Title A–Z</option></select></label></div></div></section>
    <div className="l5-results-bar"><strong>{list === null ? "Loading" : `${shown.length} ${shown.length === 1 ? "result" : "results"}`}</strong><span>Student-created · Community powered</span></div>
    {list === null ? <div className="l5-loading-grid">{Array.from({length:6},(_,i)=><div className="l5-card-skeleton" key={i}/>)}</div> : error ? <div className="l5-empty"><h2>Listings couldn't load.</h2><p>{error}</p><button onClick={() => window.location.reload()}>Try again</button></div> : shown.length === 0 ? <div className="l5-empty"><span>✳</span><h2>No listings match that yet.</h2><p>Try another search or be the first to publish something in this category.</p><Link to="/listings/new">Create a listing ↗</Link></div> : <div className="grid2 tr-browse-grid l5-listing-grid">{shown.map((item) => <ListingCard key={item.id} l={item}/>)}</div>}
  </main>;
}
