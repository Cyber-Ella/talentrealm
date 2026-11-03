import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link to="/" className="brand">TalentRealm</Link>
        <button className="link-btn" onClick={logout}>Log out</button>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <NavLink to="/browse">Discover</NavLink>
        <NavLink to="/exchanges">Exchanges</NavLink>
        <NavLink to="/notifications">My activity</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>
    </div>
  );
}