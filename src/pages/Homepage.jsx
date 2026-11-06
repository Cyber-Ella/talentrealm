import { useEffect,useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getListings } from "../services/listings";
import ListingCard from "../components/ListingCard";
import { SkeletonGrid } from "../components/Skeleton";

const stories=["Your talent","Sophia Lee","James Carter","Olivia Bennett","Daniel Kim","Mia Rodriguez"];
export default function HomePage(){
 const {user}=useAuth();const navigate=useNavigate();const [listings,setListings]=useState([]);const [loading,setLoading]=useState(true);const [postText,setPostText]=useState("");
 useEffect(()=>{let live=true;(async()=>{try{const all=await getListings();if(live)setListings(all.filter(x=>x.ownerId!==user?.uid).slice(0,6));}catch(e){console.error("Could not load feed listings",e)}finally{if(live)setLoading(false)}})();return()=>{live=false}},[user?.uid]);
const first=(user?.displayName||"there").split(" ")[0];const initials=(user?.displayName||"TR").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
 return <div className="tr-feed-page">
  <section className="tr-feed-stories"><div className="tr-feed-section-title"><h2>Talent stories</h2><Link to="/browse">View all ↗</Link></div><div className="tr-stories-row"><Link to="/listings/new" className="tr-story tr-story-add"><span className="tr-story-ring"><b>＋</b></span><small>Add your talent</small></Link>{stories.slice(1).map((s,i)=><Link to="/browse" className="tr-story" key={s}><span className={`tr-story-ring tr-story-color-${i}`}><b>{s.split(" ").map(x=>x[0]).join("")}</b><i>✦</i></span><small>{s}</small></Link>)}</div></section>
  <section className="tr-feed-composer"><div className="tr-composer-top"><span className="tr-mini-avatar">{initials}</span><button onClick={()=>navigate("/listings/new")}>Share a talent, project or idea, {first}…</button></div><div className="tr-composer-actions"><Link to="/listings/new">▧ <span>Showcase</span></Link><Link to="/listings/new">◈ <span>Service</span></Link><Link to="/exchanges/new">⇄ <span>Exchange</span></Link><Link to="/listings/new" className="tr-composer-post">Create post</Link></div></section>
  <section className="tr-feed-discover"><div className="tr-feed-section-title"><h2>Discover what's happening</h2><span>Fresh from your campus</span></div>
   <div className="tr-feed-feature"><div className="tr-feed-feature-copy"><span className="tr-feed-pill">✦ TALENT SPOTLIGHT</span><h3>There's more talent around you than you think.</h3><p>Meet students, explore their work, and find your next collaboration.</p><Link to="/browse">Explore talents ↗</Link></div><div className="tr-feed-feature-art"><span>✳</span><b>TR</b><i>✦</i></div></div>
   <div className="tr-feed-section-title tr-listings-heading"><h2>Services & talents</h2><Link to="/browse">Explore all ↗</Link></div>
   {loading?<SkeletonGrid count={4}/>:listings.length?<div className="tr-feed-listings">{listings.map(l=><ListingCard key={l.id} l={l}/>)}</div>:<div className="tr-feed-empty"><h3>Be the first to show up in the feed.</h3><p>Share a skill, service, or creative project with the TalentRealm community.</p><Link to="/listings/new">Showcase your talent ↗</Link></div>}
  </section>
  <section className="tr-feed-exchange-card"><div><span>SKILLS ARE CURRENCY</span><h2>What can you offer<br/>for what you need?</h2><p>Exchange services with fellow students—no cash required to start.</p><Link to="/exchanges/new">Propose an exchange ↗</Link></div><div className="tr-exchange-loop"><span>DESIGN</span><b>⇄</b><span>PHOTOGRAPHY</span><small>YOUR SKILLS · SHARED VALUE</small></div></section>
 </div>
}
