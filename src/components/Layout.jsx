import { NavLink, Outlet, Link } from "react-router-dom";

const Icon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const icons = {
  discover: <Icon><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></Icon>,
  swaps: <Icon><path d="M5 9h12l-3-3M19 15H7l3 3" /></Icon>,
  activity: <Icon><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" /></Icon>,
  profile: <Icon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>,
};

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link to="/" className="brand"><span className="star">★</span> TalentRealm</Link>
        <Link to="/notifications" className="bell" aria-label="Notifications">{icons.activity}</Link>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <NavLink to="/browse">{icons.discover}<span>Discover</span></NavLink>
        <NavLink to="/exchanges">{icons.swaps}<span>Exchanges</span></NavLink>
        <NavLink to="/notifications">{icons.activity}<span>My activity</span></NavLink>
        <NavLink to="/profile">{icons.profile}<span>Profile</span></NavLink>
      </nav>
    </div>
  );
}