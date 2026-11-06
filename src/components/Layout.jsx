import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUnread } from "../hooks/useUnread";
import ThemeToggle from "./ThemeToggle";

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);
const icons = {
  discover: <Icon><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></Icon>,
  swaps: <Icon><path d="M5 9h12l-3-3M19 15H7l3 3" /></Icon>,
  activity: <Icon><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" /></Icon>,
  profile: <Icon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>,
};

const LINKS = [
  ["/browse", "Discover", "discover"],
  ["/exchanges", "Exchanges", "swaps"],
  ["/notifications", "My activity", "activity"],
  ["/profile", "Profile", "profile"],
];

const Badge = ({ n }) =>
  n > 0 ? <span className="xp-badge" aria-label={`${n} unread`}>{n > 9 ? "9+" : n}</span> : null;

export default function Layout() {
  const { user, logout } = useAuth();
  const unread = useUnread(user?.uid);
  const location = useLocation();

  const cls = (to) => ({ isActive }) =>
    (isActive ? "active" : "") + (to === "/notifications" ? " xp-rel" : "");

  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link to="/" className="brand"><span className="star">★</span> TalentRealm</Link>
        <nav className="top-nav" aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} className={cls(to)}>
              {label}
              {to === "/notifications" && <Badge n={unread} />}
            </NavLink>
          ))}
        </nav>
        <div className="top-actions">
          <Link to="/notifications" className="bell xp-rel" aria-label="Notifications">
            {icons.activity}
            <Badge n={unread} />
          </Link>
          <ThemeToggle />
          <button className="link-btn" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="content tr-page" key={location.pathname}>
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Mobile">
        {LINKS.map(([to, label, icon]) => (
          <NavLink key={to} to={to} className={cls(to)}>
            {icons[icon]}
            <span>{label}</span>
            {to === "/notifications" && <Badge n={unread} />}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}