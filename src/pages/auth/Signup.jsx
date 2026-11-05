import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../../services/auth";
import "../../styles/signup-experience.css";
const GOALS = [
  {
    id: "discover",
    icon: "⌕",
    title: "Discover talents",
    detail: "Find people, explore portfolios and discover services.",
  },
  {
    id: "showcase",
    icon: "✳",
    title: "Showcase my talent",
    detail: "Build a portfolio and let people discover what I can do.",
  },
  {
    id: "services",
    icon: "↗",
    title: "Offer services",
    detail: "List services people can book or exchange.",
  },
  {
    id: "exchange",
    icon: "⇄",
    title: "Exchange skills",
    detail: "Trade my skills for things I need.",
  },
];
export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    level: "",
  });
  const [interests, setInterests] = useState(["discover"]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggle = (id) =>
    setInterests((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (interests.length === 0) {
      setError("Choose at least one interest to continue.");
      return;
    }

    setBusy(true);

    try {
      await signUp({ ...form, interests });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="tr-signup">
      <header>
        <Link className="tr-signup-logo" to="/welcome">
          TALENT<span>REALM</span>
          <i>®</i>
        </Link>
        <Link to="/login">
          Already a member? <strong>Log in ↗</strong>
        </Link>
      </header>
      <div className="tr-signup-wrap">
        <aside>
          <p className="tr-eyebrow">YOUR TALENT. YOUR PEOPLE. YOUR REALM.</p>
          <h1>
            Make room
            <br />
            for <em>what you do.</em>
          </h1>
          <p>
            Join a community built around the things you're good at—and the
            things you want to discover.
          </p>
          <div className="tr-signup-aside-note">
            <span>01</span>
            <b>Discover · Exchange · Create</b>
          </div>
        </aside>
        <form className="tr-signup-form" onSubmit={submit}>
          <div className="tr-form-heading">
            <p className="tr-eyebrow">CREATE YOUR ACCOUNT</p>
            <h2>Come on in.</h2>
            <p>Your TalentRealm starts here.</p>
          </div>
          <div className="tr-fields">
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                placeholder="Your name"
                value={form.name}
                onChange={change}
                required
              />
            </label>
            <label>
              School email
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={form.email}
                onChange={change}
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={change}
                required
              />
            </label>
            <div className="tr-fields-row">
              <label>
                Department
                <input
                  name="department"
                  placeholder="e.g. Computer Science"
                  value={form.department}
                  onChange={change}
                  required
                />
              </label>
              <label>
                Level
                <input
                  name="level"
                  placeholder="e.g. 300"
                  value={form.level}
                  onChange={change}
                  required
                />
              </label>
            </div>
          </div>
          <div className="tr-goals">
            <p className="tr-eyebrow">WHAT BRINGS YOU HERE?</p>
            <h3>
              Choose your interests <small>(select all that apply)</small>
            </h3>
            <div className="tr-goal-list">
              {GOALS.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  className={`tr-goal ${interests.includes(g.id) ? "selected" : ""}`}
                  onClick={() => toggle(g.id)}
                  aria-pressed={interests.includes(g.id)}
                >
                  <span className="tr-goal-icon">{g.icon}</span>
                  <span className="tr-goal-copy">
                    <b>{g.title}</b>
                    <small>{g.detail}</small>
                  </span>
                  <span className="tr-check">
                    {interests.includes(g.id) ? "✓" : "＋"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {error && <p className="tr-signup-error">{error}</p>}
          <button className="tr-submit" disabled={busy}>
            {busy ? "Creating your realm…" : "Create my account ↗"}
          </button>
          <p className="tr-terms">
            By joining, you agree to use TalentRealm respectfully and
            responsibly.
          </p>
        </form>
      </div>
      <footer className="tr-signup-footer">
        <span>© {new Date().getFullYear()} TALENTREALM</span>
        <Link to="/discover">Explore talents before joining ↗</Link>
      </footer>
    </main>
  );
}
