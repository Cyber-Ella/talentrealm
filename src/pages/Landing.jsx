import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getListings } from "../services/listings";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/landing.css";

const SAMPLE_TALENTS = [
  {
    id: "sample-fashion",
    title: "Fashion & styling",
    ownerName: "Creative studio",
    category: "Fashion",
    type: "showcase",
    imageUrls: [
      "https://images.unsplash.com/photo-1539102868172-9e9f6fa7f3d3?auto=format&fit=crop&w=900&q=85",
    ],
  },
  {
    id: "sample-photo",
    title: "Portrait photography",
    ownerName: "Visual storyteller",
    category: "Photography",
    type: "service",
    imageUrls: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    ],
  },
  {
    id: "sample-beauty",
    title: "Beauty artistry",
    ownerName: "Beauty creator",
    category: "Beauty",
    type: "service",
    imageUrls: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
    ],
  },
  {
    id: "sample-design",
    title: "Digital design",
    ownerName: "Digital maker",
    category: "Technology",
    type: "showcase",
    imageUrls: [
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=85",
    ],
  },
];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=85",
];

function TalentTile({ listing, index }) {
  const image =
    listing.imageUrls?.[0] ||
    listing.imageUrl ||
    listing.coverImage ||
    HERO_IMAGES[index % HERO_IMAGES.length];
  return (
    <Link
      className={`realm-talent-tile realm-talent-tile--${index % 4}`}
      to={`/discover`}
      aria-label={`Explore ${listing.title}`}
    >
      <img src={image} alt={listing.title} loading="lazy" />
      <div className="realm-talent-tile__caption">
        <span>{listing.category || "Talent"}</span>
        <strong>{listing.title}</strong>
      </div>
    </Link>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const [talents, setTalents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getListings()
      .then((items) => setTalents(items.slice(0, 8)))
      .catch(() => setTalents([]));
  }, []);

  if (!loading && user) return <Navigate to="/" replace />;

  const featured = talents.length ? talents : SAMPLE_TALENTS;
  const filteredFeatured = featured.filter((item) =>
    `${item.title} ${item.category} ${item.ownerName}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <main className="realm-landing">
      <header className="realm-header">
        <Link
          to="/welcome"
          className="realm-wordmark"
          aria-label="TalentRealm home"
        >
          TALENT<span>REALM</span>
          
        </Link>
        <nav className="realm-header__nav" aria-label="Main navigation">
          <Link to="/discover">Discover</Link>
          <a href="#exchange">Skill exchange</a>
          <a href="#booking">Services</a>
        </nav>
        <div className="realm-header__actions">
          <ThemeToggle />
          <Link className="realm-login" to="/login">
            Log in
          </Link>
          <Link className="realm-button realm-button--small" to="/signup">
            Join TalentRealm <span>↗</span>
          </Link>
        </div>
      </header>

      <section className="realm-hero" aria-labelledby="realm-hero-title">
        <div className="realm-hero__glow" />
        <div className="realm-hero__float realm-hero__float--one">
          <img src={HERO_IMAGES[0]} alt="Student talent portrait" />
        </div>
        <div className="realm-hero__float realm-hero__float--two">
          <img src={HERO_IMAGES[1]} alt="Creative student" />
        </div>
        <div className="realm-hero__float realm-hero__float--three">
          <img src={HERO_IMAGES[2]} alt="Student creator" />
        </div>
        <div className="realm-hero__float realm-hero__float--four">
          <img src={HERO_IMAGES[3]} alt="Creative portrait" />
        </div>

        <div className="realm-hero__content">
          <p className="realm-eyebrow">
            <span /> THE CAMPUS TALENT NETWORK
          </p>
          <h1 id="realm-hero-title">
            Your talent deserves
            <br />
            to be <span>discovered.</span>
          </h1>
          <p className="realm-hero__sub">
            Find your people. Show what you can do. Exchange skills and book
            talent—all in one creative community built around UNIZIK students.
          </p>
          <form
            className="realm-search"
            onSubmit={(e) => {
              e.preventDefault();
              document
                .getElementById("discover")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="realm-search__icon" aria-hidden="true">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a talent, skill or service…"
              aria-label="Search talents"
            />
            <button type="submit">
              Search <span>↗</span>
            </button>
          </form>
          <div className="realm-hero__ctas">
            <Link to="/signup" className="realm-button">
              Explore talents <span>↗</span>
            </Link>
            <a href="#exchange" className="realm-button realm-button--ghost">
              How it works <span>↓</span>
            </a>
          </div>
          <div className="realm-hero__proof">
            <span className="realm-proof-dots">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>A community built around what you can do.</span>
          </div>
        </div>
        <div className="realm-hero__bottom-note">
          UNLOCK WHAT'S IN YOU <span>✳</span> FIND WHAT YOU NEED
        </div>
      </section>

      <section className="realm-section realm-discover" id="discover">
        <div className="realm-section__heading">
          <div>
            <p className="realm-eyebrow">THE PEOPLE MAKE THE PLACE</p>
            <h2>
              Talent is <span>everywhere.</span>
            </h2>
          </div>
          <Link to="/discover" className="realm-text-link">
            Explore the community <span>↗</span>
          </Link>
        </div>
        <div className="realm-talent-grid">
          {(search.trim() ? filteredFeatured : featured.slice(0, 4)).map(
            (listing, index) => (
              <TalentTile key={listing.id} listing={listing} index={index} />
            ),
          )}
        </div>
        {search.trim() && filteredFeatured.length === 0 && (
          <p className="realm-empty">
            No talents match “{search}” yet. Join TalentRealm to explore more.
          </p>
        )}
        <div className="realm-discover__foot">
          <span>01 — DISCOVER PEOPLE, NOT JUST SERVICES</span>
          <Link to="/discover">See all talents ↗</Link>
        </div>
      </section>

      <section className="realm-exchange" id="exchange">
        <div className="realm-exchange__visual" aria-hidden="true">
          <div className="realm-orbit realm-orbit--outer" />
          <div className="realm-orbit realm-orbit--inner" />
          <div className="realm-orbit__center">
            T<span>R</span>
          </div>
          <span className="realm-orbit__tag realm-orbit__tag--a">DESIGN</span>
          <span className="realm-orbit__tag realm-orbit__tag--b">PHOTO</span>
          <span className="realm-orbit__tag realm-orbit__tag--c">MAKEUP</span>
        </div>
        <div className="realm-exchange__copy">
          <p className="realm-eyebrow">VALUE GOES BOTH WAYS</p>
          <h2>
            What you know
            <br />
            can get you what
            <br />
            <span>you need.</span>
          </h2>
          <p>
            Not everything valuable has to be paid for with money. Trade your
            skills, meet collaborators and find fair exchanges—with AI helping
            you see the match.
          </p>
          <Link className="realm-button" to="/signup">
            Explore skill exchange <span>↗</span>
          </Link>
        </div>
      </section>

      <section className="realm-booking" id="booking">
        <div>
          <p className="realm-eyebrow">WHEN YOU NEED IT DONE</p>
          <h2>
            Find talent.
            <br />
            <span>Book brilliance.</span>
          </h2>
          <p>
            From a photographer to a makeup artist, find student talent for your
            next idea, event or project.
          </p>
        </div>
        <Link className="realm-button realm-button--light" to="/signup">
          Explore services <span>↗</span>
        </Link>
        <div className="realm-booking__stamp">
          GOOD WORK
          <br />
          LIVES HERE <span>✳</span>
        </div>
      </section>

      <section className="realm-join">
        <p className="realm-eyebrow">YOUR NEXT OPPORTUNITY STARTS HERE</p>
        <h2>
          Come for the talent.
          <br />
          <span>Stay for what you create.</span>
        </h2>
        <Link className="realm-button" to="/signup">
          Join TalentRealm <span>↗</span>
        </Link>
      </section>

      <footer className="realm-footer">
        <Link to="/welcome" className="realm-wordmark">
          TALENT<span>REALM</span>
          
        </Link>
        <p>Discover. Exchange. Create.</p>
        <span>BUILT FOR THE NEXT GENERATION OF CREATORS.</span>
        <small>© {new Date().getFullYear()} TalentRealm</small>
      </footer>
    </main>
  );
}
