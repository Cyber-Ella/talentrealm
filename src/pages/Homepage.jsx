
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getListings } from "../services/listings";
import ListingCard from "../components/ListingCard";
import MatchSpotlight from "../components/MatchSpotlight";
import { SkeletonGrid } from "../components/Skeleton";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        const list = await getListings();

        if (active) {
          setPeople(
            list.filter((l) => l.ownerId !== user?.uid).slice(0, 4),
          );
        }
      } catch (error) {
        console.error("Could not load listings:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadListings();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const search = (e) => {
    e.preventDefault();
    navigate("/browse?q=" + encodeURIComponent(q));
  };

  const firstName = (user?.displayName || "there").split(" ")[0];

  return (
    <main className="tr-dashboard">
      {/* Welcome */}
      <section className="tr-dashboard-welcome">
        <div>
          <span className="tr-eyebrow">YOUR REALM, YOUR POSSIBILITIES</span>
          <h1>
            Welcome back, <span>{firstName}.</span>
          </h1>
          <p>
            Your next opportunity might be one talent away.
          </p>
        </div>

        <Link to="/profile" className="tr-dashboard-profile-link">
          View my profile ↗
        </Link>
      </section>

      <MatchSpotlight />
      {/* Search */}
      <section className="tr-dashboard-search">
        <div>
          <span className="tr-eyebrow">FIND YOUR NEXT CONNECTION</span>
          <h2>What are you looking for?</h2>
        </div>

        <form onSubmit={search}>
          <span aria-hidden="true">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try photography, fashion, coding..."
            aria-label="Search talents and services"
          />
          <button type="submit">Search ↗</button>
        </form>
      </section>

      {/* Quick actions */}
      <section className="tr-dashboard-actions">
        <div className="tr-section-heading">
          <div>
            <span className="tr-eyebrow">MAKE SOMETHING HAPPEN</span>
            <h2>Your next move</h2>
          </div>
        </div>

        <div className="tr-action-grid">
          <Link to="/browse?tab=showcase" className="tr-action-card">
            <span className="tr-action-number">01</span>
            <span className="tr-action-icon">✳</span>
            <h3>Discover talents</h3>
            <p>Meet students with skills worth knowing.</p>
            <span className="tr-action-arrow">↗</span>
          </Link>

          <Link to="/listings/new" className="tr-action-card">
            <span className="tr-action-number">02</span>
            <span className="tr-action-icon">＋</span>
            <h3>Showcase yourself</h3>
            <p>Put your talent out there and get noticed.</p>
            <span className="tr-action-arrow">↗</span>
          </Link>

          <Link to="/browse?tab=service" className="tr-action-card">
            <span className="tr-action-number">03</span>
            <span className="tr-action-icon">↗</span>
            <h3>Find a service</h3>
            <p>Get things done by talented students.</p>
            <span className="tr-action-arrow">↗</span>
          </Link>

          <Link to="/exchanges/new" className="tr-action-card">
            <span className="tr-action-number">04</span>
            <span className="tr-action-icon">⇄</span>
            <h3>Exchange skills</h3>
            <p>Your talent could be someone else's solution.</p>
            <span className="tr-action-arrow">↗</span>
          </Link>
        </div>
      </section>

      {/* Exchange feature */}
      <section className="tr-dashboard-exchange">
        <div className="tr-exchange-copy">
          <span className="tr-eyebrow">A DIFFERENT KIND OF VALUE</span>
          <h2>
            Your skills are
            <br />
            <span>worth something.</span>
          </h2>
          <p>
            Trade what you know for what you need.
            No money required to get started.
          </p>
          <Link to="/exchanges/new" className="tr-exchange-button">
            Start an exchange ↗
          </Link>
        </div>

        <div className="tr-exchange-visual" aria-hidden="true">
          <span className="tr-exchange-orbit orbit-one">DESIGN</span>
          <span className="tr-exchange-orbit orbit-two">CODING</span>
          <span className="tr-exchange-orbit orbit-three">PHOTOGRAPHY</span>
          <div className="tr-exchange-symbol">⇄</div>
        </div>
      </section>

      {/* Discover people */}
      <section className="tr-dashboard-discover">
        <div className="tr-section-heading">
          <div>
            <span className="tr-eyebrow">YOUR COMMUNITY IS FULL OF POSSIBILITY</span>
            <h2>People worth discovering</h2>
          </div>
          <Link to="/browse" className="tr-section-link">
            Explore everyone ↗
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid count={4} />
        ) : people.length === 0 ? (
          <div className="tr-dashboard-empty">
            <h3>Your community is waiting.</h3>
            <p>
              There are no other listings to discover yet.
              Be one of the first to showcase your talent.
            </p>
            <Link to="/listings/new">Create your first listing ↗</Link>
          </div>
        ) : (
          <div className="grid2 tr-dashboard-listings">
            {people.map((listing) => (
              <ListingCard key={listing.id} l={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Profile prompt */}
      <section className="tr-dashboard-profile-prompt">
        <div>
          <span className="tr-eyebrow">DON'T JUST BE A VISITOR</span>
          <h2>Let people discover what makes you, you.</h2>
          <p>
            Complete your profile, add your talents, and start building
            your presence in TalentRealm.
          </p>
        </div>
        <Link to="/profile" className="tr-profile-prompt-button">
          Build my profile ↗
        </Link>
      </section>
    </main>
  );
}
