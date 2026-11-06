import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUnread } from "../hooks/useUnread";
import ThemeToggle from "./ThemeToggle";

const Glyph = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const icons = {
  home: <Glyph><path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z" /></Glyph>,
  discover: <Glyph><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></Glyph>,
  exchange: <Glyph><path d="M4 8h14l-3-3M20 16H6l3 3"/></Glyph>,
  community: <Glyph><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M15 16a5 5 0 0 1 6 4"/></Glyph>,
  bell: <Glyph><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></Glyph>,
  profile: <Glyph><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Glyph>,
  bookmark: <Glyph><path d="M6 3h12v18l-6-4-6 4z"/></Glyph>,
  settings: <Glyph><circle cx="12" cy="12" r="3"/><path d="m19 13 2 1-2 4-2-1-2 1v2H9v-2l-2-1-2 1-2-4 2-1V11l-2-1 2-4 2 1 2-1V4h4v2l2 1 2-1 2 4-2 1z"/></Glyph>,
};
const LINKS = [["/", "Feed", "home"],["/browse", "Explore", "discover"],["/exchanges", "Exchanges", "exchange"],["/notifications", "Notifications", "bell"],["/profile", "My Profile", "profile"]];
const Badge = ({n}) => n>0?<span className="tr-count">{n>9?"9+":n}</span>:null;
function SideLink({to,label,icon,count}) { return <NavLink to={to} className={({isActive})=>`tr-side-link ${isActive?"active":""}`}>{icons[icon]}<span>{label}</span><Badge n={count||0}/></NavLink>; }
export default function Layout(){
 const {user,logout}=useAuth(); const unread=useUnread(user?.uid); const location=useLocation();
 const name=user?.displayName||"Talent explorer"; const initials=name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
 return <div className="tr-social-shell">
  <header className="tr-social-topbar"><Link to="/" className="tr-social-brand"><span className="tr-brand-mark">T</span><span>Talent<span>Realm</span></span></Link>
   <nav className="tr-top-links"><NavLink to="/">⌂ <span>Home</span></NavLink><NavLink to="/browse">⌕ <span>Explore</span></NavLink><NavLink to="/exchanges">⇄ <span>Exchanges</span></NavLink><NavLink to="/notifications">♧ <span>Activity</span><Badge n={unread}/></NavLink></nav>
   <div className="tr-top-tools"><Link to="/browse" className="tr-top-search">⌕ <span>Search talents, skills…</span></Link><ThemeToggle/><button className="tr-user-menu" onClick={logout} title="Log out"><span className="tr-mini-avatar">{initials}</span><span className="tr-user-name">{name.split(" ")[0]}</span><small>⌄</small></button></div>
  </header>
  <div className="tr-social-layout">
   <aside className="tr-social-left"><div className="tr-sidebar-label">YOUR SPACE</div><SideLink to="/" label="Feed" icon="home"/><SideLink to="/browse" label="Explore talents" icon="discover"/><SideLink to="/exchanges" label="Exchanges" icon="exchange"/><SideLink to="/notifications" label="Notifications" icon="bell" count={unread}/><SideLink to="/profile" label="My profile" icon="profile"/><Link to="/profile" className="tr-sidebar-extra">▣ Saved talents</Link><Link to="/profile" className="tr-sidebar-extra">⚙ Settings</Link>
    <Link to="/listings/new" className="tr-create-post">＋ Create a post</Link>
    <div className="tr-sidebar-label tr-shortcuts-label">YOUR SHORTCUTS</div><Link to="/browse" className="tr-shortcut"><span className="tr-shortcut-icon">✦</span> Photography <i/></Link><Link to="/browse" className="tr-shortcut"><span className="tr-shortcut-icon">⌘</span> Tech & coding <i/></Link><Link to="/browse" className="tr-shortcut"><span className="tr-shortcut-icon">✧</span> Fashion & design <i/></Link><Link to="/browse" className="tr-shortcut"><span className="tr-shortcut-icon">◉</span> Beauty <i/></Link>
    <div className="tr-sidebar-promo"><b>Your talent deserves a stage.</b><p>Build your profile and let the campus discover what you do.</p><Link to="/profile">Complete profile ↗</Link></div>
   </aside>
   <main className="tr-social-main" key={location.pathname}><Outlet/></main>
   <aside className="tr-social-right"><section className="tr-right-card"><div className="tr-right-heading">Trending skills <Link to="/browse">See all</Link></div>{[["#","Photography","+18%"],["✧","Fashion design","+12%"],["⌘","Web development","+9%"],["◉","Makeup","+7%"],["♫","Music","+5%"]].map(([ic,t,v],i)=><Link to="/browse" className="tr-trend" key={t}><span className="tr-trend-rank">{i+1}</span><span className="tr-trend-icon">{ic}</span><span className="tr-trend-name">{t}<small>Popular on campus</small></span><em>{v}</em></Link>)}</section>
    <section className="tr-right-card"><div className="tr-right-heading">Communities <Link to="/browse">Explore</Link></div>{[["📸","Photography circle","128 members"],["💻","Tech builders","96 members"],["🎨","Creative campus","76 members"]].map(([ic,t,n])=><Link to="/browse" className="tr-community" key={t}><span>{ic}</span><div><b>{t}</b><small>{n}</small></div><button>Join</button></Link>)}</section>
    <section className="tr-right-card tr-exchange-aside"><span className="tr-aside-kicker">TALENTREALM EXCHANGE</span><h3>Trade skills.<br/>Grow together.</h3><p>Your talent can be the currency for what you need.</p><Link to="/exchanges/new">Explore exchanges ↗</Link></section>
    <footer className="tr-social-footer">About · Guidelines · Help<br/>© TalentRealm · UNIZIK</footer>
   </aside>
  </div>
  <nav className="tr-social-mobile">{LINKS.slice(0,4).map(([to,label,icon])=><NavLink key={to} to={to}>{icons[icon]}<span>{label}</span></NavLink>)}</nav>
 </div>;
}
