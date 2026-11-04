import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NODES = [
  { id: "e", name: "Ella", img: "ella", x: 150, y: 52, ly: 100 },
  { id: "a", name: "Amaka", img: "amaka", x: 56, y: 168, ly: 214 },
  { id: "d", name: "David", img: "david", x: 244, y: 168, ly: 214 },
];

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" />;

  return (
    <div className="landing">
      <div className="landing-top"><span className="star">★</span> TalentRealm</div>
      <img className="landing-photo" src="/images/welcome.jpg" alt="UNIZIK students" onError={(e) => (e.currentTarget.style.display = "none")} />

      <h1>A campus-powered community for every talent.</h1>
      <p className="lead">
        Trade hair styling for photography. Swap fashion design for a website. UNIZIK students trading skills, with Gemini finding fair matches.
      </p>

      <div className="cta">
        <Link className="btn btn-accent" to="/signup">Get started</Link>
        <Link className="landing-login" to="/login">I already have an account</Link>
      </div>

      <div className="panel">
        <h2>Matches nobody could find alone</h2>
        <p>Ella needs fashion design. Amaka needs photos. David needs a stylist. Nobody matches directly, but together they complete a circle.</p>
        <svg viewBox="0 0 300 232" width="100%" role="img" aria-label="Ella gives hair styling to David, David gives photography to Amaka, Amaka gives fashion design to Ella">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L10 5L0 10z" fill="#FBB82B" />
            </marker>
            {NODES.map((n) => <clipPath key={n.id} id={"clip-" + n.id}><circle cx={n.x} cy={n.y} r="30" /></clipPath>)}
          </defs>
          <path d="M176 70 Q236 92 240 134" fill="none" stroke="#FBB82B" strokeWidth="3" markerEnd="url(#arr)" />
          <path d="M214 184 Q150 204 86 184" fill="none" stroke="#FBB82B" strokeWidth="3" markerEnd="url(#arr)" />
          <path d="M60 134 Q64 92 124 70" fill="none" stroke="#FBB82B" strokeWidth="3" markerEnd="url(#arr)" />
          {NODES.map((n) => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r="30" fill="#33206F" />
              <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">{n.name[0]}</text>
              <image href={`/images/${n.img}.jpg`} x={n.x - 30} y={n.y - 30} width="60" height="60" preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${n.id})`} />
              <circle cx={n.x} cy={n.y} r="30" fill="none" stroke="#FBB82B" strokeWidth="2" />
              <text x={n.x} y={n.ly} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{n.name}</text>
            </g>
          ))}
        </svg>
        <p><strong>Ella</strong> gives hair styling to <strong>David</strong>, who gives photography to <strong>Amaka</strong>, who gives fashion design to <strong>Ella</strong>.</p>
      </div>

      <div className="panel">
        <h2>How it works</h2>
        <div className="step"><b>1</b><p><strong>Tell us what you offer and need.</strong> Write it in your own words and Gemini tidies it up for you.</p></div>
        <div className="step"><b>2</b><p><strong>Find your match.</strong> Direct swaps and 3-person circles, with a short reason for each.</p></div>
        <div className="step"><b>3</b><p><strong>Agree and trade.</strong> Gemini suggests fair values and a small top-up if one service is worth more. You always decide.</p></div>
      </div>

      <div className="panel">
        <h2>Swap, don't pay</h2>
        <p>No middleman and no bidding. Just students trading what they are good at.</p>
      </div>

      <div className="cta">
        <Link className="btn btn-accent" to="/signup">Join TalentRealm</Link>
      </div>
      <p className="landing-foot">Built for BUILDUP UNIZIK with Google Gemini and Firebase.</p>
    </div>
  );
}